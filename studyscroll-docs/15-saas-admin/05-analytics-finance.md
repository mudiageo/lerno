# Analytics & Finance Dashboards

## Analytics Dashboard (`/admin/analytics/`)

Accessible by: `superadmin`, `staff_admin`, `analyst`, `finance`

---

## Platform KPI Dashboard

```typescript
// apps/admin/src/lib/server/remote/admin-analytics.ts

export const getPlatformAnalytics = query(async ({ range = '30d' }) => {
  const since = rangeToDate(range); // '7d' | '30d' | '90d' | '1y'

  const [
    userGrowth, dauSeries, retentionCohorts,
    contentStats, aiUsage, topCourses,
    conversionFunnel, churnData,
  ] = await Promise.all([
    // New signups per day
    db.execute(sql`
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS signups
      FROM users WHERE created_at >= ${since}
      GROUP BY 1 ORDER BY 1
    `),
    // DAU per day
    db.execute(sql`
      SELECT date_trunc('day', last_active_date)::date AS day, COUNT(*) AS dau
      FROM users WHERE last_active_date >= ${since}
      GROUP BY 1 ORDER BY 1
    `),
    // Retention: % of week-1 users still active at week 4
    computeRetentionCohorts(since),
    // Content stats
    db.execute(sql`
      SELECT post_type, COUNT(*) AS total,
        COUNT(*) FILTER (WHERE ai_generated) AS ai_count,
        AVG(engagement_score) AS avg_engagement
      FROM posts WHERE created_at >= ${since}
      GROUP BY post_type
    `),
    // AI API usage and cost
    db.execute(sql`
      SELECT date_trunc('day', created_at)::date AS day,
        COUNT(*) AS requests,
        SUM((metadata->>'tokens')::int) AS tokens
      FROM audit_log WHERE action = 'ai.generate' AND created_at >= ${since}
      GROUP BY 1 ORDER BY 1
    `),
    // Top courses by enrollment
    db.execute(sql`
      SELECT code, title, COUNT(*) AS enrollments
      FROM user_courses WHERE created_at >= ${since}
      GROUP BY code, title ORDER BY enrollments DESC LIMIT 10
    `),
    // Conversion funnel: signup → first post → premium
    computeConversionFunnel(since),
    // Churn: subscriptions cancelled
    db.execute(sql`
      SELECT date_trunc('week', updated_at)::date AS week,
        COUNT(*) AS cancelled
      FROM subscriptions WHERE status = 'cancelled' AND updated_at >= ${since}
      GROUP BY 1 ORDER BY 1
    `),
  ]);

  return { userGrowth, dauSeries, retentionCohorts, contentStats, aiUsage, topCourses, conversionFunnel, churnData };
});

async function computeConversionFunnel(since: Date) {
  const [signups, activated, converted] = await Promise.all([
    db.$count(users, sql`created_at >= ${since}`),
    db.$count(users, sql`created_at >= ${since} AND xp > 0`),
    db.$count(subscriptions, and(
      eq(subscriptions.status, 'active'),
      sql`created_at >= ${since}`,
    )),
  ]);
  return [
    { stage: 'Signed Up',    count: signups,    pct: 100 },
    { stage: 'Activated',    count: activated,  pct: Math.round((activated/signups)*100) },
    { stage: 'Converted',    count: converted,  pct: Math.round((converted/signups)*100) },
  ];
}
```

### Analytics UI

```svelte
<!-- apps/admin/src/routes/(admin)/analytics/overview/+page.svelte -->
<div class="p-6 space-y-8">
  <!-- Range selector -->
  <div class="flex gap-2">
    {#each ['7d','30d','90d','1y'] as r}
      <button onclick={() => range = r}
              class="px-3 py-1 rounded text-sm {range === r ? 'bg-brand-500 text-white' : 'btn-secondary'}">
        {r}
      </button>
    {/each}
  </div>

  <!-- Top KPIs -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard label="New Signups"      value={fmt($stats.data?.totalSignups)}   trend="+12%" />
    <StatCard label="Peak DAU"         value={fmt($stats.data?.peakDau)} />
    <StatCard label="DAU/MAU Ratio"    value="{$stats.data?.dauMauRatio}%"      target="40%" />
    <StatCard label="Avg Session"      value="{$stats.data?.avgSessionMins}min" />
  </div>

  <!-- Growth chart -->
  <div class="card p-4">
    <h2 class="font-semibold mb-4">User Growth & DAU</h2>
    <DualLineChart
      series={[$stats.data?.userGrowth, $stats.data?.dauSeries]}
      labels={['Signups', 'DAU']}
    />
  </div>

  <!-- Content breakdown -->
  <div class="card p-4">
    <h2 class="font-semibold mb-4">Content by Type</h2>
    <BarChart data={$stats.data?.contentStats} xKey="post_type" yKey="total" />
  </div>

  <!-- Conversion funnel -->
  <div class="card p-4">
    <h2 class="font-semibold mb-4">Conversion Funnel</h2>
    <FunnelChart stages={$stats.data?.conversionFunnel} />
  </div>

  <!-- Top courses -->
  <div class="card p-4">
    <h2 class="font-semibold mb-4">Top Courses by Enrollment</h2>
    <table class="w-full text-sm">
      <thead><tr class="text-left text-muted border-b"><th>Course</th><th>Enrollments</th></tr></thead>
      <tbody>
        {#each $stats.data?.topCourses ?? [] as course}
          <tr class="border-b last:border-0 py-2">
            <td class="py-2 font-medium">{course.code} <span class="text-muted font-normal">— {course.title}</span></td>
            <td class="py-2">{course.enrollments.toLocaleString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
```

---

## Finance Dashboard (`/admin/payments/`)

Accessible by: `superadmin`, `staff_admin`, `finance`

```typescript
// apps/admin/src/lib/server/remote/admin-finance.ts

export const getFinanceDashboard = query(async ({ range = '30d' }) => {
  const since = rangeToDate(range);

  const [mrr, arr, newRevenue, churnedRevenue, byProvider, byPlan, institutionalRevenue] = await Promise.all([
    // MRR: sum of all active monthly subscriptions
    db.select({ mrr: sql<number>`sum(amount)` }).from(subscriptions)
      .where(and(eq(subscriptions.status,'active'), eq(subscriptions.billingPeriod,'monthly'))),
    // ARR: MRR * 12
    // New revenue this period
    db.select({ total: sql<number>`sum(amount)` }).from(paymentEvents)
      .where(and(eq(paymentEvents.status,'active'), sql`created_at >= ${since}`)),
    // Churned revenue
    db.select({ total: sql<number>`sum(pe.amount)` }).from(paymentEvents, 'pe')
      .where(and(eq(paymentEvents.status,'cancelled'), sql`pe.created_at >= ${since}`)),
    // Revenue by payment provider
    db.execute(sql`
      SELECT provider, SUM(amount) AS total, COUNT(*) AS transactions
      FROM payment_events WHERE status = 'active' AND created_at >= ${since}
      GROUP BY provider
    `),
    // Revenue by plan
    db.execute(sql`
      SELECT plan, SUM(amount) AS total, COUNT(*) AS count
      FROM subscriptions WHERE status = 'active'
      GROUP BY plan
    `),
    // Institutional accounts revenue
    db.execute(sql`
      SELECT i.name, i.seat_limit, i.seats_used, s.amount, s.currency
      FROM institutions i
      JOIN subscriptions s ON s.id = i.subscription_id
      WHERE s.status = 'active'
      ORDER BY s.amount DESC
    `),
  ]);

  return {
    mrr: mrr[0].mrr ?? 0,
    arr: (mrr[0].mrr ?? 0) * 12,
    newRevenue: newRevenue[0].total ?? 0,
    churnedRevenue: churnedRevenue[0].total ?? 0,
    netRevenue: (newRevenue[0].total ?? 0) - (churnedRevenue[0].total ?? 0),
    byProvider: byProvider.rows,
    byPlan: byPlan.rows,
    institutionalRevenue: institutionalRevenue.rows,
  };
});
```

```svelte
<!-- Finance dashboard UI -->
<div class="p-6 space-y-8">
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard label="MRR"           value={`₦${fmtMoney($stats.data?.mrr)}`}  trend="+8%" />
    <StatCard label="ARR"           value={`₦${fmtMoney($stats.data?.arr)}`} />
    <StatCard label="New Revenue"   value={`₦${fmtMoney($stats.data?.newRevenue)}`} positive />
    <StatCard label="Churned"       value={`₦${fmtMoney($stats.data?.churnedRevenue)}`} negative />
  </div>

  <!-- Revenue by provider (Paystack vs Stripe) -->
  <div class="card p-4">
    <h2 class="font-semibold mb-4">Revenue by Payment Provider</h2>
    <DonutChart data={$stats.data?.byProvider} labelKey="provider" valueKey="total" />
  </div>

  <!-- Institutional accounts table -->
  <div class="card p-4">
    <h2 class="font-semibold mb-4">Institutional Clients</h2>
    <table class="w-full text-sm">
      <thead>
        <tr class="text-left text-muted border-b">
          <th>Institution</th>
          <th>Seats</th>
          <th>MRR</th>
          <th>Currency</th>
        </tr>
      </thead>
      <tbody>
        {#each $stats.data?.institutionalRevenue ?? [] as inst}
          <tr class="border-b last:border-0">
            <td class="py-2 font-medium">{inst.name}</td>
            <td class="py-2">{inst.seats_used} / {inst.seat_limit}</td>
            <td class="py-2 font-bold">{fmtMoney(inst.amount)}</td>
            <td class="py-2 text-muted">{inst.currency}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Refund management -->
  <div class="card p-4">
    <h2 class="font-semibold mb-4">Pending Refund Requests</h2>
    <RefundRequestsTable />
  </div>
</div>
```

### Refund Processing

```typescript
// apps/admin/src/lib/server/remote/admin-finance.ts

export const processRefund = command(async ({ subscriptionId, reason, staffId, amount }) => {
  requirePermission(staff.role, 'payments:refund');

  const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.id, subscriptionId) });
  if (!sub) throw new Error('Subscription not found');

  // Issue refund through original payment provider
  const provider = createPaymentProvider(sub.currency);
  await provider.refund(sub.providerSubId, amount);

  // Update subscription status
  await db.update(subscriptions).set({ status: 'cancelled' }).where(eq(subscriptions.id, subscriptionId));

  // Downgrade user
  await db.update(users).set({ plan: 'free' }).where(eq(users.id, sub.userId));

  await logAuditEvent({
    actorId: staffId,
    action: 'payments.refund',
    targetType: 'subscription',
    targetId: subscriptionId,
    metadata: { reason, amount, currency: sub.currency },
  });

  // Notify user
  await pgBoss.send('send-email', {
    to: sub.user.email,
    template: 'refundProcessed',
    data: { amount, currency: sub.currency },
  });
});
```

---

## Report Export

```typescript
// Export any analytics view to CSV or PDF

export const exportReport = command(async ({ type, range, format, staffId }) => {
  requirePermission(staff.role, 'analytics:export');

  const data = await getReportData(type, range);

  if (format === 'csv') {
    const csv = objectsToCSV(data);
    const key = `reports/${staffId}/${type}-${range}-${Date.now()}.csv`;
    await storage.upload(key, Buffer.from(csv), 'text/csv');
    const url = await storage.getSignedUrl(key, 3600); // 1 hour
    return { downloadUrl: url };
  }

  // PDF via puppeteer/html-pdf in worker
  await pgBoss.send('generate-report-pdf', { type, range, staffId });
  return { queued: true };
});
```
