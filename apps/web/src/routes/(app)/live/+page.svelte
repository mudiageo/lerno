<script lang="ts">
	import { getLiveStreams } from './live.remote';
	import { Button } from '@lerno/ui/components/ui/button';
	import { Skeleton } from '@lerno/ui/components/ui/skeleton';
	import { Badge } from '@lerno/ui/components/ui/badge';
	import * as Card from '@lerno/ui/components/ui/card';
	import Video from '@lucide/svelte/icons/video';
	import Radio from '@lucide/svelte/icons/radio';
	import Users from '@lucide/svelte/icons/users';
	import Plus from '@lucide/svelte/icons/plus';
	import { goto } from '$app/navigation';

	// Using a query to fetch the active streams
</script>

<svelte:head>
	<title>Live — Lerno</title>
</svelte:head>

<div
	class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border pb-20 pb-safe"
>
	<!-- Header -->
	<div
		class="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg"
	>
		<h1 class="flex items-center gap-2 text-lg font-bold tracking-tight">
			<Radio class="size-5 animate-pulse text-red-500" />
			Live Streams
		</h1>
		<Button size="sm" class="h-8 gap-1.5 text-xs" onclick={() => goto('/live/studio')}>
			<Video class="size-3.5" />
			Go Live
		</Button>
	</div>

	<svelte:boundary>
		{@const streamsReq = await getLiveStreams({})}

		{#if streamsReq.activeStreams.length === 0}
			<!-- Empty state -->
			<div class="flex flex-col items-center gap-5 px-6 py-24 text-center">
				<div class="flex size-20 items-center justify-center rounded-full bg-red-500/10">
					<Radio class="size-10 text-red-500 opacity-50" />
				</div>
				<div>
					<h2 class="mb-2 text-xl font-bold text-foreground">No active streams</h2>
					<p class="max-w-sm text-sm text-muted-foreground">
						Waiting for a tutor or peer to go live. Want to start a study session yourself?
					</p>
				</div>
				<Button onclick={() => goto('/live/studio')}>Start Broadcasting</Button>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
				{#each streamsReq.activeStreams as stream (stream.id)}
					<a
						href="/live/{stream.id}"
						class="group block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-brand-400/60 hover:shadow-lg focus:outline-none"
					>
						<!-- Thumbnail area -->
						<div class="relative aspect-video overflow-hidden bg-muted">
							{#if stream.thumbnailUrl}
								<img
									src={stream.thumbnailUrl}
									alt={stream.title}
									class="h-full w-full object-cover"
								/>
							{:else}
								<div class="flex h-full w-full items-center justify-center bg-zinc-900">
									<Video class="size-8 text-white/20" />
								</div>
							{/if}

							<!-- Badges -->
							<div class="absolute top-2 left-2 flex gap-1.5">
								<Badge
									variant="destructive"
									class="h-5 animate-pulse gap-1 px-1.5 text-[10px] font-bold tracking-wide uppercase"
								>
									<Radio class="size-2.5" /> Live
								</Badge>
								<div
									class="flex h-5 items-center gap-1 rounded-md bg-black/60 px-1.5 text-[10px] font-bold text-white backdrop-blur-md"
								>
									<Users class="size-2.5" />
									{stream.viewerCount ?? 0}
								</div>
							</div>

							{#if stream.courseCode}
								<div class="absolute right-2 bottom-2">
									<Badge
										variant="secondary"
										class="h-5 border-white/10 bg-black/60 text-[10px] text-white backdrop-blur"
									>
										{stream.courseCode}
									</Badge>
								</div>
							{/if}
						</div>

						<!-- Meta details -->
						<div class="p-3">
							<div class="flex gap-2">
								<img
									src={stream.hostImage}
									alt={stream.hostName}
									class="size-8 shrink-0 rounded-full border border-border bg-muted"
								/>
								<div class="min-w-0">
									<h3
										class="truncate text-sm leading-tight font-bold text-foreground transition-colors group-hover:text-brand-500"
									>
										{stream.title}
									</h3>
									<p class="mt-0.5 truncate text-[11px] text-muted-foreground">
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
			<div class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
				{#each Array(4) as _}
					<div class="overflow-hidden rounded-2xl border border-border">
						<Skeleton class="aspect-video w-full rounded-none" />
						<div class="flex gap-2 p-3">
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
