<script lang="ts">
  import { page } from "$app/state";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import {
    getProfile as getUserProfile,
    getProfilePosts as getUserPosts,
    toggleFollow
  } from "../profile.remote";
  import { likePost, bookmarkPost, repostPost } from "../../feed/feed.remote";
  import { PostCard } from "@lerno/ui/components/feed";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Separator } from "@lerno/ui/components/ui/separator";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Calendar from "@lucide/svelte/icons/calendar";
  import MapPin from "@lucide/svelte/icons/map-pin";
  import LinkIcon from "@lucide/svelte/icons/link";

  // Profile data fetch (Top-level blocks rendering)
  let initialProfile = await getUserProfile({ username: page.params.username });
  let profileData = $state(initialProfile);
  const posts = await getUserPosts({ username: page.params.username });

  let activeTab = $state<"posts" | "replies" | "highlights">("posts");

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
      toast.error("Failed to update follow status");
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
                  likeCount: p.likeCount + (current ? -1 : 1),
                }
              : p,
          ),
        ),
      );
    } catch {
      toast.error("Failed to update like");
    }
  }

  async function handleBookmark(postId: string, current: boolean) {
    try {
      await bookmarkPost({ postId }).updates(
        getUserPosts({ username: page.params.username }).withOverride((data) =>
          data.map((p) =>
            p.id === postId ? { ...p, bookmarked: !current } : p,
          ),
        ),
      );
    } catch {
      toast.error("Failed to update bookmark");
    }
  }

  async function handleRepost(postId: string) {
    try {
      await repostPost({ postId }).updates(
        getUserPosts({ username: page.params.username }).withOverride((data) =>
          data.map((p) =>
            p.id === postId ? { ...p, repostCount: p.repostCount + 1 } : p,
          ),
        ),
      );
      toast.success("Reposted!");
    } catch {
      toast.error("Failed to repost");
    }
  }
</script>

<svelte:head>
  <title>{profile.name} (@{profile.username}) — Lerno</title>
</svelte:head>

<div
  class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen"
>
  <!-- Profile Header Boundary -->
  <svelte:boundary
    onerror={(e, r) => {
      console.log(e);
    }}
  >
    <div
      class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-4"
    >
      <a
        href="/feed"
        class="size-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
      >
        <ArrowLeft class="size-4" />
      </a>
      <div>
        <h1 class="text-base font-bold leading-tight">{profile.name}</h1>
        <p class="text-[11px] text-muted-foreground">
          {profile.postsCount} posts
        </p>
      </div>
    </div>

    <div class="relative">
      <div class="h-32 bg-muted/30 w-full relative group">
        {#if profile.coverImage}
          <img
            src={profile.coverImage}
            alt="Cover"
            class="w-full h-full object-cover"
          />
        {/if}
      </div>
      <div
        class="px-4 -mt-12 mb-4 relative z-10 flex items-end justify-between"
      >
        <div
          class="size-24 rounded-full border-4 border-background bg-muted shadow-sm overflow-hidden"
        >
          {#if profileData.image ?? profileData.avatarUrl}
            <img
              src={profileData.image ?? profileData.avatarUrl}
              alt={profileData.name ?? profileData.displayName}
              class="w-full h-full object-cover"
            />
          {:else}
            <div
              class="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground/30"
            >
              {(profileData.name ?? profileData.displayName ?? "U").slice(0, 1).toUpperCase()}
            </div>
          {/if}
        </div>
        {#if profileData.isOwnProfile}
          <Button
            variant="outline"
            size="sm"
            class="rounded-full h-8 px-4 font-bold text-xs">Edit profile</Button>
        {:else}
          <Button
            variant={profileData.isFollowing ? "outline" : "default"}
            size="sm"
            class="rounded-full h-8 px-4 font-bold text-xs {profileData.isFollowing ? '' : 'bg-brand-500 hover:bg-brand-600 text-white'}"
            onclick={handleToggleFollow}
          >
            {profileData.isFollowing ? "Following" : "Follow"}
          </Button>
        {/if}
      </div>
    </div>

    <div class="px-4 space-y-3 mb-4">
      <div>
        <h2 class="text-xl font-black text-foreground">{profileData.name ?? profileData.displayName}</h2>
        <p class="text-sm text-muted-foreground">@{profileData.username}</p>
      </div>
      <p class="text-[13px] leading-relaxed">{profileData.bio}</p>
      <div
        class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
      >
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
            <LinkIcon class="size-3" />{profileData.website.replace(
              /^https?:\/\//,
              "",
            )}
          </a>
        {/if}
        <div class="flex items-center gap-1">
          <Calendar class="size-3" />Joined {new Date(
            profileData.createdAt,
          ).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </div>
      </div>
      <div class="flex items-center gap-4 text-xs">
        <button class="hover:underline">
          <span class="font-bold text-foreground">{profileData.following}</span
          >
          <span class="text-muted-foreground"> Following</span>
        </button>
        <button class="hover:underline">
          <span class="font-bold text-foreground">{profileData.followers}</span
          >
          <span class="text-muted-foreground"> Followers</span>
        </button>
      </div>
    </div>

    <!-- Dual boundaries for tabs/content if desired -->
    <div class="flex border-b border-border/50">
      {#each ["posts", "replies", "highlights"] as tab}
        <button
          class="flex-1 py-3 text-sm font-medium border-b-2 transition-colors capitalize
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
      <div class="p-4 space-y-4 animate-pulse">
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
          <div class="p-4 space-y-3">
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
      <div
        class="p-8 text-center bg-muted/20 rounded-xl m-4 border border-dashed border-border"
      >
        <p class="text-sm text-muted-foreground mb-3">
          Posts could not be loaded.
        </p>
        <Button variant="outline" size="sm" onclick={reset}>Retry Posts</Button>
      </div>
    {/snippet}
  </svelte:boundary>
</div>
