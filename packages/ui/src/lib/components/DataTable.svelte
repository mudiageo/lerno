<script lang="ts" generics="T">
  export let data: T[];
  export let columns: Array<{
    key: keyof T | string;
    title: string;
    render?: (row: T) => import('svelte').Snippet;
  }>;
</script>

<div class="w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
  <table class="w-full text-sm text-left text-zinc-600 dark:text-zinc-400">
    <thead class="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50 dark:text-zinc-400">
      <tr>
        {#each columns as col}
          <th scope="col" class="px-6 py-4 font-medium">{col.title}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each data as row, i}
        <tr class="bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
          {#each columns as col}
            <td class="px-6 py-4">
              {#if col.render}
                {@render col.render(row)}
              {:else}
                {row[col.key]}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
