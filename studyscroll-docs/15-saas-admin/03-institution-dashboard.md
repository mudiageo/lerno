# Institution Dashboard — Schools & Universities

## App: `apps/institution`
**URL:** `school.studyscroll.dev` or white-label subdomain  
**Users:** Institution Admins, Department Heads, Lecturers  
**Auth:** same `@studyscroll/auth` with `institution_admin` or `lecturer` roles

---

## Route Map

```
/institution/
├── login                       ← Institution-scoped login
├── setup                       ← Onboarding wizard (new institutions)
│
├── dashboard                   ← Overview: students, engagement, at-risk
│
├── students/
│   ├── (list)                  ← All enrolled students with filters
│   ├── [id]                    ← Student profile + mastery + activity
│   └── at-risk                 ← Students flagged as disengaged
│
├── courses/
│   ├── (list)                  ← All institution courses
│   ├── new                     ← Create new course
│   └── [id]/
│       ├── overview            ← Enrollment, engagement, mastery heatmap
│       ├── content             ← Materials, AI content for this course
│       ├── schedule            ← Exam/assignment schedule for cohort
│       └── students            ← Course-specific student analytics
│
├── analytics/
│   ├── overview                ← Institution-wide KPIs
│   ├── engagement              ← DAU, session length, content consumption
│   ├── mastery                 ← Topic mastery across cohort
│   └── export                  ← CSV/PDF report export
│
├── content/
│   ├── library                 ← Uploaded materials (PDFs, notes, videos)
│   ├── upload                  ← Bulk upload materials
│   └── ai-generated            ← Review/edit AI content for their courses
│
├── lecturers/
│   ├── (list)                  ← Manage lecturer accounts
│   └── invite                  ← Invite new lecturer
│
├── billing/
│   ├── overview                ← Plan, seats used, renewal date
│   ├── seats                   ← Add/remove seats
│   └── invoices                ← Payment history
│
└── settings/
    ├── profile                 ← Institution name, logo, brand color
    ├── domain                  ← Custom domain config
    └── notifications           ← Alert preferences (at-risk students etc.)
```

---

## Institution Dashboard — Overview

```svelte
<!-- apps/institution/src/routes/(app)/dashboard/+page.svelte -->
<script lang="ts">
  import { getInstitutionDashboard } from '$lib/server/remote/institution';

  let { data } = $props();
  const stats = createQuery({
    queryKey: ['institution-dashboard', data.institution.id],
    queryFn: () => getInstitutionDashboard({ institutionId: data.institution.id }),
    refetchInterval: 300_000,
  });
</script>

<div class="p-6 space-y-8">
  <div class="flex items-center gap-4">
    {#if data.institution.logoUrl}
      <img src={data.institution.logoUrl} alt="" class="size-12 rounded-xl" />
    {/if}
    <div>
      <h1 class="text-2xl font-bold">{data.institution.name}</h1>
      <p class="text-sm text-muted">Institution Dashboard</p>
    </div>
  </div>

  <!-- KPI Row -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard label="Enrolled Students"   value={$stats.data?.totalStudents} />
    <StatCard label="Active Today"        value={$stats.data?.activeToday}
              sub="{Math.round(($stats.data?.activeToday / $stats.data?.totalStudents) * 100)}% of total" />
    <StatCard label="Seats Used"          value="{$stats.data?.seatsUsed} / {data.institution.seatLimit}" />
    <StatCard label="At-Risk Students"    value={$stats.data?.atRiskCount}
              alert={$stats.data?.atRiskCount > 0} href="/institution/students/at-risk" />
  </div>

  <!-- Engagement chart -->
  <div class="card p-4">
    <h2 class="font-semibold mb-3">Student Engagement (last 30 days)</h2>
    <LineChart data={$stats.data?.engagementChart} />
  </div>

  <!-- Course mastery heatmap -->
  <div class="card p-4">
    <h2 class="font-semibold mb-3">Average Mastery by Course</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {#each $stats.data?.courseMastery ?? [] as course}
        <div class="p-3 rounded-lg border text-sm {masteryColor(course.avgScore)}">
          <div class="font-medium">{course.code}</div>
          <div class="text-2xl font-bold mt-1">{course.avgScore}%</div>
          <div class="text-xs mt-1">{course.studentCount} students</div>
        </div>
      {/each}
    </div>
  </div>

  <!-- At-risk alert -->
  {#if ($stats.data?.atRiskStudents?.length ?? 0) > 0}
    <div class="card p-4 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20">
      <h2 class="font-semibold text-orange-800 dark:text-orange-300 mb-3">
        ⚠️ {$stats.data.atRiskStudents.length} students show low engagement
      </h2>
      <div class="space-y-2">
        {#each $stats.data.atRiskStudents.slice(0, 5) as student}
          <div class="flex items-center justify-between text-sm">
            <span>{student.displayName}</span>
            <span class="text-muted">Last active {relativeTime(student.lastActiveDate)}</span>
            <a href="/institution/students/{student.id}" class="text-brand-500 text-xs">View →</a>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
```

---

## Student Detail (Institution View)

```typescript
// What an institution admin/lecturer can see about a student:
// - Name, enrolled courses, join date
// - Last active date and streak
// - Mastery scores per topic per course (heatmap)
// - Quiz answer history (aggregated accuracy, not individual answers)
// - Content engagement (posts viewed, videos watched, flashcards reviewed)
// - Upcoming exam schedule
// - Study session history (when and how long)

// What they CANNOT see:
// - Private posts
// - Individual quiz answers (only aggregate accuracy)
// - Payment information
// - Support ticket content
// - Messages or DMs
```

---

## At-Risk Detection Algorithm

```typescript
// packages/jobs/src/jobs/detect-at-risk.ts

export async function detectAtRiskStudents(institutionId: string) {
  const threshold = {
    inactiveDays: 7,          // not active in 7 days
    lowMasteryPct: 40,        // avg mastery < 40
    examProximityDays: 14,    // exam in next 14 days AND any of above
  };

  const atRisk = await db.execute(sql`
    SELECT u.id, u.display_name, u.last_active_date,
      AVG(tm.score) as avg_mastery,
      MIN(cs.scheduled_at) as next_exam,
      EXTRACT(DAY FROM MIN(cs.scheduled_at) - now()) as days_to_exam
    FROM users u
    JOIN user_courses uc ON uc.user_id = u.id AND uc.active = true
    LEFT JOIN topic_mastery tm ON tm.user_id = u.id
    LEFT JOIN course_schedule cs ON cs.user_id = u.id
      AND cs.scheduled_at > now()
      AND cs.event_type IN ('exam', 'quiz')
    WHERE u.institution_id = ${institutionId}
    GROUP BY u.id
    HAVING
      -- Inactive for 7+ days with exam coming up
      (u.last_active_date < now() - interval '7 days'
       AND MIN(cs.scheduled_at) < now() + interval '14 days')
      OR
      -- Very low mastery with exam soon
      (AVG(tm.score) < ${threshold.lowMasteryPct}
       AND MIN(cs.scheduled_at) < now() + interval '14 days')
    ORDER BY days_to_exam ASC
  `);

  return atRisk.rows;
}
```

---

## Course Management (Lecturer View)

```svelte
<!-- apps/institution/src/routes/(app)/courses/[id]/+page.svelte -->
<script lang="ts">
  // Tabs: Overview | Students | Content | Schedule
  let activeTab = $state('overview');
</script>

<!-- Overview tab: enrollment count, avg mastery, engagement metrics -->
<!-- Students tab: table of enrolled students, mastery per topic -->
<!-- Content tab: uploaded materials + AI-generated content for this course -->
<!-- Schedule tab: exam/assignment calendar, set new events -->
```

### Bulk Material Upload

```svelte
<!-- Upload multiple PDFs at once → queues OCR + AI content generation for each -->
<script lang="ts">
  import { uploadCourseMaterial } from '$lib/server/remote/institution';

  let files = $state<File[]>([]);
  let uploading = $state(false);

  async function uploadAll() {
    uploading = true;
    for (const file of files) {
      // 1. Get presigned URL
      // 2. Upload to R2
      // 3. Create courseMaterial record
      // 4. pg-boss queues process-upload job → OCR → AI content generation
    }
    uploading = false;
  }
</script>
```

---

## Billing & Seat Management

```svelte
<!-- apps/institution/src/routes/(app)/billing/overview/+page.svelte -->
<div class="card p-6">
  <div class="flex justify-between items-start mb-6">
    <div>
      <h2 class="text-xl font-bold">Institutional Plan</h2>
      <p class="text-muted mt-1">Billed annually · Renews {renewalDate}</p>
    </div>
    <span class="badge-success">Active</span>
  </div>

  <!-- Seat usage bar -->
  <div class="mb-6">
    <div class="flex justify-between text-sm mb-1">
      <span>Seats used</span>
      <span class="font-medium">{seatsUsed} / {seatLimit}</span>
    </div>
    <div class="h-3 rounded-full bg-[--color-border]">
      <div class="h-3 rounded-full bg-brand-500" style="width: {(seatsUsed/seatLimit)*100}%" />
    </div>
    {#if seatsUsed > seatLimit * 0.9}
      <p class="text-amber-600 text-xs mt-1">⚠️ Running low on seats. Contact us to add more.</p>
    {/if}
  </div>

  <div class="grid grid-cols-2 gap-4 mb-6">
    <div class="p-3 rounded-lg bg-[--color-bg-raised]">
      <p class="text-sm text-muted">Price per seat</p>
      <p class="text-lg font-bold">₦2,500<span class="text-sm font-normal">/mo</span></p>
    </div>
    <div class="p-3 rounded-lg bg-[--color-bg-raised]">
      <p class="text-sm text-muted">Monthly total</p>
      <p class="text-lg font-bold">₦{(seatsUsed * 2500).toLocaleString()}</p>
    </div>
  </div>

  <button class="btn-primary">Add More Seats</button>
  <button class="btn-secondary ml-3">Download Invoice</button>
</div>
```

---

## White-Label Branding

Institutional clients can optionally white-label the student-facing app experience:

```typescript
// Applied in student app's +layout.server.ts
// If user.institutionId exists and institution has brand config:
const institution = await db.query.institutions.findFirst({
  where: eq(institutions.id, user.institutionId),
});

if (institution?.brandColor || institution?.logoUrl) {
  // Return brand config to client
  return { user, brand: { color: institution.brandColor, logo: institution.logoUrl, name: institution.name } };
}
```

```svelte
<!-- apps/web/src/routes/+layout.svelte — apply brand CSS vars -->
{#if data.brand?.color}
  <svelte:head>
    <style>
      :root {
        --color-brand-500: {data.brand.color};
        --color-brand-600: color-mix(in oklch, {data.brand.color} 85%, black);
      }
    </style>
  </svelte:head>
{/if}
```
