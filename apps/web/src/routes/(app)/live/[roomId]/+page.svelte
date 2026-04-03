<script lang="ts">
  import { page } from "$app/state";
  import { joinLiveStream, getStreamDetails } from "../live.remote";
  import { browser } from "$app/environment";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import { Button } from "@lerno/ui/components/ui/button";
  import Video from "@lucide/svelte/icons/video";
  import Loader2 from "@lucide/svelte/icons/loader-2";
  import Users from "@lucide/svelte/icons/users";
  
  const streamId = $derived(page.params.roomId); // using streamId from URL
</script>

<svelte:head>
  <title>Watch Live — Lerno</title>
</svelte:head>

<div class="max-w-[1600px] w-full mx-auto p-0 md:p-4 min-h-screen flex flex-col md:flex-row gap-4">
  <div class="flex-1 min-w-0 flex flex-col gap-4">
    <svelte:boundary>
      {@const streamReq = await getStreamDetails({ streamId })}
      {@const joinReq = await joinLiveStream({ streamId })}

      <div class="aspect-video bg-black md:rounded-2xl overflow-hidden relative flex flex-col items-center justify-center border border-border/40">
        {#if browser}
          <!-- 
            LiveKit Viewer Implementation 
            <Room serverUrl={joinReq.url} token={joinReq.token} connect={true} />
               <VideoConference />
            </Room>
          -->
          <Video class="size-16 opacity-30 text-white animate-pulse" />
          <p class="text-white/50 mt-4">Subscribed to LiveKit Room <code>{joinReq.roomId}</code></p>
          <div class="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse shadow-lg">
            LIVE
          </div>
        {/if}
      </div>

      <div class="px-4 py-2 md:p-0">
        <h1 class="text-xl md:text-2xl font-bold tracking-tight text-foreground">{streamReq.title}</h1>
        {#if streamReq.description}
          <p class="text-muted-foreground mt-1 text-sm">{streamReq.description}</p>
        {/if}
      </div>

      {#snippet pending()}
         <div class="aspect-video">
           <Skeleton class="w-full h-full md:rounded-2xl" />
         </div>
         <div class="space-y-2 mt-4 px-4 md:p-0">
           <Skeleton class="h-8 w-3/4" />
           <Skeleton class="h-4 w-1/2" />
         </div>
      {/snippet}
      
      {#snippet failed(error, reset)}
         <div class="aspect-video bg-zinc-900 md:rounded-2xl flex flex-col items-center justify-center border border-border text-center p-6">
           <p class="text-destructive mb-2">{error.message}</p>
           <Button variant="outline" onclick={reset}>Retry Connection</Button>
         </div>
      {/snippet}
    </svelte:boundary>
  </div>

  <!-- Live Chat Sidebar Stub -->
  <div class="w-full md:w-80 lg:w-96 shrink-0 bg-card border-x md:border border-border/60 md:rounded-2xl flex flex-col h-[600px] md:h-[calc(100vh-2rem)]">
    <div class="p-4 border-b border-border/60 flex items-center justify-between">
      <h2 class="font-bold">Live Chat</h2>
      <div class="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
         <Users class="size-3.5" /> DataChannels (Soon)
      </div>
    </div>
    <div class="flex-1 p-4 flex flex-col items-center justify-center text-center">
       <p class="text-sm text-muted-foreground">Connected to LiveKit DataChannels.</p>
       <p class="text-xs text-muted-foreground/50 mt-2">Messages will appear here...</p>
    </div>
  </div>
</div>
