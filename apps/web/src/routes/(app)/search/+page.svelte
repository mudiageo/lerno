<script context="module" lang="ts">
	function formatCount(n: number) {
		return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n ?? 0);
	}
</script>

<script lang="ts">
	import { searchAll } from './search.remote';
	import { Input } from '@lerno/ui/components/ui/input';
	import { Badge } from '@lerno/ui/components/ui/badge';
	import * as Avatar from '@lerno/ui/components/ui/avatar';
	import { Skeleton } from '@lerno/ui/components/ui/skeleton';
	import Search from '@lucide/svelte/icons/search';
	import FileText from '@lucide/svelte/icons/file-text';
	import Users from '@lucide/svelte/icons/users';
	import BrainCircuit from '@lucide/svelte/icons/brain-circuit';
	import Lock from '@lucide/svelte/icons/lock';

	type SearchTab = 'posts' | 'people' | 'communities';
	let activeTab = $state<SearchTab>('posts');
	let query = $state('');

	// Debounced query for the boundary
	let debouncedQuery = $state('');
	let debounceTimer: ReturnType<typeof setTimeout>;

	$effect(() => {
		const q = query;
		clearTimeout(debounceTimer);
		if (q.trim().length < 2) {
			debouncedQuery = '';
			return;
		}
		debounceTimer = setTimeout(() => {
			debouncedQuery = q;
		}, 300);
	});

	const tabs = [
		{ value: 'posts' as const, label: 'Posts', icon: FileText },
		{ value: 'people' as const, label: 'People', icon: Users },
		{ value: 'communities' as const, label: 'Communities', icon: BrainCircuit }
	];
</script>

<svelte:head>
	<title>Search — Lerno</title>
	<meta name="description" content="Search posts, people, and communities on Lerno." />
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border">
	<!-- Sticky header — always available outside boundary -->
	<div
		class="sticky top-0 z-30 space-y-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg"
	>
		<h1 class="text-lg font-bold tracking-tight">Search</h1>
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				class="h-10 rounded-full border-0 bg-muted pl-9 text-sm focus-visible:ring-brand-500/50"
				placeholder="Search posts, people, communities…"
				bind:value={query}
				autofocus
			/>
		</div>
		<div class="flex gap-1">
			{#each tabs as tab}
				<button
					class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors
                 {activeTab === tab.value
						? 'bg-brand-500 text-white'
						: 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
					onclick={() => (activeTab = tab.value)}
				>
					<tab.icon class="size-3.5" />
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	{#if !debouncedQuery}
		<div class="flex flex-col items-center gap-3 py-16 text-center">
			<Search class="size-10 text-muted-foreground/30" />
			<p class="text-sm text-muted-foreground">Type to search across Lerno</p>
		</div>
	{:else}
		<svelte:boundary>
			{@const results = await searchAll({ q: debouncedQuery, tab: activeTab })}

			<div class="divide-y divide-border/60">
				{#if activeTab === 'posts'}
					{#each results.posts as post (post.id)}
						<a href="/feed" class="block px-4 py-3 transition-colors hover:bg-accent/40">
							<div class="mb-1.5 flex items-center gap-1.5">
								<span class="text-xs font-bold">{post.authorName ?? 'User'}</span>
								<span class="text-xs text-muted-foreground">@{post.authorUsername}</span>
								{#if post.postType !== 'text'}
									<Badge variant="secondary" class="ml-auto h-4 px-1.5 text-[10px]"
										>{post.postType}</Badge
									>
								{/if}
							</div>
							<p class="line-clamp-3 text-sm leading-relaxed text-foreground">
								{typeof post.content === 'string'
									? post.content
									: (post.content?.body ?? post.content?.question ?? '')}
							</p>
						</a>
					{:else}
						<div class="flex flex-col items-center gap-3 py-16 text-center">
							<FileText class="size-8 text-muted-foreground/30" />
							<p class="text-sm text-muted-foreground">No posts found for "{debouncedQuery}"</p>
						</div>
					{/each}
				{:else if activeTab === 'people'}
					{#each results.people as person (person.id)}
						<a
							href="/profile/{person.username}"
							class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
						>
							<Avatar.Root class="size-10 shrink-0">
								<Avatar.Image src={person.avatarUrl} alt={person.displayName} />
								<Avatar.Fallback
									class="bg-brand-100 font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300"
								>
									{(person.displayName ?? person.username ?? '?')[0]}
								</Avatar.Fallback>
							</Avatar.Root>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-bold">{person.displayName}</p>
								<p class="text-xs text-muted-foreground">@{person.username}</p>
								{#if person.bio}
									<p class="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{person.bio}</p>
								{/if}
							</div>
							{#if person.xp}
								<div class="shrink-0 text-right">
									<p class="text-xs font-bold">{(person.xp / 1000).toFixed(1)}K</p>
									<p class="text-[10px] text-muted-foreground">XP</p>
								</div>
							{/if}
						</a>
					{:else}
						<div class="flex flex-col items-center gap-3 py-16 text-center">
							<Users class="size-8 text-muted-foreground/30" />
							<p class="text-sm text-muted-foreground">No people found for "{debouncedQuery}"</p>
						</div>
					{/each}
				{:else}
					{#each results.communities as community (community.id)}
						<a
							href="/communities/{community.slug}"
							class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
						>
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-xl dark:bg-brand-950/30"
							>
								👥
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-1.5">
									<p class="text-sm font-bold">{community.name}</p>
									{#if community.isPrivate}
										<Lock class="size-3 text-muted-foreground/60" />
									{/if}
								</div>
								<p class="text-xs text-muted-foreground">
									{formatCount(community.memberCount)} members
								</p>
							</div>
							{#if community.courseCode}
								<Badge variant="outline" class="h-5 px-1.5 text-[10px]"
									>{community.courseCode}</Badge
								>
							{/if}
						</a>
					{:else}
						<div class="flex flex-col items-center gap-3 py-16 text-center">
							<BrainCircuit class="size-8 text-muted-foreground/30" />
							<p class="text-sm text-muted-foreground">
								No communities found for "{debouncedQuery}"
							</p>
						</div>
					{/each}
				{/if}
			</div>

			{#snippet pending()}
				{#each Array(4) as _}
					<div class="flex items-center gap-3 border-b border-border/60 px-4 py-3">
						<Skeleton class="size-10 shrink-0 rounded-full" />
						<div class="flex-1 space-y-2">
							<Skeleton class="h-3 w-32 rounded" />
							<Skeleton class="h-3 w-48 rounded" />
						</div>
					</div>
				{/each}
			{/snippet}

			{#snippet failed(error, reset)}
				<div class="flex flex-col items-center gap-3 px-4 py-16 text-center">
					<Search class="size-8 text-muted-foreground/30" />
					<p class="text-sm text-muted-foreground">Search failed.</p>
					<button class="text-sm text-brand-500 underline" onclick={reset}>Retry</button>
				</div>
			{/snippet}
		</svelte:boundary>
	{/if}
</div>
