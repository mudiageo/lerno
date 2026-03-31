# Infrastructure & Deployment

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                               │
│  SvelteKit (SSR + Static + Edge)                            │
│  adapter-auto → Vercel serverless functions                 │
│  Domains: studyscroll.dev, app.studyscroll.dev              │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                   │                     │
   ┌────▼─────┐      ┌──────▼──────┐      ┌──────▼──────┐
   │ Render   │      │  Cloudflare  │      │  Cloudflare  │
   │          │      │     R2       │      │   Stream     │
   │ PostgreSQL│      │  (Storage)   │      │  (Video CDN) │
   │  pg-boss │      │  Images      │      │  HLS/DASH    │
   │  workers │      │  PDFs        │      │              │
   └──────────┘      └─────────────┘      └─────────────┘
```

---

## Vercel (Web App)

```json
// vercel.json
{
  "framework": "sveltekit",
  "buildCommand": "vp build",
  "outputDirectory": ".svelte-kit/output",
  "env": {
    "NODE_ENV": "production"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/auth/(.*)", "destination": "/api/auth/$1" }
  ]
}
```

---

## Render (PostgreSQL + Workers)

```yaml
# render.yaml
databases:
  - name: studyscroll-db
    databaseName: studyscroll
    user: studyscroll
    plan: standard  # 1 vCPU, 1GB RAM, 10GB storage
    region: frankfurt  # or oregon, singapore

services:
  # Background job worker
  - type: worker
    name: studyscroll-jobs
    runtime: node
    plan: starter
    buildCommand: cd packages/jobs && pnpm install && pnpm build
    startCommand: node dist/worker.js
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: studyscroll-db
          property: connectionString
      - key: GEMINI_API_KEY
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: RESEND_API_KEY
        sync: false
```

---

## GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: npm install -g vite-plus
      - run: vp install
      - run: vp check
      - run: vp test --coverage

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: npm install -g vite-plus
      - run: vp install
      - run: vp run build:web
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_PREVIEW }}
          BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/web

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: npm install -g vite-plus
      - run: vp install
      - run: vp run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - run: vp run build:web
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          PAYSTACK_SECRET_KEY: ${{ secrets.PAYSTACK_SECRET_KEY }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
          R2_ACCESS_KEY: ${{ secrets.R2_ACCESS_KEY }}
          R2_SECRET_KEY: ${{ secrets.R2_SECRET_KEY }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: apps/web
```

---

## Monitoring — Sentry + PostHog

```typescript
// apps/web/src/hooks.client.ts
import * as Sentry from '@sentry/sveltekit';
import posthog from 'posthog-js';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  integrations: [Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false })],
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
});

// Initialize PostHog (privacy-first analytics)
if (typeof window !== 'undefined' && import.meta.env.PUBLIC_POSTHOG_KEY) {
  posthog.init(import.meta.env.PUBLIC_POSTHOG_KEY, {
    api_host: import.meta.env.PUBLIC_POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,  // manual tracking only for GDPR
    persistence: 'memory',  // no localStorage
  });
}

export const handleError = Sentry.handleErrorWithSentry();
```

---

## Email — Resend + Nodemailer

```typescript
// packages/email/src/index.ts
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

interface EmailProvider {
  send(params: { to: string; subject: string; html: string; text?: string }): Promise<void>;
}

class ResendProvider implements EmailProvider {
  private client: Resend;
  constructor(apiKey: string) { this.client = new Resend(apiKey); }
  
  async send({ to, subject, html, text }) {
    await this.client.emails.send({
      from: process.env.EMAIL_FROM ?? 'StudyScroll <noreply@studyscroll.dev>',
      to, subject, html, text,
    });
  }
}

class NodemailerProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  
  async send({ to, subject, html, text }) {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to, subject, html, text,
    });
  }
}

// Auto-select: Resend if API key present, else Nodemailer
export const email: EmailProvider = process.env.RESEND_API_KEY
  ? new ResendProvider(process.env.RESEND_API_KEY)
  : new NodemailerProvider();

// Email templates
export const templates = {
  examReminder: (params: { name: string; examTitle: string; courseCode: string; date: string; daysLeft: number }) => ({
    subject: `📅 ${params.daysLeft === 1 ? 'Tomorrow' : `${params.daysLeft} days`}: ${params.examTitle} (${params.courseCode})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1D4ED8;">Exam Reminder 📚</h2>
        <p>Hey ${params.name},</p>
        <p>Your <strong>${params.examTitle}</strong> for <strong>${params.courseCode}</strong> is 
           ${params.daysLeft === 1 ? '<strong>tomorrow</strong>' : `in <strong>${params.daysLeft} days</strong>`}.</p>
        <p>Jump into StudyScroll to review your weak topics before it's too late.</p>
        <a href="${process.env.PUBLIC_APP_URL}/study" 
           style="display: inline-block; background: #1D4ED8; color: white; padding: 12px 24px; 
                  border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Study Now
        </a>
      </div>
    `,
  }),
};
```

---

## Background Jobs (pg-boss)

```typescript
// packages/jobs/src/worker.ts
import PgBoss from 'pg-boss';

const boss = new PgBoss(process.env.DATABASE_URL!);

boss.on('error', console.error);

await boss.start();

// Register handlers
await boss.work('generate-content', { teamSize: 2 }, generateContentJob);
await boss.work('send-email', { teamSize: 5 }, sendEmailJob);
await boss.work('send-push', { teamSize: 5 }, sendPushJob);
await boss.work('process-upload', { teamSize: 2 }, processUploadJob);
await boss.work('downgrade-user', downgradeUserJob);

// Scheduled jobs (cron)
await boss.schedule('generate-ai-content-all-users', '0 2 * * *', {});  // 2am daily
await boss.schedule('send-exam-reminders', '0 9 * * *', {});             // 9am daily
await boss.schedule('update-leaderboards', '*/30 * * * *', {});          // every 30 min
await boss.schedule('clean-old-notifications', '0 0 * * 0', {});         // weekly

console.log('pg-boss worker started');
```
