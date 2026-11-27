<script lang="ts">
	import { getVideos } from './watch.remote';
	import * as Card from '@lerno/ui/components/ui/card';
	import { Badge } from '@lerno/ui/components/ui/badge';
	import { Button } from '@lerno/ui/components/ui/button';
	import Play from '@lucide/svelte/icons/play';
	import Clock from '@lucide/svelte/icons/clock';
	import Eye from '@lucide/svelte/icons/eye';
	import Search from '@lucide/svelte/icons/search';
	import Tv from '@lucide/svelte/icons/tv';
	import Zap from '@lucide/svelte/icons/zap';

	// Top-level await for videos
	const videos = await getVideos({});
</script>

<svelte:head>
	<title>Watch — Lerno</title>
	<meta name="description" content="Educational videos curated for your courses." />
</svelte:head>

<div
	class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border pb-20 lg:pb-0"
>
	<!-- Header -->
	<div
		class="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg"
	>
		<h1 class="flex items-center gap-2 text-lg font-bold tracking-tight">
			<Tv class="size-5 text-brand-500" />
			Watch
		</h1>
		<div class="flex items-center gap-2">
			<Button
				href="/watch/upload"
				variant="default"
				size="sm"
				class="bg-brand-500 font-bold hover:bg-brand-600"
			>
				Upload
			</Button>
			<Button variant="ghost" size="icon" class="size-9"><Search class="size-4" /></Button>
		</div>
	</div>

	<svelte:boundary>
		<div class="space-y-6 p-4">
			<!-- Shorts Hero Section -->
			<a href="/watch/shorts" class="group block">
				<Card.Root
					class="overflow-hidden border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent transition-all hover:border-brand-500/40"
				>
					<Card.Content class="flex items-center justify-between p-4">
						<div class="flex items-center gap-4">
							<div
								class="flex size-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/20 transition-transform group-hover:scale-110"
							>
								<Zap class="size-6 fill-current" />
							</div>
							<div>
								<h3 class="text-base font-bold text-foreground">Shorts</h3>
								<p class="text-xs text-muted-foreground">Quick educational bursts in 60s</p>
							</div>
						</div>
						<Button
							variant="secondary"
							size="sm"
							class="font-bold transition-transform group-hover:translate-x-1">Explore</Button
						>
					</Card.Content>
				</Card.Root>
			</a>

			<!-- Categories -->
			<div class="scrollbar-none flex gap-2 overflow-x-auto pb-2">
				<Button
					variant="secondary"
					size="sm"
					class="rounded-full border-0 bg-brand-50 text-brand-700 hover:bg-brand-100">All</Button
				>
				<Button
					variant="ghost"
					size="sm"
					class="rounded-full text-muted-foreground hover:text-foreground">Mathematics</Button
				>
				<Button
					variant="ghost"
					size="sm"
					class="rounded-full text-muted-foreground hover:text-foreground">Biology</Button
				>
				<Button
					variant="ghost"
					size="sm"
					class="rounded-full text-muted-foreground hover:text-foreground">Physics</Button
				>
				<Button
					variant="ghost"
					size="sm"
					class="rounded-full text-muted-foreground hover:text-foreground">Chemistry</Button
				>
			</div>

			<!-- Video Grid -->
			<div class="grid grid-cols-1 gap-6">
				{#each videos as video (video.id)}
					<div class="group space-y-3">
						<div
							class="relative aspect-video overflow-hidden rounded-2xl border border-border/50 bg-black transition-all group-hover:shadow-xl group-hover:shadow-brand-500/10"
						>
							{#if video.content.videoUrl}
								<video
									src={video.content.videoUrl}
									poster={video.content.thumbnailUrl}
									controls
									preload="metadata"
									class="h-full w-full object-cover"
								>
									<track kind="captions" />
								</video>
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-muted text-muted-foreground"
								>
									<Tv class="size-8 opacity-20" />
								</div>
							{/if}
							<div
								class="pointer-events-none absolute right-2 bottom-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white"
							>
								<Clock class="size-2.5" />
								{Math.floor((video.content.duration ?? 0) / 60)}:{(video.content.duration ?? 0) %
									60 <
								10
									? '0'
									: ''}{(video.content.duration ?? 0) % 60 || '00'}
							</div>
						</div>

						<div class="flex gap-3 px-1">
							<div
								class="mt-0.5 size-10 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border"
							>
								<img
									src={video.authorImage}
									alt={video.authorName}
									class="h-full w-full object-cover"
								/>
							</div>
							<div class="min-w-0 flex-1">
								<h4
									class="line-clamp-2 text-sm leading-tight font-bold text-foreground transition-colors"
								>
									{video.content.title ?? video.content.body}
								</h4>
								<div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
									<span class="truncate text-xs font-medium text-muted-foreground"
										>{video.authorName}</span
									>
									<span class="size-1 rounded-full bg-muted-foreground/30"></span>
									<div class="flex items-center gap-1 text-xs text-muted-foreground">
										<Eye class="size-3" />
										{((video.viewCount ?? 1200) / 1000).toFixed(1)}K
									</div>
									{#if video.courseCode}
										<Badge
											variant="secondary"
											class="h-4.5 border-0 bg-brand-50 text-[10px] text-brand-700"
											>{video.courseCode}</Badge
										>
									{/if}
								</div>
							</div>
							<Button variant="ghost" size="icon" class="-mt-1 size-8"
								><Play
									class="size-4 opacity-40 transition-opacity group-hover:opacity-100"
								/></Button
							>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-center gap-4 py-20 text-center">
						<div class="size-16 rounded-full bg-muted flex items-center justify-center">
							<Tv class="size-8 text-muted-foreground/30" />
						</div>
						<p class="text-sm text-muted-foreground">No videos available right now.</p>
					</div>
				{/each}
			</div>
		</div>

		{#snippet pending()}
			<div class="space-y-6 p-4">
				<Skeleton class="h-20 w-full rounded-xl" />
				<div class="grid grid-cols-1 gap-6">
					{#each Array(3) as _}
						<div class="space-y-3">
							<Skeleton class="aspect-video w-full rounded-2xl" />
							<div class="flex gap-3">
								<Skeleton class="size-10 shrink-0 rounded-full" />
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
			<div class="flex flex-col items-center gap-4 px-4 py-20 text-center">
				<Tv class="size-12 text-muted-foreground/20" />
				<p class="text-sm text-muted-foreground">Could not load videos.</p>
				<Button variant="outline" size="sm" onclick={reset}>Retry</Button>
			</div>
		{/snippet}
	</svelte:boundary>
</div>
