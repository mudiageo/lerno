<script lang="ts">
  import { page } from "$app/state";
  import { getFeed } from "../../../feed/feed.remote";
  import { Button } from "@lerno/ui/components/ui/button";
  import Clapperboard from "@lucide/svelte/icons/clapperboard";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import VolumeX from "@lucide/svelte/icons/volume-x";
  import Heart from "@lucide/svelte/icons/heart";
  import MessageCircle from "@lucide/svelte/icons/message-circle";
  import Share2 from "@lucide/svelte/icons/share-2";
  import Brain from "@lucide/svelte/icons/brain";

  const courseCode = page.params.code;

  // Load short posts for this course
  const result = await getFeed({
    cursor: undefined,
    courseCode,
    postType: "short",
  });
  const shorts = result.posts ?? [];

  let currentIndex = $state(0);
  let muted = $state(true);
  const current = $derived(shorts[currentIndex]);

  function next() {
    if (currentIndex < shorts.length - 1) currentIndex++;
  }
  function prev() {
    if (currentIndex > 0) currentIndex--;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") next();
    if (e.key === "ArrowUp") prev();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="relative h-[calc(100vh-120px)] overflow-hidden bg-black flex flex-col"
>
  {#if shorts.length === 0}
    <div
      class="flex flex-col items-center justify-center h-full gap-4 text-center px-6"
    >
      <Clapperboard class="size-12 text-white/30" />
      <div>
        <p class="text-white font-bold text-lg">No shorts yet</p>
        <p class="text-white/50 text-sm mt-1">
          AI video flashcards for {courseCode} will appear here.
        </p>
      </div>
    </div>
  {:else}
    <!-- Short card -->
    <div
      class="relative flex-1 flex flex-col items-center justify-center overflow-hidden"
    >
      <!-- Content -->
      {#key currentIndex}
        <div
          class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
          style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)"
        >
          <!-- AI flashcard text content -->
          {#if current?.content?.front}
            <div class="max-w-sm w-full space-y-6">
              <div
                class="size-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto"
              >
                <Brain class="size-8 text-white" />
              </div>
              <div>
                <p
                  class="text-white/60 text-xs font-medium uppercase tracking-widest mb-3"
                >
                  {current.topicTags?.[0] ?? courseCode}
                </p>
                <p class="text-white text-2xl font-black leading-tight">
                  {current.content.front}
                </p>
              </div>
              <div
                class="p-4 rounded-2xl bg-white/10 border border-white/20 text-left"
              >
                <p class="text-white/50 text-xs font-bold uppercase mb-1">
                  Answer
                </p>
                <p class="text-white/90 text-sm leading-relaxed">
                  {current.content.back}
                </p>
              </div>
            </div>
          {:else if current?.content?.body}
            <p class="text-white text-xl font-bold leading-snug max-w-sm">
              {current.content.body}
            </p>
          {/if}
        </div>
      {/key}

      <!-- Navigation swipe buttons -->
      <button
        class="absolute top-4 left-1/2 -translate-x-1/2 py-4 px-16 opacity-0 hover:opacity-100 focus:opacity-100"
        onclick={prev}
        disabled={currentIndex === 0}
        aria-label="Previous"
      >
        <div class="w-8 h-1 rounded-full bg-white/50 mx-auto"></div>
      </button>
      <button
        class="absolute bottom-4 left-1/2 -translate-x-1/2 py-4 px-16 opacity-0 hover:opacity-100 focus:opacity-100"
        onclick={next}
        disabled={currentIndex === shorts.length - 1}
        aria-label="Next"
      >
        <div class="w-8 h-1 rounded-full bg-white/50 mx-auto"></div>
      </button>
    </div>

    <!-- Right action bar -->
    <div class="absolute right-4 bottom-24 flex flex-col items-center gap-5">
      <button
        class="flex flex-col items-center gap-1"
        onclick={() => (muted = !muted)}
      >
        <div
          class="size-10 rounded-full bg-white/20 flex items-center justify-center"
        >
          {#if muted}
            <VolumeX class="size-5 text-white" />
          {:else}
            <Volume2 class="size-5 text-white" />
          {/if}
        </div>
      </button>
      <button class="flex flex-col items-center gap-1">
        <div
          class="size-10 rounded-full bg-white/20 flex items-center justify-center"
        >
          <Heart class="size-5 text-white" />
        </div>
        <span class="text-white text-[11px] font-medium"
          >{current?.likeCount ?? 0}</span
        >
      </button>
      <button class="flex flex-col items-center gap-1">
        <div
          class="size-10 rounded-full bg-white/20 flex items-center justify-center"
        >
          <MessageCircle class="size-5 text-white" />
        </div>
        <span class="text-white text-[11px] font-medium"
          >{current?.replyCount ?? 0}</span
        >
      </button>
      <button class="flex flex-col items-center gap-1">
        <div
          class="size-10 rounded-full bg-white/20 flex items-center justify-center"
        >
          <Share2 class="size-5 text-white" />
        </div>
      </button>
    </div>

    <!-- Progress dots -->
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
      {#each shorts as _, i}
        <div
          class="rounded-full transition-all {i === currentIndex
            ? 'w-4 h-1.5 bg-white'
            : 'size-1.5 bg-white/40'}"
        ></div>
      {/each}
    </div>

    <!-- Counter -->
    <div
      class="absolute top-4 right-4 bg-black/40 px-2 py-1 rounded-full text-white text-xs font-mono"
    >
      {currentIndex + 1}/{shorts.length}
    </div>
  {/if}
</div>
