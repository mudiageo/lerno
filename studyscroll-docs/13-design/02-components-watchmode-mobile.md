# Design — Component Library, Watch Mode, Mobile & Responsive

## Component Library Overview

All UI is built on **shadcn-svelte** primitives, extended with StudyScroll-specific components. Every component uses CSS custom properties from the `@theme` block — no hardcoded colors.

---

## Core shadcn Components Used

```bash
# Install all at once
pnpm dlx shadcn-svelte@latest add \
  button card avatar badge dialog sheet tabs \
  dropdown-menu popover tooltip scroll-area \
  input textarea label separator skeleton \
  toast alert progress switch select \
  command checkbox radio-group slider \
  accordion collapsible aspect-ratio
```

---

## Custom Component Specs

### Sidebar (Desktop)

```svelte
<!-- src/lib/components/layout/Sidebar.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { Home, Tv, BookOpen, Radio, Users, Trophy, Search, Settings, PenSquare } from 'lucide-svelte';

  let { user } = $props();

  const navItems = [
    { href: '/feed',        icon: Home,       label: 'Feed' },
    { href: '/watch',       icon: Tv,         label: 'Watch' },
    { href: '/study',       icon: BookOpen,   label: 'Study' },
    { href: '/live',        icon: Radio,      label: 'Live' },
    { href: '/communities', icon: Users,      label: 'Communities' },
    { href: '/leaderboard', icon: Trophy,     label: 'Leaderboard' },
    { href: '/search',      icon: Search,     label: 'Search' },
  ] as const;
</script>

<nav class="flex flex-col h-full py-4 px-3 gap-1">
  <!-- Logo -->
  <a href="/feed" class="flex items-center gap-2 px-3 py-2 mb-4">
    <span class="text-2xl font-black text-brand-500 tracking-tight">SS</span>
    <span class="text-lg font-bold text-[--color-text] hidden xl:block">StudyScroll</span>
  </a>

  {#each navItems as item}
    {@const active = $page.url.pathname.startsWith(item.href)}
    <a href={item.href}
       class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-colors duration-[--duration-fast] group
              {active
                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                : 'text-[--color-text-muted] hover:bg-[--color-bg-overlay] hover:text-[--color-text]'}">
      <svelte:component this={item.icon}
                        class="size-5 shrink-0 {active ? 'stroke-[2.5]' : ''}" />
      <span class="hidden xl:block">{item.label}</span>
    </a>
  {/each}

  <div class="mt-auto flex flex-col gap-1">
    <!-- Compose button -->
    <button class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-500 text-white
                   text-sm font-medium hover:bg-brand-600 transition-colors">
      <PenSquare class="size-5 shrink-0" />
      <span class="hidden xl:block">New Post</span>
    </button>

    <!-- User avatar + settings -->
    <a href="/profile"
       class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[--color-bg-overlay] transition-colors">
      <img src={user?.avatarUrl} alt={user?.displayName}
           class="size-8 rounded-full object-cover ring-2 ring-[--color-border]" />
      <div class="hidden xl:block min-w-0">
        <p class="text-sm font-medium text-[--color-text] truncate">{user?.displayName}</p>
        <p class="text-xs text-[--color-text-muted] truncate">@{user?.username}</p>
      </div>
    </a>
  </div>
</nav>
```

### Bottom Navigation (Mobile)

```svelte
<!-- src/lib/components/layout/BottomNav.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { Home, Tv, BookOpen, Radio, User } from 'lucide-svelte';

  const tabs = [
    { href: '/feed',   icon: Home,     label: 'Feed' },
    { href: '/watch',  icon: Tv,       label: 'Watch' },
    { href: '/study',  icon: BookOpen, label: 'Study' },
    { href: '/live',   icon: Radio,    label: 'Live' },
    { href: '/profile',icon: User,     label: 'Me' },
  ];
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 bg-[--color-bg]/90 backdrop-blur-md
            border-t border-[--color-border] pb-safe">
  <div class="flex">
    {#each tabs as tab}
      {@const active = $page.url.pathname.startsWith(tab.href)}
      <a href={tab.href}
         class="flex-1 flex flex-col items-center gap-1 py-2.5 px-1
                transition-colors duration-[--duration-fast]
                {active ? 'text-brand-500' : 'text-[--color-text-faint]'}">
        <svelte:component this={tab.icon} class="size-5 {active ? 'stroke-[2.5]' : ''}" />
        <span class="text-[10px] font-medium">{tab.label}</span>
        {#if active}
          <div class="absolute bottom-0 w-12 h-0.5 bg-brand-500 rounded-full"
               style="animation: slide-up-fade 0.2s ease-out" />
        {/if}
      </a>
    {/each}
  </div>
</nav>
```

### Command Palette

```svelte
<!-- src/lib/components/layout/CommandPalette.svelte -->
<script lang="ts">
  import { Command } from '$lib/components/ui/command';
  import { goto } from '$app/navigation';
  import { search } from '$lib/server/remote/search';

  let { open = $bindable(false) } = $props();
  let query = $state('');
  let results = $state<any>({ posts: [], users: [], communities: [] });
  let debounceTimer: ReturnType<typeof setTimeout>;

  $effect(() => {
    clearTimeout(debounceTimer);
    if (query.length < 2) { results = { posts: [], users: [], communities: [] }; return; }
    debounceTimer = setTimeout(async () => {
      results = await search({ q: query, type: 'all', userId: '' });
    }, 300);
  });
</script>

<Command.Dialog bind:open>
  <Command.Input bind:value={query} placeholder="Search courses, topics, users..." />
  <Command.List>
    {#if results.users?.length}
      <Command.Group heading="People">
        {#each results.users.slice(0, 3) as user}
          <Command.Item onSelect={() => { goto(`/profile/${user.username}`); open = false; }}>
            <img src={user.avatarUrl} alt="" class="size-6 rounded-full mr-2" />
            {user.displayName} · @{user.username}
          </Command.Item>
        {/each}
      </Command.Group>
    {/if}
    {#if results.communities?.length}
      <Command.Group heading="Communities">
        {#each results.communities.slice(0, 3) as community}
          <Command.Item onSelect={() => { goto(`/communities/${community.slug}`); open = false; }}>
            {community.name}
          </Command.Item>
        {/each}
      </Command.Group>
    {/if}
    <Command.Group heading="Quick Actions">
      <Command.Item onSelect={() => { goto('/study/flashcards'); open = false; }}>
        📚 Start Flashcard Session
      </Command.Item>
      <Command.Item onSelect={() => { goto('/study/quiz'); open = false; }}>
        🧠 Quick Quiz
      </Command.Item>
      <Command.Item onSelect={() => { goto('/study/mock-exam'); open = false; }}>
        📝 Generate Mock Exam
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>
```

### Quiz Post Component (In Feed)

```svelte
<!-- src/lib/components/feed/QuizPost.svelte -->
<script lang="ts">
  import { createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { submitQuizAnswer } from '$lib/server/remote/quiz';

  let { post, userId } = $props();
  let selected = $state<number | null>(null);
  let revealed = $state(false);
  let xpGained = $state(0);
  let showXP = $state(false);

  const qc = useQueryClient();
  const mutation = createMutation({
    mutationFn: submitQuizAnswer,
    onSuccess: (data) => {
      revealed = true;
      if (data.correct) {
        xpGained = 10;
        showXP = true;
        setTimeout(() => showXP = false, 2000);
      }
      qc.invalidateQueries({ queryKey: ['mastery'] });
    },
  });

  function choose(index: number) {
    if (revealed) return;
    selected = index;
    $mutation.mutate({
      userId,
      postId: post.id,
      selectedIndex: index,
      courseId: post.courseId,
      topic: post.topicTags?.[0],
    });
  }
</script>

<div class="my-2 rounded-xl border border-[--color-border] overflow-hidden
            {post.isSurprise ? 'border-yellow-400 dark:border-yellow-600' : ''}">
  {#if post.isSurprise}
    <div class="bg-yellow-50 dark:bg-yellow-950 px-3 py-1.5 text-xs font-medium text-yellow-700 dark:text-yellow-400
                flex items-center gap-1.5"
         style="animation: surprise-shake 0.5s ease-out">
      ⚡ Surprise Question!
    </div>
  {/if}

  <div class="p-3">
    <p class="text-sm font-medium text-[--color-text] mb-3">{post.content.question}</p>

    <div class="space-y-2">
      {#each post.content.options as option, i}
        {@const isCorrect = i === post.content.correctIndex}
        {@const isSelected = i === selected}
        <button
          onclick={() => choose(i)}
          disabled={revealed}
          class="w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-all
                 duration-[--duration-normal] {
            !revealed
              ? 'border-[--color-border] hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50'
              : isCorrect
              ? 'border-green-500 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400'
              : isSelected && !isCorrect
              ? 'border-red-400 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
              : 'border-[--color-border] opacity-50'
          }"
        >
          <span class="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
          {option}
          {#if revealed && isCorrect}
            <span class="ml-2">✓</span>
          {/if}
          {#if revealed && isSelected && !isCorrect}
            <span class="ml-2">✗</span>
          {/if}
        </button>
      {/each}
    </div>

    {#if revealed}
      <div class="mt-3 p-2.5 rounded-lg bg-[--color-bg-raised] text-xs text-[--color-text-muted] leading-relaxed"
           style="animation: slide-up-fade 0.3s ease-out">
        💡 {post.content.explanation}
      </div>
    {/if}
  </div>

  <!-- XP float -->
  {#if showXP}
    <div class="fixed top-1/3 left-1/2 -translate-x-1/2 pointer-events-none
                font-black text-2xl text-[--color-xp-gold] z-50"
         style="animation: xp-float 1.5s ease-out forwards">
      +{xpGained} XP
    </div>
  {/if}
</div>
```

---

## Watch Mode UI Layout

```
Desktop Watch Mode (≥1024px):
┌─────────────────────────────────────────────────────┐
│  Header                                              │
├────────────┬────────────────────────────────────────┤
│  Sidebar   │  Tabs: [For You] [Live] [Shorts] [Saved]│
│            ├────────────────────────────────────────┤
│            │                                        │
│            │  ┌──────┐ ┌──────┐ ┌──────┐          │
│            │  │video │ │video │ │video │          │
│            │  │card  │ │card  │ │card  │          │
│            │  └──────┘ └──────┘ └──────┘          │
│            │  ┌──────┐ ┌──────┐ ┌──────┐          │
│            │  │video │ │video │ │video │          │
│            │  └──────┘ └──────┘ └──────┘          │
│            │                                        │
└────────────┴────────────────────────────────────────┘

Video Player Page:
┌────────────────────────────────────────────────────────────┐
│  Sidebar  │  ┌──────────────────────────────┐  │  Queue   │
│           │  │                              │  │          │
│           │  │   Video Player (16:9)        │  │  Next up │
│           │  │                              │  │  list    │
│           │  └──────────────────────────────┘  │          │
│           │  Title, course, topic tags           │          │
│           │  ─────────────────────────────────  │          │
│           │  [AI Tutor] [Bookmark] [Share]       │          │
│           │  Comments                            │          │
└───────────┴──────────────────────────────────────┴──────────┘
```

---

## Responsive Breakpoints

```css
/* Tailwind v4 breakpoints (same as v3) */
/* sm:  640px  — large phones, small tablets */
/* md:  768px  — tablets */
/* lg:  1024px — laptops (sidebar appears) */
/* xl:  1280px — desktops (sidebar labels appear) */
/* 2xl: 1536px — wide screens */

/* Mobile-first approach */
.feed-container {
  /* Mobile: full width */
  @apply w-full;
  
  /* Tablet+: center with max-width */
  @apply md:max-w-[680px] md:mx-auto;
  
  /* Desktop: left-aligned (sidebar takes left space) */
  @apply lg:mx-0 lg:max-w-none;
}

/* Grid columns for Watch mode */
.video-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
}

/* Study mode — focused, centered */
.study-container {
  @apply max-w-xl mx-auto px-4;
}
```

---

## Safe Area / Notch Handling

```css
/* For iOS and Android notch/home indicator */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

.header {
  padding-top: env(safe-area-inset-top);
}
```

```javascript
// In Tauri, configure safe area via the window settings
// apps/desktop/src-tauri/tauri.conf.json
{
  "app": { "windows": [{ "decorations": false }] }
}
// Then in CSS: handle insets manually for frameless windows
```

---

## Loading Skeleton Components

```svelte
<!-- PostSkeleton.svelte -->
<div class="px-4 py-3 border-b border-[--color-border] animate-pulse">
  <div class="flex gap-3">
    <div class="size-10 rounded-full bg-[--color-bg-overlay] shrink-0" />
    <div class="flex-1 space-y-2">
      <div class="h-3 bg-[--color-bg-overlay] rounded-full w-32" />
      <div class="h-3 bg-[--color-bg-overlay] rounded-full w-full" />
      <div class="h-3 bg-[--color-bg-overlay] rounded-full w-3/4" />
      <div class="flex gap-4 mt-3">
        {#each { length: 4 } as _}
          <div class="h-6 bg-[--color-bg-overlay] rounded w-10" />
        {/each}
      </div>
    </div>
  </div>
</div>

<!-- VideoCardSkeleton.svelte -->
<div class="rounded-xl overflow-hidden border border-[--color-border] animate-pulse">
  <div class="aspect-video bg-[--color-bg-overlay]" />
  <div class="p-3 space-y-2">
    <div class="h-3.5 bg-[--color-bg-overlay] rounded w-full" />
    <div class="h-3.5 bg-[--color-bg-overlay] rounded w-2/3" />
  </div>
</div>
```

---

## XP Level Progress Bar

```svelte
<!-- src/lib/components/gamification/XPBadge.svelte -->
<script lang="ts">
  const LEVELS = [
    { level: 1, xp: 0, title: 'Freshman' },
    { level: 2, xp: 100, title: 'Scholar' },
    { level: 3, xp: 300, title: 'Analyst' },
    { level: 4, xp: 600, title: 'Researcher' },
    { level: 5, xp: 1000, title: 'Expert' },
    { level: 6, xp: 1500, title: "Dean's List" },
    { level: 7, xp: 2500, title: 'Honours' },
    { level: 8, xp: 4000, title: 'First Class' },
    { level: 9, xp: 6000, title: 'Valedictorian' },
    { level: 10, xp: 10000, title: 'Legend' },
  ];

  let { xp } = $props();

  const currentLevel = $derived(
    LEVELS.filter(l => l.xp <= xp).at(-1) ?? LEVELS[0]
  );
  const nextLevel = $derived(
    LEVELS.find(l => l.xp > xp)
  );
  const progress = $derived(
    nextLevel
      ? (xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)
      : 1
  );
</script>

<div class="flex flex-col gap-1">
  <div class="flex justify-between text-xs">
    <span class="font-semibold text-[--color-text]">
      Lv.{currentLevel.level} {currentLevel.title}
    </span>
    <span class="text-[--color-text-muted]">
      {xp} / {nextLevel?.xp ?? '∞'} XP
    </span>
  </div>
  <div class="h-1.5 rounded-full bg-[--color-border] overflow-hidden">
    <div
      class="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full
             transition-all duration-[--duration-slow] ease-[--ease-spring]"
      style="width: {progress * 100}%"
    />
  </div>
</div>
```
