<script lang="ts">
  export let title: string;
  export let description: string;
  export let icon: import('svelte').ComponentType | undefined = undefined;
</script>

<div class="flex flex-col items-center justify-center py-12 px-4 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
  {#if icon}
    <div class="w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
      <svelte:component this={icon} class="w-8 h-8" />
    </div>
  {/if}
  <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-2">{title}</h3>
  <p class="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">{description}</p>
  
  <div class="mt-6">
    <slot name="action" />
  </div>
</div>
