<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Progress } from "$lib/components/ui/progress";
  import { fade } from "svelte/transition";
  import Users from "@lucide/svelte/icons/users";
  import Check from "@lucide/svelte/icons/check";

  interface PollOption {
    id: string;
    text: string;
    voteCount: number;
  }

  let {
    question,
    options,
    totalVotes = 0,
    userVotedId,
    onVote,
  }: {
    question: string;
    options: PollOption[];
    totalVotes?: number;
    userVotedId?: string;
    onVote?: (id: string) => void;
  } = $props();

  let votedId = $state<string | undefined>(undefined);
  // Sync prop → state on mount/change
  $effect(() => { votedId = userVotedId; });
  const showedResults = $derived(!!votedId);

  function handleVote(id: string) {
    if (showedResults) return;
    votedId = id;
    onVote?.(id);
  }

  function getPercentage(votes: number) {
    if (totalVotes === 0) return 0;
    return Math.round((votes / (totalVotes + (userVotedId ? 0 : 1))) * 100);
  }
</script>

<div class="flex flex-col gap-4 p-4 rounded-xl border border-border bg-card/50">
  <div class="flex items-center justify-between gap-2">
    <Badge variant="outline" class="text-[10px] uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800">
      Poll
    </Badge>
    <div class="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
      <Users class="size-3" />
      {totalVotes} votes
    </div>
  </div>

  <h3 class="text-base font-semibold text-foreground leading-tight">
    {question}
  </h3>

  <div class="grid gap-2.5">
    {#each options as option}
      {@const percentage = getPercentage(option.voteCount + (votedId === option.id && !userVotedId ? 1 : 0))}
      {@const isVoted = votedId === option.id}
      
      {#if showedResults}
        <div class="relative w-full h-11 rounded-lg border border-border bg-background overflow-hidden group">
          <!-- Animated progress bar background -->
          <div 
            class="absolute inset-y-0 left-0 transition-all duration-1000 ease-out 
                   {isVoted ? 'bg-brand-500/15' : 'bg-muted/50'}"
            style="width: {percentage}%"
          ></div>
          
          <div class="absolute inset-0 flex items-center justify-between px-4 text-sm font-medium">
            <span class="flex items-center gap-2 truncate">
              {option.text}
              {#if isVoted}
                <Check class="size-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
              {/if}
            </span>
            <span class="font-mono text-xs text-muted-foreground shrink-0">{percentage}%</span>
          </div>
        </div>
      {:else}
        <button
          class="w-full text-left px-4 py-3 rounded-lg border border-border bg-background text-sm font-medium transition-all
                 hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-950/10 active:scale-[0.98]"
          onclick={() => handleVote(option.id)}
        >
          {option.text}
        </button>
      {/if}
    {/each}
  </div>

  {#if showedResults}
    <p transition:fade class="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-widest mt-1">
      Results shown after voting
    </p>
  {/if}
</div>
