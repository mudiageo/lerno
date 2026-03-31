# Tech Stack — Full Specification

## Guiding Principles
1. **One codebase, three platforms** — SvelteKit web source runs on web, desktop (Tauri), and Android (Tauri)
2. **No separate backend** — SvelteKit Remote Functions replace Express entirely
3. **Abstracted everything** — AI provider, storage, payment processor all behind interfaces so you can swap without refactoring
4. **Vite+ as the only toolchain** — replaces ESLint, Prettier, Vitest, Turborepo with `vp` binary

---

## Full Stack Table

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **Monorepo toolchain** | Vite+ | alpha (Mar 2026) | Unified dev/lint/test/build/task runner |
| **Package manager** | pnpm workspaces | 10+ | Fast, strict, Vite+ native |
| **Frontend framework** | SvelteKit 2 | latest | SSR + SPA, Remote Functions, file routing |
| **UI components** | shadcn-svelte | latest | Tailwind-based, accessible, copy-owned |
| **Styling** | Tailwind CSS v4 | 4.x | CSS-first config, `@theme`, no tailwind.config.js |
| **Animation** | Motion One (svelte-motion) | latest | WAAPI-based, lightweight, GPU-accelerated |
| **Icons** | @lucide/svelte | latest | Consistent icon set |
| **Remote Functions** | SvelteKit RF | built-in | Query / Command / Form / Prerender |
| **Form validation** | RF Form + Valibot | latest | Type-safe schema validation |
| **Client cache** | TanStack Query (Svelte) | 5.x | Cache + invalidation for client state |
| **Auth** | better-auth | latest | Session-based, OAuth, email/password |
| **ORM** | Drizzle ORM | latest | Type-safe, migration-first, PostgreSQL |
| **Database** | PostgreSQL | 16 | Primary store (Render in prod) |
| **Search** | PostgreSQL FTS + pg_trgm | built-in | tsvector full-text, trigram similarity |
| **Background jobs** | pg-boss | latest | PostgreSQL-backed job queue, cron |
| **AI (primary)** | Google Gemini 2.5 Pro | gemini-2.5-pro | Fast, cheap, Vision for OCR |
| **AI (fallback)** | Anthropic Claude | claude-sonnet-4-20250514 | Higher quality for complex generation |
| **AI abstraction** | Custom `AIProvider` interface | — | Swap providers without refactoring |
| **Email** | Resend (primary) + Nodemailer | latest | Resend for transactional, Nodemailer as fallback |
| **Payments (Africa)** | Paystack | latest | NGN + GHS + KES, webhooks |
| **Payments (Global)** | Stripe | latest | USD/EUR, subscriptions, one-time |
| **Storage abstraction** | Custom `StorageProvider` | — | Interface over S3-compatible providers |
| **Storage (default)** | Cloudflare R2 | — | S3-compatible, no egress fees |
| **Video CDN** | Cloudflare Stream | — | Adaptive bitrate (HLS/DASH) for uploads |
| **External video** | YouTube IFrame API + oEmbed | — | Embed-only, no download |
| **Live streaming** | Custom WebRTC + mediasoup SFU | — | Built from scratch |
| **Live fallback** | LiveKit | cloud | Drop-in if custom SFU has issues |
| **Push notifications** | Web Push API + Tauri plugin | — | Browser + native |
| **Error monitoring** | Sentry | latest | Frontend + server errors |
| **Analytics** | PostHog | latest | Privacy-first, self-hostable |
| **Web deploy** | Vercel | — | `@sveltejs/adapter-auto` |
| **Workers/DB deploy** | Render | — | PostgreSQL, background workers |
| **Desktop** | Tauri v2 | 2.x | macOS/Win/Linux native shell |
| **Android** | Tauri v2 Android | 2.x | APK/AAB, same web source |

---

## SvelteKit Remote Functions — Architecture Pattern

Remote Functions replace traditional REST endpoints for all data fetching and mutations. They run on the server but are called from the client like local functions.

```typescript
// src/lib/server/remote/feed.ts
import { query, command } from '$app/server';

// Query — read-only, cacheable
export const getFeed = query(async ({ userId, cursor, limit = 20 }) => {
  return db.select()
    .from(posts)
    .where(eq(posts.isVisible, true))
    .orderBy(desc(posts.engagementScore))
    .limit(limit);
});

// Command — mutation, not cached
export const likePost = command(async ({ postId, userId }) => {
  await db.insert(interactions).values({ postId, userId, type: 'like' });
  await invalidate('feed');
});

// Form — progressive enhancement, works without JS
export const createPost = form(async (data) => {
  const validated = postSchema.parse(data);
  return db.insert(posts).values(validated);
});
```

```svelte
<!-- +page.svelte -->
<script>
  import { getFeed, likePost } from '$lib/server/remote/feed';
  
  let { data } = $props();
  // getFeed is called in +page.server.ts for SSR,
  // then TanStack Query takes over for client-side updates
</script>
```

---

## Vite+ Configuration

```typescript
// vite.config.ts (monorepo root)
import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    coverage: { provider: 'v8' },
  },
  lint: {
    rules: { 'no-console': 'warn' },
    ignorePatterns: ['dist/**', '.svelte-kit/**'],
  },
  fmt: {
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 100,
  },
  run: {
    tasks: {
      'dev':             { command: 'vp dev',                    cwd: 'apps/web' },
      'build:web':       { command: 'vp build',                  cwd: 'apps/web' },
      'build:desktop':   { command: 'tauri build',               cwd: 'apps/desktop' },
      'build:android':   { command: 'tauri android build',       cwd: 'apps/desktop' },
      'db:generate':     { command: 'drizzle-kit generate',      cwd: 'packages/db' },
      'db:migrate':      { command: 'drizzle-kit migrate',       cwd: 'packages/db' },
      'db:studio':       { command: 'drizzle-kit studio',        cwd: 'packages/db' },
      'jobs:start':      { command: 'tsx src/worker.ts',         cwd: 'packages/jobs' },
    },
  },
  staged: {
    '*.{ts,svelte}': 'vp check --fix',
    '*.{json,md}':   'vp fmt --fix',
  },
});
```

---

## Tailwind CSS v4 Setup

Tailwind v4 uses a CSS-first config approach — no `tailwind.config.js`.

```css
/* apps/web/src/app.css */
@import 'tailwindcss';
@import '@fontsource-variable/inter';

@theme {
  /* Brand colors */
  --color-brand-50:  #eff6ff;
  --color-brand-100: #dbeafe;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;
  --color-brand-900: #1e3a5f;

  /* Semantic */
  --color-surface:        var(--color-white);
  --color-surface-raised: var(--color-brand-50);
  --color-border:         color-mix(in oklch, var(--color-brand-500) 20%, transparent);

  /* Typography */
  --font-sans: 'Inter Variable', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Radius */
  --radius-card:   1rem;
  --radius-button: 0.5rem;
  --radius-input:  0.375rem;

  /* Animation */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast:   150ms;
  --duration-normal: 250ms;
  --duration-slow:   400ms;
}

/* Dark mode via class */
.dark {
  --color-surface:        #0f1117;
  --color-surface-raised: #1a1d27;
  --color-border:         color-mix(in oklch, white 10%, transparent);
}

/* OLED mode */
.oled {
  --color-surface:        #000000;
  --color-surface-raised: #0a0a0a;
}
```

---

## AI Provider Abstraction

```typescript
// packages/ai/src/provider.ts
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProvider {
  generate(params: {
    messages: AIMessage[];
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  }): Promise<string>;
  
  generateWithVision(params: {
    prompt: string;
    imageBase64: string;
    mimeType: string;
  }): Promise<string>;
}

// packages/ai/src/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model = 'gemini-2.5-pro';
  
  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }
  
  async generate({ messages, systemPrompt, maxTokens = 1024, jsonMode = false }) {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: maxTokens,
        responseMimeType: jsonMode ? 'application/json' : 'text/plain',
      },
    });
    
    const chat = model.startChat({ history: messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))});
    
    const last = messages[messages.length - 1];
    const result = await chat.sendMessage(last.content);
    return result.response.text();
  }
  
  async generateWithVision({ prompt, imageBase64, mimeType }) {
    const model = this.client.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      prompt,
    ]);
    return result.response.text();
  }
}

// packages/ai/src/claude.ts
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  
  async generate({ messages, systemPrompt, maxTokens = 1024 }) {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });
    return (response.content[0] as { text: string }).text;
  }
  
  async generateWithVision({ prompt, imageBase64, mimeType }) {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType as any, data: imageBase64 } },
          { type: 'text', text: prompt },
        ],
      }],
    });
    return (response.content[0] as { text: string }).text;
  }
}

// packages/ai/src/index.ts — factory with fallback
export function createAIProvider(): AIProvider {
  const primary = new GeminiProvider(process.env.GEMINI_API_KEY!);
  const fallback = new ClaudeProvider(process.env.ANTHROPIC_API_KEY!);
  
  return new Proxy(primary, {
    get(target, prop) {
      return async (...args: any[]) => {
        try {
          return await (target as any)[prop](...args);
        } catch (err) {
          console.warn(`Gemini failed, falling back to Claude: ${err}`);
          return await (fallback as any)[prop](...args);
        }
      };
    },
  });
}

export const ai = createAIProvider();
```

---

## Storage Abstraction

```typescript
// packages/storage/src/provider.ts
export interface StorageProvider {
  upload(key: string, body: Buffer | ReadableStream, contentType: string): Promise<string>; // returns URL
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  getPublicUrl(key: string): string;
}

// packages/storage/src/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class R2Provider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;
  
  constructor(config: { endpoint: string; accessKey: string; secretKey: string; bucket: string; publicUrl: string }) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    });
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;
  }
  
  async upload(key: string, body: Buffer | ReadableStream, contentType: string) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket, Key: key, Body: body, ContentType: contentType,
    }));
    return this.getPublicUrl(key);
  }
  
  getPublicUrl(key: string) { return `${this.publicUrl}/${key}`; }
  
  async getSignedUrl(key: string, expiresIn = 3600) {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn });
  }
  
  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
  
  async download(key: string) {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return Buffer.from(await res.Body!.transformToByteArray());
  }
}

// packages/storage/src/index.ts
export const storage: StorageProvider = new R2Provider({
  endpoint:   process.env.R2_ENDPOINT!,
  accessKey:  process.env.R2_ACCESS_KEY!,
  secretKey:  process.env.R2_SECRET_KEY!,
  bucket:     process.env.R2_BUCKET!,
  publicUrl:  process.env.R2_PUBLIC_URL!,
});
```
