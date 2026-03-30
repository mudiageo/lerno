<script lang="ts">
  import { getLeaderboard, getUserStats } from "./leaderboard.remote";
  import { LeaderboardItem, UserStatsCard } from "@lerno/ui/components/leaderboard";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import Trophy from "@lucide/svelte/icons/trophy";
  import Users from "@lucide/svelte/icons/users";
  import Globe from "@lucide/svelte/icons/globe";
  import GraduationCap from "@lucide/svelte/icons/graduation-cap";

  let scope = $state<"global" | "course" | "friends">("global");

  // Initial data fetch with top-level await
  const stats = await getUserStats({});
  
  // For the leaderboard list, we want it to react to scope changes.
  // We can use a derived promise or just await it inside a block.
  let leaderboardPromise = $derived(getLeaderboard({ scope }));
</script>

<svelte:head>
  <title>Leaderboard — Lerno</title>
  <meta name="description" content="Compete with students globally or in your courses." />
</svelte:head>

<div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen pb-20 lg:pb-0">
  <!-- Header -->
  <div class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3">
    <h1 class="text-lg font-bold tracking-tight flex items-center gap-2">
      <Trophy class="size-5 text-yellow-500" />
      Leaderboard
    </h1>
  </div>

  <div class="p-4 space-y-6">
    <!-- User's current rank & stats -->
    <UserStatsCard
      rank={stats.rank}
      xp={stats.xp}
      level={stats.level}
      streakDays={stats.streakDays}
      xpToNextLevel={stats.xpToNextLevel}
      displayName={stats.displayName ?? stats.username ?? "Anonymous"}
      avatarUrl={stats.avatarUrl}
    />

    <!-- Scope Selector -->
    <div class="flex gap-2 p-1 bg-muted/50 rounded-xl">
      {#each [
        { id: "global", label: "Global", icon: Globe },
        { id: "course", label: "Course", icon: GraduationCap },
        { id: "friends", label: "Friends", icon: Users },
      ] as item}
        <button
          class="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all
                 {scope === item.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}"
          onclick={() => (scope = item.id as any)}
        >
          <item.icon class="size-3.5" />
          {item.label}
        </button>
      {/each}
    </div>

    <!-- Leaderboard List -->
    <div class="space-y-1">
      <svelte:boundary>
        {#await leaderboardPromise}
          {#each Array(5) as _}
            <div class="flex items-center gap-4 p-3 animate-pulse">
              <div class="size-6 bg-muted rounded"></div>
              <div class="size-10 bg-muted rounded-full"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-muted rounded w-1/3"></div>
                <div class="h-3 bg-muted rounded w-1/4"></div>
              </div>
              <div class="size-8 bg-muted rounded"></div>
            </div>
          {/each}
        {:then records}
          {#each records as record (record.id)}
            <LeaderboardItem
              rank={record.rank}
              displayName={record.displayName ?? record.username ?? "Anonymous"}
              username={record.username}
              xp={record.xp}
              avatarUrl={record.avatarUrl}
              isCurrentUser={record.id === stats.id}
            />
          {:else}
            <div class="py-20 text-center space-y-3">
              <Users class="size-10 text-muted-foreground/30 mx-auto" />
              <p class="text-sm text-muted-foreground">No students found in this scope.</p>
            </div>
          {/each}
        {/await}

        {#snippet failed(error, reset)}
          <div class="py-10 text-center space-y-4">
            <p class="text-sm text-muted-foreground">Failed to load leaderboard.</p>
            <Button variant="outline" size="sm" onclick={reset}>Try Again</Button>
          </div>
        {/snippet}
      </svelte:boundary>
    </div>
  </div>
</div>
