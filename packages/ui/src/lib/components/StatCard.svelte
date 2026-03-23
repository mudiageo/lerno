<script lang="ts">
  export let title: string;
  export let value: string | number;
  export let icon: import('svelte').ComponentType;
  export let trend: number | undefined = undefined;
</script>

<div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</h3>
    <div class="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
      <svelte:component this={icon} class="w-5 h-5" />
    </div>
  </div>
  
  <div class="flex items-baseline gap-2">
    <p class="text-3xl font-bold text-zinc-900 dark:text-white">{value}</p>
    {#if trend !== undefined}
      <span class="text-sm font-medium {trend >= 0 ? 'text-emerald-500' : 'text-red-500'}">
        {trend >= 0 ? '+' : ''}{trend}%
      </span>
    {/if}
  </div>
</div>
