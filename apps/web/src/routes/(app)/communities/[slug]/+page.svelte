<script lang="ts">
	import { page } from '$app/state';
	import {
		getCommunity,
		getCommunityPosts,
		joinCommunity,
		leaveCommunity
	} from '../communities.remote';
	import { Button } from '@lerno/ui/components/ui/button';
	import { Badge } from '@lerno/ui/components/ui/badge';
	import { Separator } from '@lerno/ui/components/ui/separator';
	import { InfiniteFeed } from '@lerno/ui/components/feed';
	import { toast } from '@lerno/ui/components/ui/sonner';
	import Users from '@lucide/svelte/icons/users';
	import Lock from '@lucide/svelte/icons/lock';
	import Calendar from '@lucide/svelte/icons/calendar';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';

	const slug = page.params.slug;
	let activeTab = $state<'feed' | 'members' | 'exams'>('feed');
	let joining = $state(false);

	// Data fetching
	const community = await getCommunity({ slug });

	// Feed state
	let extraPosts = $state<any[]>([]);
	let loadingMore = $state(false);

	async function loadMore() {
		if (loadingMore || activeTab !== 'feed') return;
		loadingMore = true;
		try {
			const current = getCommunityPosts({ communityId: community.id }).current;
			const lastPost = current?.at(-1) ?? extraPosts.at(-1);
			const data = await getCommunityPosts({
				communityId: community.id,
				cursor: lastPost?.createdAt?.toString()
			});
			extraPosts = [...extraPosts, ...(data ?? [])];
		} finally {
			loadingMore = false;
		}
	}

	async function handleToggleMembership() {
		joining = true;
		try {
			if (community.joined) {
				await leaveCommunity({ communityId: community.id }).updates(
					getCommunity({ slug }).withOverride((c) => ({
						...c,
						joined: false,
						memberCount: Math.max(0, (c.memberCount ?? 0) - 1)
					}))
				);
			} else {
				await joinCommunity({ communityId: community.id }).updates(
					getCommunity({ slug }).withOverride((c) => ({
						...c,
						joined: true,
						memberCount: (c.memberCount ?? 0) + 1
					}))
				);
			}
		} catch {
			toast.error('Action failed. Please try again.');
		} finally {
			joining = false;
		}
	}
</script>

<svelte:head>
	<title>{community?.name ?? 'Community'} — Lerno</title>
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border pb-20">
	<svelte:boundary>
		<!-- Header Back Navigation -->
		<div
			class="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur-lg"
		>
			<a
				href="/communities"
				class="-ml-1.5 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			>
				<ChevronLeft class="size-5" />
			</a>
			<h1 class="truncate text-sm font-bold tracking-tight">{community.name}</h1>
		</div>

		<!-- Banner & Header Info -->
		<div class="relative">
			<div
				class="h-32 w-full bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-900 dark:to-brand-800"
			></div>

			<div class="px-4 pb-4">
				<div class="-mt-10 mb-4 flex items-end justify-between gap-4">
					<div
						class="flex size-20 shrink-0 items-center justify-center rounded-2xl border-4 border-background bg-background text-4xl shadow-sm"
					>
						👥
					</div>
					<Button
						variant={community.joined ? 'outline' : 'default'}
						class="rounded-full shadow-sm"
						disabled={joining}
						onclick={handleToggleMembership}
					>
						{joining ? '…' : community.joined ? 'Leave' : 'Join Community'}
					</Button>
				</div>

				<div>
					<h1 class="flex items-center gap-2 text-2xl font-black tracking-tight text-foreground">
						{community.name}
						{#if community.isPrivate}
							<Lock class="size-4 text-muted-foreground/60" />
						{/if}
					</h1>
					<p class="mt-1 max-w-lg min-w-0 text-sm leading-relaxed text-muted-foreground">
						{community.description || 'A study community for sharing resources and knowledge.'}
					</p>

					<div class="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
						<span class="flex items-center gap-1.5">
							<Users class="size-3.5" />
							<span class="font-bold text-foreground">{community.memberCount}</span> members
						</span>
						{#if community.courseCode}
							<Badge variant="outline" class="h-5 bg-muted/30 px-1.5 text-[10px]">
								Course: {community.courseCode}
							</Badge>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Tabs -->
		<div class="flex items-center border-y border-border/60 bg-muted/10 px-2">
			{#each [{ id: 'feed', label: 'Discussions', icon: MessageSquare }, { id: 'exams', label: 'Shared Exams', icon: Calendar }, { id: 'members', label: 'Members', icon: Users }] as tab}
				<button
					class="flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-sm font-medium transition-colors
                 {activeTab === tab.id
						? 'border-brand-500 text-brand-600 dark:text-brand-400'
						: 'border-transparent text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeTab = tab.id as any)}
				>
					<tab.icon class="hidden size-3.5 sm:block" />
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- Tab Content -->
		<div class="min-h-[400px]">
			{#if activeTab === 'feed'}
				<svelte:boundary>
					{@const initialPosts = await getCommunityPosts({ communityId: community.id })}
					{@const allPosts = [...(initialPosts ?? []), ...extraPosts]}

					<InfiniteFeed
						posts={allPosts}
						loading={false}
						{loadingMore}
						hasMore={initialPosts.length >= 20}
						onLoadMore={loadMore}
					/>

					{#snippet failed(error, reset)}
						<div class="p-8 text-center text-sm text-muted-foreground">
							Failed to load discussions. <button class="ml-1 underline" onclick={reset}
								>Retry</button
							>
						</div>
					{/snippet}
				</svelte:boundary>
			{:else if activeTab === 'exams'}
				<div class="flex flex-col items-center justify-center px-4 py-20 text-center">
					<div class="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/60">
						<Calendar class="size-8 text-muted-foreground/40" />
					</div>
					<p class="text-sm font-bold text-foreground">Community Exam Schedule</p>
					<p class="mt-1 max-w-sm text-[13px] text-muted-foreground">
						Exams added here will automatically appear on the study calendars of all community
						members.
					</p>
					<Button variant="outline" class="mt-6 h-8 rounded-full text-xs">Add Exam Date</Button>
				</div>
			{:else if activeTab === 'members'}
				<div class="flex flex-col items-center justify-center px-4 py-20 text-center">
					<div class="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/60">
						<Users class="size-8 text-muted-foreground/40" />
					</div>
					<p class="text-sm font-bold text-foreground">Members List</p>
					<p class="mt-1 text-[13px] text-muted-foreground">
						See everyone part of {community.name}.
					</p>
				</div>
			{/if}
		</div>

		{#snippet pending()}
			<div class="space-y-4 p-8">
				<div class="h-32 animate-pulse rounded-xl bg-muted/40"></div>
				<div class="h-8 w-48 animate-pulse rounded bg-muted/40"></div>
			</div>
		{/snippet}

		{#snippet failed(error, reset)}
			<div class="p-16 text-center text-muted-foreground">Community not found.</div>
		{/snippet}
	</svelte:boundary>
</div>
