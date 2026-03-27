<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import X from "@lucide/svelte/icons/x";

  let {
    badge,
    onclose,
  }: {
    badge?: { icon: string; title: string; description: string };
    onclose?: () => void;
  } = $props();

  let visible = $state(!!badge);
  $effect(() => { visible = !!badge; });

  function close() {
    visible = false;
    onclose?.();
  }

  // Auto-close after 4s
  $effect(() => {
    if (!visible) return;
    const t = setTimeout(close, 4000);
    return () => clearTimeout(t);
  });
</script>

{#if visible && badge}
  <!-- Overlay -->
  <div
    class="fixed inset-0 z-[300] flex items-end justify-center p-4 pointer-events-none"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="pointer-events-auto w-full max-w-sm bg-background border border-border rounded-2xl shadow-2xl shadow-brand-500/10 overflow-hidden"
      transition:scale={{ duration: 300, start: 0.85 }}
    >
      <!-- Gold accent bar -->
      <div class="h-1 bg-gradient-to-r from-xp-gold via-amber-400 to-xp-gold animate-pulse"></div>

      <div class="flex items-center gap-4 p-4">
        <div class="size-14 text-3xl flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-amber-900/20 rounded-xl shrink-0">
          {badge.icon}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-widest text-xp-gold mb-0.5">Achievement Unlocked</p>
          <p class="text-base font-black text-foreground leading-tight">{badge.title}</p>
          <p class="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{badge.description}</p>
        </div>
        <button
          class="size-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 self-start"
          onclick={close}
        >
          <X class="size-4" />
        </button>
      </div>
    </div>
  </div>
{/if}
