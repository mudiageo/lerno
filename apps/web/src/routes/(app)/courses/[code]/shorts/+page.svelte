<script lang="ts">
	import { page } from '$app/state';
	import { getFeed } from '../../../feed/feed.remote';
	import { Button } from '@lerno/ui/components/ui/button';
	import Clapperboard from '@lucide/svelte/icons/clapperboard';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import Heart from '@lucide/svelte/icons/heart';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Share2 from '@lucide/svelte/icons/share-2';
	import Brain from '@lucide/svelte/icons/brain';

	const courseCode = page.params.code;

	// Load short posts for this course
	const result = await getFeed({
		cursor: undefined,
		courseCode,
		postType: 'short'
	});
	const shorts = result.posts ?? [];

	let currentIndex = $state(0);
	let muted = $state(true);
	const current = $derived(shorts[currentIndex]);

	function next() {
		if (currentIndex < shorts.length - 1) currentIndex++;
	}
	function prev() {
		if (currentIndex > 0) currentIndex--;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') next();
		if (e.key === 'ArrowUp') prev();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative flex h-[calc(100vh-120px)] flex-col overflow-hidden bg-black">
	{#if shorts.length === 0}
		<div class="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
			<Clapperboard class="size-12 text-white/30" />
			<div>
				<p class="text-lg font-bold text-white">No shorts yet</p>
				<p class="mt-1 text-sm text-white/50">
					AI video flashcards for {courseCode} will appear here.
				</p>
			</div>
		</div>
	{:else}
		<!-- Short card -->
		<div class="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
			<!-- Content -->
			{#key currentIndex}
				<div
					class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
					style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)"
				>
					<!-- AI flashcard text content -->
					{#if current?.content?.front}
						<div class="w-full max-w-sm space-y-6">
							<div class="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white/10">
								<Brain class="size-8 text-white" />
							</div>
							<div>
								<p class="mb-3 text-xs font-medium tracking-widest text-white/60 uppercase">
									{current.topicTags?.[0] ?? courseCode}
								</p>
								<p class="text-2xl leading-tight font-black text-white">
									{current.content.front}
								</p>
							</div>
							<div class="rounded-2xl border border-white/20 bg-white/10 p-4 text-left">
								<p class="mb-1 text-xs font-bold text-white/50 uppercase">Answer</p>
								<p class="text-sm leading-relaxed text-white/90">
									{current.content.back}
								</p>
							</div>
						</div>
					{:else if current?.content?.body}
						<p class="max-w-sm text-xl leading-snug font-bold text-white">
							{current.content.body}
						</p>
					{/if}
				</div>
			{/key}

			<!-- Navigation swipe buttons -->
			<button
				class="absolute top-4 left-1/2 -translate-x-1/2 px-16 py-4 opacity-0 hover:opacity-100 focus:opacity-100"
				onclick={prev}
				disabled={currentIndex === 0}
				aria-label="Previous"
			>
				<div class="mx-auto h-1 w-8 rounded-full bg-white/50"></div>
			</button>
			<button
				class="absolute bottom-4 left-1/2 -translate-x-1/2 px-16 py-4 opacity-0 hover:opacity-100 focus:opacity-100"
				onclick={next}
				disabled={currentIndex === shorts.length - 1}
				aria-label="Next"
			>
				<div class="mx-auto h-1 w-8 rounded-full bg-white/50"></div>
			</button>
		</div>

		<!-- Right action bar -->
		<div class="absolute right-4 bottom-24 flex flex-col items-center gap-5">
			<button class="flex flex-col items-center gap-1" onclick={() => (muted = !muted)}>
				<div class="flex size-10 items-center justify-center rounded-full bg-white/20">
					{#if muted}
						<VolumeX class="size-5 text-white" />
					{:else}
						<Volume2 class="size-5 text-white" />
					{/if}
				</div>
			</button>
			<button class="flex flex-col items-center gap-1">
				<div class="flex size-10 items-center justify-center rounded-full bg-white/20">
					<Heart class="size-5 text-white" />
				</div>
				<span class="text-[11px] font-medium text-white">{current?.likeCount ?? 0}</span>
			</button>
			<button class="flex flex-col items-center gap-1">
				<div class="flex size-10 items-center justify-center rounded-full bg-white/20">
					<MessageCircle class="size-5 text-white" />
				</div>
				<span class="text-[11px] font-medium text-white">{current?.replyCount ?? 0}</span>
			</button>
			<button class="flex flex-col items-center gap-1">
				<div class="flex size-10 items-center justify-center rounded-full bg-white/20">
					<Share2 class="size-5 text-white" />
				</div>
			</button>
		</div>

		<!-- Progress dots -->
		<div class="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5">
			{#each shorts as _, i}
				<div
					class="rounded-full transition-all {i === currentIndex
						? 'h-1.5 w-4 bg-white'
						: 'size-1.5 bg-white/40'}"
				></div>
			{/each}
		</div>

		<!-- Counter -->
		<div
			class="absolute top-4 right-4 rounded-full bg-black/40 px-2 py-1 font-mono text-xs text-white"
		>
			{currentIndex + 1}/{shorts.length}
		</div>
	{/if}
</div>
