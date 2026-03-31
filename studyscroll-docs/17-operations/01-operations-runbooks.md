# Operations — Runbooks, Incident Response & SaaS Management

## Daily Operations

### Automated Monitoring Checks
All automated — alerts fire to the ops Slack channel (`#studyscroll-alerts`) via Sentry + PostHog webhooks:

| Check | Frequency | Alert condition |
|---|---|---|
| Feed API latency | Continuous | p99 > 2s |
| DB connection pool | Every 1 min | connections > 80% |
| AI generation failures | Every job run | error rate > 10% |
| Email bounce rate | Daily | bounce rate > 3% |
| Payment webhook failures | Every hour | any unprocessed |
| Flagged content queue | Every 15 min | queue > 50 items |
| Disk usage (Render) | Daily | > 70% |

### Daily Admin Checklist
```
08:00  Check overnight AI generation job results (/admin/analytics/ai-usage)
08:15  Review flagged content queue (/admin/content/flagged) — target: clear by noon
08:30  Scan open support tickets (/admin/support/tickets) — assign unassigned
09:00  Review payment webhook events (/admin/payments/events) — check for failures
17:00  Check at-risk student alerts (/admin/analytics/overview)
17:30  Verify exam reminder emails sent correctly (/admin/analytics)
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|---|---|---|---|
| P1 — Critical | Full platform down | 15 minutes | Database unreachable, Vercel deployment failure |
| P2 — Major | Core feature broken | 1 hour | Feed not loading, payments failing |
| P3 — Minor | Non-critical feature degraded | 4 hours | AI generation slow, push notifications delayed |
| P4 — Low | Cosmetic or edge case | Next business day | UI bug on specific browser |

### P1 Incident Runbook

```bash
# 1. Assess — what's broken?
curl -I https://app.studyscroll.dev/api/health
# Check Vercel dashboard for deployment errors
# Check Render dashboard for DB/worker status

# 2. Communicate — post in #incidents Slack immediately
"🔴 P1 INCIDENT: [description]. Investigating. ETA unknown."

# 3. Diagnose
# Check Sentry for error spike: https://sentry.io/organizations/studyscroll/
# Check PostHog for drop in events: https://app.posthog.com
# Check Render logs for DB errors

# 4. Rollback if deployment-caused
vercel rollback --yes   # in apps/web directory

# 5. Database issues — check connections
# Via Render dashboard → Database → Connections monitor
# If connection pool exhausted:
#   → Restart pg-boss workers (reduce active connections)
#   → Temporarily reduce max pool size in DATABASE_URL params

# 6. Resolve and communicate
"✅ RESOLVED: [description of fix]. RCA to follow within 24 hours."
```

### Maintenance Mode

```typescript
// Enable via superadmin system config:
await updateSystemConfig({ key: 'maintenance_mode', value: { enabled: true, message: 'We\'ll be back in 30 minutes.' } });

// apps/web/src/hooks.server.ts — check on every request:
const config = await db.query.systemConfig.findFirst({ where: eq(systemConfig.key, 'maintenance_mode') });
if (config?.value?.enabled && !event.url.pathname.startsWith('/admin')) {
  return new Response(config.value.message, { status: 503 });
}
```

---

## SaaS Management Operations

### New Institution Onboarding

```
Day 1: Contract signed → finance team creates institution record in admin
        └── /admin/payments/institutions → "New Institution"
        └── Set: name, domain, seat_limit, plan, billing cycle
        └── Generate institution admin invite email

Day 2-3: Institution admin sets up their account
        └── Adds courses (course codes, titles)
        └── Uploads course materials (PDFs, past exams)
        └── Invites lecturers
        └── Sets student onboarding instructions

Day 4-7: Students join via institution invite link
        └── /join/:institutionCode → auto-enrolls in institution
        └── First exam schedule import
        └── AI content generation kicks off

Week 2: Check-in by support team
        └── Review engagement metrics
        └── Address any technical issues
        └── Gather feedback for product team
```

### Churn Prevention Workflow

```typescript
// Automated: detect at-risk premium subscribers
export async function detectChurnRisk() {
  // Premium users who haven't logged in for 14+ days
  const atRisk = await db.select().from(users)
    .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(and(
      eq(subscriptions.status, 'active'),
      sql`users.last_active_date < now() - interval '14 days'`,
      sql`subscriptions.current_period_end > now() + interval '7 days'`, // renewal coming up
    ));

  for (const user of atRisk) {
    // Send re-engagement email
    await pgBoss.send('send-email', {
      to: user.email,
      template: 'reengagementPremium',
      data: { name: user.displayName, daysSinceLogin: 14 },
    });

    // Create internal alert in admin panel
    await db.insert(adminAlerts).values({
      type: 'churn_risk',
      userId: user.id,
      message: `Premium user inactive 14+ days, renewal in ${daysUntilRenewal} days`,
    });
  }
}
```

---

## Content Operations

### AI Content Quality Review

Daily rotation among content editors to spot-check AI-generated content:

```
1. Sample 20 random AI posts from the last 24 hours (/admin/content/ai-pool)
2. Check for: factual errors, inappropriate content, formatting issues, relevance
3. Flag problematic posts → moderator removes
4. Note recurring issues → update prompts in system config
5. Log quality score in weekly content report
```

### Course Catalog Management

```typescript
// Content editors can manage a global course catalog that helps AI
// generate better, more targeted content

export const globalCourses = pgTable('global_courses', {
  id:          uuid('id').primaryKey().defaultRandom(),
  code:        varchar('code', { length: 20 }).unique().notNull(),  // e.g. CPE461
  title:       text('title').notNull(),
  description: text('description'),
  level:       text('level'),          // 100 | 200 | 300 | 400 | postgrad | secondary
  subject:     text('subject'),        // Engineering | Medicine | Law | etc.
  country:     varchar('country', { length: 2 }),
  examBodies:  text('exam_bodies').array(),  // WAEC, JAMB, NECO, etc.
  topics:      jsonb('topics'),        // canonical topic list for this course
  updatedAt:   timestamptz('updated_at').defaultNow(),
});
```

---

## Deployment Procedures

### Standard Deploy (Web App)

```bash
# 1. Ensure all tests pass
vp test

# 2. Create PR to main
# GitHub Actions runs: vp check → vp test → preview deploy on Vercel

# 3. After review, merge to main
# GitHub Actions: vp run db:migrate → vp build → vercel --prod

# 4. Verify
curl https://app.studyscroll.dev/api/health
# Check Sentry for any new errors in first 15 minutes
```

### Database Migration Procedure

```bash
# 1. Review the migration SQL first
cat packages/db/migrations/$(ls packages/db/migrations | tail -1)

# 2. Test on staging DB first
DATABASE_URL=$STAGING_DATABASE_URL vp run db:migrate

# 3. Run on production during low-traffic window (2-4am)
DATABASE_URL=$PRODUCTION_DATABASE_URL vp run db:migrate

# 4. Verify migration
vp run db:studio
# Check table structure matches schema
```

### Rollback Plan

```bash
# If a migration breaks production:
# 1. Enable maintenance mode immediately
# 2. Rollback Vercel deployment
vercel rollback --yes

# 3. Reverse migration (if safe to do so)
# Drizzle doesn't auto-generate rollback SQL — write manually:
# e.g. DROP COLUMN added, recreate removed indexes, etc.

# 4. Disable maintenance mode once stable
```

---

## Security Operations

### Regular Security Checklist (Monthly)

```
□ Rotate all API keys (Gemini, Anthropic, Paystack, Stripe)
□ Review staff accounts — remove departed employees
□ Audit log review — check for unusual admin actions
□ Review Sentry for any security-related errors
□ Check payment webhook signature validation is working
□ Verify VAPID keys haven't been compromised
□ Review PostgreSQL connection logs for unauthorized access attempts
□ Update dependencies (vp update in each package)
□ Review Cloudflare firewall rules
□ Check R2 bucket policies — ensure no public write access
```

### Data Retention Policy

```typescript
// Automated cleanup job (runs weekly via pg-boss)
export async function cleanupExpiredData() {
  // Delete notifications older than 90 days
  await db.delete(notifications).where(sql`created_at < now() - interval '90 days'`);

  // Delete YouTube cache older than 7 days
  await db.delete(youtubeCache).where(sql`created_at < now() - interval '7 days'`);

  // Anonymize interaction data older than 2 years
  await db.execute(sql`
    UPDATE interactions SET user_id = NULL
    WHERE created_at < now() - interval '2 years'
  `);

  // Delete support tickets older than 3 years
  await db.delete(supportTickets).where(sql`created_at < now() - interval '3 years'`);

  // Delete audit log older than 1 year
  await db.delete(auditLog).where(sql`created_at < now() - interval '1 year'`);
}
```
