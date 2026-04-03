<script lang="ts">
  import { page } from "$app/state";
  import { InfiniteFeed } from "@lerno/ui/components/feed";
  import { Button } from "@lerno/ui/components/ui/button";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Layers from "@lucide/svelte/icons/layers";
  import Brain from "@lucide/svelte/icons/brain";
  import Video from "@lucide/svelte/icons/video";
  import Link2 from "@lucide/svelte/icons/link-2";
  import MessageSquare from "@lucide/svelte/icons/message-square";

  const courseCode = page.params.code;

  type FeedFilter = "all" | "quiz" | "flashcard" | "video" | "link" | "text";
  let filter = $state<FeedFilter>("all");

  const filterIcons: Record<FeedFilter, any> = {
    all: Layers,
    quiz: Brain,
    flashcard: BookOpen,
    video: Video,
    link: Link2,
    text: MessageSquare,
  };
</script>

<div class="space-y-0">
  <!-- Filter chips -->
  <div
    class="sticky top-[var(--course-header-h,100px)] z-20 bg-background/90 backdrop-blur-sm border-b border-border/60 px-4 py-2.5 flex gap-1.5 overflow-x-auto scrollbar-hide"
  >
    {#each Object.entries(filterIcons) as [val, Icon]}
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0
               {filter === val
          ? 'bg-brand-500 text-white shadow-sm'
          : 'bg-muted/60 text-muted-foreground hover:bg-muted'}"
        onclick={() => (filter = val as FeedFilter)}
      >
        <svelte:component this={Icon} class="size-3" />
        {val.charAt(0).toUpperCase() + val.slice(1)}
      </button>
    {/each}
  </div>

  <!-- Feed -->
  <InfiniteFeed {courseCode} postType={filter === "all" ? undefined : filter} />
</div>
