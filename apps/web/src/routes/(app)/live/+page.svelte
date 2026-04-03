<script lang="ts">
  import { getLiveStreams } from "./live.remote";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import * as Card from "@lerno/ui/components/ui/card";
  import Video from "@lucide/svelte/icons/video";
  import Radio from "@lucide/svelte/icons/radio";
  import Users from "@lucide/svelte/icons/users";
  import Plus from "@lucide/svelte/icons/plus";
  import { goto } from "$app/navigation";

  // Using a query to fetch the active streams
</script>

<svelte:head>
  <title>Live — Lerno</title>
</svelte:head>

<div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen pb-safe pb-20">
  <!-- Header -->
  <div class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between gap-3">
    <h1 class="text-lg font-bold tracking-tight flex items-center gap-2">
      <Radio class="size-5 text-red-500 animate-pulse" />
      Live Streams
    </h1>
    <Button size="sm" class="h-8 gap-1.5 text-xs" onclick={() => goto("/live/studio")}>
      <Video class="size-3.5" />
      Go Live
    </Button>
  </div>

  <svelte:boundary>
    {@const streamsReq = await getLiveStreams({})}
    
    {#if streamsReq.activeStreams.length === 0}
      <!-- Empty state -->
      <div class="flex flex-col items-center gap-5 py-24 px-6 text-center">
        <div class="size-20 rounded-full bg-red-500/10 flex items-center justify-center">
          <Radio class="size-10 text-red-500 opacity-50" />
        </div>
        <div>
           <h2 class="text-xl font-bold text-foreground mb-2">No active streams</h2>
           <p class="text-sm text-muted-foreground max-w-sm">
             Waiting for a tutor or peer to go live. Want to start a study session yourself?
           </p>
        </div>
        <Button onclick={() => goto("/live/studio")}>Start Broadcasting</Button>
      </div>
    {:else}
      <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {#each streamsReq.activeStreams as stream (stream.id)}
          <a
            href="/live/{stream.id}"
            class="group block rounded-2xl border border-border overflow-hidden hover:border-brand-400/60 transition-all bg-card hover:shadow-lg focus:outline-none"
          >
            <!-- Thumbnail area -->
            <div class="aspect-video bg-muted relative overflow-hidden">
              {#if stream.thumbnailUrl}
                 <img src={stream.thumbnailUrl} alt={stream.title} class="w-full h-full object-cover" />
              {:else}
                 <div class="w-full h-full flex items-center justify-center bg-zinc-900">
                    <Video class="size-8 text-white/20" />
                 </div>
              {/if}
              
              <!-- Badges -->
              <div class="absolute top-2 left-2 flex gap-1.5">
                <Badge variant="destructive" class="h-5 px-1.5 text-[10px] font-bold tracking-wide uppercase gap-1 animate-pulse">
                  <Radio class="size-2.5" /> Live
                </Badge>
                <div class="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 h-5 px-1.5 rounded-md">
                  <Users class="size-2.5" /> {stream.viewerCount ?? 0}
                </div>
              </div>

              {#if stream.courseCode}
                <div class="absolute bottom-2 right-2">
                  <Badge variant="secondary" class="bg-black/60 text-white border-white/10 backdrop-blur text-[10px] h-5">
                    {stream.courseCode}
                  </Badge>
                </div>
              {/if}
            </div>

            <!-- Meta details -->
            <div class="p-3">
              <div class="flex gap-2">
                <img src={stream.hostImage} alt={stream.hostName} class="size-8 rounded-full bg-muted shrink-0 border border-border" />
                <div class="min-w-0">
                  <h3 class="text-sm font-bold text-foreground leading-tight truncate group-hover:text-brand-500 transition-colors">
                    {stream.title}
                  </h3>
                  <p class="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {stream.hostName}
                  </p>
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}

    {#snippet pending()}
      <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {#each Array(4) as _}
           <div class="rounded-2xl border border-border overflow-hidden">
             <Skeleton class="aspect-video w-full rounded-none" />
             <div class="p-3 flex gap-2">
               <Skeleton class="size-8 rounded-full" />
               <div class="flex-1 space-y-1">
                 <Skeleton class="h-4 w-3/4" />
                 <Skeleton class="h-3 w-1/2" />
               </div>
             </div>
           </div>
        {/each}
      </div>
    {/snippet}

    {#snippet failed(error, reset)}
       <div class="py-20 text-center">
         <p class="text-sm text-destructive">{error.message ?? 'Failed to load streams'}</p>
         <Button variant="outline" size="sm" class="mt-4" onclick={reset}>Try Again</Button>
       </div>
    {/snippet}
  </svelte:boundary>
</div>
