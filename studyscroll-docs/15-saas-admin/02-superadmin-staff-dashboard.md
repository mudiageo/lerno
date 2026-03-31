# SuperAdmin & Staff Admin Dashboard

## App: `apps/admin`
**URL:** `admin.studyscroll.dev`  
**Access:** Staff roles only. IP allowlist in Vercel + role check on every route.

---

## Route Map

```
/admin/
├── login                   ← Staff login (email/password, no OAuth)
├── unauthorized            ← Access denied page
│
├── dashboard               ← Main overview (superadmin/staff_admin)
│
├── users/
│   ├── (list)              ← Searchable user table
│   ├── [id]/               ← Single user detail + actions
│   └── banned              ← Banned/suspended users
│
├── content/
│   ├── feed                ← All posts with moderation queue
│   ├── flagged             ← Flagged content review
│   ├── ai-pool             ← AI-generated content management
│   └── courses             ← Platform course catalog management
│
├── moderation/
│   ├── queue               ← Pending moderation items
│   ├── history             ← Past moderation decisions
│   └── appeals             ← User appeals
│
├── support/
│   ├── tickets             ← All support tickets
│   ├── tickets/[id]        ← Single ticket thread
│   └── macros              ← Saved response templates
│
├── payments/
│   ├── overview            ← Revenue dashboard
│   ├── subscriptions       ← All active subscriptions
│   ├── institutions        ← Institutional accounts
│   ├── refunds             ← Refund requests and history
│   └── events              ← Payment event log
│
├── analytics/
│   ├── overview            ← Platform KPI dashboard
│   ├── growth              ← User growth, retention, churn
│   ├── content             ← Content performance
│   ├── ai-usage            ← AI API cost and usage
│   └── reports             ← Export CSV/PDF reports
│
├── staff/
│   ├── (list)              ← Staff members list
│   ├── invite              ← Invite new staff
│   ├── [id]/               ← Staff profile + permissions
│   └── audit-log           ← All admin actions log
│
└── system/
    ├── config              ← Platform-wide settings (superadmin only)
    ├── feature-flags       ← Enable/disable features
    ├── ai-config           ← AI generation settings, prompts
    └── maintenance         ← Maintenance mode toggle
```

---

## Dashboard — Superadmin Overview

```svelte
<!-- apps/admin/src/routes/(admin)/dashboard/+page.svelte -->
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { getDashboardStats } from '$lib/server/remote/admin';
  import StatCard from '@studyscroll/ui/StatCard.svelte';
  import LineChart from '$lib/components/charts/LineChart.svelte';
  import AlertList from '$lib/components/AlertList.svelte';

  let { data } = $props();
  const stats = createQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getDashboardStats,
    refetchInterval: 60_000,  // refresh every minute
  });
</script>

<div class="p-6 space-y-8">
  <h1 class="text-2xl font-bold">Platform Overview</h1>

  <!-- Stat cards row -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard label="Total Users"        value={$stats.data?.totalUsers}        trend={$stats.data?.usersTrend} />
    <StatCard label="DAU"                value={$stats.data?.dau}               trend={$stats.data?.dauTrend} />
    <StatCard label="MRR"                value={$stats.data?.mrr} prefix="₦"   trend={$stats.data?.mrrTrend} />
    <StatCard label="Active Subs"        value={$stats.data?.activeSubscriptions} />
    <StatCard label="Posts Today"        value={$stats.data?.postsToday} />
    <StatCard label="AI Posts Today"     value={$stats.data?.aiPostsToday} />
    <StatCard label="Open Tickets"       value={$stats.data?.openTickets}       alert={$stats.data?.openTickets > 20} />
    <StatCard label="Flagged Content"    value={$stats.data?.flaggedContent}    alert={$stats.data?.flaggedContent > 0} />
  </div>

  <!-- Charts row -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-4">
      <h2 class="font-semibold mb-3">Daily Active Users (30d)</h2>
      <LineChart data={$stats.data?.dauChart} color="brand" />
    </div>
    <div class="card p-4">
      <h2 class="font-semibold mb-3">Revenue (MRR)</h2>
      <LineChart data={$stats.data?.revenueChart} color="green" prefix="₦" />
    </div>
  </div>

  <!-- Alert feed -->
  <div class="card p-4">
    <h2 class="font-semibold mb-3">Needs Attention</h2>
    <AlertList items={$stats.data?.alerts} />
  </div>
</div>
```

```typescript
// apps/admin/src/lib/server/remote/admin.ts
export const getDashboardStats = query(async ({ request }) => {
  await requireAdminAuth(request, 'analytics:platform');

  const [
    totalUsers, dau, mrr, activeSubscriptions,
    postsToday, aiPostsToday, openTickets, flaggedContent,
    dauChart, revenueChart,
  ] = await Promise.all([
    db.$count(users),
    db.$count(users, sql`last_active_date >= current_date`),
    db.select({ sum: sql<number>`sum(amount)` }).from(subscriptions)
      .where(and(eq(subscriptions.status, 'active'), eq(subscriptions.billingPeriod, 'monthly'))),
    db.$count(subscriptions, eq(subscriptions.status, 'active')),
    db.$count(posts, sql`created_at >= current_date`),
    db.$count(posts, and(sql`created_at >= current_date`, eq(posts.aiGenerated, true))),
    db.$count(supportTickets, inArray(supportTickets.status, ['open', 'in_progress'])),
    db.$count(posts, eq(posts.isFlagged, true)),
    // 30-day DAU chart
    db.execute(sql`
      SELECT date_trunc('day', last_active_date)::date AS day, count(*) AS value
      FROM users WHERE last_active_date >= now() - interval '30 days'
      GROUP BY 1 ORDER BY 1
    `),
    // 30-day revenue chart
    db.execute(sql`
      SELECT date_trunc('day', created_at)::date AS day, sum(amount) AS value
      FROM payment_events WHERE status = 'active' AND created_at >= now() - interval '30 days'
      GROUP BY 1 ORDER BY 1
    `),
  ]);

  const alerts = [];
  if (flaggedContent > 0) alerts.push({ type: 'warning', message: `${flaggedContent} posts need moderation`, href: '/admin/content/flagged' });
  if (openTickets > 20) alerts.push({ type: 'alert', message: `${openTickets} open support tickets`, href: '/admin/support/tickets' });

  return {
    totalUsers, dau, mrr: mrr[0].sum ?? 0, activeSubscriptions,
    postsToday, aiPostsToday, openTickets, flaggedContent,
    dauChart: dauChart.rows, revenueChart: revenueChart.rows,
    alerts,
    usersTrend: '+12%', dauTrend: '+5%', mrrTrend: '+8%',
  };
});
```

---

## User Management

```svelte
<!-- apps/admin/src/routes/(admin)/users/+page.svelte -->
<script lang="ts">
  import DataTable from '@studyscroll/ui/DataTable.svelte';
  import { searchUsers } from '$lib/server/remote/admin-users';

  let query = $state('');
  let plan = $state<'all'|'free'|'premium'|'institutional'>('all');
  let suspended = $state(false);

  const users = createQuery({
    queryKey: ['admin-users', query, plan, suspended],
    queryFn: () => searchUsers({ query, plan, suspended }),
    debounce: 300,
  });
</script>

<div class="p-6">
  <div class="flex items-center gap-3 mb-6">
    <input bind:value={query} placeholder="Search by name, email, username…"
           class="input flex-1 max-w-md" />
    <select bind:value={plan} class="select w-36">
      <option value="all">All Plans</option>
      <option value="free">Free</option>
      <option value="premium">Premium</option>
      <option value="institutional">Institution</option>
    </select>
    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" bind:checked={suspended} />
      Suspended only
    </label>
  </div>

  <DataTable
    data={$users.data ?? []}
    columns={[
      { key: 'avatar',      label: '',            render: 'avatar' },
      { key: 'displayName', label: 'Name',        sortable: true },
      { key: 'email',       label: 'Email',       sortable: true },
      { key: 'plan',        label: 'Plan',        render: 'badge' },
      { key: 'xp',          label: 'XP',          sortable: true },
      { key: 'streakDays',  label: 'Streak',      sortable: true },
      { key: 'createdAt',   label: 'Joined',      render: 'date', sortable: true },
      { key: 'actions',     label: '',            render: 'actions' },
    ]}
    actions={[
      { label: 'View',     href: (row) => `/admin/users/${row.id}` },
      { label: 'Suspend',  action: 'suspend',  permission: 'users:write' },
      { label: 'Delete',   action: 'delete',   permission: 'users:delete', danger: true },
    ]}
  />
</div>
```

### User Detail Page

```svelte
<!-- apps/admin/src/routes/(admin)/users/[id]/+page.svelte -->
<!-- Sections: -->
<!-- 1. Profile info (editable by support/admin) -->
<!-- 2. Account status (plan, subscription, joined date) -->
<!-- 3. Activity timeline (last 30 actions) -->
<!-- 4. Content posts (paginated list of their posts) -->
<!-- 5. Support tickets history -->
<!-- 6. Payment history -->
<!-- 7. Danger zone: Suspend | Reset Password | Delete Account -->
<!-- 8. Staff notes (internal, not visible to user) -->
```

---

## Content Moderation Queue

```svelte
<!-- apps/admin/src/routes/(admin)/content/flagged/+page.svelte -->
<script lang="ts">
  import { getFlaggedContent, moderatePost } from '$lib/server/remote/admin-content';

  let currentIndex = $state(0);
  const queue = createQuery({ queryKey: ['flagged'], queryFn: getFlaggedContent });
  const current = $derived($queue.data?.[currentIndex]);

  const approve = createMutation({
    mutationFn: ({ postId }) => moderatePost({ postId, action: 'approve' }),
    onSuccess: () => currentIndex++,
  });
  const remove = createMutation({
    mutationFn: ({ postId, reason }) => moderatePost({ postId, action: 'remove', reason }),
    onSuccess: () => currentIndex++,
  });
</script>

<div class="max-w-2xl mx-auto p-6">
  <div class="flex justify-between mb-4">
    <h1 class="text-xl font-bold">Moderation Queue</h1>
    <span class="text-sm text-muted">{currentIndex + 1} / {$queue.data?.length ?? 0}</span>
  </div>

  {#if current}
    <!-- AI moderation signal -->
    <div class="card p-4 mb-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200">
      <p class="text-sm font-medium">AI flagged as: <span class="text-amber-700">{current.flagReason}</span></p>
      <p class="text-xs text-muted">Confidence: {(current.flagConfidence * 100).toFixed(0)}%</p>
    </div>

    <!-- Post preview (same PostCard component) -->
    <PostCard post={current} preview />

    <!-- Reporter info -->
    {#if current.reportedBy}
      <div class="card p-3 mt-3 text-sm text-muted">
        Reported by {current.reportedBy.username}: "{current.reportReason}"
      </div>
    {/if}

    <!-- Actions -->
    <div class="flex gap-3 mt-6">
      <button onclick={() => approve.mutate({ postId: current.id })}
              class="btn-success flex-1">✓ Approve & Keep</button>
      <button onclick={() => remove.mutate({ postId: current.id, reason: 'policy_violation' })}
              class="btn-danger flex-1">✗ Remove Post</button>
      <button class="btn-secondary">↩ Escalate</button>
    </div>
  {:else}
    <div class="text-center py-16 text-muted">
      <p class="text-4xl mb-3">✅</p>
      <p>Queue is clear!</p>
    </div>
  {/if}
</div>
```

---

## System Configuration (Superadmin Only)

```svelte
<!-- apps/admin/src/routes/(admin)/system/config/+page.svelte -->
<!-- Feature flags, rate limits, AI config, maintenance mode -->
```

```typescript
// apps/admin/src/lib/server/remote/admin-system.ts

// Platform-wide feature flags stored in DB
export const systemConfig = pgTable('system_config', {
  key:       text('key').primaryKey(),
  value:     jsonb('value').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

// Config keys:
// maintenance_mode: { enabled: boolean, message: string }
// ai_generation: { enabled: boolean, model: string, maxTokensPerDay: number }
// new_registrations: { enabled: boolean }
// free_tier_limits: { aiPostsPerDay: number, maxCourses: number }
// feature_flags: { liveStreaming: boolean, communities: boolean, marketplace: boolean }

export const updateSystemConfig = command(async ({ key, value, staffId }) => {
  requirePermission(staff.role, 'system:config');

  await db.insert(systemConfig).values({ key, value, updatedBy: staffId })
    .onConflictDoUpdate({ target: systemConfig.key, set: { value, updatedBy: staffId, updatedAt: new Date() } });

  await logAuditEvent({ actorId: staffId, action: `system.config.${key}`, metadata: { value } });
});
```

---

## Staff Management

```svelte
<!-- apps/admin/src/routes/(admin)/staff/+page.svelte -->
<!-- Table of all staff members with:
  - Avatar, name, email
  - Role badge (color-coded)
  - Department
  - Last login
  - Active/Inactive toggle
  - Actions: Edit role, Deactivate, View audit log -->
```

```typescript
// apps/admin/src/lib/server/remote/admin-staff.ts

export const inviteStaffMember = command(async ({
  email, role, department, inviterStaffId,
}) => {
  requirePermission(inviterStaff.role, 'staff:write');

  // Create pending user account
  const [user] = await db.insert(users).values({
    email, plan: 'free',
    emailVerified: false,
  }).returning();

  await db.insert(staffMembers).values({
    userId: user.id, role, department, createdBy: inviterStaffId,
  });

  // Send invite email
  await pgBoss.send('send-email', {
    to: email,
    template: 'staffInvite',
    data: { role, inviterName: inviterStaff.displayName, loginUrl: process.env.ADMIN_APP_URL },
  });

  await logAuditEvent({
    actorId: inviterStaffId,
    action: 'staff.invite',
    metadata: { email, role, department },
  });
});
```
