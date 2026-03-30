<script lang="ts">
  import { useSession } from "$lib/auth.svelte";
  import { getProfile, getProfilePosts, toggleFollow } from "./profile.remote";
  import * as Avatar from "@lerno/ui/components/ui/avatar";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Separator } from "@lerno/ui/components/ui/separator";
  import { XpBadge } from "@lerno/ui/components/gamification";
  import { PostCard } from "@lerno/ui/components/feed";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import UserPlus from "@lucide/svelte/icons/user-plus";
  import UserCheck from "@lucide/svelte/icons/user-check";
  import CalendarDays from "@lucide/svelte/icons/calendar-days";
  import Flame from "@lucide/svelte/icons/flame";
  import Trophy from "@lucide/svelte/icons/trophy";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Settings from "@lucide/svelte/icons/settings";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";

  import { likePost, bookmarkPost, repostPost } from "../feed/feed.remote";

  const getSession = useSession();
  const session = $derived($getSession);
  const currentUser = $derived(session.data?.user);

  const paramUsername = $derived(page.params?.username);
  const targetUsername = $derived(paramUsername ?? currentUser?.username ?? "");

  const profile = await getProfile({ username: targetUsername });
  const posts = await getProfilePosts({ username: targetUsername });

  let activeTab = $state<"posts" | "replies" | "media" | "likes">("posts");
  let followLoading = $state(false);

  async function handleFollow(profile: any) {
    followLoading = true;
    try {
      await toggleFollow({ targetUserId: profile.id }).updates(
        getProfile({ username: targetUsername }).withOverride((p) =>
          p
            ? {
                ...p,
                isFollowing: !p.isFollowing,
                followers: p.followers + (p.isFollowing ? -1 : 1),
              }
            : p,
        ),
      );
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      followLoading = false;
    }
  }

  async function handleLike(postId: string, current: boolean) {
    try {
      await likePost({ postId }).updates(
        getProfilePosts({ username: targetUsername }).withOverride((data) =>
          data.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  liked: !current,
                  likeCount: (p.likeCount ?? 0) + (current ? -1 : 1),
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
        getProfilePosts({ username: targetUsername }).withOverride((data) =>
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
        getProfilePosts({ username: targetUsername }).withOverride((data) =>
          data.map((p) =>
            p.id === postId
              ? { ...p, repostCount: (p.repostCount ?? 0) + 1 }
              : p,
          ),
        ),
      );
      toast.success("Reposted!");
    } catch {
      toast.error("Failed to repost");
    }
  }

  function joinDate(iso: string) {
    return new Date(iso).toLocaleDateString("en", {
      month: "long",
      year: "numeric",
    });
  }
</script>

<svelte:head>
  <title
    >{profile.isOwnProfile ? "Your Profile" : `@${profile.username}`} — Lerno</title
  >
</svelte:head>

<div
  class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen"
>
  <!-- Profile Header Boundary -->
  <svelte:boundary>
    <div
      class="h-32 sm:h-44 bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-500 relative overflow-hidden"
    >
      <div
        class="absolute inset-0 opacity-20"
        style="background-image: repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%); background-size: 12px 12px;"
      ></div>
    </div>

    <div class="px-4 pb-4 relative">
      <div class="flex items-end justify-between -mt-10 mb-3">
        <Avatar.Root class="size-20 ring-4 ring-background shadow-lg">
          <Avatar.Image src={profile.avatarUrl} alt={profile.displayName} />
          <Avatar.Fallback class="bg-brand-500 text-white font-black text-2xl">
            {(profile.displayName ?? profile.username ?? "?")[0].toUpperCase()}
          </Avatar.Fallback>
        </Avatar.Root>
        <div class="flex items-center gap-2 pb-1">
          {#if profile.isOwnProfile}
            <Button
              variant="outline"
              size="sm"
              class="h-8 text-xs rounded-full gap-1.5"
              onclick={() => goto("/settings")}
            >
              <Settings class="size-3.5" />Edit profile
            </Button>
          {:else}
            <Button
              size="sm"
              variant={profile.isFollowing ? "outline" : "default"}
              class="h-8 text-xs rounded-full gap-1.5"
              disabled={followLoading}
              onclick={() => handleFollow(profile)}
            >
              {#if profile.isFollowing}
                <UserCheck class="size-3.5" />Following
              {:else}
                <UserPlus class="size-3.5" />Follow
              {/if}
            </Button>
          {/if}
        </div>
      </div>

      <div class="space-y-1.5">
        <div class="flex items-center gap-2 flex-wrap">
          <h1 class="text-xl font-black text-foreground leading-tight">
            {profile.displayName ?? profile.username}
          </h1>
          <XpBadge xp={profile.xp ?? 0} />
        </div>
        <p class="text-sm text-muted-foreground">@{profile.username}</p>
        {#if profile.bio}
          <p class="text-sm text-foreground leading-relaxed mt-2">
            {profile.bio}
          </p>
        {/if}
        <div
          class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2"
        >
          {#if profile.createdAt}
            <span class="flex items-center gap-1"
              ><CalendarDays class="size-3" />Joined {joinDate(
                profile.createdAt,
              )}</span
            >
          {/if}
          {#if profile.streakDays}
            <span class="flex items-center gap-1 text-brand-500"
              ><Flame class="size-3 text-streak-fire" />{profile.streakDays}d
              streak</span
            >
          {/if}
        </div>
        <div class="flex items-center gap-5 mt-3 text-sm">
          <button class="hover:underline underline-offset-2">
            <span class="font-bold text-foreground">{profile.following}</span>
            <span class="text-muted-foreground ml-1">Following</span>
          </button>
          <button class="hover:underline underline-offset-2">
            <span class="font-bold text-foreground">{profile.followers}</span>
            <span class="text-muted-foreground ml-1">Followers</span>
          </button>
          <div
            class="ml-auto flex items-center gap-1 text-xs text-muted-foreground"
          >
            <Trophy class="size-3.5 text-amber-400" />
            <span class="font-bold text-foreground"
              >{((profile.xp ?? 0) / 1000).toFixed(1)}K</span
            > XP
          </div>
        </div>
      </div>
    </div>

    <Separator />    {#snippet pending()}
      <div class="px-4 pb-4 space-y-4 pt-20">
        <Skeleton class="h-6 w-48 rounded" />
        <Skeleton class="h-4 w-32 rounded" />
        <Skeleton class="h-4 w-full rounded" />
      </div>
    {/snippet}
  </svelte:boundary>

  <!-- Tabs & Posts Boundary -->
  <svelte:boundary>
    <div class="flex border-b border-border/50">
      {#each [{ value: "posts" as const, label: "Posts" }, { value: "replies" as const, label: "Replies" }, { value: "media" as const, label: "Media" }, { value: "likes" as const, label: "Likes" }] as tab}
        <button
          class="flex-1 py-3 text-sm font-medium border-b-2 transition-colors
                 {activeTab === tab.value ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-muted-foreground hover:text-foreground'}"
          onclick={() => (activeTab = tab.value)}
        >
          {tab.label}
          {#if tab.value === "posts" && profile.posts > 0}
            <span class="text-xs text-muted-foreground ml-1">({profile.posts})</span>
          {/if}
        </button>
      {/each}
    </div>

    {@const posts = await getProfilePosts({ username: targetUsername })}
    {#if activeTab === "posts"}
      {#each posts as post, i (post.id)}
        <PostCard
          post={{
            ...post,
            author: { name: profile.displayName, username: profile.username, image: profile.avatarUrl },
          }}
          index={i}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onRepost={handleRepost}
        />
      {:else}
        <div class="flex flex-col items-center gap-3 py-16 text-center">
          <BookOpen class="size-8 text-muted-foreground/30" />
          <p class="text-sm text-muted-foreground">No posts yet.</p>
        </div>
      {/each}
    {:else}
      <div class="flex flex-col items-center gap-3 py-16 text-center">
        <BookOpen class="size-8 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">Nothing here yet.</p>
      </div>
    {/if}

    {#snippet pending()}
      <div class="divide-y divide-border/60">
        {#each Array(3) as _}
          <div class="px-4 py-3 space-y-3">
            <div class="flex items-center gap-2">
              <Skeleton class="size-8 rounded-full" />
              <Skeleton class="h-3 w-24 rounded" />
            </div>
            <Skeleton class="h-4 w-full rounded" />
          </div>
        {/each}
      </div>
    {/snippet}

    {#snippet failed(error, reset)}
      <div
        class="p-8 text-center bg-muted/20 border border-dashed border-border m-4 rounded-xl"
      >
        <p class="text-sm text-muted-foreground mb-3">Posts failed to load.</p>
        <Button variant="outline" size="sm" onclick={reset}>Retry Posts</Button>
      </div>
    {/snippet}
  </svelte:boundary>
</div>
