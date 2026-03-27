<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Progress } from "$lib/components/ui/progress";
  import Check from "@lucide/svelte/icons/check";
  import X from "@lucide/svelte/icons/x";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import { fade, slide } from "svelte/transition";

  interface Flashcard {
    id: string;
    front: string;
    back: string;
  }

  let {
    cards,
    deckTitle = "Flashcard Deck",
    onComplete,
  }: {
    cards: Flashcard[];
    deckTitle?: string;
    onComplete?: (stats: { known: number; unknown: number }) => void;
  } = $props();

  let currentIndex = $state(0);
  let flipped = $state(false);
  let known = $state(0);
  let unknown = $state(0);
  let completed = $state(false);

  const current = $derived(cards[currentIndex]);
  const progress = $derived(cards.length > 0 ? (currentIndex / cards.length) * 100 : 0);

  function handleFlip() { flipped = !flipped; }

  function handleResponse(isKnown: boolean) {
    if (isKnown) known++;
    else unknown++;

    if (currentIndex >= cards.length - 1) {
      completed = true;
      onComplete?.({ known, unknown });
    } else {
      currentIndex++;
      flipped = false;
    }
  }

  function reset() {
    currentIndex = 0;
    flipped = false;
    known = 0;
    unknown = 0;
    completed = false;
  }
</script>

<div class="flex flex-col gap-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-base font-bold text-foreground">{deckTitle}</h2>
      <p class="text-xs text-muted-foreground mt-0.5">{currentIndex} / {cards.length} cards</p>
    </div>
    <div class="flex items-center gap-2">
      <Badge variant="outline" class="text-xs border-green-500/50 text-green-600 dark:text-green-400">
        <Check class="size-3 mr-1" />{known}
      </Badge>
      <Badge variant="outline" class="text-xs border-red-500/50 text-red-600 dark:text-red-400">
        <X class="size-3 mr-1" />{unknown}
      </Badge>
    </div>
  </div>

  <Progress value={progress} class="h-1.5 [&>[data-slot=indicator]]:bg-brand-500" />

  {#if completed}
    <div transition:fade class="flex flex-col items-center gap-6 py-12 text-center">
      <div class="size-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
        <Check class="size-8 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h3 class="text-xl font-bold text-foreground mb-1">Session Complete!</h3>
        <p class="text-sm text-muted-foreground">
          <span class="font-bold text-green-600 dark:text-green-400">{known}</span> known ·
          <span class="font-bold text-red-600 dark:text-red-400">{unknown}</span> to review
        </p>
      </div>
      <div class="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
        +{known * 5} XP earned
      </div>
      <Button onclick={reset} variant="outline" class="gap-2">
        <RotateCcw class="size-4" />
        Start Over
      </Button>
    </div>
  {:else if current}
    <!-- Card -->
    <button
      type="button"
      class="perspective-1000 h-56 w-full cursor-pointer group"
      onclick={handleFlip}
      aria-label="{flipped ? 'Showing back. Click to flip.' : 'Showing front. Click to flip.'}"
    >
      <div class="relative w-full h-full transition-transform duration-500 preserve-3d {flipped ? 'rotate-y-180' : ''}">
        <div class="absolute inset-0 backface-hidden border-2 border-brand-100 dark:border-brand-900 bg-background rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm group-hover:border-brand-300 group-hover:shadow-md transition-all">
          <p class="text-lg font-semibold text-foreground leading-tight">{current.front}</p>
          <p class="text-xs text-muted-foreground mt-4 font-bold uppercase tracking-widest">
            Tap to reveal answer
          </p>
        </div>
        <div class="absolute inset-0 backface-hidden rotate-y-180 border-2 border-brand-500/40 bg-brand-50/20 dark:bg-brand-950/20 rounded-2xl p-8 flex items-center justify-center text-center">
          <p class="text-lg font-medium text-foreground leading-relaxed italic">{current.back}</p>
        </div>
      </div>
    </button>

    {#if flipped}
      <div transition:slide class="grid grid-cols-2 gap-3">
        <Button
          class="h-12 gap-2 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30"
          variant="outline"
          onclick={() => handleResponse(false)}
        >
          <X class="size-4" />
          Didn't Know
        </Button>
        <Button
          class="h-12 gap-2 bg-green-600 hover:bg-green-700 text-white border-0"
          onclick={() => handleResponse(true)}
        >
          <Check class="size-4" />
          Got It!
        </Button>
      </div>
    {:else}
      <div class="flex justify-center">
        <Button variant="outline" class="gap-2 h-10" onclick={handleFlip}>
          <RotateCcw class="size-4" />
          Flip Card
        </Button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .perspective-1000 { perspective: 1000px; }
  .preserve-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
</style>
