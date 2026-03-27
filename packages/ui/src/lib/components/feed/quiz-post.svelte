<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import CheckCircle2 from "@lucide/svelte/icons/check-circle-2";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import { fade, slide } from "svelte/transition";

  interface QuizOption {
    id: string;
    text: string;
  }

  let {
    question,
    options,
    correctOptionId,
    explanation,
    onCorrect,
  }: {
    question: string;
    options: QuizOption[];
    correctOptionId: string;
    explanation?: string;
    onCorrect?: () => void;
  } = $props();

  let selectedId = $state<string | null>(null);
  let revealed = $state(false);

  const isCorrect = $derived(selectedId === correctOptionId);

  function handleSelect(id: string) {
    if (revealed) return;
    selectedId = id;
    revealed = true;
    if (id === correctOptionId) {
      onCorrect?.();
    }
  }
</script>

<div class="flex flex-col gap-4 p-4 rounded-xl border border-border bg-card/50">
  <div class="flex items-center justify-between gap-2">
    <Badge variant="outline" class="text-[10px] uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800">
      Quiz
    </Badge>
    {#if revealed}
      <div transition:fade class="flex items-center gap-1.5 text-xs font-bold {isCorrect ? 'text-green-600' : 'text-red-600'}">
        {#if isCorrect}
          <CheckCircle2 class="size-3.5" />
          Correct!
        {:else}
          <CircleAlert class="size-3.5" />
          Incorrect
        {/if}
      </div>
    {/if}
  </div>

  <h3 class="text-base font-semibold text-foreground leading-tight">
    {question}
  </h3>

  <div class="grid gap-2">
    {#each options as option}
      {@const isOptionSelected = selectedId === option.id}
      {@const isOptionCorrect = option.id === correctOptionId}
      
      <button
        class="w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all relative overflow-hidden group
               {revealed 
                 ? isOptionCorrect 
                   ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400' 
                   : isOptionSelected 
                     ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                     : 'border-border bg-background opacity-60'
                 : 'border-border bg-background hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-950/10'}"
        onclick={() => handleSelect(option.id)}
        disabled={revealed}
      >
        <div class="flex items-center gap-3">
          <div class="size-5 rounded-full border flex items-center justify-center shrink-0
                      {revealed && isOptionCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-border'}">
            {#if revealed && isOptionCorrect}
              <CheckCircle2 class="size-3" />
            {:else}
              <span class="text-[10px] uppercase">{String.fromCharCode(65 + options.indexOf(option))}</span>
            {/if}
          </div>
          {option.text}
        </div>
      </button>
    {/each}
  </div>

  {#if revealed && explanation}
    <div transition:slide class="p-3 rounded-lg bg-muted/50 border-l-4 {isCorrect ? 'border-green-500' : 'border-amber-500'}">
      <p class="text-xs text-muted-foreground leading-relaxed">
        <span class="font-bold text-foreground block mb-1">Explanation</span>
        {explanation}
      </p>
    </div>
  {/if}
</div>
