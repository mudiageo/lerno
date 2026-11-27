<script lang="ts">
	import { getShorts } from '../watch.remote';
	import Heart from '@lucide/svelte/icons/heart';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Bookmark from '@lucide/svelte/icons/bookmark';
	import Share2 from '@lucide/svelte/icons/share-2';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import * as Avatar from '@lerno/ui/components/ui/avatar';
	import { Badge } from '@lerno/ui/components/ui/badge';
	import { Button } from '@lerno/ui/components/ui/button';
	import VideoIcon from '@lucide/svelte/icons/video';
	import { onMount } from 'svelte';

	// Top-level await for shorts
	const shorts = await getShorts({});

	let videoElements: HTMLVideoElement[] = $state([]);
	let likedMap = $state<Record<string, boolean>>({});
	let savedMap = $state<Record<string, boolean>>({});

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const video = entry.target as HTMLVideoElement;
					if (entry.isIntersecting) {
						video.play().catch(() => {});
					} else {
						video.pause();
					}
				});
			},
			{ threshold: 0.6 }
		);

		videoElements.forEach((vid) => {
			if (vid) observer.observe(vid);
		});

		return () => observer.disconnect();
	});

	function togglePlay(vid: HTMLVideoElement | undefined) {
		if (!vid) return;
		if (vid.paused) {
			vid.play().catch(() => {});
		} else {
			vid.pause();
		}
	}
</script>

<svelte:head>
	<title>Shorts — Lerno Watch</title>
	<meta name="description" content="Short educational videos for quick learning." />
</svelte:head>

<div class="fixed inset-0 z-50 flex flex-col bg-black">
	<!-- Top Nav -->
	<div
		class="pointer-events-none absolute top-0 right-0 left-0 z-20 flex items-center justify-between p-4"
	>
		<Button
			href="/watch"
			variant="ghost"
			size="icon"
			class="pointer-events-auto rounded-full text-white hover:bg-white/20"
		>
			<ChevronLeft class="size-6" />
		</Button>
		<h1 class="text-lg font-bold text-white drop-shadow">Shorts</h1>
		<div class="w-10"></div>
	</div>

	{#if shorts.length > 0}
		<!-- Scroll Snap Container -->
		<div
			class="scrollbar-none relative h-full w-full flex-1 snap-y snap-mandatory overflow-y-scroll pb-16 lg:pb-0"
		>
			{#each shorts as current, i (current.id)}
				<div
					class="relative h-full max-h-screen w-full snap-start snap-always lg:mx-auto lg:max-w-[420px]"
				>
					<button
						type="button"
						class="absolute inset-0 h-full w-full focus:outline-none"
						onclick={(e) => {
							// Only toggle if clicked directly on the video container, not buttons
							if (e.target === e.currentTarget) togglePlay(videoElements[i]);
						}}
					>
						<!-- Native Video Player -->
						<!-- svelte-ignore a11y_media_has_caption -->
						<video
							src={current.content.videoUrl}
							poster={current.content.thumbnailUrl}
							loop
							playsinline
							class="h-full w-full object-cover"
							bind:this={videoElements[i]}
						></video>
					</button>

					<!-- Right side action buttons -->
					<div
						class="absolute right-3 bottom-24 z-10 flex flex-col items-center gap-5 lg:bottom-12"
					>
						<Avatar.Root class="size-12 ring-2 ring-white/80">
							<Avatar.Image src={current.authorImage} alt={current.authorName} />
							<Avatar.Fallback class="bg-brand-600 font-bold text-white"
								>{(current.authorName ?? 'U')[0]}</Avatar.Fallback
							>
						</Avatar.Root>

						<button
							class="group flex flex-col items-center gap-0.5"
							onclick={() => {
								likedMap[current.id] = !likedMap[current.id];
							}}
						>
							<div
								class="flex size-12 items-center justify-center rounded-full bg-black/40 backdrop-blur transition-all group-active:scale-95 {likedMap[
									current.id
								]
									? 'text-rose-400'
									: 'text-white'}"
							>
								<Heart class="size-6" style={likedMap[current.id] ? 'fill: currentColor;' : ''} />
							</div>
							<span class="text-xs font-bold text-white drop-shadow">
								{((current.likeCount + (likedMap[current.id] ? 1 : 0)) / 1000).toFixed(1)}K
							</span>
						</button>

						<button class="group flex flex-col items-center gap-0.5">
							<div
								class="flex size-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur group-active:scale-95"
							>
								<MessageCircle class="size-6" />
							</div>
							<span class="text-xs font-bold text-white drop-shadow">Reply</span>
						</button>

						<button
							class="group flex flex-col items-center gap-0.5"
							onclick={() => {
								savedMap[current.id] = !savedMap[current.id];
							}}
						>
							<div
								class="flex size-12 items-center justify-center rounded-full bg-black/40 backdrop-blur transition-all group-active:scale-95 {savedMap[
									current.id
								]
									? 'text-brand-400'
									: 'text-white'}"
							>
								<Bookmark
									class="size-6"
									style={savedMap[current.id] ? 'fill: currentColor;' : ''}
								/>
							</div>
							<span class="text-xs font-bold text-white drop-shadow">Save</span>
						</button>

						<button class="group flex flex-col items-center gap-0.5">
							<div
								class="flex size-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur group-active:scale-95"
							>
								<Share2 class="size-6" />
							</div>
							<span class="text-xs font-bold text-white drop-shadow">Share</span>
						</button>
					</div>

					<!-- Bottom info overlay -->
					<div
						class="pointer-events-none absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pb-20 lg:pb-8"
					>
						<div class="mb-2 flex items-center gap-2">
							<span class="text-sm font-bold text-white drop-shadow"
								>{current.authorName ?? `@${current.authorUsername}`}</span
							>
							{#if current.courseCode}
								<Badge class="border-0 bg-brand-500/80 text-[10px] text-white"
									>{current.courseCode}</Badge
								>
							{/if}
						</div>
						<p class="line-clamp-2 text-sm leading-snug font-medium text-white drop-shadow">
							{current.content.title ?? current.content.body}
						</p>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex h-full w-full flex-1 items-center justify-center">
			<div class="flex flex-col items-center gap-4 p-8 text-center">
				<div class="flex size-16 items-center justify-center rounded-full bg-white/10">
					<VideoIcon class="size-8 text-white/40" />
				</div>
				<p class="font-medium text-white">No shorts found.</p>
				<Button href="/watch" variant="outline" class="border-white/20 text-white hover:bg-white/10"
					>Go Back</Button
				>
			</div>
		</div>
	{/if}
</div>
