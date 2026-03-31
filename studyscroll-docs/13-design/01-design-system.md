# Design System — UI/UX Specification

## Philosophy

StudyScroll's design must make studying feel like entertainment. The UI should be **instantly familiar** to someone who uses X, BlueSky, or TikTok — then progressively reveal its academic superpowers. Every interaction should feel smooth, fast, and rewarding.

### Core UX Principles
1. **Thumb-first** — 90%+ of interactions reachable with one thumb on mobile
2. **Zero latency feel** — optimistic UI updates everywhere, skeleton loaders, instant feedback
3. **Delight in the details** — micro-animations for every state change, haptic feedback on native
4. **Information density** — cards are compact but scannable; study mode is focused and distraction-free
5. **Calm technology** — notifications and alerts don't interrupt flow unless critical

---

## Color System (Tailwind v4 Tokens)

```css
@theme {
  /* === Brand === */
  --color-brand-50:   oklch(97% 0.02 250);
  --color-brand-100:  oklch(94% 0.04 250);
  --color-brand-200:  oklch(88% 0.08 250);
  --color-brand-300:  oklch(79% 0.12 250);
  --color-brand-400:  oklch(68% 0.17 250);
  --color-brand-500:  oklch(57% 0.22 250);   /* primary */
  --color-brand-600:  oklch(49% 0.22 250);
  --color-brand-700:  oklch(41% 0.20 250);
  --color-brand-800:  oklch(33% 0.16 250);
  --color-brand-900:  oklch(26% 0.12 250);
  --color-brand-950:  oklch(17% 0.08 250);

  /* === Semantic — Light === */
  --color-bg:             oklch(99% 0 0);
  --color-bg-raised:      oklch(97% 0.005 250);
  --color-bg-overlay:     oklch(93% 0.01 250);
  --color-border:         oklch(88% 0.01 250);
  --color-border-subtle:  oklch(94% 0.005 250);
  --color-text:           oklch(15% 0.01 250);
  --color-text-muted:     oklch(45% 0.02 250);
  --color-text-faint:     oklch(65% 0.015 250);

  /* === Status === */
  --color-success:  oklch(65% 0.20 145);
  --color-warning:  oklch(72% 0.18 80);
  --color-error:    oklch(60% 0.22 25);
  --color-info:     oklch(60% 0.18 225);

  /* === Gamification === */
  --color-xp-gold:    oklch(72% 0.18 85);
  --color-streak-fire: oklch(68% 0.22 40);
  --color-mastery-low: oklch(60% 0.22 25);
  --color-mastery-mid: oklch(72% 0.18 80);
  --color-mastery-hi:  oklch(65% 0.20 145);
}

.dark {
  --color-bg:            oklch(12% 0.01 250);
  --color-bg-raised:     oklch(16% 0.015 250);
  --color-bg-overlay:    oklch(20% 0.015 250);
  --color-border:        oklch(25% 0.02 250);
  --color-border-subtle: oklch(20% 0.01 250);
  --color-text:          oklch(95% 0.005 250);
  --color-text-muted:    oklch(65% 0.015 250);
  --color-text-faint:    oklch(45% 0.01 250);
}

.oled {
  --color-bg:            oklch(0% 0 0);
  --color-bg-raised:     oklch(7% 0.01 250);
  --color-bg-overlay:    oklch(12% 0.01 250);
  --color-border:        oklch(18% 0.015 250);
}
```

---

## Typography

```css
@theme {
  /* Scale — Major Third (1.25) */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */
  --text-4xl:  2.25rem;    /* 36px */

  /* Leading */
  --leading-tight:  1.25;
  --leading-snug:   1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Dyslexia-friendly alternative */
  --font-dyslexia: 'OpenDyslexic', 'Comic Sans MS', cursive;
}

/* Applied in app.css */
:root { font-family: var(--font-sans); }
.dyslexia { font-family: var(--font-dyslexia); letter-spacing: 0.05em; line-height: 1.8; }
```

---

## Spacing & Layout

```css
@theme {
  /* 4px base unit */
  --space-1:  0.25rem;   /* 4px */
  --space-2:  0.5rem;    /* 8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */

  /* Container widths */
  --width-feed:    680px;   /* scroll mode max-width */
  --width-watch:   1200px;  /* watch mode max-width */
  --sidebar-width: 240px;
  --right-panel:   300px;

  /* Border radius */
  --radius-sm:   0.25rem;
  --radius-md:   0.5rem;
  --radius-lg:   0.75rem;
  --radius-xl:   1rem;
  --radius-2xl:  1.5rem;
  --radius-full: 9999px;
}
```

---

## Animation System

```css
@theme {
  /* Easings */
  --ease-linear:    linear;
  --ease-in:        cubic-bezier(0.4, 0, 1, 1);
  --ease-out:       cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);   /* overshoot spring */
  --ease-bounce:    cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-snappy:    cubic-bezier(0.2, 0, 0, 1);          /* fast start, slow end */

  /* Durations */
  --duration-instant: 50ms;
  --duration-fast:    120ms;
  --duration-normal:  200ms;
  --duration-slow:    350ms;
  --duration-lazy:    500ms;
}
```

### Key Animations

```css
/* Post card entrance — stagger from feed */
@keyframes slide-up-fade {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Like button pop */
@keyframes heart-pop {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.4); }
  60%  { transform: scale(0.9); }
  100% { transform: scale(1); }
}

/* Quiz answer reveal */
@keyframes reveal-correct {
  from { background-color: transparent; }
  to   { background-color: var(--color-success); }
}

/* XP gain float */
@keyframes xp-float {
  0%   { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-40px); }
}

/* Streak fire pulse */
@keyframes fire-pulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50%       { transform: scale(1.1); filter: brightness(1.2); }
}

/* Flashcard flip */
@keyframes card-flip-out {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(90deg); }
}
@keyframes card-flip-in {
  from { transform: rotateY(-90deg); }
  to   { transform: rotateY(0deg); }
}

/* Surprise question shake */
@keyframes surprise-shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px) rotate(-1deg); }
  40%       { transform: translateX(6px) rotate(1deg); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}

/* Scroll mode post entry (staggered) */
.post-card {
  animation: slide-up-fade var(--duration-slow) var(--ease-out) both;
}
.post-card:nth-child(1) { animation-delay: 0ms; }
.post-card:nth-child(2) { animation-delay: 40ms; }
.post-card:nth-child(3) { animation-delay: 80ms; }
/* etc. */
```

---

## shadcn-svelte Component Customizations

### PostCard

```svelte
<!-- src/lib/components/feed/PostCard.svelte -->
<script lang="ts">
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import { motion } from 'svelte-motion';
  import { Heart, Repeat2, MessageCircle, Bookmark, Share } from 'lucide-svelte';
  import type { Post } from '$lib/types/post';
  
  let { post, index = 0 }: { post: Post; index?: number } = $props();
  
  let liked = $state(false);
  let likeCount = $state(post.likeCount);
  
  function handleLike() {
    liked = !liked;
    likeCount += liked ? 1 : -1;
    // Optimistic — fire command in background
    likePost({ postId: post.id });
  }
</script>

<motion.article
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.04, duration: 0.3, ease: [0, 0, 0.2, 1] }}
  class="border-b border-[--color-border] px-4 py-3 hover:bg-[--color-bg-raised]
         cursor-pointer transition-colors duration-[--duration-fast]"
>
  <div class="flex gap-3">
    <!-- Avatar -->
    <Avatar class="size-10 shrink-0">
      <AvatarImage src={post.author?.avatarUrl} />
      <AvatarFallback>{post.author?.displayName?.[0] ?? 'AI'}</AvatarFallback>
    </Avatar>
    
    <div class="flex-1 min-w-0">
      <!-- Header -->
      <div class="flex items-baseline gap-1.5 flex-wrap">
        <span class="font-semibold text-sm text-[--color-text] truncate">
          {post.author?.displayName ?? 'StudyScroll AI'}
        </span>
        {#if post.aiGenerated}
          <span class="text-xs px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            AI
          </span>
        {/if}
        <span class="text-xs text-[--color-text-faint]">· {post.courseCode}</span>
        <span class="text-xs text-[--color-text-faint] ml-auto">{relativeTime(post.createdAt)}</span>
      </div>
      
      <!-- Content (renders by postType) -->
      <div class="mt-1.5">
        {#if post.postType === 'text'}
          <p class="text-sm leading-relaxed text-[--color-text]">{post.content.body}</p>
        {:else if post.postType === 'quiz'}
          <QuizPost {post} />
        {:else if post.postType === 'flashcard'}
          <FlashcardPost {post} />
        {:else if post.postType === 'poll'}
          <PollPost {post} />
        {/if}
      </div>
      
      <!-- Topic tags -->
      {#if post.topicTags?.length}
        <div class="flex gap-1.5 mt-2 flex-wrap">
          {#each post.topicTags.slice(0, 3) as tag}
            <span class="text-xs text-brand-600 dark:text-brand-400 hover:underline cursor-pointer">
              #{tag}
            </span>
          {/each}
        </div>
      {/if}
      
      <!-- Action bar -->
      <div class="flex items-center gap-1 mt-2.5 -ml-2 text-[--color-text-faint]">
        <Button variant="ghost" size="sm" class="gap-1.5 text-xs h-8 px-2" onclick={handleLike}>
          <Heart
            class="size-4 transition-all duration-[--duration-fast]"
            style={liked ? 'fill: oklch(60% 0.22 25); color: oklch(60% 0.22 25); animation: heart-pop 0.3s ease;' : ''}
          />
          {likeCount}
        </Button>
        <Button variant="ghost" size="sm" class="gap-1.5 text-xs h-8 px-2">
          <MessageCircle class="size-4" />{post.replyCount}
        </Button>
        <Button variant="ghost" size="sm" class="gap-1.5 text-xs h-8 px-2">
          <Repeat2 class="size-4" />{post.repostCount}
        </Button>
        <Button variant="ghost" size="sm" class="h-8 w-8 p-0 ml-auto">
          <Bookmark class="size-4" />
        </Button>
        <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
          <Share class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</motion.article>
```

---

## Layout — Scroll Mode

```
Desktop (≥1024px):
┌─────────────────────────────────────────────────────────┐
│ [Logo] [Search ──────────────] [Notif] [Avatar]  Header │
├────────────┬──────────────────────────┬─────────────────┤
│            │                          │                 │
│  Sidebar   │    Feed (max 680px)      │   Right Panel   │
│  240px     │    infinite scroll       │   300px         │
│            │                          │  - Upcoming      │
│  - Feed    │  [PostCard]              │    exams         │
│  - Watch   │  [QuizPost]   ← pos 3   │  - Leaderboard  │
│  - Study   │  [PostCard]             │  - Trending      │
│  - Live    │  [SurpriseQ] ← pos 8   │    topics        │
│  - Search  │  [FlashCard]            │                 │
│  - Leagues │  [PostCard]             │                 │
│            │  ...                    │                 │
│  [Compose] │                          │                 │
└────────────┴──────────────────────────┴─────────────────┘

Mobile (<768px):
┌─────────────────────────┐
│ [Logo]  [Search] [Notif]│  ← Minimal header
├─────────────────────────┤
│                         │
│  Feed (full width)      │
│  [PostCard]             │
│  [QuizPost]             │
│  ...                    │
│                         │
├─────────────────────────┤
│ 🏠  📺  📚  🔴  👤    │  ← Bottom nav (5 tabs)
└─────────────────────────┘
```

---

## Infinite Scroll Implementation

```svelte
<!-- src/lib/components/feed/InfiniteFeed.svelte -->
<script lang="ts">
  import { createInfiniteQuery } from '@tanstack/svelte-query';
  import { getFeed } from '$lib/server/remote/feed';
  import PostCard from './PostCard.svelte';
  
  let { userId, mode = 'scroll' } = $props();
  
  const query = createInfiniteQuery({
    queryKey: ['feed', userId, mode],
    queryFn: ({ pageParam }) => getFeed({ userId, cursor: pageParam, mode }),
    getNextPageParam: (lastPage) => lastPage.at(-1)?.createdAt,
    staleTime: 30_000,
  });
  
  let sentinel: HTMLDivElement;
  
  $effect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && $query.hasNextPage && !$query.isFetchingNextPage) {
          $query.fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  });
  
  const allPosts = $derived(
    $query.data?.pages.flatMap((page) => page) ?? []
  );
</script>

<div class="flex flex-col divide-y divide-[--color-border]">
  {#if $query.isPending}
    {#each { length: 5 } as _, i}
      <PostSkeleton {i} />
    {/each}
  {:else}
    {#each allPosts as post, i (post.id)}
      {#if post.isSurprise}
        <SurpriseQuestion {post} />
      {:else}
        <PostCard {post} index={i} />
      {/if}
    {/each}
    
    <div bind:this={sentinel} class="h-1" />
    
    {#if $query.isFetchingNextPage}
      <LoadingSpinner class="py-8 mx-auto" />
    {/if}
  {/if}
</div>
```

---

## Flashcard 3D Flip Component

```svelte
<!-- src/lib/components/feed/FlashcardPost.svelte -->
<script lang="ts">
  let { post } = $props();
  let flipped = $state(false);
  let knew = $state<boolean | null>(null);
  
  function flip() {
    flipped = !flipped;
    if (flipped) submitFlashcardFlip({ postId: post.id, knew: null });
  }
  
  function respond(didKnow: boolean) {
    knew = didKnow;
    submitFlashcardFlip({ postId: post.id, knew: didKnow });
  }
</script>

<div class="my-2 cursor-pointer select-none" onclick={flip}>
  <div
    class="relative h-40 rounded-xl transition-all"
    style="transform-style: preserve-3d; transform: rotateY({flipped ? 180 : 0}deg); transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
  >
    <!-- Front -->
    <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700
                flex items-center justify-center p-4 text-white font-medium text-center"
         style="backface-visibility: hidden">
      <span>{post.content.front}</span>
      <div class="absolute bottom-3 text-xs text-brand-200">Tap to reveal</div>
    </div>
    <!-- Back -->
    <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900
                flex flex-col items-center justify-center p-4 text-white"
         style="backface-visibility: hidden; transform: rotateY(180deg)">
      <p class="text-center font-medium">{post.content.back}</p>
      {#if flipped && knew === null}
        <div class="flex gap-3 mt-4">
          <button onclick|stopPropagation={() => respond(false)}
            class="px-4 py-1.5 rounded-full bg-red-500/30 text-sm hover:bg-red-500/50 transition-colors">
            ✗ Didn't know
          </button>
          <button onclick|stopPropagation={() => respond(true)}
            class="px-4 py-1.5 rounded-full bg-green-500/30 text-sm hover:bg-green-500/50 transition-colors">
            ✓ Got it
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
```
