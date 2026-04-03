<script lang="ts">
  import { page } from "$app/state";
  import { getCourseLeaderboard } from "../../courses.remote";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import Trophy from "@lucide/svelte/icons/trophy";
  import Medal from "@lucide/svelte/icons/medal";

  const courseCode = page.params.code;

  let period = $state<"week" | "month" | "all">("week");
  const leaderboard = await getCourseLeaderboard({ courseCode, period });

  const medals = ["🥇", "🥈", "🥉"];

  function formatXP(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  }
</script>

<div class="px-4 py-5 space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="text-base font-bold text-foreground flex items-center gap-2">
      <Trophy class="size-4 text-amber-500" />
      Course Leaderboard
    </h2>

    <!-- Period filter -->
    <div class="flex rounded-lg border border-border overflow-hidden">
      {#each [["week", "Week"], ["month", "Month"], ["all", "All"]] as [val, label]}
        <button
          class="px-2.5 py-1 text-xs font-medium transition-colors {period === val ? 'bg-brand-500 text-white' : 'text-muted-foreground hover:bg-accent'}"
          onclick={() => (period = val as any)}
        >{label}</button>
      {/each}
    </div>
  </div>

  <svelte:boundary>
    <div class="space-y-2">
      {#if leaderboard.length === 0}
        <div class="flex flex-col items-center gap-3 py-16 text-center">
          <Trophy class="size-10 text-muted-foreground/30" />
          <p class="text-sm text-muted-foreground">No rankings yet. Start studying to earn XP!</p>
          <a href="/courses/{courseCode}/study">
            <Button size="sm">Start Studying</Button>
          </a>
        </div>
      {:else}
        {#each leaderboard as entry (entry.userId)}
          <div class="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-accent/40 transition-colors
                      {entry.rank <= 3 ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/10' : ''}">
            <!-- Rank -->
            <div class="w-7 text-center">
              {#if entry.rank <= 3}
                <span class="text-lg">{medals[entry.rank - 1]}</span>
              {:else}
                <span class="text-sm font-bold text-muted-foreground">#{entry.rank}</span>
              {/if}
            </div>
            <!-- Avatar -->
            <div class="size-9 rounded-full bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center text-sm font-bold text-brand-600 shrink-0 overflow-hidden">
              {#if entry.image}
                <img src={entry.image} alt={entry.name ?? "User"} class="size-full object-cover" />
              {:else}
                {(entry.name ?? "?")[0].toUpperCase()}
              {/if}
            </div>
            <!-- Name -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-foreground truncate">{entry.name ?? "User"}</p>
              {#if entry.username}
                <p class="text-[11px] text-muted-foreground">@{entry.username}</p>
              {/if}
            </div>
            <!-- XP -->
            <div class="text-right">
              <p class="text-sm font-black text-amber-600 dark:text-amber-400">{formatXP(entry.total)} XP</p>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    {#snippet pending()}
      <div class="space-y-2">
        {#each Array(8) as _}
          <div class="flex items-center gap-3 p-3 rounded-xl border border-border/60">
            <Skeleton class="size-7 rounded" />
            <Skeleton class="size-9 rounded-full" />
            <div class="flex-1 space-y-1">
              <Skeleton class="h-4 w-28 rounded" />
              <Skeleton class="h-3 w-16 rounded" />
            </div>
            <Skeleton class="h-5 w-14 rounded" />
          </div>
        {/each}
      </div>
    {/snippet}
  </svelte:boundary>
</div>
