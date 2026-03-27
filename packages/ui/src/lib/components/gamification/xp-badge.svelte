<script lang="ts">
  import Flame from '@lucide/svelte/icons/flame';
  import { Progress } from '$lib/components/ui/progress';
  import { Badge } from '$lib/components/ui/badge';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { getXpLevel, getNextXpLevel, getXpProgress } from '$lib/constants/xp';

  let { xp = 0, streak = 0 }: { xp?: number; streak?: number } = $props();

  const currentLevel = $derived(getXpLevel(xp));
  const nextLevel = $derived(getNextXpLevel(xp));
  const progress = $derived(getXpProgress(xp));
</script>

<div class="flex flex-col gap-1.5">
  <div class="flex items-center justify-between text-xs">
    <Tooltip.Root>
      <Tooltip.Trigger>
        <Badge variant="outline" class="text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800 font-semibold cursor-help h-5">
          Lv.{currentLevel.level} · {currentLevel.title}
        </Badge>
      </Tooltip.Trigger>
      <Tooltip.Content>
        {xp.toLocaleString()} XP total
      </Tooltip.Content>
    </Tooltip.Root>

    {#if streak > 0}
      <span class="flex items-center gap-1 font-medium tabular-nums" style="color: var(--streak-fire)">
        <Flame class="size-3.5" style="animation: fire-pulse 2s ease-in-out infinite;" />
        {streak}d
      </span>
    {/if}
  </div>

  <Progress
    value={progress}
    class="h-1 [&>[data-slot=indicator]]:bg-gradient-to-r [&>[data-slot=indicator]]:from-brand-400 [&>[data-slot=indicator]]:to-brand-600"
  />

  {#if nextLevel}
    <p class="text-[10px] text-muted-foreground text-right font-mono">
      {(nextLevel.xp - xp).toLocaleString()} XP → {nextLevel.title}
    </p>
  {/if}
</div>
