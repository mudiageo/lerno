<script lang="ts">
  import {
    getMyCourses,
    enrollCourse,
    searchCourseCatalog,
    unenrollCourse,
  } from "./courses.remote";
  import { goto } from "$app/navigation";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Input } from "@lerno/ui/components/ui/input";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import * as Dialog from "@lerno/ui/components/ui/dialog";
  import * as Card from "@lerno/ui/components/ui/card";
  import * as Progress from "@lerno/ui/components/ui/progress";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import BookMarked from "@lucide/svelte/icons/book-marked";
  import Plus from "@lucide/svelte/icons/plus";
  import Search from "@lucide/svelte/icons/search";
  import Clock from "@lucide/svelte/icons/clock";
  import Zap from "@lucide/svelte/icons/zap";
  import Brain from "@lucide/svelte/icons/brain";
  import Calendar from "@lucide/svelte/icons/calendar";
  import TrendingUp from "@lucide/svelte/icons/trending-up";
  import Layers from "@lucide/svelte/icons/layers";
  import Users from "@lucide/svelte/icons/users";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import GraduationCap from "@lucide/svelte/icons/graduation-cap";

  const courses = await getMyCourses({});

  let addOpen = $state(false);
  let searchQuery = $state("");
  let searchResults: any[] = $state([]);
  let searching = $state(false);
  let enrolling: Record<string, boolean> = $state({});

  // Course level colors
  const levelColors: Record<number, string> = {
    100: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    200: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    300: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    400: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    500: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  };

  function getLevelColor(year: number | null) {
    return levelColors[year ?? 100] ?? levelColors[100];
  }

  function formatCountdown(isoDate: string) {
    const diff = new Date(isoDate).getTime() - Date.now();
    if (diff <= 0) return "Past";
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days}d away`;
  }

  async function doSearch() {
    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }
    searching = true;
    try {
      searchResults = await searchCourseCatalog({ query: searchQuery });
    } finally {
      searching = false;
    }
  }

  async function handleEnroll(course: any) {
    enrolling[course.code] = true;
    try {
      await enrollCourse({
        code: course.code,
        title: course.title,
        year: course.year,
        creditUnits: course.creditUnits,
        description: course.description,
      }).updates(getMyCourses({}));
      toast.success(`Enrolled in ${course.code}`);
      addOpen = false;
    } catch (e: any) {
      toast.error(e.message ?? "Failed to enroll");
    } finally {
      enrolling[course.code] = false;
    }
  }

  // Group courses by level
  const grouped = $derived(
    courses.reduce<Record<number, typeof courses>>((acc, c) => {
      const lvl = c.year ?? 100;
      if (!acc[lvl]) acc[lvl] = [];
      acc[lvl].push(c);
      return acc;
    }, {}),
  );
</script>

<svelte:head>
  <title>My Courses — Lerno</title>
  <meta
    name="description"
    content="Manage your enrolled courses, study progress, and exam schedule."
  />
</svelte:head>

<div
  class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen"
>
  <!-- Header -->
  <div
    class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between gap-3"
  >
    <h1 class="text-lg font-bold tracking-tight flex items-center gap-2">
      <GraduationCap class="size-5 text-brand-500" />
      My Courses
    </h1>
    <Button
      size="sm"
      class="h-8 gap-1.5 text-xs"
      onclick={() => (addOpen = true)}
    >
      <Plus class="size-3.5" />
      Add Course
    </Button>
  </div>

  <svelte:boundary>
    {#if courses.length === 0}
      <!-- Empty state -->
      <div class="flex flex-col items-center gap-5 py-20 px-6 text-center">
        <div
          class="size-20 rounded-3xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center"
        >
          <GraduationCap class="size-10 text-brand-500" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-foreground mb-1">No courses yet</h2>
          <p class="text-sm text-muted-foreground max-w-xs">
            Add your courses to get personalized study content, quizzes,
            flashcards, and exam reminders.
          </p>
        </div>
        <Button onclick={() => (addOpen = true)} class="gap-2">
          <Plus class="size-4" />
          Add Your First Course
        </Button>
      </div>
    {:else}
      <div class="px-4 pt-4 pb-8 space-y-8">
        {#each Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)) as [level, levelCourses]}
          <section>
            <div class="flex items-center gap-2 mb-3">
              <span
                class="text-xs font-bold text-muted-foreground uppercase tracking-widest"
                >{level}L</span
              >
              <div class="flex-1 h-px bg-border"></div>
              <span class="text-xs text-muted-foreground"
                >{levelCourses.length} course{levelCourses.length !== 1
                  ? "s"
                  : ""}</span
              >
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {#each levelCourses as course (course.id)}
                <div
                  onclick={() => goto(`/courses/${course.code}`)}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) =>
                    e.key === "Enter" && goto(`/courses/${course.code}`)}
                  class="group relative flex flex-col gap-3 p-4 rounded-2xl border border-border bg-card hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg hover:shadow-brand-500/5 transition-all cursor-pointer"
                >
                  <!-- Top row -->
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="text-xs font-bold px-2 py-0.5 rounded-full border {getLevelColor(
                          course.year,
                        )}"
                      >
                        {course.code}
                      </span>
                      {#if course.semester}
                        <span
                          class="text-[10px] text-muted-foreground capitalize"
                          >{course.semester} sem</span
                        >
                      {/if}
                    </div>
                    <ChevronRight
                      class="size-4 text-muted-foreground/40 group-hover:text-brand-500 shrink-0 transition-colors mt-0.5"
                    />
                  </div>

                  <!-- Title -->
                  <div>
                    <p
                      class="text-sm font-semibold text-foreground leading-snug line-clamp-2"
                    >
                      {course.title}
                    </p>
                    {#if course.creditUnits}
                      <p class="text-[11px] text-muted-foreground mt-0.5">
                        {course.creditUnits} credit unit{course.creditUnits !==
                        1
                          ? "s"
                          : ""}
                      </p>
                    {/if}
                  </div>

                  <!-- Mastery bar -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-muted-foreground">Mastery</span>
                      <span class="font-bold text-foreground"
                        >{course.masteryPct}%</span
                      >
                    </div>
                    <div class="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
                        style="width: {course.masteryPct}%"
                      ></div>
                    </div>
                  </div>

                  <!-- Stats row -->
                  <div
                    class="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t border-border/60"
                  >
                    {#if course.flashcardsDue > 0}
                      <span
                        class="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium"
                      >
                        <Brain class="size-3" />
                        {course.flashcardsDue} due
                      </span>
                    {/if}
                    {#if course.postCount > 0}
                      <span class="flex items-center gap-1">
                        <Layers class="size-3" />
                        {course.postCount} posts
                      </span>
                    {/if}
                    {#if course.nextExam}
                      <span
                        class="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium ml-auto"
                      >
                        <Calendar class="size-3" />
                        {formatCountdown(course.nextExam.scheduledAt)}
                      </span>
                    {/if}
                  </div>

                  <!-- Quick actions -->
                  <div class="flex gap-2" onclick={(e) => e.stopPropagation()}>
                    <a
                      href="/courses/{course.code}/study"
                      class="flex-1 flex items-center justify-center gap-1 h-7 text-[11px] font-medium rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-950/60 transition-colors"
                    >
                      <Brain class="size-3" />
                      Study
                    </a>
                    <a
                      href="/courses/{course.code}/feed"
                      class="flex-1 flex items-center justify-center gap-1 h-7 text-[11px] font-medium rounded-lg bg-muted/60 text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Layers class="size-3" />
                      Feed
                    </a>
                    <a
                      href="/courses/{course.code}/exams"
                      class="flex-1 flex items-center justify-center gap-1 h-7 text-[11px] font-medium rounded-lg bg-muted/60 text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Calendar class="size-3" />
                      Exams
                    </a>
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/if}

    {#snippet pending()}
      <div class="px-4 pt-4 pb-8 space-y-8">
        {#each [100, 200, 300] as lvl}
          <section>
            <div class="flex items-center gap-2 mb-3">
              <Skeleton class="h-3 w-8 rounded" />
              <div class="flex-1 h-px bg-border"></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {#each Array(2) as _}
                <div class="p-4 rounded-2xl border border-border space-y-3">
                  <Skeleton class="h-5 w-20 rounded-full" />
                  <Skeleton class="h-4 w-full rounded" />
                  <Skeleton class="h-3 w-full rounded-full" />
                  <div class="flex gap-2 pt-1">
                    <Skeleton class="h-7 flex-1 rounded-lg" />
                    <Skeleton class="h-7 flex-1 rounded-lg" />
                    <Skeleton class="h-7 flex-1 rounded-lg" />
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/snippet}

    {#snippet failed(error, reset)}
      <div class="flex flex-col items-center gap-3 py-16 text-center">
        <p class="text-sm text-muted-foreground">Could not load courses.</p>
        <Button variant="ghost" size="sm" onclick={reset}>Retry</Button>
      </div>
    {/snippet}
  </svelte:boundary>
</div>

<!-- Add Course Dialog -->
<Dialog.Root bind:open={addOpen}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Plus class="size-4" />
        Add a Course
      </Dialog.Title>
      <Dialog.Description
        >Search for a course by code or title</Dialog.Description
      >
    </Dialog.Header>

    <div class="space-y-4">
      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        />
        <Input
          class="pl-9"
          placeholder="e.g. CPE375 or Computer Architecture…"
          bind:value={searchQuery}
          oninput={doSearch}
        />
      </div>

      <div
        class="max-h-72 overflow-y-auto divide-y divide-border rounded-xl border"
      >
        {#if searching}
          {#each Array(4) as _}
            <div class="p-3 space-y-1">
              <Skeleton class="h-4 w-24 rounded" />
              <Skeleton class="h-3 w-full rounded" />
            </div>
          {/each}
        {:else if searchResults.length > 0}
          {#each searchResults as result (result.code)}
            <div
              class="flex items-center justify-between p-3 hover:bg-accent/40 transition-colors"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    class="text-xs font-bold text-brand-600 dark:text-brand-400"
                    >{result.code}</span
                  >
                  {#if result.year}
                    <span class="text-[10px] text-muted-foreground"
                      >{result.year}L</span
                    >
                  {/if}
                </div>
                <p
                  class="text-sm font-medium text-foreground mt-0.5 line-clamp-1"
                >
                  {result.title}
                </p>
                {#if result.creditUnits}
                  <p class="text-[11px] text-muted-foreground">
                    {result.creditUnits} units
                  </p>
                {/if}
              </div>
              <Button
                size="sm"
                variant={result.enrolled ? "outline" : "default"}
                class="h-7 text-xs shrink-0 ml-3"
                disabled={enrolling[result.code] || result.enrolled}
                onclick={() => handleEnroll(result)}
              >
                {enrolling[result.code]
                  ? "…"
                  : result.enrolled
                    ? "Added"
                    : "Add"}
              </Button>
            </div>
          {/each}
        {:else if searchQuery.length > 0}
          <div class="py-8 text-center text-sm text-muted-foreground">
            No courses found
          </div>
        {:else}
          <div
            class="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2"
          >
            <BookOpen class="size-8 opacity-30" />
            Search to find courses
          </div>
        {/if}
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
