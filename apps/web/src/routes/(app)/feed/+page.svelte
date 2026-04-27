<script lang="ts">
  import { useSession } from "$lib/auth.svelte";
  import {
    getFeed,
    createPost,
    likePost,
    bookmarkPost,
    repostPost,
    deletePost,
  } from "./feed.remote";
  import { InfiniteFeed, PostComposer } from "@lerno/ui/components/feed";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Separator } from "@lerno/ui/components/ui/separator";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import TrendingUp from "@lucide/svelte/icons/trending-up";
  import UserIcon from "@lucide/svelte/icons/users";

  const getSession = useSession();
  const session = $derived($getSession);
  const user = $derived(session.data?.user);

  let activeTab = $state("for-you");
  let extraPosts = $state<any[]>([]);
  let loadingMore = $state(false);

  async function loadMore() {
    if (loadingMore) return;
    loadingMore = true;
    try {
      const current = getFeed({}).current;
      const lastPost = current?.posts?.at(-1) ?? extraPosts.at(-1);
      const data = await getFeed({ cursor: lastPost?.createdAt?.toString() });
      extraPosts = [...extraPosts, ...(data?.posts ?? [])];
    } finally {
      loadingMore = false;
    }
  }

  async function handlePost(evt: { postType: string; content: any }) {
    const optimisticPost = {
      id: crypto.randomUUID(),
      postType: evt.postType,
      content: evt.content,
      author: {
        name: user?.name,
        username: user?.email?.split("@")[0],
        image: user?.image,
      },
      likeCount: 0,
      replyCount: 0,
      repostCount: 0,
      liked: false,
      bookmarked: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await createPost({
        postType: evt.postType as any,
        content: evt.content,
      }).updates(
        getFeed({}).withOverride((current) => ({
          posts: [optimisticPost, ...(current?.posts ?? [])],
          nextCursor: current?.nextCursor,
        })),
      );
      toast.success("Post shared!");
    } catch {
      toast.error("Failed to post. Please try again.");
    }
  }

  async function handleLike(postId: string, current: boolean) {
    try {
      await likePost({ postId }).updates(
        getFeed({}).withOverride((data) => ({
          ...data,
          posts: data.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  liked: !current,
                  likeCount: p.likeCount + (current ? -1 : 1),
                }
              : p,
          ),
        })),
      );
    } catch {
      toast.error("Failed to update like");
    }
  }

  async function handleBookmark(postId: string, current: boolean) {
    try {
      await bookmarkPost({ postId }).updates(
        getFeed({}).withOverride((data) => ({
          ...data,
          posts: data.posts.map((p) =>
            p.id === postId ? { ...p, bookmarked: !current } : p,
          ),
        })),
      );
    } catch {
      toast.error("Failed to update bookmark");
    }
  }

  async function handleRepost(postId: string) {
    try {
      await repostPost({ postId }).updates(
        getFeed({}).withOverride((data) => ({
          ...data,
          posts: data.posts.map((p) =>
            p.id === postId ? { ...p, repostCount: p.repostCount + 1 } : p,
          ),
        })),
      );
      toast.success("Reposted!");
    } catch {
      toast.error("Failed to repost");
    }
  }

  async function handleDelete(postId: string) {
    try {
      await deletePost({ postId }).updates(
        getFeed({}).withOverride((data) => ({
          ...data,
          posts: data.posts.filter((p) => p.id !== postId),
        })),
      );
      extraPosts = extraPosts.filter((p) => p.id !== postId);
      toast.success("Post deleted");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete post");
    }
  }
</script>

<svelte:head>
  <title>Feed — Lerno</title>
  <meta name="description" content="Your personalized academic study feed" />
</svelte:head>

<div
  class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen"
>
  <!-- Header -->
  <div
    class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border"
  >
    <div class="flex items-center justify-between px-4 py-3">
      <h1 class="text-lg font-bold tracking-tight">Home</h1>
      <Button
        variant="ghost"
        size="icon"
        class="size-9 text-brand-500"
        onclick={() => getFeed({}).refresh()}
      >
        <Sparkles class="size-4" />
      </Button>
    </div>
    <div class="flex border-b border-border/50 px-2">
      {#each [{ value: "for-you", label: "For You", icon: Sparkles }, { value: "following", label: "Following", icon: UserIcon }, { value: "trending", label: "Trending", icon: TrendingUp }] as tab}
        <button
          class="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors
                 {activeTab === tab.value
            ? 'border-brand-500 text-brand-600 dark:text-brand-400'
            : 'border-transparent text-muted-foreground hover:text-foreground'}"
          onclick={() => (activeTab = tab.value)}
        >
          <tab.icon class="size-3.5 hidden sm:block" />
          {tab.label}
          {#if tab.value === "for-you"}
            <Badge
              variant="secondary"
              class="text-[10px] px-1.5 h-4 ml-0.5 hidden sm:flex">AI</Badge
            >
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <PostComposer {user} onPost={handlePost} />
  <Separator />

  <svelte:boundary>
    {@const feed = await getFeed({})}
    {@const allPosts = [...(feed.posts ?? []), ...extraPosts]}

    <InfiniteFeed
      posts={allPosts}
      loading={false}
      {loadingMore}
      hasMore={!!feed.nextCursor}
      onLoadMore={loadMore}
      currentUserId={user?.id}
      onDelete={handleDelete}
    />

    {#snippet pending()}
      {#each Array(4) as _}
        <div class="px-4 py-3 border-b border-border/60 space-y-3">
          <div class="flex items-center gap-2">
            <Skeleton class="size-9 rounded-full" />
            <div class="space-y-1.5 flex-1">
              <Skeleton class="h-3 w-24 rounded" />
              <Skeleton class="h-2.5 w-16 rounded" />
            </div>
          </div>
          <Skeleton class="h-4 w-full rounded" />
          <Skeleton class="h-4 w-3/4 rounded" />
        </div>
      {/each}
    {/snippet}

    {#snippet failed(error, reset)}
      <div class="flex flex-col items-center gap-3 py-16 text-center px-4">
        <Sparkles class="size-10 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">Could not load feed.</p>
        <button class="text-sm text-brand-500 underline" onclick={reset}
          >Retry</button
        >
      </div>
    {/snippet}
  </svelte:boundary>
</div>
