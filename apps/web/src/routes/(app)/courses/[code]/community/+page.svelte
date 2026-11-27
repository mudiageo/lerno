<script lang="ts">
	import { page } from '$app/state';
	import {
		getCommunity,
		getCommunityPosts,
		joinCommunity,
		leaveCommunity
	} from '../../../communities/communities.remote';
	import { getCourseStats } from '../../courses.remote';
	import { Button } from '@lerno/ui/components/ui/button';
	import { Badge } from '@lerno/ui/components/ui/badge';
	import { Skeleton } from '@lerno/ui/components/ui/skeleton';
	import { toast } from '@lerno/ui/components/ui/sonner';
	import Users from '@lucide/svelte/icons/users';
	import Plus from '@lucide/svelte/icons/plus';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Heart from '@lucide/svelte/icons/heart';
	import Clock from '@lucide/svelte/icons/clock';

	const courseCode = page.params.code;
	const stats = await getCourseStats({ courseCode });

	const community = stats.community;
	let communityPosts: any[] = [];
	let joined = false;
	let toggling = $state(false);

	if (community) {
		const detail = await getCommunity({ slug: community.slug ?? '' });
		joined = detail.joined;
		communityPosts = await getCommunityPosts({ communityId: community.id });
	}

	async function handleToggle() {
		if (!community) return;
		toggling = true;
		try {
			if (joined) {
				await leaveCommunity({ communityId: community.id });
				joined = false;
				toast.success('Left community');
			} else {
				await joinCommunity({ communityId: community.id });
				joined = true;
				toast.success('Joined community!');
			}
		} catch (e: any) {
			toast.error(e.message ?? 'Action failed');
		} finally {
			toggling = false;
		}
	}

	function timeAgo(iso: string) {
		const diff = Date.now() - new Date(iso).getTime();
		const m = Math.floor(diff / 60000);
		if (m < 1) return 'just now';
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		return `${Math.floor(h / 24)}d ago`;
	}
</script>

<div class="space-y-5 px-4 py-5">
	{#if !community}
		<!-- No community linked -->
		<div class="flex flex-col items-center gap-5 py-16 text-center">
			<div class="flex size-16 items-center justify-center rounded-2xl bg-muted">
				<Users class="size-8 text-muted-foreground/40" />
			</div>
			<div>
				<h3 class="text-base font-bold text-foreground">No community yet</h3>
				<p class="mt-1 max-w-xs text-sm text-muted-foreground">
					Create a community for {courseCode} students to share notes, ask questions, and study together.
				</p>
			</div>
			<a href="/communities">
				<Button class="gap-2">
					<Plus class="size-4" />
					Create Community
				</Button>
			</a>
		</div>
	{:else}
		<!-- Community header -->
		<div class="overflow-hidden rounded-2xl border border-border bg-card">
			{#if community.bannerUrl}
				<img src={community.bannerUrl} alt="Banner" class="h-24 w-full object-cover" />
			{:else}
				<div class="h-20 w-full bg-gradient-to-br from-brand-400 to-brand-600"></div>
			{/if}
			<div class="-mt-5 flex items-end justify-between gap-3 px-4 pb-4">
				<div
					class="flex size-14 items-center justify-center rounded-2xl border-2 border-background bg-white text-2xl shadow-lg dark:bg-background"
				>
					👥
				</div>
				<Button
					size="sm"
					variant={joined ? 'outline' : 'default'}
					class="h-8 rounded-full text-xs"
					disabled={toggling}
					onclick={handleToggle}
				>
					{toggling ? '…' : joined ? 'Leave' : 'Join'}
				</Button>
			</div>
			<div class="px-4 pb-3">
				<a
					href="/communities/{community.slug}"
					class="text-base font-bold text-foreground hover:underline"
				>
					{community.name}
				</a>
				<p class="mt-0.5 text-xs text-muted-foreground">
					{community.memberCount} members · {courseCode}
				</p>
			</div>
		</div>

		<!-- Community feed preview -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<p class="text-sm font-bold text-foreground">Recent Posts</p>
				<a href="/communities/{community.slug}" class="text-xs text-brand-500 hover:underline"
					>See all</a
				>
			</div>

			{#if communityPosts.length === 0}
				<div
					class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center"
				>
					<MessageCircle class="size-8 text-muted-foreground/30" />
					<p class="text-xs text-muted-foreground">No posts yet. Be the first!</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each communityPosts.slice(0, 5) as post (post.id)}
						<div
							class="rounded-xl border border-border/70 bg-card p-3.5 transition-colors hover:bg-accent/30"
						>
							<div class="mb-2 flex items-center gap-2">
								<div
									class="flex size-7 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-bold text-brand-600 dark:bg-brand-950/40"
								>
									{#if post.author?.image}
										<img src={post.author.image} alt="Avatar" class="size-full object-cover" />
									{:else}
										{(post.author?.name ?? '?')[0]}
									{/if}
								</div>
								<span class="text-xs font-medium text-foreground"
									>{post.author?.name ?? 'Unknown'}</span
								>
								<span class="ml-auto text-[11px] text-muted-foreground"
									>{timeAgo(post.createdAt)}</span
								>
							</div>
							<p class="line-clamp-3 text-sm text-foreground">
								{post.content?.body ?? post.content?.question ?? post.content?.front ?? 'View post'}
							</p>
							<div class="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
								<span class="flex items-center gap-1"
									><Heart class="size-3" />{post.likeCount ?? 0}</span
								>
								<span class="flex items-center gap-1"
									><MessageCircle class="size-3" />{post.replyCount ?? 0}</span
								>
								<Badge variant="outline" class="ml-auto h-4 px-1 text-[10px]">{post.postType}</Badge
								>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
