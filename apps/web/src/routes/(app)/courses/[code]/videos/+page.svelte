<script lang="ts">
	import { page } from '$app/state';
	import { getCourseVideos } from '../../courses.remote';
	import { Button } from '@lerno/ui/components/ui/button';
	import { Badge } from '@lerno/ui/components/ui/badge';
	import { Skeleton } from '@lerno/ui/components/ui/skeleton';
	import Video from '@lucide/svelte/icons/video';
	import Youtube from '@lucide/svelte/icons/youtube';
	import Play from '@lucide/svelte/icons/play';
	import Clock from '@lucide/svelte/icons/clock';
	import Eye from '@lucide/svelte/icons/eye';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	const courseCode = page.params.code;
	const { youtube, uploaded } = await getCourseVideos({ courseCode });

	type Filter = 'all' | 'youtube' | 'uploaded' | 'ai';
	let filter = $state<Filter>('all');
	let activeVideo = $state<any>(null);

	function formatDuration(secs: number) {
		if (!secs) return '';
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	function formatViews(n: number) {
		if (!n) return '';
		return n >= 1000 ? `${(n / 1000).toFixed(1)}K views` : `${n} views`;
	}

	const allVideos = $derived([
		...youtube.map((v: any) => ({ ...v, source: 'youtube' })),
		...uploaded.map((v: any) => ({
			...v,
			source: uploaded.find((u: any) => u.aiGenerated) ? 'ai' : 'uploaded'
		}))
	]);

	const filtered = $derived(
		filter === 'all'
			? allVideos
			: filter === 'youtube'
				? allVideos.filter((v) => v.source === 'youtube')
				: filter === 'uploaded'
					? allVideos.filter((v) => v.source === 'uploaded')
					: allVideos.filter((v) => v.source === 'ai')
	);
</script>

<div class="space-y-4 py-4">
	<!-- Filter tabs -->
	<div class="scrollbar-hide flex gap-1 overflow-x-auto px-4">
		{#each [['all', 'All'], ['youtube', 'YouTube'], ['uploaded', 'Uploaded'], ['ai', 'AI Generated']] as [val, label]}
			<button
				class="rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors
               {filter === val
					? 'bg-brand-500 text-white'
					: 'bg-muted/60 text-muted-foreground hover:bg-muted'}"
				onclick={() => (filter = val as Filter)}>{label}</button
			>
		{/each}
	</div>

	<!-- Inline player -->
	{#if activeVideo}
		<div class="relative mx-4 aspect-video overflow-hidden rounded-2xl bg-black">
			{#if activeVideo.source === 'youtube'}
				<iframe
					class="h-full w-full"
					src="https://www.youtube.com/embed/{activeVideo.videoId}?autoplay=1"
					title={activeVideo.title}
					allow="autoplay; fullscreen"
					frameborder="0"
				></iframe>
			{:else}
				<video
					class="h-full w-full object-contain"
					controls
					autoplay
					src={activeVideo.content?.url ?? activeVideo.url}
				>
					<track kind="captions" />
				</video>
			{/if}
			<button
				class="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
				onclick={() => (activeVideo = null)}>✕</button
			>
		</div>

		<!-- Topic timestamps sidebar -->
		{#if activeVideo.topicTimestamps?.length}
			<div class="mx-4 rounded-2xl border border-border bg-card p-3">
				<p class="mb-2 text-xs font-bold text-foreground">📍 Topics</p>
				<div class="max-h-36 space-y-1 overflow-y-auto">
					{#each activeVideo.topicTimestamps as ts}
						<button
							class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent/40"
							onclick={() => {
								// Post message to iframe if YouTube, otherwise seek video
							}}
						>
							<span class="shrink-0 font-mono text-[10px] text-brand-500"
								>{Math.floor(ts.startSecs / 60)}:{String(ts.startSecs % 60).padStart(2, '0')}</span
							>
							<span class="truncate text-xs text-foreground">{ts.topic}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Video grid -->
	<svelte:boundary>
		{#if filtered.length === 0}
			<div class="flex flex-col items-center gap-3 px-6 py-16 text-center">
				<Video class="size-10 text-muted-foreground/30" />
				<p class="text-sm text-muted-foreground">
					{filter === 'youtube' ? 'No YouTube videos cached yet.' : 'No videos available.'}
				</p>
				{#if filter === 'youtube'}
					<p class="text-xs text-muted-foreground">The YouTube cron runs daily at 2am UTC.</p>
				{/if}
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2">
				{#each filtered as video (video.id ?? video.videoId)}
					<button
						class="group overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:border-brand-300 hover:shadow-lg dark:hover:border-brand-700"
						onclick={() => (activeVideo = video)}
					>
						<!-- Thumbnail -->
						<div class="relative aspect-video overflow-hidden bg-muted">
							{#if video.thumbnailUrl}
								<img
									src={video.thumbnailUrl}
									alt={video.title ?? 'Video'}
									class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
							{:else if video.content?.thumbnailUrl}
								<img
									src={video.content.thumbnailUrl}
									alt="Video"
									class="h-full w-full object-cover"
								/>
							{:else}
								<div class="flex h-full w-full items-center justify-center bg-muted">
									<Video class="size-8 text-muted-foreground/40" />
								</div>
							{/if}
							<!-- Play button overlay -->
							<div
								class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<div
									class="flex size-12 items-center justify-center rounded-full bg-white/90 shadow-lg"
								>
									<Play class="ml-1 size-5 fill-black text-black" />
								</div>
							</div>
							<!-- Duration badge -->
							{#if video.durationSecs || video.content?.durationSecs}
								<span
									class="absolute right-2 bottom-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] text-white"
								>
									{formatDuration(video.durationSecs ?? video.content?.durationSecs)}
								</span>
							{/if}
							<!-- Source badge -->
							<span class="absolute top-2 left-2">
								{#if video.source === 'youtube'}
									<Badge class="h-4 border-0 bg-red-600 px-1.5 text-[10px] text-white">YT</Badge>
								{:else if video.source === 'ai'}
									<Badge class="h-4 border-0 bg-brand-600 px-1.5 text-[10px] text-white">AI</Badge>
								{:else}
									<Badge variant="secondary" class="h-4 px-1.5 text-[10px]">Upload</Badge>
								{/if}
							</span>
						</div>
						<!-- Info -->
						<div class="p-3">
							<p class="line-clamp-2 text-sm leading-snug font-semibold text-foreground">
								{video.title ?? video.content?.title ?? 'Untitled'}
							</p>
							{#if video.channelTitle}
								<p class="mt-1 text-[11px] text-muted-foreground">{video.channelTitle}</p>
							{/if}
							<div class="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
								{#if video.viewCount}
									<span class="flex items-center gap-1"
										><Eye class="size-3" />{formatViews(video.viewCount)}</span
									>
								{/if}
								{#if video.source === 'youtube' && video.videoId}
									<a
										href="https://youtube.com/watch?v={video.videoId}"
										target="_blank"
										rel="noopener noreferrer"
										class="ml-auto flex items-center gap-1 transition-colors hover:text-brand-500"
										onclick={(e) => e.stopPropagation()}
									>
										<ExternalLink class="size-3" /> YouTube
									</a>
								{/if}
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}

		{#snippet pending()}
			<div class="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2">
				{#each Array(6) as _}
					<div class="overflow-hidden rounded-2xl border border-border">
						<Skeleton class="aspect-video w-full" />
						<div class="space-y-2 p-3">
							<Skeleton class="h-4 w-full rounded" />
							<Skeleton class="h-3 w-24 rounded" />
						</div>
					</div>
				{/each}
			</div>
		{/snippet}
	</svelte:boundary>
</div>
