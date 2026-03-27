<script lang="ts">
  import * as AspectRatio from "$lib/components/ui/aspect-ratio";
  import Play from "@lucide/svelte/icons/play";
  import { fade } from "svelte/transition";

  let {
    videoId,
    title,
    autoload = false,
  }: {
    videoId: string;
    title?: string;
    autoload?: boolean;
  } = $props();

  let loaded = $state(autoload);
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
</script>

<div class="rounded-xl overflow-hidden bg-black shadow-lg">
  <AspectRatio.Root ratio={16 / 9}>
    {#if loaded}
      <iframe
        {src}
        {title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        class="w-full h-full border-0"
        loading="lazy"
      ></iframe>
    {:else}
      <button
        type="button"
        class="w-full h-full relative cursor-pointer group"
        onclick={() => (loaded = true)}
        aria-label="Play video: {title ?? videoId}"
      >
        <img
          src={thumb}
          alt={title ?? `YouTube video ${videoId}`}
          class="w-full h-full object-cover"
        />
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
        <!-- Play button -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="size-16 rounded-full bg-red-600 group-hover:bg-red-500 group-hover:scale-110 transition-all duration-200 shadow-xl flex items-center justify-center">
            <Play class="size-7 text-white ml-1" />
          </div>
        </div>
        {#if title}
          <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <p class="text-sm font-semibold text-white line-clamp-1">{title}</p>
          </div>
        {/if}
      </button>
    {/if}
  </AspectRatio.Root>
</div>
