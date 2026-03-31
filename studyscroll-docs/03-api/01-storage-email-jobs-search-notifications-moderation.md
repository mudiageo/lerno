# API — Storage, Email, Background Jobs, Search, Notifications & Moderation

## Storage API (Abstract + R2)

See `01-architecture/01-tech-stack.md` for the `StorageProvider` interface and R2 implementation.

### Upload Flow (Presigned URLs)

```typescript
// src/routes/api/upload/+server.ts
import { json } from '@sveltejs/kit';
import { storage } from '@studyscroll/storage';
import { auth } from '@studyscroll/auth';
import crypto from 'crypto';

export async function POST({ request }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  const { filename, contentType, size, uploadType } = await request.json();

  // Validate upload type and file size
  const limits: Record<string, number> = {
    avatar:  2 * 1024 * 1024,      // 2MB
    post_image: 10 * 1024 * 1024,  // 10MB
    note_pdf:   50 * 1024 * 1024,  // 50MB
    video:   500 * 1024 * 1024,    // 500MB (goes to Cloudflare Stream instead)
  };

  if (size > (limits[uploadType] ?? 10 * 1024 * 1024)) {
    return json({ error: 'File too large' }, { status: 413 });
  }

  // Generate unique key
  const ext = filename.split('.').pop();
  const key = `${uploadType}/${session.user.id}/${crypto.randomUUID()}.${ext}`;

  // Get presigned PUT URL (valid 15 minutes)
  const uploadUrl = await storage.getSignedUploadUrl(key, 15 * 60, contentType);
  const publicUrl = storage.getPublicUrl(key);

  return json({ uploadUrl, key, publicUrl });
}
```

```svelte
<!-- src/lib/components/ui/FileUploader.svelte -->
<script lang="ts">
  let { accept, uploadType, onComplete } = $props();
  let uploading = $state(false);
  let progress = $state(0);

  async function handleFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    uploading = true;

    // 1. Get presigned URL from our server
    const { uploadUrl, key, publicUrl } = await fetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
        uploadType,
      }),
    }).then(r => r.json());

    // 2. Upload directly to R2 (browser → R2, no server involved)
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) progress = Math.round((e.loaded / e.total) * 100);
    };
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    await new Promise((res, rej) => {
      xhr.onload = res;
      xhr.onerror = rej;
      xhr.send(file);
    });

    uploading = false;
    onComplete({ key, publicUrl });
  }
</script>

<label class="cursor-pointer flex flex-col items-center gap-2 border-2 border-dashed
              border-[--color-border] rounded-xl p-8 hover:border-brand-500 transition-colors">
  <input type="file" {accept} class="sr-only" onchange={handleFile} />
  {#if uploading}
    <div class="w-full bg-[--color-border] rounded-full h-2">
      <div class="bg-brand-500 h-2 rounded-full transition-all" style="width: {progress}%" />
    </div>
    <span class="text-sm text-[--color-text-muted]">{progress}%</span>
  {:else}
    <span class="text-[--color-text-muted] text-sm">Click to upload or drag & drop</span>
  {/if}
</label>
```

### Cloudflare Stream (Video Uploads)

```typescript
// src/lib/server/remote/uploads.ts
export const getVideoUploadUrl = command(async ({ userId, title }) => {
  // Request a one-time upload URL from Cloudflare Stream
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream?direct_user=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
        'Tus-Resumable': '1.0.0',
        'Upload-Length': '0',
        'Upload-Metadata': `name ${btoa(title)},requiresignedurls`,
      },
    }
  );
  const streamId = res.headers.get('stream-media-id')!;
  const uploadUrl = res.headers.get('location')!;

  return { uploadUrl, streamId };
});

// After upload, poll for readiness
export const getVideoStatus = query(async ({ streamId }) => {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream/${streamId}`,
    { headers: { Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}` } }
  );
  const { result } = await res.json();
  return {
    ready: result.readyToStream,
    thumbnail: result.thumbnail,
    playbackUrl: `https://customer-${process.env.CF_CUSTOMER_CODE}.cloudflarestream.com/${streamId}/manifest/video.m3u8`,
    duration: result.duration,
  };
});
```

---

## Search

```typescript
// src/lib/server/remote/search.ts
import { query } from '$app/server';
import { db } from '$db/client';
import { posts, users, communities } from '$db/schema';
import { sql, ilike, or, and, eq } from 'drizzle-orm';

export const search = query(async ({
  q, type = 'all', userId, limit = 20,
}: {
  q: string; type?: 'posts' | 'users' | 'communities' | 'all'; userId: string; limit?: number;
}) => {
  const trimmed = q.trim();
  if (trimmed.length < 2) return { posts: [], users: [], communities: [] };

  const results: Record<string, any[]> = { posts: [], users: [], communities: [] };

  if (type === 'all' || type === 'posts') {
    // Full-text search on posts
    results.posts = await db.select({
      id: posts.id,
      postType: posts.postType,
      content: posts.content,
      topicTags: posts.topicTags,
      createdAt: posts.createdAt,
      rank: sql<number>`ts_rank(search_vector, plainto_tsquery('english', ${trimmed}))`,
    })
    .from(posts)
    .where(and(
      eq(posts.isVisible, true),
      sql`search_vector @@ plainto_tsquery('english', ${trimmed})`,
    ))
    .orderBy(sql`rank DESC`)
    .limit(limit);
  }

  if (type === 'all' || type === 'users') {
    // Trigram similarity on username/display name
    results.users = await db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      xp: users.xp,
      similarity: sql<number>`GREATEST(
        similarity(username, ${trimmed}),
        similarity(display_name, ${trimmed})
      )`,
    })
    .from(users)
    .where(or(
      sql`username % ${trimmed}`,
      sql`display_name % ${trimmed}`,
    ))
    .orderBy(sql`similarity DESC`)
    .limit(limit / 2);
  }

  if (type === 'all' || type === 'communities') {
    results.communities = await db.select()
      .from(communities)
      .where(or(
        ilike(communities.name, `%${trimmed}%`),
        ilike(communities.slug, `%${trimmed}%`),
        ilike(communities.courseCode, `%${trimmed}%`),
      ))
      .limit(limit / 2);
  }

  return results;
});
```

---

## Notifications (SSE + Web Push)

### Server-Sent Events Stream

```typescript
// src/routes/api/notifications/stream/+server.ts
import { db } from '$db/client';
import { notifications } from '$db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET({ locals, request }) {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  const userId = locals.user.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(data: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      // Poll for new notifications every 10 seconds
      // (WebSocket is better for scale, but SSE works fine for v1)
      const interval = setInterval(async () => {
        const newNotifs = await db.select()
          .from(notifications)
          .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
          .orderBy(desc(notifications.createdAt))
          .limit(10);

        if (newNotifs.length > 0) {
          send({ type: 'notifications', data: newNotifs });
        }
      }, 10_000);

      // Initial send
      db.select()
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
        .orderBy(desc(notifications.createdAt))
        .limit(20)
        .then(notifs => send({ type: 'notifications', data: notifs }));

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 30_000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

```svelte
<!-- src/lib/stores/notifications.svelte.ts -->
<script lang="ts">
  let notifications = $state<Notification[]>([]);
  let unreadCount = $derived(notifications.filter(n => !n.read).length);

  $effect(() => {
    const source = new EventSource('/api/notifications/stream');
    source.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data);
      if (type === 'notifications') notifications = data;
    };
    return () => source.close();
  });
</script>
```

### Web Push Notifications

```typescript
// src/routes/api/push/subscribe/+server.ts
import webpush from 'web-push';
import { db } from '$db/client';
import { pushSubscriptions } from '$db/schema';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST({ request, locals }) {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });

  const subscription = await request.json();
  await db.insert(pushSubscriptions).values({
    userId: locals.user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    platform: 'web',
  }).onConflictDoUpdate({
    target: pushSubscriptions.endpoint,
    set: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
  });

  return new Response(null, { status: 201 });
}

// Send push from job worker
export async function sendPushToUser(userId: string, payload: object) {
  const subs = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      ).catch(async (err) => {
        // Remove expired subscriptions
        if (err.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        }
      })
    )
  );
}
```

---

## Background Jobs (pg-boss) — All Job Handlers

```typescript
// packages/jobs/src/jobs/generate-content.ts
// See 14-prompts/01-system-prompts.md for full AI generation pipeline

// packages/jobs/src/jobs/send-email.ts
export async function sendEmailJob(job: { data: { to: string; template: string; data: any } }) {
  const { to, template, data } = job.data;
  const { subject, html } = templates[template](data);
  await email.send({ to, subject, html });
}

// packages/jobs/src/jobs/send-push.ts
export async function sendPushJob(job: { data: { userId: string; payload: object } }) {
  await sendPushToUser(job.data.userId, job.data.payload);
}

// packages/jobs/src/jobs/process-upload.ts
export async function processUploadJob(job: { data: { materialId: string } }) {
  const material = await db.query.courseMaterials.findFirst({
    where: eq(courseMaterials.id, job.data.materialId),
    with: { course: true },
  });
  if (!material) return;

  // 1. Download from R2
  const buffer = await storage.download(material.storageKey!);
  const base64 = buffer.toString('base64');

  // 2. OCR with Gemini Vision
  const extracted = await ai.generateWithVision({
    prompt: buildOCRExtractionPrompt({
      courseCode: material.course.code,
      courseTitle: material.course.title,
      extractedText: '',
    }),
    imageBase64: base64,
    mimeType: 'application/pdf',
  });

  const parsed = JSON.parse(extracted);

  // 3. Store extracted text
  await db.update(courseMaterials).set({
    ocrText: parsed.cleanedText,
    processed: true,
  }).where(eq(courseMaterials.id, material.id));

  // 4. Seed initial topic mastery entries for new topics
  for (const topic of parsed.topics) {
    await db.insert(topicMastery).values({
      userId: material.userId,
      courseId: material.courseId,
      topic,
      score: 50,
    }).onConflictDoNothing();
  }

  // 5. Queue content generation using this material as context
  await pgBoss.send('generate-content', { userId: material.userId, materialId: material.id });
}

// packages/jobs/src/jobs/exam-reminders.ts
export async function sendExamReminders() {
  // Find events in 1, 3, and 7 days
  const upcoming = await db.select({
    event: courseSchedule,
    user: users,
    course: userCourses,
  })
  .from(courseSchedule)
  .innerJoin(users, eq(users.id, courseSchedule.userId))
  .innerJoin(userCourses, eq(userCourses.id, courseSchedule.courseId))
  .where(and(
    eq(courseSchedule.reminderSent, false),
    sql`scheduled_at BETWEEN now() + interval '23 hours' AND now() + interval '8 days'`,
    sql`event_type IN ('exam', 'quiz', 'assignment')`,
  ));

  for (const { event, user, course } of upcoming) {
    const daysLeft = Math.ceil(
      (new Date(event.scheduledAt).getTime() - Date.now()) / 86400000
    );

    if (![1, 3, 7].includes(daysLeft)) continue;

    // Send email
    await pgBoss.send('send-email', {
      to: user.email,
      template: 'examReminder',
      data: { name: user.displayName ?? user.username, examTitle: event.title, courseCode: course.code, daysLeft },
    });

    // Send push
    await pgBoss.send('send-push', {
      userId: user.id,
      payload: {
        title: `📅 ${daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}: ${event.title}`,
        body: `${course.code} · Open StudyScroll to review`,
        url: '/study',
      },
    });

    // Mark reminder sent
    await db.update(courseSchedule).set({ reminderSent: true })
      .where(eq(courseSchedule.id, event.id));
  }
}

// packages/jobs/src/cron.ts
export async function registerCronJobs(boss: PgBoss) {
  await boss.schedule('generate-ai-content',     '0 2 * * *',    {});  // 2am daily
  await boss.schedule('send-exam-reminders',     '0 8 * * *',    {});  // 8am daily
  await boss.schedule('update-engagement-scores','*/10 * * * *', {});  // every 10min
  await boss.schedule('refresh-post-scores',     '*/5 * * * *',  {});  // every 5min
  await boss.schedule('update-leaderboards',     '*/30 * * * *', {});  // every 30min
  await boss.schedule('clean-yt-cache',          '0 3 * * *',    {});  // 3am daily (clear >24h entries)
  await boss.schedule('send-streak-at-risk',     '0 20 * * *',   {});  // 8pm — warn users whose streak is at risk
  await boss.schedule('downgrade-expired-subs',  '*/30 * * * *', {});  // every 30min
}
```

---

## Content Moderation Pipeline

```typescript
// src/lib/server/remote/moderation.ts
import { command } from '$app/server';
import { ai } from '@studyscroll/ai';
import { buildModerationPrompt, MODERATION_SYSTEM_PROMPT } from '@studyscroll/ai/prompts';

// Called before any user-created post is set to isVisible=true
export async function moderateContent(content: string): Promise<{
  approved: boolean;
  reason: string | null;
  category: string | null;
  confidence: number;
}> {
  const raw = await ai.generate({
    messages: [{ role: 'user', content: buildModerationPrompt(content) }],
    systemPrompt: MODERATION_SYSTEM_PROMPT,
    maxTokens: 256,
    jsonMode: true,
  });

  const result = JSON.parse(raw);

  // High-confidence rejections: hide immediately
  // Low-confidence rejections: flag for human review (isFlagged=true but isVisible=true)
  if (!result.approved && result.confidence >= 0.8) {
    return { ...result, approved: false };
  } else if (!result.approved && result.confidence < 0.8) {
    return { ...result, approved: true, flagForReview: true };
  }

  return result;
}

export const createPostWithModeration = command(async (input: CreatePostInput) => {
  const validated = createPostSchema.parse(input);

  // Extract text content for moderation
  const textContent = [
    validated.content.body,
    validated.content.question,
    validated.content.front,
    validated.content.back,
  ].filter(Boolean).join(' ');

  const modResult = await moderateContent(textContent);

  const [post] = await db.insert(posts).values({
    ...validated,
    isVisible: modResult.approved,
    isFlagged: !modResult.approved || (modResult as any).flagForReview,
  }).returning();

  if (!modResult.approved) {
    throw new Error('Your post was not approved. Reason: ' + modResult.reason);
  }

  return post;
});
```
