# Customer Support System

## Overview

Support lives inside `apps/admin` under `/admin/support/`. The system is purpose-built (no third-party helpdesk in v1) — lean, fast, and integrated directly with the database. Students submit tickets from within `apps/web` at `/settings/help`.

---

## Support Ticket Flow

```
Student submits ticket (apps/web /settings/help)
       │
       ▼
Ticket created in DB → status: 'open'
       │
       ▼
Auto-assign to available support agent (round-robin)
       │
pg-boss sends email to agent
       │
       ▼
Agent responds in admin panel (/admin/support/tickets/:id)
       │
Student gets email notification + in-app notification
       │
       ▼
Student replies → agent notified again
       │
       ▼
Agent marks resolved → status: 'resolved'
       │
Auto-send CSAT survey 24 hours later
       │
       ▼
Student rates 1-5 → stored in ticket.satisfactionScore
```

---

## Ticket Submission (Student Side)

```svelte
<!-- apps/web/src/routes/(app)/settings/help/+page.svelte -->
<script lang="ts">
  import { submitTicket } from '$lib/server/remote/support';

  let category = $state<string>('');
  let subject = $state('');
  let body = $state('');
  let submitted = $state(false);

  const categories = [
    { value: 'billing',          label: '💳 Billing & Payments' },
    { value: 'account',          label: '👤 Account & Login' },
    { value: 'technical',        label: '🔧 Technical Issue' },
    { value: 'content',          label: '📚 Content Problem' },
    { value: 'abuse',            label: '🚨 Report Abuse / Violation' },
    { value: 'feature_request',  label: '💡 Feature Request' },
    { value: 'other',            label: '❓ Other' },
  ];

  const mutation = createMutation({
    mutationFn: submitTicket,
    onSuccess: () => { submitted = true; },
  });
</script>

{#if submitted}
  <div class="text-center py-16">
    <span class="text-5xl">✅</span>
    <h2 class="text-xl font-bold mt-4">Ticket submitted!</h2>
    <p class="text-muted mt-2">We'll get back to you within 24 hours via email.</p>
  </div>
{:else}
  <form onsubmit|preventDefault={() => mutation.mutate({ category, subject, body })}>
    <h1 class="text-2xl font-bold mb-6">Get Help</h1>

    <!-- Quick help links first -->
    <div class="grid grid-cols-2 gap-3 mb-8">
      <a href="/help/billing" class="card p-3 text-sm hover:border-brand-500">💳 Billing FAQ</a>
      <a href="/help/getting-started" class="card p-3 text-sm hover:border-brand-500">🚀 Getting Started</a>
      <a href="/help/premium" class="card p-3 text-sm hover:border-brand-500">⭐ Premium Features</a>
      <a href="/help/technical" class="card p-3 text-sm hover:border-brand-500">🔧 Technical Issues</a>
    </div>

    <div class="space-y-4">
      <div>
        <label class="label">Category</label>
        <select bind:value={category} class="select w-full" required>
          <option value="">Choose a category…</option>
          {#each categories as cat}
            <option value={cat.value}>{cat.label}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="label">Subject</label>
        <input bind:value={subject} class="input w-full" placeholder="Brief description of the issue" required />
      </div>
      <div>
        <label class="label">Details</label>
        <textarea bind:value={body} class="textarea w-full min-h-[120px]"
                  placeholder="Please describe your issue in detail. Include any error messages." required />
      </div>
      <button type="submit" disabled={$mutation.isPending} class="btn-primary w-full">
        {$mutation.isPending ? 'Submitting…' : 'Submit Ticket'}
      </button>
    </div>
  </form>
{/if}
```

---

## Ticket Detail (Agent View)

```svelte
<!-- apps/admin/src/routes/(admin)/support/tickets/[id]/+page.svelte -->
<script lang="ts">
  import { getTicket, replyToTicket, updateTicketStatus } from '$lib/server/remote/admin-support';

  let { data } = $props();
  let replyBody = $state('');
  let isInternal = $state(false);  // internal note vs customer-visible reply

  const ticket = createQuery({
    queryKey: ['ticket', data.ticketId],
    queryFn: () => getTicket({ ticketId: data.ticketId }),
    refetchInterval: 30_000,
  });

  // Quick macros
  const macros = [
    { label: 'Acknowledge', text: 'Hi {name}, thanks for reaching out. I\'m looking into this for you and will follow up shortly.' },
    { label: 'Refund processed', text: 'Hi {name}, your refund has been processed. It should appear within 5-10 business days.' },
    { label: 'Bug escalated', text: 'Hi {name}, I\'ve flagged this with our engineering team. We\'ll keep you updated.' },
    { label: 'Resolved?', text: 'Hi {name}, just checking if the issue has been resolved on your end. Please let us know!' },
  ];
</script>

<div class="flex h-screen">
  <!-- Ticket thread (left) -->
  <div class="flex-1 flex flex-col border-r border-[--color-border]">
    <!-- Header -->
    <div class="p-4 border-b flex justify-between items-start">
      <div>
        <h1 class="font-semibold">{$ticket.data?.subject}</h1>
        <div class="flex gap-2 mt-1">
          <Badge variant={priorityColor($ticket.data?.priority)}>{$ticket.data?.priority}</Badge>
          <Badge variant={statusColor($ticket.data?.status)}>{$ticket.data?.status}</Badge>
          <span class="text-xs text-muted">{$ticket.data?.category}</span>
        </div>
      </div>
      <div class="flex gap-2">
        <select class="select text-xs" onchange={(e) => updateStatus(e.target.value)}>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_user">Waiting on User</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>
    </div>

    <!-- Message thread -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      {#each $ticket.data?.messages ?? [] as msg}
        <div class="flex gap-3 {msg.isInternal ? 'opacity-70' : ''}">
          <img src={msg.author?.avatarUrl ?? '/support-avatar.png'} class="size-8 rounded-full shrink-0" alt="" />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium">{msg.author?.displayName ?? 'Support'}</span>
              {#if msg.isInternal}
                <span class="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">Internal Note</span>
              {/if}
              <span class="text-xs text-muted">{relativeTime(msg.createdAt)}</span>
            </div>
            <div class="text-sm bg-[--color-bg-raised] p-3 rounded-xl">
              {msg.body}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Reply box -->
    <div class="p-4 border-t">
      <!-- Macros -->
      <div class="flex gap-2 mb-2 flex-wrap">
        {#each macros as macro}
          <button onclick={() => replyBody = macro.text.replace('{name}', $ticket.data?.user?.displayName ?? 'there')}
                  class="text-xs px-2 py-1 rounded border hover:border-brand-500 transition-colors">
            {macro.label}
          </button>
        {/each}
      </div>
      <textarea bind:value={replyBody} class="textarea w-full min-h-[100px] mb-2"
                placeholder="Type your reply…" />
      <div class="flex items-center justify-between">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={isInternal} />
          Internal note (not visible to customer)
        </label>
        <button onclick={sendReply} class="btn-primary">
          {isInternal ? 'Add Note' : 'Send Reply'}
        </button>
      </div>
    </div>
  </div>

  <!-- User info sidebar (right) -->
  <div class="w-72 p-4 space-y-4 overflow-y-auto">
    <!-- User summary -->
    <div class="card p-4">
      <div class="flex items-center gap-3 mb-3">
        <img src={$ticket.data?.user?.avatarUrl} class="size-10 rounded-full" alt="" />
        <div>
          <p class="font-medium text-sm">{$ticket.data?.user?.displayName}</p>
          <p class="text-xs text-muted">@{$ticket.data?.user?.username}</p>
        </div>
      </div>
      <div class="text-xs space-y-1 text-muted">
        <p>Plan: <span class="font-medium text-[--color-text]">{$ticket.data?.user?.plan}</span></p>
        <p>Joined: {formatDate($ticket.data?.user?.createdAt)}</p>
        <p>Streak: {$ticket.data?.user?.streakDays} days</p>
      </div>
      <a href="/admin/users/{$ticket.data?.user?.id}" class="text-xs text-brand-500 mt-2 block">
        Full profile →
      </a>
    </div>

    <!-- Ticket history -->
    <div class="card p-4">
      <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Previous Tickets</p>
      {#each $ticket.data?.userTicketHistory ?? [] as prev}
        <a href="/admin/support/tickets/{prev.id}" class="block text-xs text-muted hover:text-[--color-text] py-1">
          {prev.subject} · {formatDate(prev.createdAt)}
        </a>
      {/each}
    </div>

    <!-- Quick actions -->
    <div class="card p-4 space-y-2">
      <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Quick Actions</p>
      <button class="btn-secondary w-full text-xs">Upgrade to Premium (free)</button>
      <button class="btn-secondary w-full text-xs">Grant 7-day Trial</button>
      <button class="btn-secondary w-full text-xs">Reset Password</button>
      <button class="btn-danger w-full text-xs">Suspend Account</button>
    </div>
  </div>
</div>
```

---

## CSAT Survey (Automated)

```typescript
// packages/jobs/src/jobs/send-csat.ts
export async function sendCsatSurveys() {
  // Find tickets resolved 24h ago without a CSAT response
  const tickets = await db.select().from(supportTickets)
    .where(and(
      eq(supportTickets.status, 'resolved'),
      sql`resolved_at BETWEEN now() - interval '25 hours' AND now() - interval '23 hours'`,
      sql`satisfaction_score IS NULL`,
    ));

  for (const ticket of tickets) {
    await pgBoss.send('send-email', {
      to: ticket.user.email,
      template: 'csatSurvey',
      data: {
        ticketId: ticket.id,
        subject: ticket.subject,
        ratingUrl: `${process.env.PUBLIC_APP_URL}/support/rate/${ticket.id}`,
      },
    });
  }
}
```

---

## Support Metrics (Admin Analytics)

```typescript
// Key metrics tracked for support team:
// - Average first response time (target: < 4 hours)
// - Average resolution time (target: < 24 hours)
// - CSAT score (target: > 4.2/5)
// - Tickets by category (identify product issues)
// - Tickets per agent (workload balance)
// - Ticket volume over time (growth indicator)

export const getSupportMetrics = query(async ({ dateRange }) => {
  return db.execute(sql`
    SELECT
      AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))/3600) AS avg_first_response_hours,
      AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) AS avg_resolution_hours,
      AVG(satisfaction_score) AS avg_csat,
      COUNT(*) FILTER (WHERE status = 'open') AS open_count,
      COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
      COUNT(*) AS total
    FROM support_tickets
    WHERE created_at >= ${dateRange.start} AND created_at <= ${dateRange.end}
  `);
});
```
