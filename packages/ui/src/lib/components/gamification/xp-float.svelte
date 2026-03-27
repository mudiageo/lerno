<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import { fade } from "svelte/transition";

  let {
    amount = 10,
    label = "XP",
    visible = false,
  }: {
    amount?: number;
    label?: string;
    visible?: boolean;
  } = $props();
</script>

{#if visible}
  <div
    class="pointer-events-none fixed z-[200] flex items-center gap-1 font-black text-lg text-xp-gold drop-shadow-lg select-none"
    style="left: 50%; top: 40%; transform: translateX(-50%);"
    transition:fade={{ duration: 200 }}
  >
    <span class="animate-xp-float">+{amount} {label}</span>
  </div>
{/if}

<style>
  .animate-xp-float {
    animation: xp-float 1.4s ease-out forwards;
  }

  @keyframes xp-float {
    0%   { opacity: 0; transform: translateY(0) scale(0.6); }
    20%  { opacity: 1; transform: translateY(-8px) scale(1.2); }
    60%  { opacity: 1; transform: translateY(-40px) scale(1); }
    100% { opacity: 0; transform: translateY(-80px) scale(0.9); }
  }
</style>
