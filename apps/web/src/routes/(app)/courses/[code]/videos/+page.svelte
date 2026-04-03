<script lang="ts">
  import { page } from "$app/state";
  import { getCourseVideos } from "../../courses.remote";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import Video from "@lucide/svelte/icons/video";
  import Youtube from "@lucide/svelte/icons/youtube";
  import Play from "@lucide/svelte/icons/play";
  import Clock from "@lucide/svelte/icons/clock";
  import Eye from "@lucide/svelte/icons/eye";
  import ExternalLink from "@lucide/svelte/icons/external-link";

  const courseCode = page.params.code;
  const { youtube, uploaded } = await getCourseVideos({ courseCode });

  type Filter = "all" | "youtube" | "uploaded" | "ai";
  let filter = $state<Filter>("all");
  let activeVideo = $state<any>(null);

  function formatDuration(secs: number) {
    if (!secs) return "";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function formatViews(n: number) {
    if (!n) return "";
    return n >= 1000 ? `${(n / 1000).toFixed(1)}K views` : `${n} views`;
  }

  const allVideos = $derived([
    ...youtube.map((v: any) => ({ ...v, source: "youtube" })),
    ...uploaded.map((v: any) => ({ ...v, source: uploaded.find((u: any) => u.aiGenerated) ? "ai" : "uploaded" })),
  ]);

  const filtered = $derived(
    filter === "all" ? allVideos
    : filter === "youtube" ? allVideos.filter((v) => v.source === "youtube")
    : filter === "uploaded" ? allVideos.filter((v) => v.source === "uploaded")
    : allVideos.filter((v) => v.source === "ai"),
  );
</script>

<div class="py-4 space-y-4">
  <!-- Filter tabs -->
  <div class="flex gap-1 px-4 overflow-x-auto scrollbar-hide">
    {#each [["all", "All"], ["youtube", "YouTube"], ["uploaded", "Uploaded"], ["ai", "AI Generated"]] as [val, label]}
      <button
        class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
               {filter === val ? 'bg-brand-500 text-white' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}"
        onclick={() => (filter = val as Filter)}
      >{label}</button>
    {/each}
  </div>

  <!-- Inline player -->
  {#if activeVideo}
    <div class="mx-4 rounded-2xl overflow-hidden bg-black aspect-video relative">
      {#if activeVideo.source === "youtube"}
        <iframe
          class="w-full h-full"
          src="https://www.youtube.com/embed/{activeVideo.videoId}?autoplay=1"
          title={activeVideo.title}
          allow="autoplay; fullscreen"
          frameborder="0"
        ></iframe>
      {:else}
        <video
          class="w-full h-full object-contain"
          controls
          autoplay
          src={activeVideo.content?.url ?? activeVideo.url}
        >
          <track kind="captions" />
        </video>
      {/if}
      <button
        class="absolute top-2 right-2 size-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 text-xs"
        onclick={() => (activeVideo = null)}
      >✕</button>
    </div>

    <!-- Topic timestamps sidebar -->
    {#if activeVideo.topicTimestamps?.length}
      <div class="mx-4 rounded-2xl border border-border bg-card p-3">
        <p class="text-xs font-bold text-foreground mb-2">📍 Topics</p>
        <div class="space-y-1 max-h-36 overflow-y-auto">
          {#each activeVideo.topicTimestamps as ts}
            <button
              class="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/40 transition-colors"
              onclick={() => {
                // Post message to iframe if YouTube, otherwise seek video
              }}
            >
              <span class="text-[10px] font-mono text-brand-500 shrink-0">{Math.floor(ts.startSecs / 60)}:{String(ts.startSecs % 60).padStart(2, '0')}</span>
              <span class="text-xs text-foreground truncate">{ts.topic}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {/if}

  <!-- Video grid -->
  <svelte:boundary>
    {#if filtered.length === 0}
      <div class="flex flex-col items-center gap-3 py-16 text-center px-6">
        <Video class="size-10 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">
          {filter === "youtube" ? "No YouTube videos cached yet." : "No videos available."}
        </p>
        {#if filter === "youtube"}
          <p class="text-xs text-muted-foreground">The YouTube cron runs daily at 2am UTC.</p>
        {/if}
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4">
        {#each filtered as video (video.id ?? video.videoId)}
          <button
            class="text-left rounded-2xl overflow-hidden border border-border bg-card hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg transition-all group"
            onclick={() => (activeVideo = video)}
          >
            <!-- Thumbnail -->
            <div class="relative aspect-video bg-muted overflow-hidden">
              {#if video.thumbnailUrl}
                <img src={video.thumbnailUrl} alt={video.title ?? "Video"} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              {:else if video.content?.thumbnailUrl}
                <img src={video.content.thumbnailUrl} alt="Video" class="w-full h-full object-cover" />
              {:else}
                <div class="w-full h-full flex items-center justify-center bg-muted">
                  <Video class="size-8 text-muted-foreground/40" />
                </div>
              {/if}
              <!-- Play button overlay -->
              <div class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="size-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play class="size-5 text-black fill-black ml-1" />
                </div>
              </div>
              <!-- Duration badge -->
              {#if video.durationSecs || video.content?.durationSecs}
                <span class="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                  {formatDuration(video.durationSecs ?? video.content?.durationSecs)}
                </span>
              {/if}
              <!-- Source badge -->
              <span class="absolute top-2 left-2">
                {#if video.source === "youtube"}
                  <Badge class="bg-red-600 text-white text-[10px] h-4 px-1.5 border-0">YT</Badge>
                {:else if video.source === "ai"}
                  <Badge class="bg-brand-600 text-white text-[10px] h-4 px-1.5 border-0">AI</Badge>
                {:else}
                  <Badge variant="secondary" class="text-[10px] h-4 px-1.5">Upload</Badge>
                {/if}
              </span>
            </div>
            <!-- Info -->
            <div class="p-3">
              <p class="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                {video.title ?? video.content?.title ?? "Untitled"}
              </p>
              {#if video.channelTitle}
                <p class="text-[11px] text-muted-foreground mt-1">{video.channelTitle}</p>
              {/if}
              <div class="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                {#if video.viewCount}
                  <span class="flex items-center gap-1"><Eye class="size-3" />{formatViews(video.viewCount)}</span>
                {/if}
                {#if video.source === "youtube" && video.videoId}
                  <a
                    href="https://youtube.com/watch?v={video.videoId}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-1 ml-auto hover:text-brand-500 transition-colors"
                    onclick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink class="size-3" /> YouTube
                  </a>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}

    {#snippet pending()}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4">
        {#each Array(6) as _}
          <div class="rounded-2xl overflow-hidden border border-border">
            <Skeleton class="aspect-video w-full" />
            <div class="p-3 space-y-2">
              <Skeleton class="h-4 w-full rounded" />
              <Skeleton class="h-3 w-24 rounded" />
            </div>
          </div>
        {/each}
      </div>
    {/snippet}
  </svelte:boundary>
</div>
