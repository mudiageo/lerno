<script lang="ts">
  import Flame from '@lucide/svelte/icons/flame';
  import Award from '@lucide/svelte/icons/award';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import TrendingUp from '@lucide/svelte/icons/trending-up';
  import { Separator } from '$lib/components/ui/separator';
  import { Badge } from '$lib/components/ui/badge';
  import { Progress } from '$lib/components/ui/progress';
  import * as Card from '$lib/components/ui/card';
  import * as Avatar from '$lib/components/ui/avatar';
  import { getXpLevel, getNextXpLevel, getXpProgress } from '$lib/constants/xp';

  let { user }: { user?: any } = $props();

  const xp = $derived(user?.xp ?? 2450);
  const currentLevel = $derived(getXpLevel(xp));
  const nextLevel = $derived(getNextXpLevel(xp));
  const xpProgress = $derived(getXpProgress(xp));

  // Mock upcoming exams — will be replaced with real data from remote function
  const upcomingExams = [
    { course: 'CS101', topic: 'Final Exam', daysLeft: 3 },
    { course: 'PSY201', topic: 'Midterm', daysLeft: 7 },
    { course: 'HIST305', topic: 'Essay Due', daysLeft: 14 },
  ];

  const trendingTopics = ['#ReactHooks', '#MacroEcon', '#OrganicChem', '#LinearAlgebra', '#Cognition'];
</script>

<aside class="hidden xl:flex flex-col w-[var(--right-panel-w)] sticky top-0 h-screen border-l border-border bg-sidebar p-4 gap-4 no-scrollbar overflow-y-auto shrink-0">
  <!-- XP / Level Card -->
  <Card.Root class="border-border/50">
    <Card.Header class="pb-2 pt-4">
      <div class="flex items-center justify-between">
        <Badge variant="outline" class="text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800 font-semibold">
          Lv.{currentLevel.level} {currentLevel.title}
        </Badge>
        <span class="text-xs text-muted-foreground font-medium font-mono">{xp} XP</span>
      </div>
    </Card.Header>
    <Card.Content class="pb-4">
      <Progress value={xpProgress} class="h-1.5 [&>[data-slot=indicator]]:bg-brand-500" />
      {#if nextLevel}
        <p class="text-[10px] text-muted-foreground mt-1.5 text-right">{nextLevel.xp - xp} XP to {nextLevel.title}</p>
      {/if}
    </Card.Content>
  </Card.Root>

  <!-- Today's Streak -->
  <div class="flex items-center justify-between px-1">
    <span class="text-sm font-semibold text-foreground flex items-center gap-1.5">
      <Flame class="size-4" style="color: var(--streak-fire); animation: fire-pulse 2s ease-in-out infinite;" />
      Streak
    </span>
    <Badge class="font-mono bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-0">
      {user?.streak ?? 12} days
    </Badge>
  </div>

  <Separator />

  <!-- Upcoming Exams -->
  <div>
    <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
      <BookOpen class="size-3.5" />
      Upcoming Exams
    </h3>
    <div class="space-y-2">
      {#each upcomingExams as exam}
        <div class="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
          <div class="min-w-0">
            <p class="text-xs font-semibold text-foreground truncate">{exam.course}</p>
            <p class="text-[11px] text-muted-foreground truncate">{exam.topic}</p>
          </div>
          <Badge
            variant={exam.daysLeft <= 3 ? 'destructive' : 'secondary'}
            class="text-[10px] px-1.5 h-5 shrink-0 ml-2"
          >
            {exam.daysLeft}d
          </Badge>
        </div>
      {/each}
    </div>
  </div>

  <Separator />

  <!-- Trending Topics -->
  <div>
    <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
      <TrendingUp class="size-3.5" />
      Trending
    </h3>
    <div class="flex flex-wrap gap-1.5">
      {#each trendingTopics as topic}
        <button class="text-xs text-brand-600 dark:text-brand-400 hover:underline hover:text-brand-700 transition-colors">
          {topic}
        </button>
      {/each}
    </div>
  </div>

  <Separator />

  <!-- Leaderboard snippet -->
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Award class="size-3.5" />
        Top Learners
      </h3>
      <a href="/leaderboard" class="text-xs text-brand-600 dark:text-brand-400 hover:underline">See all</a>
    </div>
    <div class="space-y-2">
      {#each [
        { name: 'Sarah M.', xp: 4200, rank: 1 },
        { name: 'James K.', xp: 3800, rank: 2 },
        { name: 'You', xp: xp, rank: 4 },
      ] as entry}
        <div class="flex items-center gap-2.5 py-1.5">
          <span class="text-xs font-bold text-muted-foreground w-4 text-center">#{entry.rank}</span>
          <Avatar.Root class="size-6 shrink-0">
            <Avatar.Fallback class="text-[10px] bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              {entry.name[0]}
            </Avatar.Fallback>
          </Avatar.Root>
          <span class="text-xs font-medium text-foreground flex-1 truncate {entry.name === 'You' ? 'text-brand-600 dark:text-brand-400' : ''}">
            {entry.name}
          </span>
          <span class="text-xs text-muted-foreground font-mono">{entry.xp.toLocaleString()}</span>
        </div>
      {/each}
    </div>
  </div>
</aside>
