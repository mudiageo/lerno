# Features — Feed, Watch, Study, Social, Quiz, Notes, Analytics & Push

## Feed / Scroll Mode

### App Layout (Authenticated Shell)

```svelte
<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import BottomNav from '$lib/components/layout/BottomNav.svelte';
  import Header from '$lib/components/layout/Header.svelte';
  import CommandPalette from '$lib/components/layout/CommandPalette.svelte';
  import { isMobile } from '$lib/utils/responsive';

  let { data, children } = $props();
  let cmdOpen = $state(false);

  // Cmd+K / Ctrl+K to open command palette
  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      cmdOpen = true;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen bg-[--color-bg] flex flex-col">
  <Header user={data.user} />

  <div class="flex flex-1 max-w-[1280px] mx-auto w-full">
    <!-- Desktop sidebar -->
    {#if !isMobile}
      <Sidebar user={data.user} class="w-60 shrink-0 sticky top-16 h-[calc(100vh-4rem)]" />
    {/if}

    <!-- Main content -->
    <main class="flex-1 min-w-0 border-x border-[--color-border]">
      {@render children()}
    </main>

    <!-- Right panel (desktop only) -->
    {#if !isMobile}
      <aside class="w-72 shrink-0 p-4 space-y-4">
        <UpcomingExamsWidget userId={data.user?.id} />
        <LeaderboardWidget userId={data.user?.id} />
        <TrendingTopicsWidget />
      </aside>
    {/if}
  </div>

  <!-- Mobile bottom nav -->
  {#if isMobile}
    <BottomNav />
  {/if}
</div>

<CommandPalette bind:open={cmdOpen} />
```

### Post Composer

```svelte
<!-- src/lib/components/feed/PostComposer.svelte -->
<script lang="ts">
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { createPostWithModeration } from '$lib/server/remote/moderation';
  import { Image, Video, HelpCircle, StickyNote, BarChart2 } from 'lucide-svelte';
  import valibot from 'valibot';

  let { courseId, onPosted } = $props();
  let activeTab = $state('text');
  let body = $state('');
  let charCount = $derived(body.length);

  const qc = useQueryClient();
  const mutation = createMutation({
    mutationFn: createPostWithModeration,
    onSuccess: () => {
      body = '';
      qc.invalidateQueries({ queryKey: ['feed'] });
      onPosted?.();
    },
  });

  function submit() {
    if (!body.trim()) return;
    $mutation.mutate({
      courseId,
      postType: activeTab as any,
      content: { body },
      topicTags: [],
    });
  }
</script>

<div class="border border-[--color-border] rounded-xl p-4 bg-[--color-bg-raised]">
  <Tabs bind:value={activeTab}>
    <TabsList class="mb-3">
      <TabsTrigger value="text">Post</TabsTrigger>
      <TabsTrigger value="quiz"><HelpCircle class="size-3.5 mr-1" />Quiz</TabsTrigger>
      <TabsTrigger value="flashcard"><StickyNote class="size-3.5 mr-1" />Card</TabsTrigger>
      <TabsTrigger value="poll"><BarChart2 class="size-3.5 mr-1" />Poll</TabsTrigger>
    </TabsList>

    <TabsContent value="text">
      <textarea
        bind:value={body}
        placeholder="What's on your mind about {courseCode}?"
        maxlength="500"
        class="w-full resize-none bg-transparent text-sm outline-none min-h-[80px]
               placeholder:text-[--color-text-faint]"
      />
      <div class="flex items-center justify-between mt-2">
        <div class="flex gap-2">
          <button class="p-1.5 rounded-lg hover:bg-[--color-bg-overlay] text-[--color-text-muted]">
            <Image class="size-4" />
          </button>
          <button class="p-1.5 rounded-lg hover:bg-[--color-bg-overlay] text-[--color-text-muted]">
            <Video class="size-4" />
          </button>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-[--color-text-faint]">{charCount}/500</span>
          <button
            onclick={submit}
            disabled={!body.trim() || $mutation.isPending}
            class="px-4 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-full
                   hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
          >
            {$mutation.isPending ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </TabsContent>
    <!-- Quiz/Flashcard/Poll tabs have their own dedicated subforms -->
  </Tabs>
</div>
```

---

## Watch Mode

```svelte
<!-- src/routes/(app)/watch/+page.svelte -->
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { getWatchFeed } from '$lib/server/remote/feed';
  import VideoCard from '$lib/components/video/VideoCard.svelte';
  import { Play, Radio } from 'lucide-svelte';

  let { data } = $props();

  const feed = createQuery({
    queryKey: ['watch-feed', data.user?.id],
    queryFn: () => getWatchFeed({ userId: data.user!.id }),
  });
</script>

<div class="p-4">
  <!-- Live now banner -->
  <div class="mb-6">
    <h2 class="text-sm font-semibold text-[--color-text-muted] uppercase tracking-wide mb-3">
      🔴 Live Now
    </h2>
    <LiveStreamRow userId={data.user?.id} />
  </div>

  <!-- Video grid -->
  <h2 class="text-sm font-semibold text-[--color-text-muted] uppercase tracking-wide mb-3">
    For You
  </h2>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#if $feed.isPending}
      {#each { length: 6 } as _}
        <VideoCardSkeleton />
      {/each}
    {:else}
      {#each $feed.data ?? [] as video}
        <VideoCard {video} />
      {/each}
    {/if}
  </div>
</div>
```

```svelte
<!-- src/lib/components/video/VideoCard.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Play } from 'lucide-svelte';
  
  let { video } = $props();
  let hovered = $state(false);
</script>

<a href="/watch/{video.id}"
   class="block group rounded-xl overflow-hidden border border-[--color-border]
          hover:border-brand-500 transition-all duration-[--duration-normal]
          hover:shadow-lg hover:shadow-brand-500/10 hover:-translate-y-0.5">
  <div class="relative aspect-video bg-[--color-bg-overlay]"
       onmouseenter={() => hovered = true}
       onmouseleave={() => hovered = false}>
    <img src={video.content.thumbnailUrl} alt={video.content.title}
         class="w-full h-full object-cover" loading="lazy" />
    <div class="absolute inset-0 flex items-center justify-center
                bg-black/0 group-hover:bg-black/30 transition-colors">
      <div class="size-12 rounded-full bg-white/90 flex items-center justify-center
                  scale-0 group-hover:scale-100 transition-transform duration-[--duration-normal]
                  ease-[--ease-spring]">
        <Play class="size-5 text-brand-600 fill-brand-600 ml-0.5" />
      </div>
    </div>
    <span class="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">
      {formatDuration(video.content.durationSecs)}
    </span>
    {#if video.topicTags?.length}
      <span class="absolute top-2 left-2 text-xs bg-brand-600 text-white px-1.5 py-0.5 rounded-full">
        #{video.topicTags[0]}
      </span>
    {/if}
  </div>
  <div class="p-3">
    <p class="text-sm font-medium text-[--color-text] line-clamp-2">{video.content.title}</p>
    <p class="text-xs text-[--color-text-muted] mt-1">{video.courseCode} · {relativeTime(video.createdAt)}</p>
  </div>
</a>
```

---

## Study Mode

### FSRS Spaced Repetition

```typescript
// src/lib/utils/fsrs.ts
// Simplified FSRS algorithm implementation

interface FSRSCard {
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  due: Date;
}

type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export function scheduleCard(card: Partial<FSRSCard>, rating: Rating): FSRSCard {
  const isNew = !card.reps || card.reps === 0;

  // FSRS parameters (default weights)
  const w = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];

  const stability = card.stability ?? initStability(rating, w);
  const difficulty = card.difficulty ?? initDifficulty(rating, w);

  const newStability = isNew ? initStability(rating, w) : updateStability(stability, difficulty, card.reps!, rating, w);
  const newDifficulty = updateDifficulty(difficulty, rating, w);

  const interval = calculateInterval(newStability);
  const due = new Date(Date.now() + interval * 86400000);

  return {
    stability: newStability,
    difficulty: newDifficulty,
    reps: (card.reps ?? 0) + 1,
    lapses: (card.lapses ?? 0) + (rating === 1 ? 1 : 0),
    due,
  };
}

function initStability(rating: Rating, w: number[]) {
  return Math.max(w[rating - 1], 0.1);
}

function initDifficulty(rating: Rating, w: number[]) {
  return Math.min(Math.max(w[4] - w[5] * (rating - 3), 1), 10);
}

function updateStability(S: number, D: number, reps: number, rating: Rating, w: number[]) {
  if (rating === 1) {
    return w[11] * Math.pow(D, -w[12]) * (Math.pow(S + 1, w[13]) - 1) * Math.exp(w[14] * (1 - 1));
  }
  const modifier = rating === 2 ? w[15] : rating === 4 ? w[16] : 1;
  return S * Math.exp(w[8]) * (11 - D) * Math.pow(S, -w[9]) * (Math.exp(w[10] * (1 - 1)) - 1) * modifier + S;
}

function updateDifficulty(D: number, rating: Rating, w: number[]) {
  return Math.min(Math.max(D + w[6] * (rating - 3), 1), 10);
}

function calculateInterval(stability: number, requestedRetention = 0.9) {
  return Math.round(stability * Math.log(requestedRetention) / Math.log(0.9));
}
```

```svelte
<!-- src/routes/(app)/study/flashcards/+page.svelte -->
<script lang="ts">
  import { createQuery, createMutation } from '@tanstack/svelte-query';
  import { getDueCards, submitFlashcardReview } from '$lib/server/remote/flashcards';
  import FlashcardDeck from '$lib/components/study/FlashcardDeck.svelte';

  let { data } = $props();

  const dueCards = createQuery({
    queryKey: ['due-cards', data.user?.id],
    queryFn: () => getDueCards({ userId: data.user!.id }),
  });
</script>

{#if $dueCards.isPending}
  <LoadingSpinner />
{:else if !$dueCards.data?.length}
  <div class="flex flex-col items-center justify-center py-20 gap-4">
    <span class="text-5xl">🎉</span>
    <h2 class="text-xl font-semibold">All caught up!</h2>
    <p class="text-[--color-text-muted]">No flashcards due. Come back tomorrow.</p>
  </div>
{:else}
  <FlashcardDeck cards={$dueCards.data} userId={data.user!.id} />
{/if}
```

### Pomodoro Timer

```svelte
<!-- src/lib/components/study/PomodoroTimer.svelte -->
<script lang="ts">
  let workMins = $state(25);
  let breakMins = $state(5);
  let timeLeft = $state(workMins * 60);
  let isRunning = $state(false);
  let isBreak = $state(false);
  let sessions = $state(0);

  $effect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      if (timeLeft <= 0) {
        isBreak = !isBreak;
        timeLeft = (isBreak ? breakMins : workMins) * 60;
        if (!isBreak) sessions++;
        // Play chime
        new Audio('/sounds/chime.mp3').play().catch(() => {});
      } else {
        timeLeft--;
      }
    }, 1000);
    return () => clearInterval(interval);
  });

  const display = $derived({
    mins: String(Math.floor(timeLeft / 60)).padStart(2, '0'),
    secs: String(timeLeft % 60).padStart(2, '0'),
    progress: 1 - timeLeft / ((isBreak ? breakMins : workMins) * 60),
  });
</script>

<div class="flex flex-col items-center gap-6 py-8">
  <!-- Circular progress -->
  <div class="relative size-48">
    <svg class="size-full -rotate-90" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" stroke-width="6" />
      <circle cx="50" cy="50" r="45" fill="none"
              stroke={isBreak ? 'var(--color-success)' : 'var(--color-brand-500)'}
              stroke-width="6"
              stroke-linecap="round"
              stroke-dasharray={`${display.progress * 283} 283`}
              class="transition-all duration-1000" />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <span class="text-3xl font-mono font-bold">{display.mins}:{display.secs}</span>
      <span class="text-sm text-[--color-text-muted]">{isBreak ? 'Break' : 'Focus'}</span>
    </div>
  </div>

  <div class="flex gap-3">
    <button
      onclick={() => isRunning = !isRunning}
      class="px-6 py-2.5 rounded-full font-medium text-sm transition-colors
             {isRunning ? 'bg-[--color-bg-overlay] text-[--color-text]' : 'bg-brand-500 text-white hover:bg-brand-600'}"
    >
      {isRunning ? 'Pause' : 'Start'}
    </button>
    <button onclick={() => { isRunning = false; timeLeft = workMins * 60; isBreak = false; }}
            class="px-4 py-2.5 rounded-full text-sm text-[--color-text-muted] hover:bg-[--color-bg-overlay]">
      Reset
    </button>
  </div>

  <p class="text-sm text-[--color-text-muted]">{sessions} sessions completed today</p>
</div>
```

---

## Social Features

### Communities

```typescript
// src/lib/server/remote/communities.ts
export const getCommunity = query(async ({ slug, userId }) => {
  const community = await db.query.communities.findFirst({
    where: eq(communities.slug, slug),
    with: {
      members: {
        where: eq(communityMembers.userId, userId),
        limit: 1,
      },
    },
  });
  return community;
});

export const joinCommunity = command(async ({ communityId, userId }) => {
  await db.insert(communityMembers).values({
    communityId, userId, role: 'member',
  }).onConflictDoNothing();

  await db.update(communities)
    .set({ memberCount: sql`member_count + 1` })
    .where(eq(communities.id, communityId));
});

export const createCommunity = command(async ({ name, description, courseCode, isPrivate, userId }) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const [community] = await db.insert(communities).values({
    slug, name, description, courseCode, isPrivate, createdBy: userId,
  }).returning();

  // Add creator as admin
  await db.insert(communityMembers).values({
    communityId: community.id, userId, role: 'admin',
  });

  return community;
});
```

### Follow System

```typescript
// src/lib/server/remote/users.ts
export const toggleFollow = command(async ({ followerId, followingId }) => {
  const existing = await db.query.follows.findFirst({
    where: and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)),
  });

  if (existing) {
    await db.delete(follows).where(
      and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
    );
    return { following: false };
  } else {
    await db.insert(follows).values({ followerId, followingId });

    // Notify the followed user
    await db.insert(notifications).values({
      userId: followingId,
      type: 'follow',
      actorId: followerId,
    });

    // Queue push
    await pgBoss.send('send-push', {
      userId: followingId,
      payload: { title: 'New follower', body: `Someone started following you`, url: '/notifications' },
    });

    return { following: true };
  }
});
```

---

## Student Analytics Dashboard

```svelte
<!-- src/routes/(app)/profile/analytics/+page.svelte -->
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { getAnalytics } from '$lib/server/remote/analytics';

  let { data } = $props();
  let range = $state<'7d' | '30d' | 'all'>('30d');

  const analytics = createQuery({
    queryKey: ['analytics', data.user?.id, range],
    queryFn: () => getAnalytics({ userId: data.user!.id, range }),
  });
</script>

<div class="p-6 space-y-8 max-w-2xl">
  <h1 class="text-2xl font-bold">Your Learning Analytics</h1>

  <!-- Mastery heatmap per course -->
  {#each $analytics.data?.courses ?? [] as course}
    <section>
      <h2 class="font-semibold mb-3">{course.code} — {course.title}</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {#each course.topics as topic}
          <div class="p-3 rounded-lg border border-[--color-border]
                      {masteryColor(topic.score)} transition-colors">
            <div class="text-xs font-medium truncate">{topic.topic}</div>
            <div class="text-lg font-bold mt-1">{topic.score}%</div>
            <div class="w-full bg-black/10 rounded-full h-1 mt-1">
              <div class="bg-current h-1 rounded-full" style="width: {topic.score}%" />
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/each}

  <!-- Activity graph (GitHub-style) -->
  <section>
    <h2 class="font-semibold mb-3">Study Activity</h2>
    <ActivityHeatmap data={$analytics.data?.activity} />
  </section>

  <!-- Stats row -->
  <div class="grid grid-cols-3 gap-4">
    {#each [
      { label: 'Quiz Accuracy', value: `${$analytics.data?.quizAccuracy ?? 0}%` },
      { label: 'Cards Reviewed', value: $analytics.data?.cardsReviewed ?? 0 },
      { label: 'Study Sessions', value: $analytics.data?.sessions ?? 0 },
    ] as stat}
      <div class="text-center p-4 rounded-xl bg-[--color-bg-raised] border border-[--color-border]">
        <div class="text-2xl font-bold text-brand-500">{stat.value}</div>
        <div class="text-xs text-[--color-text-muted] mt-1">{stat.label}</div>
      </div>
    {/each}
  </div>
</div>

<script>
  function masteryColor(score: number) {
    if (score >= 80) return 'bg-green-500/10 text-green-600 border-green-200';
    if (score >= 60) return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    return 'bg-red-500/10 text-red-600 border-red-200';
  }
</script>
```

---

## Mock Exam Generator

```typescript
// src/lib/server/remote/ai.ts
export const generateMockExam = command(async ({ userId, courseId, topicFilter }) => {
  // Check rate limit + premium
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  await checkAIRateLimit(userId, 'mockExamPerMonth', user!.plan as any);

  const course = await db.query.userCourses.findFirst({ where: eq(userCourses.id, courseId) });
  const mastery = await db.select().from(topicMastery)
    .where(and(eq(topicMastery.userId, userId), eq(topicMastery.courseId, courseId)));

  const topics = topicFilter ?? mastery.map(m => m.topic);
  const pastQuestions = await db.select()
    .from(posts)
    .where(and(
      eq(posts.courseId, courseId),
      eq(posts.postType, 'past_exam_q'),
      eq(posts.isVisible, true),
    ))
    .limit(10);

  const raw = await ai.generate({
    messages: [{ role: 'user', content: buildMockExamPrompt({
      courseCode: course!.code,
      courseTitle: course!.title,
      topics,
      pastQuestions: pastQuestions.map(p => p.content.question as string),
      questionCount: 20,
      timeLimitMins: 60,
    })}],
    systemPrompt: CONTENT_GENERATION_SYSTEM_PROMPT,
    maxTokens: 4096,
    jsonMode: true,
  });

  const examContent = JSON.parse(raw);

  // Save as a post
  const [exam] = await db.insert(posts).values({
    authorId: userId,
    courseId,
    postType: 'mock_exam',
    content: examContent,
    topicTags: topics.slice(0, 5),
    aiGenerated: true,
    isVisible: false, // private to creator
    isPremium: false,
  }).returning();

  return exam;
});
```

---

## Note Upload & OCR

```typescript
// src/lib/server/remote/courses.ts
export const uploadCourseMaterial = command(async ({
  userId, courseId, storageKey, title, type,
}) => {
  const [material] = await db.insert(courseMaterials).values({
    userId, courseId, storageKey, title, type,
    processed: false,
  }).returning();

  // Queue OCR + content generation job
  await pgBoss.send('process-upload', { materialId: material.id }, { priority: 5 });

  return material;
});
```

---

## Push Notification Service Worker Registration

```typescript
// src/lib/utils/push.ts
export async function registerPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return; // already subscribed

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      import.meta.env.PUBLIC_VAPID_PUBLIC_KEY
    ),
  });

  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { 'Content-Type': 'application/json' },
  });
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
```
