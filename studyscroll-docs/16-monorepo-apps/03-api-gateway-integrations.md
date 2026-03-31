# External API & Integrations

## App: `apps/api-gateway`
**URL:** `api.studyscroll.dev`  
**Stack:** Express 4, Zod validation, OpenAPI/Swagger  
**Auth:** API key per institution/developer  
**Deploy:** Render (always-on worker)  
**Purpose:** Allow institutions to sync student data with their own systems (LMS, SIS, HRIS)

---

## When to Use the API vs Remote Functions

| Use Case | Method |
|---|---|
| Student app data fetching | SvelteKit Remote Functions |
| Admin dashboard data | Admin Remote Functions |
| External LMS integration | API Gateway (REST) |
| Institution student sync | API Gateway (REST) |
| Webhook delivery | API Gateway routes |

---

## Authentication

```typescript
// API key authentication
// Keys are generated per institution, stored hashed in DB

// apps/api-gateway/src/middleware/apiAuth.ts
import { db } from '@studyscroll/db';
import { apiKeys } from '@studyscroll/db/schema';
import crypto from 'crypto';

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'] as string;
  if (!key) return res.status(401).json({ error: 'API key required' });

  const hashed = crypto.createHash('sha256').update(key).digest('hex');
  const apiKey = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.keyHash, hashed), eq(apiKeys.active, true)),
    with: { institution: true },
  });

  if (!apiKey) return res.status(401).json({ error: 'Invalid API key' });

  req.institution = apiKey.institution;
  req.apiKey = apiKey;
  next();
}
```

### API Key Management Schema

```typescript
// packages/db/src/schema/api-keys.ts
export const apiKeys = pgTable('api_keys', {
  id:            uuid('id').primaryKey().defaultRandom(),
  institutionId: uuid('institution_id').references(() => institutions.id).notNull(),
  keyHash:       text('key_hash').unique().notNull(),     // SHA-256 of the raw key
  name:          text('name').notNull(),                  // e.g. "Moodle Integration"
  scopes:        text('scopes').array().notNull(),        // ['students:read', 'courses:write']
  lastUsedAt:    timestamptz('last_used_at'),
  expiresAt:     timestamptz('expires_at'),
  active:        boolean('active').default(true),
  createdAt:     timestamptz('created_at').defaultNow(),
});
```

---

## REST API Endpoints

### Students

```
GET    /v1/students                    List all institution students
GET    /v1/students/:id                Get student profile + mastery
POST   /v1/students                    Create/invite a student
PUT    /v1/students/:id                Update student record
DELETE /v1/students/:id                Remove from institution
POST   /v1/students/bulk               Bulk import (CSV body or JSON array)
GET    /v1/students/:id/mastery        Student's mastery scores per topic
GET    /v1/students/:id/activity       Student's recent activity summary
```

### Courses

```
GET    /v1/courses                     List institution courses
POST   /v1/courses                     Create a course
PUT    /v1/courses/:id                 Update course
DELETE /v1/courses/:id                 Archive course
POST   /v1/courses/:id/enroll          Enroll students in a course
GET    /v1/courses/:id/analytics       Course-level analytics
```

### Analytics

```
GET    /v1/analytics/overview          Platform-wide KPIs for institution
GET    /v1/analytics/at-risk           List at-risk students
GET    /v1/analytics/mastery           Cohort mastery by topic
GET    /v1/analytics/engagement        Engagement metrics
POST   /v1/analytics/reports           Generate and email a report
```

---

## Implementation

```typescript
// apps/api-gateway/src/routes/students.ts
import { Router } from 'express';
import { z } from 'zod';
import { db } from '@studyscroll/db';
import { users, userCourses, topicMastery } from '@studyscroll/db/schema';

const router = Router();

// GET /v1/students — paginated list
router.get('/', async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const students = await db.select({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    email: users.email,
    plan: users.plan,
    xp: users.xp,
    streakDays: users.streakDays,
    lastActiveDate: users.lastActiveDate,
    createdAt: users.createdAt,
  })
  .from(users)
  .where(and(
    eq(users.institutionId, req.institution.id),
    search ? ilike(users.displayName, `%${search}%`) : undefined,
  ))
  .orderBy(desc(users.createdAt))
  .limit(Number(limit))
  .offset(offset);

  const total = await db.$count(users, eq(users.institutionId, req.institution.id));

  res.json({ data: students, meta: { total, page: Number(page), limit: Number(limit) } });
});

// POST /v1/students/bulk — bulk import
const BulkImportSchema = z.object({
  students: z.array(z.object({
    email: z.string().email(),
    displayName: z.string().min(2),
    courseCodes: z.array(z.string()).optional(),
  })).max(500),
  sendInvites: z.boolean().default(true),
});

router.post('/bulk', async (req, res) => {
  const { students, sendInvites } = BulkImportSchema.parse(req.body);

  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const student of students) {
    try {
      const existing = await db.query.users.findFirst({ where: eq(users.email, student.email) });
      if (existing) { results.skipped++; continue; }

      const [user] = await db.insert(users).values({
        email: student.email,
        displayName: student.displayName,
        institutionId: req.institution.id,
        plan: 'premium', // institution plan covers them
      }).returning();

      if (sendInvites) {
        await pgBoss.send('send-email', {
          to: student.email,
          template: 'institutionStudentInvite',
          data: { institutionName: req.institution.name, loginUrl: process.env.PUBLIC_APP_URL },
        });
      }

      results.created++;
    } catch (err) {
      results.errors.push(`${student.email}: ${(err as Error).message}`);
    }
  }

  res.json(results);
});

export default router;
```

---

## Webhooks (Outbound to Institutions)

StudyScroll can send webhook events to institution endpoints when key events occur:

```typescript
// Webhook event types
type WebhookEventType =
  | 'student.enrolled'
  | 'student.active'          // first login
  | 'student.at_risk'         // inactive 7+ days before exam
  | 'exam.reminder_sent'
  | 'mastery.milestone'       // student reaches 80% on a topic
  | 'subscription.renewed'
  | 'subscription.cancelled';

// Webhook delivery
export async function deliverWebhook(institutionId: string, event: WebhookEventType, payload: object) {
  const webhookConfig = await db.query.webhooks.findFirst({
    where: and(eq(webhooks.institutionId, institutionId), eq(webhooks.active, true)),
  });
  if (!webhookConfig) return;

  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  const signature = crypto
    .createHmac('sha256', webhookConfig.secret)
    .update(body)
    .digest('hex');

  await fetch(webhookConfig.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-StudyScroll-Signature': signature,
      'X-StudyScroll-Event': event,
    },
    body,
  }).catch(err => {
    console.error(`Webhook delivery failed for institution ${institutionId}:`, err);
  });
}
```

---

## LMS Integrations

### Moodle Integration

```typescript
// Sync students from Moodle via the REST API
// Institutions run this sync daily via cron or manually from their institution dashboard

export async function syncFromMoodle(institutionId: string, moodleConfig: {
  url: string;
  token: string;
  courseIds: number[];
}) {
  // Fetch enrolled users from each Moodle course
  for (const moodleCourseId of moodleConfig.courseIds) {
    const res = await fetch(
      `${moodleConfig.url}/webservice/rest/server.php?wstoken=${moodleConfig.token}&wsfunction=core_enrol_get_enrolled_users&moodlewsrestformat=json&courseid=${moodleCourseId}`
    );
    const moodleUsers = await res.json();

    // Upsert each student into StudyScroll
    for (const mUser of moodleUsers) {
      await upsertStudent({
        institutionId,
        email: mUser.email,
        displayName: `${mUser.firstname} ${mUser.lastname}`,
        externalId: `moodle:${mUser.id}`,
      });
    }
  }
}
```

### Canvas LMS Integration (similar pattern)

```typescript
export async function syncFromCanvas(institutionId: string, config: { domain: string; token: string; courseIds: number[] }) {
  for (const courseId of config.courseIds) {
    const res = await fetch(`https://${config.domain}/api/v1/courses/${courseId}/enrollments?per_page=100`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });
    const enrollments = await res.json();
    for (const enrollment of enrollments) {
      await upsertStudent({ institutionId, email: enrollment.user.login_id, displayName: enrollment.user.name });
    }
  }
}
```

---

## OpenAPI Spec

```yaml
# apps/api-gateway/openapi.yaml
openapi: 3.1.0
info:
  title: StudyScroll External API
  version: 1.0.0
  description: REST API for institutional integrations

servers:
  - url: https://api.studyscroll.dev/v1

security:
  - ApiKeyAuth: []

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

paths:
  /students:
    get:
      summary: List students
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 50, maximum: 200 }
        - name: search
          in: query
          schema: { type: string }
      responses:
        '200':
          description: Paginated list of students
```
