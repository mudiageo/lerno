<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { cn } from "$lib/utils.js";
  import Medal from "@lucide/svelte/icons/medal";

  let {
    rank,
    displayName,
    username,
    xp,
    avatarUrl,
    isCurrentUser = false,
  }: {
    rank: number;
    displayName: string;
    username?: string;
    xp: number;
    avatarUrl?: string;
    isCurrentUser?: boolean;
  } = $props();

  const isTop3 = $derived(rank <= 3);
  const medalColor = $derived(
    rank === 1 ? "text-yellow-500" : 
    rank === 2 ? "text-zinc-400" : 
    rank === 3 ? "text-amber-600" : ""
  );
</script>

<div class={cn(
  "flex items-center gap-4 p-4 rounded-xl transition-all",
  isCurrentUser ? "bg-primary/5 border border-primary/20 shadow-sm" : "hover:bg-muted/50"
)}>
  <div class="w-8 flex justify-center items-center">
    {#if isTop3}
      <Medal class={cn("size-6", medalColor)} />
    {:else}
      <span class="text-sm font-bold text-muted-foreground tabular-nums">#{rank}</span>
    {/if}
  </div>

  <Avatar.Root>
    <Avatar.Image src={avatarUrl} alt={displayName} />
    <Avatar.Fallback>{displayName[0].toUpperCase()}</Avatar.Fallback>
  </Avatar.Root>

  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2">
      <p class={cn("font-bold truncate", isCurrentUser && "text-primary")}>
        {displayName}
      </p>
      {#if isCurrentUser}
        <span class="px-1.5 py-0.5 rounded bg-primary/10 text-[10px] font-bold text-primary uppercase">You</span>
      {/if}
    </div>
    {#if username}
      <p class="text-xs text-muted-foreground truncate">@{username}</p>
    {/if}
  </div>

  <div class="text-right shrink-0">
    <p class="text-sm font-bold tabular-nums">{xp.toLocaleString()}</p>
    <p class="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">XP</p>
  </div>
</div>
