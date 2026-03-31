# Institutional Licensing — School & University Plans

## Overview

Institutional plans let universities, polytechnics, secondary schools, and tutoring businesses license StudyScroll for their entire student body. Billing is per-seat with volume discounts. The institution admin controls the course catalog, lecturer access, and branding. Individual students get full Premium access automatically.

---

## Tier Structure

| Seats | Monthly/Seat | Annual/Seat | Minimum Commitment |
|---|---|---|---|
| 1–99 | $5 / ₦4,500 | $45 / ₦40,000 | None |
| 100–499 | $4 / ₦3,600 | $36 / ₦32,000 | 3 months |
| 500–1999 | $3 / ₦2,700 | $27 / ₦24,000 | 6 months |
| 2000+ | Custom | Custom | Annual |

All institutional plans include:
- All Premium features for every enrolled student
- Lecturer/admin dashboard
- Cohort analytics (anonymised)
- Custom course catalog
- Optional brand theming (logo + color)
- SSO support (Google Workspace, Microsoft Entra — roadmap)
- Dedicated onboarding and support

---

## Database Schema (Institutions)

```typescript
// packages/db/src/schema/institutions.ts
import { pgTable, uuid, text, varchar, integer, boolean, timestamptz, jsonb } from 'drizzle-orm/pg-core';
import { subscriptions } from './payments';

export const institutions = pgTable('institutions', {
  id:             uuid('id').primaryKey().defaultRandom(),
  name:           text('name').notNull(),
  type:           varchar('type', { length: 30 }).notNull(), // university|polytechnic|secondary|tutoring
  country:        varchar('country', { length: 2 }),         // ISO 3166-1 alpha-2
  domain:         varchar('domain', { length: 100 }),        // e.g. unilag.edu.ng (for SSO matching)
  logoUrl:        text('logo_url'),
  brandColor:     varchar('brand_color', { length: 7 }),     // hex
  seatLimit:      integer('seat_limit').notNull(),
  seatsUsed:      integer('seats_used').default(0).notNull(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  currency:       varchar('currency', { length: 3 }).default('USD'),
  active:         boolean('active').default(true),
  settings:       jsonb('settings').default({}),
  // { allowStudentCourseCreation: bool, requireCourseApproval: bool, showLeaderboard: bool }
  createdAt:      timestamptz('created_at').defaultNow(),
  updatedAt:      timestamptz('updated_at').defaultNow(),
});

export const institutionMembers = pgTable('institution_members', {
  id:            uuid('id').primaryKey().defaultRandom(),
  institutionId: uuid('institution_id').references(() => institutions.id, { onDelete: 'cascade' }).notNull(),
  userId:        uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role:          varchar('role', { length: 20 }).default('student').notNull(), // student|lecturer|admin
  addedAt:       timestamptz('added_at').defaultNow(),
  addedBy:       uuid('added_by').references(() => users.id),
  active:        boolean('active').default(true),
});

export const institutionCourses = pgTable('institution_courses', {
  id:            uuid('id').primaryKey().defaultRandom(),
  institutionId: uuid('institution_id').references(() => institutions.id, { onDelete: 'cascade' }).notNull(),
  code:          varchar('code', { length: 20 }).notNull(),
  title:         text('title').notNull(),
  description:   text('description'),
  lecturerId:    uuid('lecturer_id').references(() => users.id),
  department:    varchar('department', { length: 100 }),
  level:         varchar('level', { length: 20 }),  // 100|200|300|400|postgrad
  isActive:      boolean('is_active').default(true),
  createdAt:     timestamptz('created_at').defaultNow(),
});

export const institutionInvites = pgTable('institution_invites', {
  id:            uuid('id').primaryKey().defaultRandom(),
  institutionId: uuid('institution_id').references(() => institutions.id, { onDelete: 'cascade' }).notNull(),
  email:         text('email').notNull(),
  role:          varchar('role', { length: 20 }).default('student'),
  token:         varchar('token', { length: 64 }).unique().notNull(),
  usedAt:        timestamptz('used_at'),
  expiresAt:     timestamptz('expires_at').notNull(),
  createdAt:     timestamptz('created_at').defaultNow(),
});
```

---

## Onboarding Flow for Institutions

```
Admin signs up → selects "Institutional" plan
  │
  ├─ 1. Institution details (name, type, country, domain)
  │
  ├─ 2. Choose plan (seats, billing period, currency)
  │    └─ Redirects to Paystack (NGN) or Stripe (USD/EUR)
  │
  ├─ 3. After payment success webhook:
  │    - institutions row created
  │    - admin user.plan = 'institutional'
  │    - admin institutionMembers row (role: 'admin') inserted
  │
  ├─ 4. Admin dashboard unlocked at /dashboard/institution
  │
  └─ 5. Invite students (CSV upload or invite link or email list)
```

---

## Institution Admin Dashboard

### Remote Functions

```typescript
// src/lib/server/remote/institution.ts
import { query, command } from '$app/server';

// ── Overview stats ──────────────────────────────────────────────────────────
export const getInstitutionDashboard = query(async ({ institutionId }) => {
  const [institution, memberCount, activeToday, courseCount] = await Promise.all([
    db.query.institutions.findFirst({ where: eq(institutions.id, institutionId) }),

    db.$count(institutionMembers, and(
      eq(institutionMembers.institutionId, institutionId),
      eq(institutionMembers.active, true),
    )),

    db.$count(users, and(
      eq(users.institutionId, institutionId),
      sql`last_active_date::date = current_date`,
    )),

    db.$count(institutionCourses, and(
      eq(institutionCourses.institutionId, institutionId),
      eq(institutionCourses.isActive, true),
    )),
  ]);

  return { institution, memberCount, activeToday, courseCount,
           seatUsage: { used: institution!.seatsUsed, limit: institution!.seatLimit } };
});

// ── Cohort analytics (anonymised) ───────────────────────────────────────────
export const getCohortAnalytics = query(async ({ institutionId, courseCode }) => {
  // Average mastery per topic across all students in a course
  const topicAverages = await db
    .select({
      topic:   topicMastery.topic,
      avgScore: sql<number>`round(avg(${topicMastery.score}), 1)`,
      count:   sql<number>`count(distinct ${topicMastery.userId})`,
    })
    .from(topicMastery)
    .innerJoin(userCourses, eq(userCourses.id, topicMastery.courseId))
    .innerJoin(users, and(
      eq(users.id, topicMastery.userId),
      eq(users.institutionId, institutionId),
    ))
    .where(eq(userCourses.code, courseCode))
    .groupBy(topicMastery.topic)
    .orderBy(sql`avg(${topicMastery.score}) asc`);

  // Engagement stats (no individual identification)
  const engagement = await db
    .select({
      activeUsers: sql<number>`count(distinct ${users.id})`,
      avgStreakDays: sql<number>`round(avg(${users.streakDays}), 1)`,
      avgXP:        sql<number>`round(avg(${users.xp}), 0)`,
    })
    .from(users)
    .where(and(
      eq(users.institutionId, institutionId),
      sql`last_active_date > now() - interval '30 days'`,
    ));

  return { topicAverages, engagement: engagement[0] };
});

// ── At-risk detection (anonymised flag, no names) ────────────────────────────
export const getAtRiskStudents = query(async ({ institutionId }) => {
  // Students with avg mastery < 40 AND streak = 0 for 7+ days
  // Returns anonymised count + cohort-level info only — never individual names
  const atRisk = await db
    .select({
      courseCode: userCourses.code,
      count:      sql<number>`count(distinct ${users.id})`,
    })
    .from(users)
    .innerJoin(userCourses, eq(userCourses.userId, users.id))
    .innerJoin(topicMastery, and(
      eq(topicMastery.userId, users.id),
      eq(topicMastery.courseId, userCourses.id),
    ))
    .where(and(
      eq(users.institutionId, institutionId),
      eq(userCourses.active, true),
      sql`${users.lastActiveDate} < now() - interval '7 days'`,
    ))
    .groupBy(userCourses.code)
    .having(sql`avg(${topicMastery.score}) < 40`);

  return atRisk;
});

// ── Member management ────────────────────────────────────────────────────────
export const inviteMembers = command(async ({
  institutionId, emails, role = 'student', adminId,
}) => {
  const institution = await db.query.institutions.findFirst({
    where: eq(institutions.id, institutionId),
  });

  const available = institution!.seatLimit - institution!.seatsUsed;
  const studentEmails = emails.filter(() => role === 'student');
  if (studentEmails.length > available) {
    throw new Error(`Only ${available} seats remaining. Upgrade your plan or remove inactive members.`);
  }

  const invites = emails.map(email => ({
    institutionId,
    email,
    role,
    token: crypto.randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days
    createdAt: new Date(),
  }));

  await db.insert(institutionInvites).values(invites);

  // Send invite emails
  for (const invite of invites) {
    await pgBoss.send('send-email', {
      to: invite.email,
      template: 'institutionInvite',
      data: {
        institutionName: institution!.name,
        role: invite.role,
        inviteUrl: `${process.env.PUBLIC_APP_URL}/join/${invite.token}`,
      },
    });
  }

  return { sent: invites.length };
});

// ── CSV bulk invite ───────────────────────────────────────────────────────────
export const bulkInviteCSV = command(async ({ institutionId, csvContent, adminId }) => {
  const lines = csvContent.split('\n').slice(1); // skip header
  const emails = lines
    .map(line => line.split(',')[0]?.trim().toLowerCase())
    .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  return inviteMembers({ institutionId, emails, role: 'student', adminId });
});

// ── Remove member ─────────────────────────────────────────────────────────────
export const removeMember = command(async ({ institutionId, userId }) => {
  await db.update(institutionMembers)
    .set({ active: false })
    .where(and(
      eq(institutionMembers.institutionId, institutionId),
      eq(institutionMembers.userId, userId),
    ));

  await db.update(users)
    .set({ plan: 'free', institutionId: null })
    .where(eq(users.id, userId));

  await db.update(institutions)
    .set({ seatsUsed: sql`seats_used - 1` })
    .where(eq(institutions.id, institutionId));
});

// ── Join via invite token ─────────────────────────────────────────────────────
export const joinInstitution = command(async ({ token, userId }) => {
  const invite = await db.query.institutionInvites.findFirst({
    where: and(
      eq(institutionInvites.token, token),
      sql`expires_at > now()`,
      sql`used_at IS NULL`,
    ),
    with: { institution: true },
  });

  if (!invite) throw new Error('Invite link is invalid or has expired.');

  const institution = invite.institution;
  if (institution.seatsUsed >= institution.seatLimit) {
    throw new Error('This institution has no seats remaining. Contact your administrator.');
  }

  await db.transaction(async (tx) => {
    // Mark invite used
    await tx.update(institutionInvites)
      .set({ usedAt: new Date() })
      .where(eq(institutionInvites.id, invite.id));

    // Add member
    await tx.insert(institutionMembers).values({
      institutionId: institution.id,
      userId,
      role: invite.role,
    }).onConflictDoNothing();

    // Upgrade user plan
    await tx.update(users)
      .set({ plan: 'institutional', institutionId: institution.id })
      .where(eq(users.id, userId));

    // Increment seat count
    await tx.update(institutions)
      .set({ seatsUsed: sql`seats_used + 1` })
      .where(eq(institutions.id, institution.id));
  });

  return { institutionName: institution.name, role: invite.role };
});
```

---

## Lecturer Dashboard Features

Lecturers (role: `lecturer`) get a subset of the admin dashboard focused on their own courses:

```svelte
<!-- src/routes/(app)/dashboard/lecturer/+page.svelte -->
<script lang="ts">
  // Lecturer can:
  // 1. Upload course materials → auto-generates AI content for their students
  // 2. Create official quiz sets for their course
  // 3. Schedule exam/assignment dates (visible to all enrolled students)
  // 4. View anonymised cohort analytics for their course
  // 5. Pin important posts in the course feed
  // 6. Host live study sessions (labelled as official)
  // 7. Moderate course community

  let { data } = $props();
</script>

<div class="max-w-4xl mx-auto p-6 space-y-8">
  <h1 class="text-2xl font-bold">Lecturer Dashboard</h1>

  <!-- Course selector -->
  <CourseSelector courses={data.lecturerCourses} />

  <!-- Quick stats for selected course -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <StatCard label="Enrolled students" value={data.stats.enrolled} />
    <StatCard label="Active this week" value={data.stats.activeThisWeek} />
    <StatCard label="Avg. mastery" value="{data.stats.avgMastery}%" />
    <StatCard label="Posts created" value={data.stats.postsCreated} />
  </div>

  <!-- Weak topics alert -->
  {#if data.weakTopics.length > 0}
    <div class="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
      <h3 class="font-semibold text-red-700 dark:text-red-400 mb-2">
        ⚠ Topics needing attention
      </h3>
      <p class="text-sm text-red-600 dark:text-red-300">
        Your cohort is struggling with:
        {data.weakTopics.map(t => t.topic).join(', ')}.
        Average mastery: {data.weakTopics[0]?.avgScore}%.
      </p>
      <button class="mt-2 text-sm font-medium text-red-600 hover:underline">
        Generate quiz content for these topics →
      </button>
    </div>
  {/if}

  <!-- Material upload -->
  <section>
    <h2 class="text-lg font-semibold mb-3">Upload Course Materials</h2>
    <p class="text-sm text-[--color-text-muted] mb-3">
      Upload lecture slides, notes, or past exam papers.
      StudyScroll will extract the content and generate study posts for your students automatically.
    </p>
    <MaterialUploader courseId={data.selectedCourse?.id} />
  </section>

  <!-- Schedule management -->
  <section>
    <h2 class="text-lg font-semibold mb-3">Exam & Assignment Schedule</h2>
    <ScheduleManager courseId={data.selectedCourse?.id} />
  </section>
</div>
```

---

## Institution Billing (Payment Flow)

```typescript
// src/lib/server/remote/institution.ts
export const createInstitutionalSubscription = command(async ({
  adminUserId,
  institutionData,
  seats,
  billingPeriod,
  currency,
}) => {
  const admin = await db.query.users.findFirst({ where: eq(users.id, adminUserId) });

  // Price calculation
  const rateTable: Record<string, Record<string, number>> = {
    USD: { monthly: 500, yearly: 4500 },   // cents per seat
    NGN: { monthly: 450000, yearly: 4000000 }, // kobo per seat
  };
  const rate = rateTable[currency]?.[billingPeriod] ?? rateTable.USD[billingPeriod];
  const totalAmount = rate * seats;

  const provider = createPaymentProvider(currency);

  const { checkoutUrl, subscriptionId } = await provider.createSubscription({
    userId:        adminUserId,
    email:         admin!.email,
    plan:          'institutional',
    currency:      currency as any,
    metadata: {
      institutionName: institutionData.name,
      seats:           String(seats),
      billingPeriod,
    },
  });

  // Create institution record in pending state
  const [institution] = await db.insert(institutions).values({
    ...institutionData,
    seatLimit:  seats,
    seatsUsed:  0,
    currency,
    active:     false, // activated on payment webhook
  }).returning();

  return { checkoutUrl, institutionId: institution.id };
});
```

### Webhook Handler for Institutional Payments

```typescript
// In the existing webhook handler (src/routes/api/webhooks/paystack/+server.ts)
// Add institutional handling:

async function handleInstitutionalPayment(event: WebhookEvent) {
  const metadata = event.raw.data?.metadata;
  if (metadata?.institutionName) {
    // Activate the institution
    const institution = await db.query.institutions.findFirst({
      where: and(
        eq(institutions.name, metadata.institutionName),
        eq(institutions.active, false),
      ),
    });
    if (institution) {
      await db.update(institutions)
        .set({ active: true, subscriptionId: event.subscriptionId })
        .where(eq(institutions.id, institution.id));

      // Add admin as first institutional member
      await db.insert(institutionMembers).values({
        institutionId: institution.id,
        userId: event.userId!,
        role: 'admin',
      });

      await db.update(users)
        .set({ plan: 'institutional', institutionId: institution.id })
        .where(eq(users.id, event.userId!));
    }
  }
}
```

---

## Seat Management & Auto-Downgrade

```typescript
// packages/jobs/src/jobs/manage-seats.ts
export async function downgradeExpiredInstitutionalMembers() {
  // Find institutions with cancelled or expired subscriptions
  const expired = await db.select()
    .from(institutions)
    .innerJoin(subscriptions, eq(subscriptions.id, institutions.subscriptionId))
    .where(and(
      eq(subscriptions.status, 'cancelled'),
      sql`subscriptions.current_period_end < now()`,
    ));

  for (const { institutions: inst } of expired) {
    // Downgrade all members
    await db.update(users)
      .set({ plan: 'free', institutionId: null })
      .where(eq(users.institutionId, inst.id));

    await db.update(institutionMembers)
      .set({ active: false })
      .where(eq(institutionMembers.institutionId, inst.id));

    await db.update(institutions)
      .set({ active: false, seatsUsed: 0 })
      .where(eq(institutions.id, inst.id));

    // Notify admin
    const admin = await db.query.institutionMembers.findFirst({
      where: and(
        eq(institutionMembers.institutionId, inst.id),
        eq(institutionMembers.role, 'admin'),
      ),
      with: { user: true },
    });
    if (admin) {
      await pgBoss.send('send-email', {
        to: admin.user.email,
        template: 'institutionExpired',
        data: { institutionName: inst.name, renewUrl: `${process.env.PUBLIC_APP_URL}/dashboard/billing` },
      });
    }
  }
}
```
