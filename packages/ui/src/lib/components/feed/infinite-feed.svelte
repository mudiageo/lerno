<script lang="ts">
  import PostCard from "./post-card.svelte";
  import PostSkeleton from "./post-skeleton.svelte";
  import { Spinner } from "$lib/components/ui/spinner";

  let {
    posts = [],
    loading = false,
    loadingMore = false,
    hasMore = false,
    currentUserId = undefined,
    onLoadMore,
    onDelete,
  }: {
    posts?: any[];
    loading?: boolean;
    loadingMore?: boolean;
    hasMore?: boolean;
    currentUserId?: string;
    onLoadMore?: () => void;
    onDelete?: (id: string) => void;
  } = $props();

  let sentinel = $state<HTMLDivElement | null>(null);

  $effect(() => {
    if (!sentinel || !onLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  });
</script>

<div class="flex flex-col divide-y-0">
  {#if loading}
    {#each { length: 5 } as _}
      <PostSkeleton />
    {/each}
  {:else if posts.length === 0}
    <div
      class="flex flex-col items-center justify-center py-16 text-center px-8"
    >
      <div
        class="size-16 rounded-full bg-brand-50 dark:bg-brand-950 flex items-center justify-center mb-4"
      >
        <span class="text-3xl">📚</span>
      </div>
      <p class="text-base font-semibold text-foreground mb-1">
        Your feed is empty
      </p>
      <p class="text-sm text-muted-foreground">
        Follow courses and people to see content here, or the AI will start
        generating content shortly.
      </p>
    </div>
  {:else}
    {#each posts as post, i (post.id)}
      <PostCard {post} index={i} {currentUserId} {onDelete} />
    {/each}

    <div bind:this={sentinel} class="h-1"></div>

    {#if loadingMore}
      <div class="flex justify-center py-6">
        <Spinner class="size-5 text-brand-500" />
      </div>
    {/if}

    {#if !hasMore && posts.length > 0}
      <div class="py-8 text-center text-xs text-muted-foreground">
        You're all caught up! 🎉
      </div>
    {/if}
  {/if}
</div>
