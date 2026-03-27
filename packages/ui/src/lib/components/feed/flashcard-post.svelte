<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import Check from "@lucide/svelte/icons/check";
  import X from "@lucide/svelte/icons/x";
  import { fade } from "svelte/transition";

  let {
    front,
    back,
    onKnow,
    onDontKnow,
  }: {
    front: string;
    back: string;
    onKnow?: () => void;
    onDontKnow?: () => void;
  } = $props();

  let flipped = $state(false);
  let responded = $state(false);

  function handleFlip() {
    flipped = !flipped;
  }

  function handleResponse(known: boolean) {
    responded = true;
    if (known) onKnow?.();
    else onDontKnow?.();
  }
</script>

<div class="flex flex-col gap-4 p-4 rounded-xl border border-border bg-card/50">
  <div class="flex items-center justify-between gap-2">
    <Badge
      variant="outline"
      class="text-[10px] uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800"
    >
      Flashcard
    </Badge>
    <div
      class="text-[10px] text-muted-foreground font-medium uppercase tracking-widest"
    >
      {flipped ? "Back" : "Front"}
    </div>
  </div>

  <!-- Perspective Container for 3D flip -->
  <button
    type="button"
    class="perspective-1000 h-40 w-full cursor-pointer group"
    onclick={handleFlip}
  >
    <div
      class="relative w-full h-full transition-transform duration-500 preserve-3d {flipped
        ? 'rotate-y-180'
        : ''}"
    >
      <!-- Front side -->
      <div
        class="absolute inset-0 backface-hidden border border-brand-100 dark:border-brand-900 bg-background rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm group-hover:shadow-md transition-shadow"
      >
        <p
          class="text-base font-semibold text-foreground line-clamp-3 leading-tight"
        >
          {front}
        </p>
        <div
          class="mt-4 flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider"
        >
          <RefreshCw class="size-3" />
          Tap to flip
        </div>
      </div>

      <!-- Back side -->
      <div
        class="absolute inset-0 backface-hidden rotate-y-180 border border-brand-500/30 bg-brand-50/10 dark:bg-brand-950/20 rounded-xl p-6 flex items-center justify-center text-center shadow-inner"
      >
        <p class="text-base font-medium text-foreground leading-relaxed italic">
          {back}
        </p>
      </div>
    </div>
  </button>

  {#if flipped && !responded}
    <div transition:fade class="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        class="h-9 text-xs border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/30"
        onclick={(e: MouseEvent) => {
          e.stopPropagation();
          handleResponse(false);
        }}
      >
        <X class="size-3.5 mr-1.5" />
        Didn't know
      </Button>
      <Button
        variant="default"
        class="h-9 text-xs bg-green-600 hover:bg-green-700 text-white border-0"
        onclick={(e: MouseEvent) => {
          e.stopPropagation();
          handleResponse(true);
        }}
      >
        <Check class="size-3.5 mr-1.5" />
        Got it!
      </Button>
    </div>
  {/if}

  {#if responded}
    <div transition:fade class="flex items-center justify-center py-2">
      <Badge variant="secondary" class="text-[10px] font-bold py-1 px-3">
        Mastery updated
      </Badge>
    </div>
  {/if}
</div>

<style>
  .perspective-1000 {
    perspective: 1000px;
  }
  .preserve-3d {
    transform-style: preserve-3d;
  }
  .backface-hidden {
    backface-visibility: hidden;
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
</style>
