# Developer Setup Guide — Step by Step

## Prerequisites

Install these before starting:

```bash
# Node.js 22+ (use fnm or nvm)
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 22
fnm use 22

# pnpm 10+
npm install -g pnpm@latest

# Vite+ global binary (NEW — alpha as of March 2026)
npm install -g vite-plus

# Rust + Tauri CLI (only needed for desktop/Android builds)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install tauri-cli@^2

# For Android builds only:
# Install Android Studio → SDK Manager → API 34 + NDK
# Set ANDROID_HOME in your shell profile
```

---

## Step 1: Scaffold the Monorepo

```bash
# Create root directory
mkdir studyscroll && cd studyscroll

# Initialize pnpm workspace
pnpm init

# Create workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
overrides:
  vite:   'npm:@voidzero-dev/vite-plus-core@latest'
  vitest: 'npm:@voidzero-dev/vite-plus-test@latest'
EOF

# Create directory structure
mkdir -p apps/{web,desktop} packages/{db,ai,storage,email,payments,jobs}

# Initialize git
git init
echo "node_modules\n.env*\n!.env.example\ndist\nbuild\n.svelte-kit\nsrc-tauri/target" > .gitignore
```

---

## Step 2: Create the Vite+ Config

```bash
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    coverage: { provider: 'v8' },
  },
  lint: {
    ignorePatterns: ['dist/**', '.svelte-kit/**', 'src-tauri/**'],
  },
  fmt: {
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 100,
  },
  run: {
    tasks: {
      'dev':           { command: 'vp dev',                cwd: 'apps/web' },
      'build:web':     { command: 'vp build',              cwd: 'apps/web' },
      'build:desktop': { command: 'tauri build',           cwd: 'apps/desktop' },
      'build:android': { command: 'tauri android build',   cwd: 'apps/desktop' },
      'db:generate':   { command: 'drizzle-kit generate',  cwd: 'packages/db' },
      'db:migrate':    { command: 'drizzle-kit migrate',   cwd: 'packages/db' },
      'db:studio':     { command: 'drizzle-kit studio',    cwd: 'packages/db' },
      'jobs:dev':      { command: 'tsx watch src/worker.ts', cwd: 'packages/jobs' },
    },
  },
  staged: {
    '*.{ts,svelte}': 'vp check --fix',
    '*.{json,md,css}': 'vp fmt --fix',
  },
});
EOF
```

---

## Step 3: Scaffold SvelteKit App

```bash
cd apps/web

# Initialize SvelteKit
pnpm create svelte@latest . --template skeleton --types typescript --no-eslint --no-prettier --no-playwright

# Install core dependencies
pnpm add \
  @sveltejs/adapter-auto \
  better-auth \
  drizzle-orm \
  @tanstack/svelte-query \
  @tanstack/svelte-form \
  valibot \
  svelte-motion \
  lucide-svelte \
  pg \
  postgres

pnpm add -D \
  tailwindcss \
  @sveltejs/vite-plugin-svelte \
  drizzle-kit \
  @types/pg

# Install shadcn-svelte
pnpm dlx shadcn-svelte@latest init
# Choose: Tailwind CSS v4, TypeScript, src/lib/components/ui

# Add core shadcn components
pnpm dlx shadcn-svelte@latest add \
  button card avatar badge dialog sheet tabs \
  dropdown-menu popover tooltip scroll-area \
  input textarea label separator skeleton \
  toast alert progress switch
```

---

## Step 4: Configure Tailwind v4

```bash
# apps/web/src/app.css
cat > src/app.css << 'EOF'
@import 'tailwindcss';
@import '@fontsource-variable/inter';
@import '@fontsource-variable/jetbrains-mono';

@theme {
  --color-brand-500: oklch(57% 0.22 250);
  --color-brand-600: oklch(49% 0.22 250);
  --color-brand-700: oklch(41% 0.20 250);
  
  --color-bg:           oklch(99% 0 0);
  --color-bg-raised:    oklch(97% 0.005 250);
  --color-border:       oklch(88% 0.01 250);
  --color-text:         oklch(15% 0.01 250);
  --color-text-muted:   oklch(45% 0.02 250);
  
  --font-sans: 'Inter Variable', sans-serif;
  --font-mono: 'JetBrains Mono Variable', monospace;
  
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-snappy:  cubic-bezier(0.2, 0, 0, 1);
}

.dark {
  --color-bg:         oklch(12% 0.01 250);
  --color-bg-raised:  oklch(16% 0.015 250);
  --color-border:     oklch(25% 0.02 250);
  --color-text:       oklch(95% 0.005 250);
  --color-text-muted: oklch(65% 0.015 250);
}

.oled {
  --color-bg:        oklch(0% 0 0);
  --color-bg-raised: oklch(7% 0.01 250);
}
EOF

pnpm add @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

---

## Step 5: Set Up the Database Package

```bash
cd ../../packages/db

pnpm init
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit @types/node

mkdir -p src/schema migrations

# Create client
cat > src/client.ts << 'EOF'
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
export type DB = typeof db;
EOF

# Create drizzle config
cat > drizzle.config.ts << 'EOF'
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
EOF

# Create package.json scripts
```

---

## Step 6: Set Up PostgreSQL

```bash
# Local dev (Docker recommended)
docker run -d \
  --name studyscroll-db \
  -e POSTGRES_DB=studyscroll \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16

# Or install locally on Ubuntu/Debian:
sudo apt install postgresql-16
sudo -u postgres createdb studyscroll

# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/studyscroll"
```

---

## Step 7: Environment Variables

```bash
# Create .env.example at monorepo root
cat > .env.example << 'EOF'
# === Database ===
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/studyscroll

# === Auth ===
BETTER_AUTH_SECRET=change-me-to-random-32-char-string
BETTER_AUTH_URL=http://localhost:5173

# === OAuth (optional for dev) ===
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# === AI (Gemini is default/required) ===
GEMINI_API_KEY=
ANTHROPIC_API_KEY=        # fallback, optional in dev

# === Storage (Cloudflare R2) ===
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=studyscroll-media
R2_PUBLIC_URL=https://media.studyscroll.dev  # or R2 public bucket URL

# === Cloudflare Stream (video CDN) ===
CF_STREAM_TOKEN=
CF_ACCOUNT_ID=

# === Email ===
RESEND_API_KEY=
SMTP_HOST=smtp.gmail.com     # Nodemailer fallback
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@studyscroll.dev

# === Payments ===
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLIC_KEY=pk_test_...

# === YouTube ===
YOUTUBE_API_KEY=

# === Live Streaming ===
LIVEKIT_URL=wss://studyscroll.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# === Web Push ===
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:push@studyscroll.dev

# === Security ===
DOWNLOAD_SECRET=change-me-random-string

# === App ===
PUBLIC_APP_URL=http://localhost:5173
PUBLIC_PAYSTACK_PUBLIC_KEY=${PAYSTACK_PUBLIC_KEY}
PUBLIC_STRIPE_PUBLIC_KEY=${STRIPE_PUBLIC_KEY}
PUBLIC_VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}
PUBLIC_YOUTUBE_API_KEY=${YOUTUBE_API_KEY}  # safe — restricted to your domain

# === Monitoring ===
SENTRY_DSN=
PUBLIC_POSTHOG_KEY=
PUBLIC_POSTHOG_HOST=https://app.posthog.com
EOF

# Copy to actual .env (never commit this)
cp .env.example apps/web/.env.local
```

---

## Step 8: Run Migrations

```bash
# From repo root
cd packages/db

# Copy schema files (see 02-database/02-schema-drizzle.md for full schema)
# Then generate and run migrations:
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Verify with Drizzle Studio
pnpm drizzle-kit studio
# Open http://localhost:4983
```

---

## Step 9: Install Pre-commit Hooks

```bash
# From monorepo root
vp prepare

# This installs a pre-commit hook that runs:
# vp check --fix on all staged .ts/.svelte files
# vp fmt --fix on all staged .json/.md/.css files
```

---

## Step 10: Start Dev

```bash
# Start everything
vp run dev
# → SvelteKit dev server on http://localhost:5173

# In separate terminal, start background jobs
vp run jobs:dev
# → pg-boss worker polling for AI generation jobs

# Optional: Drizzle Studio in another terminal
vp run db:studio
```

---

## Step 11: Tauri Setup (Desktop + Android)

```bash
cd apps/desktop

# Initialize Tauri project
pnpm create tauri-app@latest . -- --template vanilla-ts --no-open

# Replace generated tauri.conf.json with:
# (see 01-architecture/02-monorepo-structure.md for full config)

# For Android, run:
tauri android init

# Build commands:
vp run build:web          # build web first
vp run build:desktop      # then desktop
vp run build:android      # or android
```

---

## Generating VAPID Keys for Web Push

```bash
npx web-push generate-vapid-keys
# Copy the output to .env VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
```

---

## Useful Dev Commands

```bash
vp dev                    # start SvelteKit dev server
vp check                  # type-check + lint
vp check --fix            # auto-fix all issues
vp test                   # run test suite
vp run db:generate        # generate Drizzle migration from schema changes
vp run db:migrate         # apply pending migrations
vp run db:studio          # open Drizzle Studio
vp run jobs:dev           # start background job worker
```
