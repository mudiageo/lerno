<script lang="ts">
	import { page } from '$app/state';
	import { toast } from '@lerno/ui/components/ui/sonner';
	import {
		getProfile as getUserProfile,
		getProfilePosts as getUserPosts,
		toggleFollow
	} from '../profile.remote';
	import { likePost, bookmarkPost, repostPost } from '../../feed/feed.remote';
	import { PostCard } from '@lerno/ui/components/feed';
	import { Button } from '@lerno/ui/components/ui/button';
	import { Badge } from '@lerno/ui/components/ui/badge';
	import { Separator } from '@lerno/ui/components/ui/separator';
	import { Skeleton } from '@lerno/ui/components/ui/skeleton';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Calendar from '@lucide/svelte/icons/calendar';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import LinkIcon from '@lucide/svelte/icons/link';

	// Profile data fetch (Top-level blocks rendering)
	let initialProfile = await getUserProfile({ username: page.params.username });
	let profileData = $state(initialProfile);
	const posts = await getUserPosts({ username: page.params.username });

	let activeTab = $state<'posts' | 'replies' | 'highlights'>('posts');

	async function handleToggleFollow() {
		const wasFollowing = profileData.isFollowing;
		// Optimistic update
		profileData.isFollowing = !wasFollowing;
		profileData.followers += wasFollowing ? -1 : 1;
		try {
			await toggleFollow({ targetUserId: profileData.id });
		} catch {
			// Revert on error
			profileData.isFollowing = wasFollowing;
			profileData.followers += wasFollowing ? 1 : -1;
			toast.error('Failed to update follow status');
		}
	}

	async function handleLike(postId: string, current: boolean) {
		try {
			await likePost({ postId }).updates(
				getUserPosts({ username: page.params.username }).withOverride((data) =>
					data.map((p) =>
						p.id === postId
							? {
									...p,
									liked: !current,
									likeCount: p.likeCount + (current ? -1 : 1)
								}
							: p
					)
				)
			);
		} catch {
			toast.error('Failed to update like');
		}
	}

	async function handleBookmark(postId: string, current: boolean) {
		try {
			await bookmarkPost({ postId }).updates(
				getUserPosts({ username: page.params.username }).withOverride((data) =>
					data.map((p) => (p.id === postId ? { ...p, bookmarked: !current } : p))
				)
			);
		} catch {
			toast.error('Failed to update bookmark');
		}
	}

	async function handleRepost(postId: string) {
		try {
			await repostPost({ postId }).updates(
				getUserPosts({ username: page.params.username }).withOverride((data) =>
					data.map((p) => (p.id === postId ? { ...p, repostCount: p.repostCount + 1 } : p))
				)
			);
			toast.success('Reposted!');
		} catch {
			toast.error('Failed to repost');
		}
	}
</script>

<svelte:head>
	<title>{profile.name} (@{profile.username}) — Lerno</title>
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border">
	<!-- Profile Header Boundary -->
	<svelte:boundary
		onerror={(e, r) => {
			console.log(e);
		}}
	>
		<div
			class="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg"
		>
			<a
				href="/feed"
				class="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-accent"
			>
				<ArrowLeft class="size-4" />
			</a>
			<div>
				<h1 class="text-base leading-tight font-bold">{profile.name}</h1>
				<p class="text-[11px] text-muted-foreground">
					{profile.postsCount} posts
				</p>
			</div>
		</div>

		<div class="relative">
			<div class="group relative h-32 w-full bg-muted/30">
				{#if profile.coverImage}
					<img src={profile.coverImage} alt="Cover" class="h-full w-full object-cover" />
				{/if}
			</div>
			<div class="relative z-10 -mt-12 mb-4 flex items-end justify-between px-4">
				<div
					class="size-24 overflow-hidden rounded-full border-4 border-background bg-muted shadow-sm"
				>
					{#if profileData.image ?? profileData.avatarUrl}
						<img
							src={profileData.image ?? profileData.avatarUrl}
							alt={profileData.name ?? profileData.displayName}
							class="h-full w-full object-cover"
						/>
					{:else}
						<div
							class="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground/30"
						>
							{(profileData.name ?? profileData.displayName ?? 'U').slice(0, 1).toUpperCase()}
						</div>
					{/if}
				</div>
				{#if profileData.isOwnProfile}
					<Button variant="outline" size="sm" class="h-8 rounded-full px-4 text-xs font-bold"
						>Edit profile</Button
					>
				{:else}
					<Button
						variant={profileData.isFollowing ? 'outline' : 'default'}
						size="sm"
						class="h-8 rounded-full px-4 text-xs font-bold {profileData.isFollowing
							? ''
							: 'bg-brand-500 text-white hover:bg-brand-600'}"
						onclick={handleToggleFollow}
					>
						{profileData.isFollowing ? 'Following' : 'Follow'}
					</Button>
				{/if}
			</div>
		</div>

		<div class="mb-4 space-y-3 px-4">
			<div>
				<h2 class="text-xl font-black text-foreground">
					{profileData.name ?? profileData.displayName}
				</h2>
				<p class="text-sm text-muted-foreground">@{profileData.username}</p>
			</div>
			<p class="text-[13px] leading-relaxed">{profileData.bio}</p>
			<div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
				{#if profileData.location}
					<div class="flex items-center gap-1">
						<MapPin class="size-3" />{profileData.location}
					</div>
				{/if}
				{#if profileData.website}
					<a
						href={profileData.website}
						target="_blank"
						class="flex items-center gap-1 text-brand-500 hover:underline"
					>
						<LinkIcon class="size-3" />{profileData.website.replace(/^https?:\/\//, '')}
					</a>
				{/if}
				<div class="flex items-center gap-1">
					<Calendar class="size-3" />Joined {new Date(profileData.createdAt).toLocaleDateString(
						undefined,
						{ month: 'long', year: 'numeric' }
					)}
				</div>
			</div>
			<div class="flex items-center gap-4 text-xs">
				<button class="hover:underline">
					<span class="font-bold text-foreground">{profileData.following}</span>
					<span class="text-muted-foreground"> Following</span>
				</button>
				<button class="hover:underline">
					<span class="font-bold text-foreground">{profileData.followers}</span>
					<span class="text-muted-foreground"> Followers</span>
				</button>
			</div>
		</div>

		<!-- Dual boundaries for tabs/content if desired -->
		<div class="flex border-b border-border/50">
			{#each ['posts', 'replies', 'highlights'] as tab}
				<button
					class="flex-1 border-b-2 py-3 text-sm font-medium capitalize transition-colors
                 {activeTab === tab
						? 'border-brand-500 text-brand-600 dark:text-brand-400'
						: 'border-transparent text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeTab = tab as any)}
				>
					{tab}
				</button>
			{/each}
		</div>

		{#snippet pending()}
			<div class="animate-pulse space-y-4 p-4">
				<Skeleton class="h-8 w-48 rounded" />
				<Skeleton class="h-4 w-full rounded" />
				<Skeleton class="h-4 w-2/3 rounded" />
			</div>
		{/snippet}

		{#snippet failed()}{/snippet}
	</svelte:boundary>

	<!-- Posts Body Boundary -->
	<svelte:boundary>
		<div class="divide-y divide-border/60">
			{#each posts as post, i (post.id)}
				<PostCard
					{post}
					index={i}
					onLike={handleLike}
					onBookmark={handleBookmark}
					onRepost={handleRepost}
				/>
			{:else}
				<div class="flex flex-col items-center gap-3 py-16 text-center">
					<p class="text-sm text-muted-foreground">No posts yet.</p>
				</div>
			{/each}
		</div>

		{#snippet pending()}
			<div class="divide-y divide-border/60">
				{#each Array(3) as _}
					<div class="space-y-3 p-4">
						<div class="flex items-center gap-2">
							<Skeleton class="size-8 rounded-full" />
							<Skeleton class="h-3 w-24 rounded" />
						</div>
						<Skeleton class="h-4 w-full rounded" />
						<Skeleton class="h-4 w-3/4 rounded" />
					</div>
				{/each}
			</div>
		{/snippet}

		{#snippet failed(error, reset)}
			<div class="m-4 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
				<p class="mb-3 text-sm text-muted-foreground">Posts could not be loaded.</p>
				<Button variant="outline" size="sm" onclick={reset}>Retry Posts</Button>
			</div>
		{/snippet}
	</svelte:boundary>
</div>
