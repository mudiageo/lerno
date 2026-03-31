# Monorepo — All Apps & Services

## Complete App Inventory

StudyScroll is not just one app. The full product consists of **7 deployable applications** and **8 shared packages**, all in one pnpm monorepo.

```
studyscroll/
│
├── apps/
│   ├── web/              → Student app (SvelteKit) — web, desktop, Android
│   ├── admin/            → SuperAdmin + Staff dashboard (SvelteKit)
│   ├── institution/      → Institution dashboard for schools/universities (SvelteKit)
│   ├── landing/          → Marketing site (SvelteKit static)
│   ├── docs/             → Developer/help documentation site (static)
│   ├── desktop/          → Tauri v2 shell (wraps apps/web)
│   └── api-gateway/      → Standalone Express API for external integrations (optional)
│
└── packages/
    ├── db/               → Drizzle schema + client
    ├── ai/               → AI provider abstraction
    ├── storage/          → Storage provider abstraction
    ├── email/            → Email provider (Resend + Nodemailer)
    ├── payments/         → Paystack + Stripe
    ├── jobs/             → pg-boss workers
    ├── auth/             → better-auth shared config
    └── ui/               → Shared Svelte component library (shadcn base + StudyScroll tokens)
```

---

## App Descriptions

### `apps/web` — Main Student App
- **URL:** `app.studyscroll.dev`
- **Stack:** SvelteKit 2, Tailwind v4, shadcn-svelte
- **Auth:** `@studyscroll/auth` (student role)
- **Users:** Students, tutors
- **Features:** All 3 modes (Scroll/Watch/Study), live, communities, gamification
- **Deploy:** Vercel

### `apps/admin` — Internal Staff Dashboard
- **URL:** `admin.studyscroll.dev` (IP-restricted or VPN)
- **Stack:** SvelteKit 2, Tailwind v4, shadcn-svelte
- **Auth:** `@studyscroll/auth` (staff/admin roles only)
- **Users:** Superadmin, moderators, support agents, data analysts, finance team
- **Features:** Full platform management (see `15-saas-admin/`)
- **Deploy:** Vercel (separate project, restricted access)

### `apps/institution` — Institution Admin Dashboard
- **URL:** `school.studyscroll.dev` or white-label `portal.university.edu`
- **Stack:** SvelteKit 2, Tailwind v4, optionally branded
- **Auth:** `@studyscroll/auth` (institution_admin, lecturer roles)
- **Users:** School admins, department heads, lecturers
- **Features:** Cohort analytics, course management, student monitoring, billing
- **Deploy:** Vercel

### `apps/landing` — Marketing Site
- **URL:** `studyscroll.dev`
- **Stack:** SvelteKit 2 (fully static, `adapter-static`)
- **Features:** Homepage, pricing, blog, about, careers, press
- **Deploy:** Vercel (static CDN)

### `apps/docs` — Documentation Site
- **URL:** `docs.studyscroll.dev`
- **Stack:** SvelteKit 2 static OR VitePress
- **Features:** Developer API docs, help center, integration guides
- **Deploy:** Vercel (static CDN)

### `apps/desktop` — Tauri Shell
- **URL:** macOS/Windows/Linux/Android app
- **Stack:** Tauri v2 (Rust), wraps `apps/web` build
- **Deploy:** GitHub Releases, future: App Store / Play Store

### `apps/api-gateway` — External REST API (Optional)
- **URL:** `api.studyscroll.dev`
- **Stack:** Express 4, Zod validation, OpenAPI/Swagger
- **Auth:** API key authentication for institutional integrations
- **Features:** Webhooks, LMS integrations (Moodle, Canvas), student sync
- **Deploy:** Render (always-on)

---

## Shared Packages

### `packages/ui` — Shared Component Library

A package that re-exports all StudyScroll custom components so they can be used across `apps/admin`, `apps/institution`, and `apps/web` without duplication.

```typescript
// packages/ui/src/index.ts
export { default as PostCard } from './components/PostCard.svelte';
export { default as UserAvatar } from './components/UserAvatar.svelte';
export { default as StatCard } from './components/StatCard.svelte';
export { default as DataTable } from './components/DataTable.svelte';
export { default as XPBadge } from './components/XPBadge.svelte';
export { default as StreakCounter } from './components/StreakCounter.svelte';
export { default as LoadingSpinner } from './components/LoadingSpinner.svelte';
export { default as EmptyState } from './components/EmptyState.svelte';
export { default as ConfirmDialog } from './components/ConfirmDialog.svelte';
// Tailwind config is shared via CSS custom properties — no config export needed
```

### `packages/auth` — Shared Auth Config

```typescript
// packages/auth/src/index.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@studyscroll/db';

// Roles: student | tutor | institution_admin | lecturer |
//         support | moderator | analyst | finance | staff_admin | superadmin
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  // ... full config in 01-architecture/03-data-flow-auth-remote-functions.md
  plugins: [
    // Role-based access control plugin
    {
      id: 'rbac',
      hooks: {
        after: [
          {
            matcher: (ctx) => ctx.path === '/sign-in/email',
            handler: async (ctx) => {
              // Redirect staff to admin app, students to web app
              const user = ctx.context.newSession?.user;
              if (user && ['superadmin','staff_admin','moderator','support','analyst','finance']
                         .includes(user.role)) {
                ctx.context.returnedResponse = Response.redirect(
                  `${process.env.ADMIN_APP_URL}/dashboard`
                );
              }
            },
          },
        ],
      },
    },
  ],
});
```

---

## Cross-App Database Schema Additions

The new apps require additional tables beyond the core student schema:

```typescript
// packages/db/src/schema/staff.ts
import { pgTable, uuid, text, varchar, boolean, timestamptz, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const staffRoleEnum = pgEnum('staff_role', [
  'superadmin',         // full access to everything
  'staff_admin',        // admin of admin panel, can manage staff
  'moderator',          // content moderation only
  'support',            // customer support tickets, user management (limited)
  'analyst',            // read-only analytics and reporting
  'finance',            // subscription, payment, revenue data
  'content_editor',     // edit/create AI-generated content, manage courses
]);

export const staffMembers = pgTable('staff_members', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role:         staffRoleEnum('role').notNull(),
  department:   text('department'),                  // e.g. "Engineering", "Support", "Content"
  employeeId:   varchar('employee_id', { length: 20 }),
  active:       boolean('active').default(true),
  permissions:  jsonb('permissions'),                // fine-grained overrides
  createdBy:    uuid('created_by').references(() => users.id),
  createdAt:    timestamptz('created_at').defaultNow(),
  lastLoginAt:  timestamptz('last_login_at'),
});

// Audit log for all admin actions
export const auditLog = pgTable('audit_log', {
  id:         uuid('id').primaryKey().defaultRandom(),
  actorId:    uuid('actor_id').references(() => users.id).notNull(),
  action:     text('action').notNull(),               // e.g. "user.suspend", "post.delete"
  targetType: text('target_type'),                    // "user", "post", "institution", etc.
  targetId:   uuid('target_id'),
  metadata:   jsonb('metadata'),                      // before/after state
  ipAddress:  text('ip_address'),
  userAgent:  text('user_agent'),
  createdAt:  timestamptz('created_at').defaultNow(),
});
```

```typescript
// packages/db/src/schema/support.ts
import { pgTable, uuid, text, timestamptz, pgEnum, integer, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { staffMembers } from './staff';

export const ticketStatusEnum = pgEnum('ticket_status', ['open','in_progress','waiting_user','resolved','closed']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low','normal','high','urgent']);
export const ticketCategoryEnum = pgEnum('ticket_category', [
  'billing','account','content','technical','abuse','feature_request','other',
]);

export const supportTickets = pgTable('support_tickets', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id),
  assignedTo:   uuid('assigned_to').references(() => staffMembers.id),
  category:     ticketCategoryEnum('category').notNull(),
  priority:     ticketPriorityEnum('priority').default('normal'),
  status:       ticketStatusEnum('status').default('open'),
  subject:      text('subject').notNull(),
  firstResponse:timestamptz('first_response_at'),
  resolvedAt:   timestamptz('resolved_at'),
  satisfactionScore: integer('satisfaction_score'),    // 1-5 CSAT
  createdAt:    timestamptz('created_at').defaultNow(),
  updatedAt:    timestamptz('updated_at').defaultNow(),
});

export const ticketMessages = pgTable('ticket_messages', {
  id:         uuid('id').primaryKey().defaultRandom(),
  ticketId:   uuid('ticket_id').references(() => supportTickets.id, { onDelete: 'cascade' }).notNull(),
  authorId:   uuid('author_id').references(() => users.id),
  body:       text('body').notNull(),
  isInternal: boolean('is_internal').default(false),   // staff-only note
  createdAt:  timestamptz('created_at').defaultNow(),
});
```

---

## Monorepo Workspace Config (Updated)

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
overrides:
  vite:   'npm:@voidzero-dev/vite-plus-core@latest'
  vitest: 'npm:@voidzero-dev/vite-plus-test@latest'
```

```typescript
// vite.config.ts (root — updated tasks)
run: {
  tasks: {
    // Student app
    'dev':                   { command: 'vp dev',                cwd: 'apps/web' },
    'build:web':             { command: 'vp build',              cwd: 'apps/web' },
    // Admin app
    'dev:admin':             { command: 'vp dev',                cwd: 'apps/admin' },
    'build:admin':           { command: 'vp build',              cwd: 'apps/admin' },
    // Institution app
    'dev:institution':       { command: 'vp dev',                cwd: 'apps/institution' },
    'build:institution':     { command: 'vp build',              cwd: 'apps/institution' },
    // Landing + Docs
    'dev:landing':           { command: 'vp dev',                cwd: 'apps/landing' },
    'build:landing':         { command: 'vp build',              cwd: 'apps/landing' },
    'build:docs':            { command: 'vp build',              cwd: 'apps/docs' },
    // Native
    'build:desktop':         { command: 'tauri build',           cwd: 'apps/desktop' },
    'build:android':         { command: 'tauri android build',   cwd: 'apps/desktop' },
    // DB
    'db:generate':           { command: 'drizzle-kit generate',  cwd: 'packages/db' },
    'db:migrate':            { command: 'drizzle-kit migrate',   cwd: 'packages/db' },
    'db:studio':             { command: 'drizzle-kit studio',    cwd: 'packages/db' },
    // Workers
    'jobs:dev':              { command: 'tsx watch src/worker.ts', cwd: 'packages/jobs' },
  },
},
```

---

## Domain Map

| Domain | App | Notes |
|---|---|---|
| `studyscroll.dev` | `apps/landing` | Marketing, static |
| `app.studyscroll.dev` | `apps/web` | Main student app |
| `admin.studyscroll.dev` | `apps/admin` | Staff-only, IP restricted |
| `school.studyscroll.dev` | `apps/institution` | Institution dashboard |
| `docs.studyscroll.dev` | `apps/docs` | Help + developer docs |
| `api.studyscroll.dev` | `apps/api-gateway` | External REST API |
| `media.studyscroll.dev` | Cloudflare R2 | CDN for user uploads |
| `stream.studyscroll.dev` | Cloudflare Stream | Video delivery |
| `sfu.studyscroll.dev` | Render worker | mediasoup SFU |
