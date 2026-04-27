<script lang="ts">
  import { page } from "$app/state";
  import { getCourseStats } from "../courses.remote";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import Brain from "@lucide/svelte/icons/brain";
  import LayoutGrid from "@lucide/svelte/icons/layout-grid";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Video from "@lucide/svelte/icons/video";
  import Clapperboard from "@lucide/svelte/icons/clapperboard";
  import CalendarDays from "@lucide/svelte/icons/calendar-days";
  import Trophy from "@lucide/svelte/icons/trophy";
  import Users from "@lucide/svelte/icons/users";
  import FileText from "@lucide/svelte/icons/file-text";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";

  let { children } = $props();

  const courseCode = $derived(page.params.code);

  const stats = await getCourseStats({ courseCode: page.params.code });
  const course = $derived(stats.course);

  const tabs = $derived([
    { href: `/courses/${courseCode}/overview`, label: "Overview", icon: LayoutGrid, id: "overview" },
    { href: `/courses/${courseCode}/feed`, label: "Feed", icon: BookOpen, id: "feed" },
    { href: `/courses/${courseCode}/study`, label: "Study", icon: Brain, id: "study" },
    { href: `/courses/${courseCode}/videos`, label: "Videos", icon: Video, id: "videos" },
    { href: `/courses/${courseCode}/shorts`, label: "Shorts", icon: Clapperboard, id: "shorts" },
    { href: `/courses/${courseCode}/exams`, label: "Exams", icon: CalendarDays, id: "exams" },
    { href: `/courses/${courseCode}/leaderboard`, label: "Board", icon: Trophy, id: "leaderboard" },
    { href: `/courses/${courseCode}/community`, label: "Community", icon: Users, id: "community" },
    { href: `/courses/${courseCode}/materials`, label: "Materials", icon: FileText, id: "materials" },
  ]);

  const activeTab = $derived(
    tabs.find((t) => page.url.pathname.startsWith(t.href))?.id ?? "overview",
  );

  // Level color accent
  const levelColor = $derived(
    course.year <= 100 ? "from-blue-500 to-cyan-500"
    : course.year <= 200 ? "from-emerald-500 to-teal-500"
    : course.year <= 300 ? "from-amber-500 to-orange-500"
    : course.year <= 400 ? "from-orange-500 to-red-500"
    : "from-purple-500 to-violet-500"
  );
</script>

<svelte:head>
  <title>{courseCode} — {course?.title ?? 'Course'} — Lerno</title>
</svelte:head>

<div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen flex flex-col">
  <!-- Sticky course header + tabs -->
  <div class="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
    <!-- Course identity bar -->
    <div class="px-4 pt-3 pb-2 flex items-center gap-3">
      <a href="/courses" class="text-muted-foreground hover:text-foreground transition-colors shrink-0">
        <ChevronLeft class="size-5" />
      </a>

      <svelte:boundary>
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <!-- Level accent dot -->
          <div class="size-8 rounded-xl bg-gradient-to-br {levelColor} flex items-center justify-center shrink-0 shadow-sm">
            <span class="text-[10px] font-black text-white">{String(course.year ?? 100)[0]}L</span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-black text-foreground tracking-tight">{courseCode}</span>
              {#if course.creditUnits}
                <Badge variant="outline" class="text-[10px] h-4 px-1.5">{course.creditUnits}CU</Badge>
              {/if}
            </div>
            <p class="text-[11px] text-muted-foreground truncate">{course.title}</p>
          </div>
        </div>

        {#snippet pending()}<Skeleton class="h-8 w-48 rounded-xl" />{/snippet}
        {#snippet failed()}<span class="text-sm font-bold">{courseCode}</span>{/snippet}
      </svelte:boundary>

      <!-- Mastery badge -->
      <div class="shrink-0 flex items-center gap-1.5">
        <div class="relative size-9">
          <svg class="size-9 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" stroke-width="2.5" class="text-muted/40" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="url(#brand-grad)" stroke-width="2.5"
              stroke-dasharray="{stats.masteryPct} {100 - stats.masteryPct}"
              stroke-linecap="round"
            />
            <defs>
              <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#6366f1" />
                <stop offset="100%" style="stop-color:#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span class="absolute inset-0 flex items-center justify-center text-[9px] font-black text-foreground">{stats.masteryPct}%</span>
        </div>
      </div>
    </div>

    <!-- Horizontal tab bar (scrollable) -->
    <div class="flex overflow-x-auto scrollbar-hide px-2 pb-0" role="tablist">
      {#each tabs as tab}
        {@const isActive = activeTab === tab.id}
        {@const Icon = tab.icon}
        <a
          href={tab.href}
          role="tab"
          aria-selected={isActive}
          class="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-all
                 {isActive
                   ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                   : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'}"
        >
          <Icon class="size-3.5 shrink-0" />
          {tab.label}
        </a>
      {/each}
    </div>
  </div>

  <!-- Page content -->
  <div class="flex-1">
    <svelte:boundary onerror={e => console.log(e)}>
      {@render children()}

      {#snippet pending()}
        <div class="flex items-center justify-center py-16">
          <div class="w-8 h-8 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin"></div>
        </div>
      {/snippet}

      {#snippet failed(error, reset)}
        <div class="flex flex-col items-center gap-3 py-16 text-center">{error}
          <p class="text-sm text-muted-foreground">Something went wrong.</p>
          <Button variant="ghost" size="sm" onclick={reset}>Retry</Button>
        </div>
      {/snippet}
    </svelte:boundary>
  </div>
</div>
