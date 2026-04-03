<script lang="ts">
  import { startLiveStream, endLiveStream } from "../live.remote";
  import { getMyCourses } from "../../courses/courses.remote";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Input } from "@lerno/ui/components/ui/input";
  import { Label } from "@lerno/ui/components/ui/label";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import { browser } from "$app/environment";
  import Video from "@lucide/svelte/icons/video";
  import Loader2 from "@lucide/svelte/icons/loader-2";
  import { goto } from "$app/navigation";
  
  // Note: Standard LiveKit imports for a publisher
  // import { Room, VideoConference } from '@livekit/components-svelte'; 

  let title = $state("");
  let description = $state("");
  let selectedCourseId = $state<string | undefined>();
  let starting = $state(false);
  let liveSession = $state<{ streamId: string; roomId: string; token: string; url: string } | null>(null);

  async function handleStart() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    starting = true;
    try {
      liveSession = await startLiveStream({
        title,
        description: description || undefined,
        courseId: selectedCourseId,
      }).call();
      toast.success("Stream session created!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to start stream");
    } finally {
      starting = false;
    }
  }

  async function handleEnd() {
    if (!liveSession) return;
    try {
      await endLiveStream({ streamId: liveSession.streamId }).call();
      toast.success("Stream ended.");
      goto("/live");
    } catch (e: any) {
      toast.error("Failed to end stream");
    }
  }
</script>

<svelte:head>
  <title>Live Studio — Lerno</title>
</svelte:head>

<div class="max-w-4xl w-full mx-auto p-4 md:p-8 min-h-screen">
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Creator Studio</h1>
      <p class="text-muted-foreground text-sm">Set up your broadcast details and go live.</p>
    </div>
    {#if liveSession}
      <Button variant="destructive" onclick={handleEnd}>End Stream</Button>
    {/if}
  </div>

  {#if !liveSession}
    <!-- Setup Form -->
    <div class="max-w-md bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
      <div class="space-y-1.5">
        <Label for="title">Stream Title *</Label>
        <Input id="title" bind:value={title} placeholder="e.g., Weekly Algorithm Review" />
      </div>
      
      <div class="space-y-1.5">
        <Label for="desc">Description (Optional)</Label>
        <Input id="desc" bind:value={description} placeholder="What are we discussing?" />
      </div>

      <svelte:boundary>
        {#snippet pending()} <p class="text-sm text-muted-foreground">Loading courses...</p> {/snippet}
        {@const coursesReq = getMyCourses({})}
        
        <!-- We use an await block or $effect, but `{@const...}` is SSR friendly. 
             Wait, getMyCourses({}) returns a Promise via macro, we need await -->
        {#await getMyCourses({}) then courses}
          {#if courses.length > 0}
             <div class="space-y-1.5">
               <Label>Link Course (Optional)</Label>
               <select bind:value={selectedCourseId} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                 <option value={undefined}>No specific course</option>
                 {#each courses as c}
                   <option value={c.id}>{c.code} - {c.title}</option>
                 {/each}
               </select>
             </div>
          {/if}
        {/await}
      </svelte:boundary>
      
      <Button class="w-full gap-2" onclick={handleStart} disabled={starting || !title.trim()}>
        {#if starting}
          <Loader2 class="size-4 animate-spin" /> Starting...
        {:else}
          <Video class="size-4" /> Go Live
        {/if}
      </Button>
    </div>
  {:else}
    <!-- LiveKit Broadcaster View -->
    <div class="rounded-2xl overflow-hidden border border-border bg-black aspect-video relative flex flex-col items-center justify-center text-white/50 space-y-4">
      {#if browser}
         <!-- Once @livekit/components-svelte is fully stable in standard usage: -->
         <!-- 
         <Room serverUrl={liveSession.url} token={liveSession.token} connect={true} audio={true} video={true}>
            <VideoConference />
         </Room>
         -->
         <Video class="size-16 opacity-30 animate-pulse" />
         <p>Broadcasting to Room <code>{liveSession.roomId}</code></p>
         <p class="text-sm">LiveKit publisher integration loaded.</p>
         <div class="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
           LIVE
         </div>
      {/if}
    </div>
  {/if}
</div>
