<script lang="ts">
  import { getVideos } from "./watch.remote";
  import * as Card from "@lerno/ui/components/ui/card";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Button } from "@lerno/ui/components/ui/button";
  import Play from "@lucide/svelte/icons/play";
  import Clock from "@lucide/svelte/icons/clock";
  import Eye from "@lucide/svelte/icons/eye";
  import Search from "@lucide/svelte/icons/search";
  import Tv from "@lucide/svelte/icons/tv";
  import Zap from "@lucide/svelte/icons/zap";

  // Top-level await for videos
  const videos = await getVideos({});
</script>

<svelte:head>
  <title>Watch — Lerno</title>
  <meta
    name="description"
    content="Educational videos curated for your courses."
  />
</svelte:head>

<div
  class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen pb-20 lg:pb-0"
>
  <!-- Header -->
  <div
    class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between"
  >
    <h1 class="text-lg font-bold tracking-tight flex items-center gap-2">
      <Tv class="size-5 text-brand-500" />
      Watch
    </h1>
    <div class="flex items-center gap-2">
      <Button href="/watch/upload" variant="default" size="sm" class="font-bold bg-brand-500 hover:bg-brand-600">
        Upload
      </Button>
      <Button variant="ghost" size="icon" class="size-9"
        ><Search class="size-4" /></Button
      >
    </div>
  </div>

  <svelte:boundary>
    <div class="p-4 space-y-6">
      <!-- Shorts Hero Section -->
      <a href="/watch/shorts" class="block group">
        <Card.Root
          class="overflow-hidden border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent hover:border-brand-500/40 transition-all"
        >
          <Card.Content class="p-4 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div
                class="size-12 rounded-full bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform"
              >
                <Zap class="size-6 fill-current" />
              </div>
              <div>
                <h3 class="text-base font-bold text-foreground">Shorts</h3>
                <p class="text-xs text-muted-foreground">
                  Quick educational bursts in 60s
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              class="font-bold group-hover:translate-x-1 transition-transform"
              >Explore</Button
            >
          </Card.Content>
        </Card.Root>
      </a>

      <!-- Categories -->
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Button
          variant="secondary"
          size="sm"
          class="rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 border-0"
          >All</Button
        >
        <Button
          variant="ghost"
          size="sm"
          class="rounded-full text-muted-foreground hover:text-foreground"
          >Mathematics</Button
        >
        <Button
          variant="ghost"
          size="sm"
          class="rounded-full text-muted-foreground hover:text-foreground"
          >Biology</Button
        >
        <Button
          variant="ghost"
          size="sm"
          class="rounded-full text-muted-foreground hover:text-foreground"
          >Physics</Button
        >
        <Button
          variant="ghost"
          size="sm"
          class="rounded-full text-muted-foreground hover:text-foreground"
          >Chemistry</Button
        >
      </div>

      <!-- Video Grid -->
      <div class="grid grid-cols-1 gap-6">
        {#each videos as video (video.id)}
          <div class="space-y-3 group">
            <div
              class="relative aspect-video rounded-2xl overflow-hidden bg-black group-hover:shadow-xl group-hover:shadow-brand-500/10 transition-all border border-border/50"
            >
              {#if video.content.videoUrl}
                <video
                  src={video.content.videoUrl}
                  poster={video.content.thumbnailUrl}
                  controls
                  preload="metadata"
                  class="w-full h-full object-cover"
                >
                  <track kind="captions" />
                </video>
              {:else}
                <div class="flex items-center justify-center w-full h-full text-muted-foreground bg-muted">
                   <Tv class="size-8 opacity-20" />
                </div>
              {/if}
              <div
                class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white flex items-center gap-1 pointer-events-none"
              >
                <Clock class="size-2.5" />
                {Math.floor((video.content.duration ?? 0) / 60)}:{(video.content.duration ?? 0) % 60 < 10 ? '0' : ''}{(video.content.duration ?? 0) % 60 || '00'}
              </div>
            </div>

            <div class="flex gap-3 px-1">
              <div
                class="size-10 rounded-full bg-muted shrink-0 mt-0.5 overflow-hidden ring-1 ring-border"
              >
                <img
                  src={video.authorImage}
                  alt={video.authorName}
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex-1 min-w-0">
                <h4
                  class="text-sm font-bold text-foreground leading-tight line-clamp-2 transition-colors"
                >
                  {video.content.title ?? video.content.body}
                </h4>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                  <span class="text-xs text-muted-foreground font-medium truncate"
                    >{video.authorName}</span
                  >
                  <span class="size-1 rounded-full bg-muted-foreground/30"></span>
                  <div
                    class="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    <Eye class="size-3" />
                    {((video.viewCount ?? 1200) / 1000).toFixed(1)}K
                  </div>
                  {#if video.courseCode}
                    <Badge
                      variant="secondary"
                      class="text-[10px] h-4.5 bg-brand-50 text-brand-700 border-0"
                      >{video.courseCode}</Badge
                    >
                  {/if}
                </div>
              </div>
              <Button variant="ghost" size="icon" class="size-8 -mt-1"
                ><Play
                  class="size-4 opacity-40 group-hover:opacity-100 transition-opacity"
                /></Button
              >
            </div>
          </div>
        {:else}
          <div class="flex flex-col items-center gap-4 py-20 text-center">
            <div
              class="size-16 rounded-full bg-muted flex items-center justify-center"
            >
              <Tv class="size-8 text-muted-foreground/30" />
            </div>
            <p class="text-sm text-muted-foreground">
              No videos available right now.
            </p>
          </div>
        {/each}
      </div>
    </div>

    {#snippet pending()}
      <div class="p-4 space-y-6">
        <Skeleton class="h-20 w-full rounded-xl" />
        <div class="grid grid-cols-1 gap-6">
          {#each Array(3) as _}
            <div class="space-y-3">
              <Skeleton class="aspect-video w-full rounded-2xl" />
              <div class="flex gap-3">
                <Skeleton class="size-10 rounded-full shrink-0" />
                <div class="flex-1 space-y-2">
                  <Skeleton class="h-4 w-3/4 rounded" />
                  <Skeleton class="h-3 w-1/2 rounded" />
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/snippet}

    {#snippet failed(error, reset)}
      <div class="flex flex-col items-center gap-4 py-20 text-center px-4">
        <Tv class="size-12 text-muted-foreground/20" />
        <p class="text-sm text-muted-foreground">Could not load videos.</p>
        <Button variant="outline" size="sm" onclick={reset}>Retry</Button>
      </div>
    {/snippet}
  </svelte:boundary>
</div>
