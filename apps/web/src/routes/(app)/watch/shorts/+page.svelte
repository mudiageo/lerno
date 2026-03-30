<script lang="ts">
  import { getShorts } from "../watch.remote";
  import Heart from "@lucide/svelte/icons/heart";
  import MessageCircle from "@lucide/svelte/icons/message-circle";
  import Bookmark from "@lucide/svelte/icons/bookmark";
  import Share2 from "@lucide/svelte/icons/share-2";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import * as Avatar from "@lerno/ui/components/ui/avatar";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Button } from "@lerno/ui/components/ui/button";
  import VideoIcon from "@lucide/svelte/icons/video";
  import { onMount } from "svelte";

  // Top-level await for shorts
  const shorts = await getShorts({});

  let videoElements: HTMLVideoElement[] = $state([]);
  let likedMap = $state<Record<string, boolean>>({});
  let savedMap = $state<Record<string, boolean>>({});

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    videoElements.forEach((vid) => {
      if (vid) observer.observe(vid);
    });

    return () => observer.disconnect();
  });

  function togglePlay(vid: HTMLVideoElement | undefined) {
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }
</script>

<svelte:head>
  <title>Shorts — Lerno Watch</title>
  <meta name="description" content="Short educational videos for quick learning." />
</svelte:head>

<div class="fixed inset-0 bg-black z-50 flex flex-col">
  <!-- Top Nav -->
  <div class="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between pointer-events-none">
    <Button href="/watch" variant="ghost" size="icon" class="text-white hover:bg-white/20 pointer-events-auto rounded-full">
      <ChevronLeft class="size-6" />
    </Button>
    <h1 class="text-white font-bold text-lg drop-shadow">Shorts</h1>
    <div class="w-10"></div>
  </div>

  {#if shorts.length > 0}
    <!-- Scroll Snap Container -->
    <div class="flex-1 overflow-y-scroll snap-y snap-mandatory h-full w-full scrollbar-none pb-16 lg:pb-0 relative">
      {#each shorts as current, i (current.id)}
        <div class="snap-start snap-always relative w-full h-full lg:max-w-[420px] lg:mx-auto max-h-screen">
          
          <button 
            type="button" 
            class="absolute inset-0 w-full h-full focus:outline-none"
            onclick={(e) => {
              // Only toggle if clicked directly on the video container, not buttons
              if (e.target === e.currentTarget) togglePlay(videoElements[i]);
            }}
          >
            <!-- Native Video Player -->
            <!-- svelte-ignore a11y_media_has_caption -->
            <video
              src={current.content.videoUrl}
              poster={current.content.thumbnailUrl}
              loop
              playsinline
              class="w-full h-full object-cover"
              bind:this={videoElements[i]}
            ></video>
          </button>

          <!-- Right side action buttons -->
          <div class="absolute right-3 bottom-24 lg:bottom-12 flex flex-col items-center gap-5 z-10">
            <Avatar.Root class="size-12 ring-2 ring-white/80">
              <Avatar.Image src={current.authorImage} alt={current.authorName} />
              <Avatar.Fallback class="bg-brand-600 text-white font-bold">{(current.authorName ?? "U")[0]}</Avatar.Fallback>
            </Avatar.Root>

            <button
              class="flex flex-col items-center gap-0.5 group"
              onclick={() => { likedMap[current.id] = !likedMap[current.id]; }}
            >
              <div class="size-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center transition-all group-active:scale-95 {likedMap[current.id] ? 'text-rose-400' : 'text-white'}">
                <Heart class="size-6" style={likedMap[current.id] ? "fill: currentColor;" : ""} />
              </div>
              <span class="text-white text-xs font-bold drop-shadow">
                {((current.likeCount + (likedMap[current.id] ? 1 : 0)) / 1000).toFixed(1)}K
              </span>
            </button>

            <button class="flex flex-col items-center gap-0.5 group">
              <div class="size-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white group-active:scale-95">
                <MessageCircle class="size-6" />
              </div>
              <span class="text-white text-xs font-bold drop-shadow">Reply</span>
            </button>

            <button
              class="flex flex-col items-center gap-0.5 group"
              onclick={() => { savedMap[current.id] = !savedMap[current.id]; }}
            >
              <div class="size-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center transition-all group-active:scale-95 {savedMap[current.id] ? 'text-brand-400' : 'text-white'}">
                <Bookmark class="size-6" style={savedMap[current.id] ? "fill: currentColor;" : ""} />
              </div>
              <span class="text-white text-xs font-bold drop-shadow">Save</span>
            </button>

            <button class="flex flex-col items-center gap-0.5 group">
              <div class="size-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white group-active:scale-95">
                <Share2 class="size-6" />
              </div>
              <span class="text-white text-xs font-bold drop-shadow">Share</span>
            </button>
          </div>

          <!-- Bottom info overlay -->
          <div class="absolute bottom-0 left-0 right-0 p-4 pb-20 lg:pb-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-white font-bold text-sm drop-shadow">{current.authorName ?? `@${current.authorUsername}`}</span>
              {#if current.courseCode}
                <Badge class="text-[10px] bg-brand-500/80 text-white border-0">{current.courseCode}</Badge>
              {/if}
            </div>
            <p class="text-white text-sm font-medium leading-snug drop-shadow line-clamp-2">{current.content.title ?? current.content.body}</p>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="flex-1 flex items-center justify-center w-full h-full">
      <div class="flex flex-col items-center gap-4 text-center p-8">
        <div class="size-16 rounded-full bg-white/10 flex items-center justify-center">
          <VideoIcon class="size-8 text-white/40" />
        </div>
        <p class="text-white font-medium">No shorts found.</p>
        <Button href="/watch" variant="outline" class="text-white border-white/20 hover:bg-white/10">Go Back</Button>
      </div>
    </div>
  {/if}
</div>
