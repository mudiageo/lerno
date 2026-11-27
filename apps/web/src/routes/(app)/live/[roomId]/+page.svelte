<script lang="ts">
	import { page } from '$app/state';
	import { joinLiveStream, getStreamDetails } from '../live.remote';
	import { browser } from '$app/env';
	import { Skeleton } from '@lerno/ui/components/ui/skeleton';
	import { Button } from '@lerno/ui/components/ui/button';
	import Video from '@lucide/svelte/icons/video';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Users from '@lucide/svelte/icons/users';

	const streamId = $derived(page.params.roomId); // using streamId from URL
</script>

<svelte:head>
	<title>Watch Live — Lerno</title>
</svelte:head>

<div class="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 p-0 md:flex-row md:p-4">
	<div class="flex min-w-0 flex-1 flex-col gap-4">
		<svelte:boundary>
			{@const streamReq = await getStreamDetails({ streamId })}
			{@const joinReq = await joinLiveStream({ streamId })}

			<div
				class="relative flex aspect-video flex-col items-center justify-center overflow-hidden border border-border/40 bg-black md:rounded-2xl"
			>
				{#if browser}
					<!-- 
            LiveKit Viewer Implementation 
            <Room serverUrl={joinReq.url} token={joinReq.token} connect={true} />
               <VideoConference />
            </Room>
          -->
					<Video class="size-16 animate-pulse text-white opacity-30" />
					<p class="mt-4 text-white/50">Subscribed to LiveKit Room <code>{joinReq.roomId}</code></p>
					<div
						class="absolute top-4 left-4 animate-pulse rounded bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-lg"
					>
						LIVE
					</div>
				{/if}
			</div>

			<div class="px-4 py-2 md:p-0">
				<h1 class="text-xl font-bold tracking-tight text-foreground md:text-2xl">
					{streamReq.title}
				</h1>
				{#if streamReq.description}
					<p class="mt-1 text-sm text-muted-foreground">{streamReq.description}</p>
				{/if}
			</div>

			{#snippet pending()}
				<div class="aspect-video">
					<Skeleton class="h-full w-full md:rounded-2xl" />
				</div>
				<div class="mt-4 space-y-2 px-4 md:p-0">
					<Skeleton class="h-8 w-3/4" />
					<Skeleton class="h-4 w-1/2" />
				</div>
			{/snippet}

			{#snippet failed(error, reset)}
				<div
					class="flex aspect-video flex-col items-center justify-center border border-border bg-zinc-900 p-6 text-center md:rounded-2xl"
				>
					<p class="mb-2 text-destructive">{error.message}</p>
					<Button variant="outline" onclick={reset}>Retry Connection</Button>
				</div>
			{/snippet}
		</svelte:boundary>
	</div>

	<!-- Live Chat Sidebar Stub -->
	<div
		class="flex h-[600px] w-full shrink-0 flex-col border-x border-border/60 bg-card md:h-[calc(100vh-2rem)] md:w-80 md:rounded-2xl md:border lg:w-96"
	>
		<div class="flex items-center justify-between border-b border-border/60 p-4">
			<h2 class="font-bold">Live Chat</h2>
			<div
				class="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
			>
				<Users class="size-3.5" /> DataChannels (Soon)
			</div>
		</div>
		<div class="flex flex-1 flex-col items-center justify-center p-4 text-center">
			<p class="text-sm text-muted-foreground">Connected to LiveKit DataChannels.</p>
			<p class="mt-2 text-xs text-muted-foreground/50">Messages will appear here...</p>
		</div>
	</div>
</div>
