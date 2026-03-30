<script lang="ts">
  import { getStreams } from "./live.remote";
  import * as Card from "@lerno/ui/components/ui/card";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import Radio from "@lucide/svelte/icons/radio";
  import Users from "@lucide/svelte/icons/users";
  import Calendar from "@lucide/svelte/icons/calendar";
  import Play from "@lucide/svelte/icons/play";

  // Top-level await for streams
  const streams = await getStreams({});

  const activeStreams = $derived(streams.filter(s => s.status === 'live'));
  const scheduledStreams = $derived(streams.filter(s => s.status === 'scheduled'));
</script>

<svelte:head>
  <title>Live — Lerno</title>
</svelte:head>

<div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen pb-20 lg:pb-0">
  <!-- Header -->
  <div class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
    <h1 class="text-lg font-bold tracking-tight flex items-center gap-2">
      <Radio class="size-5 text-red-500 animate-pulse" />
      Live Now
    </h1>
    <Button variant="default" size="sm" class="bg-red-500 hover:bg-red-600 text-white font-bold h-8">
      Go Live
    </Button>
  </div>

  <svelte:boundary>
    <div class="p-4 space-y-8">
      <!-- Active Streams section -->
      <section class="space-y-4">
        <h2 class="text-sm font-bold text-muted-foreground uppercase tracking-wider">Active Sessions</h2>
        <div class="grid grid-cols-1 gap-4">
          {#each activeStreams as stream (stream.id)}
            <Card.Root class="overflow-hidden border-border/60 hover:border-red-500/30 transition-colors group">
              <div class="relative aspect-video bg-muted cursor-pointer">
                <img src={stream.thumbnailUrl ?? `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80`} alt={stream.title} class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                <Badge class="absolute top-2 left-2 bg-red-500 text-white border-0 font-bold px-2 py-0.5">LIVE</Badge>
                <div class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white flex items-center gap-1">
                  <Users class="size-2.5" />
                  {stream.viewerCount} watching
                </div>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="size-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
                    <Play class="size-6 fill-current" />
                  </div>
                </div>
              </div>
              <Card.Content class="p-3 flex gap-3">
                <div class="size-9 rounded-full bg-muted shrink-0 overflow-hidden ring-1 ring-border mt-0.5">
                  <img src={stream.avatarUrl} alt={stream.hostName} class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-bold text-foreground line-clamp-1 group-hover:text-red-500 transition-colors">{stream.title}</h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-muted-foreground truncate">{stream.hostName}</span>
                    {#if stream.courseCode}
                      <Badge variant="secondary" class="text-[9px] h-4 px-1.5 bg-brand-50 text-brand-700 border-0">{stream.courseCode}</Badge>
                    {/if}
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          {:else}
            <div class="py-12 text-center space-y-3 bg-muted/30 rounded-2xl border border-dashed border-border/60">
              <Radio class="size-8 text-muted-foreground/30 mx-auto" />
              <p class="text-sm text-muted-foreground">No active sessions. Start your own!</p>
            </div>
          {/each}
        </div>
      </section>

      <!-- Scheduled Streams section -->
      {#if scheduledStreams.length > 0}
        <section class="space-y-4 pb-12">
          <h2 class="text-sm font-bold text-muted-foreground uppercase tracking-wider">Upcoming Events</h2>
          <div class="space-y-3">
            {#each scheduledStreams as stream (stream.id)}
              <div class="flex items-center gap-4 p-3 bg-muted/40 rounded-xl border border-border/40 hover:bg-muted/60 transition-colors cursor-pointer group">
                <div class="size-16 rounded-lg bg-muted flex flex-col items-center justify-center shrink-0 border border-border/60 group-hover:border-brand-500/30 transition-colors">
                  <Calendar class="size-5 text-brand-500 mb-0.5" />
                  <span class="text-[10px] font-bold text-foreground uppercase">{new Date(stream.startTime!).toLocaleString('en-US', { month: 'short' })}</span>
                  <span class="text-xs font-black text-brand-600 leading-none">{new Date(stream.startTime!).getDate()}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-bold text-foreground line-clamp-1">{stream.title}</h4>
                  <p class="text-xs text-muted-foreground mt-0.5">{stream.hostName} • {new Date(stream.startTime!).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                </div>
                <Button variant="ghost" size="sm" class="text-xs font-bold text-brand-500">Remind Me</Button>
              </div>
            {/each}
          </div>
        </section>
      {/if}
    </div>

    {#snippet pending()}
      <div class="p-4 space-y-8">
        <div class="space-y-4">
          <Skeleton class="h-4 w-32" />
          <Skeleton class="aspect-video w-full rounded-xl" />
          <div class="flex gap-3">
            <Skeleton class="size-9 rounded-full" />
            <Skeleton class="h-4 flex-1" />
          </div>
        </div>
      </div>
    {/snippet}

    {#snippet failed(error, reset)}
      <div class="py-20 text-center px-4">
        <p class="text-sm text-muted-foreground mb-4">Failed to load streams.</p>
        <Button variant="outline" size="sm" onclick={reset}>Retry</Button>
      </div>
    {/snippet}
  </svelte:boundary>
</div>
