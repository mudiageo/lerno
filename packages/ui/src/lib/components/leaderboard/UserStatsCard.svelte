<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { Progress } from "$lib/components/ui/progress/index.js";
  import { cn } from "$lib/utils.js";
  import Trophy from "@lucide/svelte/icons/trophy";
  import Flame from "@lucide/svelte/icons/flame";
  import TrendingUp from "@lucide/svelte/icons/trending-up";

  let {
    rank,
    xp,
    level,
    streakDays,
    xpToNextLevel,
    displayName,
    avatarUrl,
    class: className,
  }: {
    rank: number;
    xp: number;
    level: number;
    streakDays: number;
    xpToNextLevel: number;
    displayName: string;
    avatarUrl?: string;
    class?: string;
  } = $props();

  const progress = $derived(100 - (xpToNextLevel / 10)); // Assuming 1000 XP per level
</script>

<div class={cn(
  "relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md",
  "bg-gradient-to-br from-card to-muted/30",
  className
)}>
  <!-- Glassmorphism effect -->
  <div class="absolute -right-8 -top-8 size-32 rounded-full bg-primary/5 blur-3xl"></div>
  <div class="absolute -left-8 -bottom-8 size-32 rounded-full bg-primary/5 blur-3xl"></div>

  <div class="relative flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Avatar.Root size="lg" class="ring-2 ring-primary/10">
          <Avatar.Image src={avatarUrl} alt={displayName} />
          <Avatar.Fallback>{displayName[0].toUpperCase()}</Avatar.Fallback>
        </Avatar.Root>
        <div>
          <h2 class="text-xl font-bold tracking-tight">{displayName}</h2>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs">
              Level {level}
            </span>
          </div>
        </div>
      </div>
      <div class="text-right">
        <div class="flex items-center justify-end gap-1.5 text-yellow-500 font-bold text-2xl">
          <Trophy class="size-6" />
          #{rank}
        </div>
        <p class="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Rank</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="p-3 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm">
        <div class="flex items-center gap-2 text-muted-foreground mb-1">
          <TrendingUp class="size-4 text-primary" />
          <span class="text-xs font-semibold uppercase">Total XP</span>
        </div>
        <p class="text-lg font-bold tabular-nums">{xp.toLocaleString()}</p>
      </div>
      <div class="p-3 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm">
        <div class="flex items-center gap-2 text-muted-foreground mb-1">
          <Flame class="size-4 text-orange-500" />
          <span class="text-xs font-semibold uppercase">Streak</span>
        </div>
        <p class="text-lg font-bold tabular-nums">{streakDays} Days</p>
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between text-xs font-medium">
        <span class="text-muted-foreground">Progress to Level {level + 1}</span>
        <span class="tabular-nums text-primary">{xpToNextLevel} XP left</span>
      </div>
      <Progress value={progress} class="h-2 bg-muted/50" />
    </div>
  </div>
</div>
