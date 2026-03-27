<script lang="ts">
  import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<div class="px-4 py-3 border-b border-border">
  <div class="flex gap-3">
    <Skeleton class="size-10 rounded-full shrink-0" />
    <div class="flex-1 space-y-2 pt-0.5">
      <div class="flex items-center gap-2">
        <Skeleton class="h-3 w-24 rounded-full" />
        <Skeleton class="h-3 w-12 rounded-full" />
      </div>
      <Skeleton class="h-3 w-full rounded-full" />
      <Skeleton class="h-3 w-4/5 rounded-full" />
      <Skeleton class="h-3 w-2/3 rounded-full" />
      <div class="flex gap-4 mt-3 pt-1">
        {#each { length: 4 } as _}
          <Skeleton class="h-7 w-12 rounded-lg" />
        {/each}
      </div>
    </div>
  </div>
</div>
