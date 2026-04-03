<script lang="ts">
  import { page } from "$app/state";
  import { getCourseStats } from "../../courses.remote";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import Brain from "@lucide/svelte/icons/brain";
  import Zap from "@lucide/svelte/icons/zap";
  import CalendarDays from "@lucide/svelte/icons/calendar-days";
  import Layers from "@lucide/svelte/icons/layers";
  import Trophy from "@lucide/svelte/icons/trophy";
  import Users from "@lucide/svelte/icons/users";
  import Video from "@lucide/svelte/icons/video";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Clock from "@lucide/svelte/icons/clock";
  import TrendingUp from "@lucide/svelte/icons/trending-up";
  import CheckCircle from "@lucide/svelte/icons/check-circle-2";

  const courseCode = page.params.code;
  const stats = await getCourseStats({ courseCode });

  function formatCountdown(isoDate: string) {
    const diff = new Date(isoDate).getTime() - Date.now();
    if (diff <= 0) return "Passed";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days === 0) return `${hours}h remaining`;
    if (days === 1) return "Tomorrow";
    return `${days} days away`;
  }

  const examTypeIcons: Record<string, string> = {
    exam: "🎓", quiz: "📝", lab: "🔬", assignment: "📋",
    presentation: "🎤", other: "📌",
  };
</script>

<div class="px-4 py-5 space-y-6">

  <!-- Stats grid -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {#each [
      { label: "Mastery", value: `${stats.masteryPct}%`, icon: Brain, color: "text-brand-500" },
      { label: "XP Earned", value: stats.xpEarned, icon: Zap, color: "text-amber-500" },
      { label: "Flashcards", value: stats.flashcardCount, icon: Layers, color: "text-blue-500" },
      { label: "Quizzes", value: stats.quizCount, icon: BookOpen, color: "text-emerald-500" },
    ] as stat}
      <div class="rounded-2xl border border-border bg-card p-4 flex flex-col gap-1">
        <svelte:component this={stat.icon} class="size-4 {stat.color}" />
        <span class="text-2xl font-black text-foreground tabular-nums">{stat.value}</span>
        <span class="text-[11px] text-muted-foreground">{stat.label}</span>
      </div>
    {/each}
  </div>

  <!-- Mastery breakdown -->
  <div class="rounded-2xl border border-border bg-card p-4">
    <h3 class="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
      <TrendingUp class="size-4 text-brand-500" />
      Mastery Progress
    </h3>
    <div class="space-y-2">
      <div class="flex items-center justify-between text-xs mb-1">
        <span class="text-muted-foreground">Overall</span>
        <span class="font-bold">{stats.masteryPct}%</span>
      </div>
      <div class="h-3 rounded-full bg-muted overflow-hidden">
        <div
          class="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700"
          style="width: {stats.masteryPct}%"
        ></div>
      </div>
      <p class="text-[11px] text-muted-foreground mt-1">
        Keep studying flashcards to improve your mastery score.
      </p>
    </div>
  </div>

  <!-- Upcoming exams -->
  {#if stats.upcomingExams.length > 0}
    <div class="rounded-2xl border border-border bg-card p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
          <CalendarDays class="size-4 text-red-500" />
          Upcoming Exams
        </h3>
        <a href="/courses/{courseCode}/exams" class="text-xs text-brand-500 hover:underline">See all</a>
      </div>
      <div class="space-y-2">
        {#each stats.upcomingExams.slice(0, 3) as exam}
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
            <div class="flex items-center gap-2.5">
              <span class="text-lg">{examTypeIcons[exam.eventType] ?? "📌"}</span>
              <div>
                <p class="text-sm font-medium text-foreground">{exam.title}</p>
                <p class="text-[11px] text-muted-foreground">
                  {new Date(exam.scheduledAt).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {#if exam.durationMins} · {exam.durationMins}min{/if}
                </p>
              </div>
            </div>
            <span class="text-xs font-bold text-red-500 dark:text-red-400 shrink-0">
              {formatCountdown(exam.scheduledAt)}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Community preview -->
  {#if stats.community}
    <div class="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="size-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center text-xl">👥</div>
        <div>
          <p class="text-sm font-bold text-foreground">{stats.community.name}</p>
          <p class="text-[11px] text-muted-foreground">{stats.community.memberCount} members</p>
        </div>
      </div>
      <a href="/courses/{courseCode}/community">
        <Button size="sm" variant="outline" class="h-7 text-xs rounded-full">View</Button>
      </a>
    </div>
  {/if}

  <!-- Quick actions -->
  <div class="grid grid-cols-2 gap-3">
    <a href="/courses/{courseCode}/study" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-950/50 transition-colors">
      <Brain class="size-6 text-brand-500" />
      <span class="text-sm font-bold text-brand-600 dark:text-brand-400">Study Now</span>
      <span class="text-[11px] text-brand-500/70">Flashcards & Quizzes</span>
    </a>
    <a href="/courses/{courseCode}/exams" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/40 border border-border hover:bg-muted/70 transition-colors">
      <CalendarDays class="size-6 text-foreground" />
      <span class="text-sm font-bold text-foreground">Exam Prep</span>
      <span class="text-[11px] text-muted-foreground">Timetable & Mock</span>
    </a>
    <a href="/courses/{courseCode}/videos" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/40 border border-border hover:bg-muted/70 transition-colors">
      <Video class="size-6 text-foreground" />
      <span class="text-sm font-bold text-foreground">Videos</span>
      <span class="text-[11px] text-muted-foreground">{stats.videoCount} available</span>
    </a>
    <a href="/courses/{courseCode}/leaderboard" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/40 border border-border hover:bg-muted/70 transition-colors">
      <Trophy class="size-6 text-amber-500" />
      <span class="text-sm font-bold text-foreground">Leaderboard</span>
      <span class="text-[11px] text-muted-foreground">See rankings</span>
    </a>
  </div>
</div>
