# AI — Content Generation, Tutor, OCR & Rate Limiting

## AI Provider Architecture

See `01-architecture/01-tech-stack.md` for the full `AIProvider` interface, `GeminiProvider`, `ClaudeProvider`, and proxy-fallback factory.

**Default provider:** `gemini-2.5-pro` — faster and cheaper  
**Fallback:** `claude-sonnet-4-20250514` — higher quality, used when Gemini fails or for complex generation

---

## Content Generation Pipeline

### Nightly Batch Job

```typescript
// packages/jobs/src/jobs/generate-content.ts
import { db } from '@studyscroll/db';
import { users, userCourses, topicMastery, courseSchedule, courseMaterials, posts } from '@studyscroll/db/schema';
import { ai } from '@studyscroll/ai';
import { and, eq, asc, sql } from 'drizzle-orm';
import {
  buildQuizPrompt, buildFlashcardPrompt, buildTextPostPrompt,
  buildThreadPrompt, buildPollPrompt, CONTENT_GENERATION_SYSTEM_PROMPT,
} from '@studyscroll/ai/prompts/content';

const POST_TYPES_PER_TOPIC = ['quiz', 'flashcard', 'text', 'poll'] as const;
const MIN_POOL_SIZE = 50; // ensure each user always has content to see

export async function generateContentForAllUsers() {
  // Only process users who have been active in last 30 days
  const activeUsers = await db.select({ id: users.id, plan: users.plan })
    .from(users)
    .where(sql`last_active_date > now() - interval '30 days'`);

  // Process in parallel batches of 10 to respect API rate limits
  for (let i = 0; i < activeUsers.length; i += 10) {
    const batch = activeUsers.slice(i, i + 10);
    await Promise.allSettled(batch.map(u => generateContentForUser(u.id)));
    await sleep(2000); // 2s between batches to avoid Gemini quota spikes
  }
}

async function generateContentForUser(userId: string) {
  const [courses, masteryRecords] = await Promise.all([
    db.select().from(userCourses).where(and(eq(userCourses.userId, userId), eq(userCourses.active, true))),
    db.select().from(topicMastery).where(eq(topicMastery.userId, userId)),
  ]);

  for (const course of courses) {
    // Check how much content already exists in the pool
    const poolSize = await db.$count(posts, and(
      eq(posts.courseId, course.id),
      eq(posts.aiGenerated, true),
      eq(posts.isVisible, true),
      sql`created_at > now() - interval '7 days'`,
    ));

    if (poolSize >= MIN_POOL_SIZE) continue; // pool is full, skip

    const upcoming = await db.select().from(courseSchedule)
      .where(and(eq(courseSchedule.courseId, course.id), sql`scheduled_at > now()`))
      .orderBy(asc(courseSchedule.scheduledAt)).limit(1);

    const urgency = upcoming.length > 0
      ? Math.max(0, 1 - (new Date(upcoming[0].scheduledAt).getTime() - Date.now()) / (14 * 86400000))
      : 0;

    const courseMastery = masteryRecords.filter(m => m.courseId === course.id);
    const weakTopics = courseMastery.sort((a, b) => a.score - b.score).slice(0, 5);

    // Also pull topics from course materials
    const materials = await db.select({ ocrText: courseMaterials.ocrText })
      .from(courseMaterials)
      .where(and(eq(courseMaterials.courseId, course.id), eq(courseMaterials.processed, true)))
      .limit(3);
    const context = materials.map(m => m.ocrText?.slice(0, 800)).filter(Boolean).join('\n\n---\n\n');

    for (const topicRecord of weakTopics.slice(0, 3)) {
      for (const postType of POST_TYPES_PER_TOPIC) {
        try {
          const content = await generateSinglePost({
            postType, course, topic: topicRecord.topic,
            masteryScore: topicRecord.score, urgency, context,
          });

          if (!content) continue;

          const { topicTags, ...postContent } = content;
          await db.insert(posts).values({
            courseId: course.id,
            postType,
            content: postContent,
            topicTags: topicTags ?? [topicRecord.topic],
            aiGenerated: true,
            isVisible: true,
          });

          // Small delay between API calls
          await sleep(300);
        } catch (err) {
          console.error(`[AI] Failed ${postType} for ${course.code}/${topicRecord.topic}:`, err);
        }
      }
    }
  }
}

async function generateSinglePost({ postType, course, topic, masteryScore, urgency, context }: any) {
  let prompt: string;

  switch (postType) {
    case 'quiz':
      prompt = buildQuizPrompt({ courseCode: course.code, courseTitle: course.title, topic, masteryScore, context });
      break;
    case 'flashcard':
      prompt = buildFlashcardPrompt({ courseCode: course.code, topic, context });
      break;
    case 'poll':
      prompt = buildPollPrompt({ courseCode: course.code, topic });
      break;
    default:
      prompt = buildTextPostPrompt({ courseCode: course.code, courseTitle: course.title, topic, masteryScore, urgencyLevel: urgency, context });
  }

  const raw = await ai.generate({
    messages: [{ role: 'user', content: prompt }],
    systemPrompt: CONTENT_GENERATION_SYSTEM_PROMPT,
    maxTokens: 512,
    jsonMode: true,
    temperature: 0.8,
  });

  return JSON.parse(raw);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
```

---

## AI Tutor Chatbot

```svelte
<!-- src/lib/components/feed/AiTutor.svelte -->
<script lang="ts">
  import { createMutation } from '@tanstack/svelte-query';
  import { askTutor } from '$lib/server/remote/ai';
  import { Bot, Send, X } from 'lucide-svelte';

  let { post, user } = $props();
  let open = $state(false);
  let messages = $state<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  let input = $state('');

  const mutation = createMutation({
    mutationFn: askTutor,
    onSuccess: (data) => {
      messages = [...messages, { role: 'assistant', content: data.reply }];
      input = '';
    },
  });

  function sendMessage() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    messages = [...messages, { role: 'user', content: userMsg }];

    $mutation.mutate({
      userId: user.id,
      question: userMsg,
      courseId: post.courseId,
      topic: post.topicTags?.[0],
      postContext: JSON.stringify(post.content),
      conversationHistory: messages.slice(-6), // last 3 turns
    });
  }
</script>

{#if !open}
  <button onclick={() => open = true}
          class="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 mt-2">
    <Bot class="size-3.5" />Ask AI Tutor
  </button>
{:else}
  <div class="mt-3 rounded-xl border border-brand-200 dark:border-brand-800 overflow-hidden">
    <div class="flex items-center justify-between px-3 py-2 bg-brand-50 dark:bg-brand-950">
      <span class="text-xs font-medium flex items-center gap-1">
        <Bot class="size-3.5 text-brand-500" /> AI Tutor
      </span>
      <button onclick={() => open = false} class="text-[--color-text-faint] hover:text-[--color-text]">
        <X class="size-3.5" />
      </button>
    </div>

    <div class="max-h-64 overflow-y-auto p-3 space-y-2 bg-[--color-bg]">
      {#if messages.length === 0}
        <p class="text-xs text-[--color-text-muted] italic">
          Ask me anything about this {post.postType === 'quiz' ? 'question' : 'topic'}.
        </p>
      {/if}
      {#each messages as msg}
        <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[80%] text-xs px-3 py-2 rounded-xl
                      {msg.role === 'user'
                        ? 'bg-brand-500 text-white'
                        : 'bg-[--color-bg-raised] text-[--color-text] border border-[--color-border]'}">
            {msg.content}
          </div>
        </div>
      {/each}
      {#if $mutation.isPending}
        <div class="flex gap-1 px-3 py-2">
          {#each { length: 3 } as _, i}
            <div class="size-1.5 rounded-full bg-brand-400 animate-bounce"
                 style="animation-delay: {i * 150}ms" />
          {/each}
        </div>
      {/if}
    </div>

    <div class="flex gap-2 p-2 border-t border-[--color-border]">
      <input bind:value={input} placeholder="Ask a question…"
             class="flex-1 text-xs bg-transparent outline-none placeholder:text-[--color-text-faint]"
             onkeydown={(e) => e.key === 'Enter' && sendMessage()} />
      <button onclick={sendMessage} disabled={!input.trim() || $mutation.isPending}
              class="p-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600
                     disabled:opacity-50 transition-colors">
        <Send class="size-3" />
      </button>
    </div>
  </div>
{/if}
```

```typescript
// src/lib/server/remote/ai.ts
export const askTutor = command(async ({
  userId, question, courseId, topic, postContext, conversationHistory,
}) => {
  // Rate limit check
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  await checkAIRateLimit(userId, 'tutorMessagesPerDay', user!.plan as any);

  const course = await db.query.userCourses.findFirst({ where: eq(userCourses.id, courseId) });
  const mastery = await db.query.topicMastery.findFirst({
    where: and(
      eq(topicMastery.userId, userId),
      eq(topicMastery.courseId, courseId),
      eq(topicMastery.topic, topic ?? ''),
    ),
  });

  const userMessage = buildTutorUserPrompt({
    question, courseCode: course?.code ?? '', topic: topic ?? '',
    masteryScore: mastery?.score ?? 50, postContext,
  });

  const reply = await ai.generate({
    messages: [
      ...(conversationHistory ?? []).map(m => ({ role: m.role as any, content: m.content })),
      { role: 'user', content: userMessage },
    ],
    systemPrompt: TUTOR_SYSTEM_PROMPT,
    maxTokens: 512,
    temperature: 0.7,
  });

  return { reply };
});
```

---

## Rate Limiting & Cost Controls

```typescript
// packages/ai/src/rate-limiter.ts
// Uses PostgreSQL (via pg-boss's internal table) rather than Redis for simplicity

interface RateLimits {
  tutorMessagesPerDay: number;
  mockExamPerMonth: number;
  contentGenerationPerDay: number;
}

const LIMITS: Record<string, RateLimits> = {
  free:    { tutorMessagesPerDay: 10,  mockExamPerMonth: 1,  contentGenerationPerDay: 50 },
  premium: { tutorMessagesPerDay: 100, mockExamPerMonth: 20, contentGenerationPerDay: 500 },
  institutional: { tutorMessagesPerDay: 200, mockExamPerMonth: 50, contentGenerationPerDay: 1000 },
};

// Store counts in a simple DB table (or use in-memory Map for single-instance)
const counts = new Map<string, number>();

export async function checkAIRateLimit(userId: string, type: keyof RateLimits, plan: string) {
  const limit = LIMITS[plan]?.[type] ?? LIMITS.free[type];
  const period = type === 'mockExamPerMonth' ? 'month' : 'day';
  const key = `${userId}:${type}:${getTimePeriod(period)}`;

  const current = (counts.get(key) ?? 0) + 1;
  counts.set(key, current);

  if (current > limit) {
    const message = plan === 'free'
      ? `You've reached your ${type === 'tutorMessagesPerDay' ? 'daily AI tutor' : 'monthly mock exam'} limit. Upgrade to Premium for more.`
      : `Rate limit reached. Please try again later.`;
    throw new Error(message);
  }
}

function getTimePeriod(type: 'day' | 'month') {
  const d = new Date();
  return type === 'day'
    ? d.toISOString().split('T')[0]
    : `${d.getFullYear()}-${d.getMonth()}`;
}

// Gemini quota management
// Free tier: 15 req/min, 1M tokens/day for gemini-2.5-pro
// Upgrade path: Gemini API paid tier → higher limits
export const AI_COST_CONTROLS = {
  maxTokensPerRequest: {
    quiz:      512,
    flashcard: 256,
    text:      256,
    poll:      200,
    thread:    1024,
    mock_exam: 4096,
    tutor:     512,
    ocr:       2048,
  },
  // If Gemini quota exhausted, auto-route to Claude
  fallbackThreshold: 429,  // HTTP 429 = quota exceeded
};
```
