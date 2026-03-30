<script lang="ts">
  import { page } from "$app/state";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import { getCommunity, getCommunityPosts, joinCommunity, leaveCommunity } from "../communities.remote";
  import { likePost, bookmarkPost, repostPost } from "../../feed/feed.remote";
  import { PostCard } from "@lerno/ui/components/feed";

  const slug = $derived(page.params.id);

  // Top-level awaits
  const community = await getCommunity({ slug });
  const posts = await getCommunityPosts({ slug });

  let activeTab = $state<"posts" | "members" | "about">("posts");
  let joinLoading = $state(false);

  async function handleJoin() {
    joinLoading = true;
    try {
      const isJoined = community.joined;
      if (isJoined) {
        await leaveCommunity({ communityId: community.id }).updates(
          getCommunity({ slug }).withOverride(c => c ? { ...c, joined: false, members: Math.max(0, c.members - 1) } : c)
        );
      } else {
        await joinCommunity({ communityId: community.id }).updates(
          getCommunity({ slug }).withOverride(c => c ? { ...c, joined: true, members: c.members + 1 } : c)
        );
      }
    } catch {
      toast.error("Action failed");
    } finally {
      joinLoading = false;
    }
  }

  async function handleLike(postId: string, current: boolean) {
    try {
      await likePost({ postId }).updates(
        getCommunityPosts({ slug }).withOverride((data) => 
          data.map(p => p.id === postId 
            ? { ...p, liked: !current, likeCount: (p.likeCount ?? 0) + (current ? -1 : 1) }
            : p
          )
        )
      );
    } catch {
      toast.error("Failed to update like");
    }
  }

  async function handleBookmark(postId: string, current: boolean) {
    try {
      await bookmarkPost({ postId }).updates(
        getCommunityPosts({ slug }).withOverride((data) => 
          data.map(p => p.id === postId 
            ? { ...p, bookmarked: !current }
            : p
          )
        )
      );
    } catch {
      toast.error("Failed to update bookmark");
    }
  }

  async function handleRepost(postId: string) {
    try {
      await repostPost({ postId }).updates(
        getCommunityPosts({ slug }).withOverride((data) => 
          data.map(p => p.id === postId 
            ? { ...p, repostCount: (p.repostCount ?? 0) + 1 }
            : p
          )
        )
      );
      toast.success("Reposted!");
    } catch {
      toast.error("Failed to repost");
    }
  }
</script>

<svelte:head>
  <title>{community.name} — Lerno Communities</title>
</svelte:head>

<svelte:boundary>
  <div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen">
    <!-- Header -->
    <div class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
      <a href="/communities" class="size-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
        <ArrowLeft class="size-4" />
      </a>
      <h1 class="text-base font-bold text-foreground flex-1 truncate">{community.name}</h1>
      <Button 
        size="sm" 
        class="h-8 text-xs gap-1.5 shrink-0 rounded-full" 
        variant={community.joined ? "outline" : "default"}
        disabled={joinLoading}
        onclick={handleJoin}
      >
        {community.joined ? "Joined ✓" : "Join"}
      </Button>
    </div>

    <!-- Community banner -->
    <div class="px-4 py-4 border-b border-border/60">
      <div class="flex items-start gap-3">
        <div class="size-14 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center text-3xl shrink-0">
          {community.emoji}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <h2 class="text-base font-black text-foreground">{community.name}</h2>
            {#if community.isPrivate}
              <Lock class="size-3.5 text-muted-foreground" />
            {/if}
          </div>
          <p class="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{community.description}</p>
          <div class="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span class="flex items-center gap-1"><Users class="size-3" />{community.members >= 1000 ? (community.members / 1000).toFixed(1) + 'K' : community.members} members</span>
            {#each community.tags as tag}
              <Badge variant="outline" class="text-[10px] h-4 px-1.5">{tag}</Badge>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-border/50">
      {#each [
        { value: "posts" as const, label: "Posts" },
        { value: "members" as const, label: "Members" },
        { value: "about" as const, label: "About" },
      ] as tab}
        <button
          class="flex-1 py-3 text-sm font-medium border-b-2 transition-colors
                 {activeTab === tab.value ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-muted-foreground hover:text-foreground'}"
          onclick={() => (activeTab = tab.value)}
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- Tab content -->
    {#if activeTab === "posts"}
      <!-- Compose bar -->
      <a href="/feed" class="flex items-center gap-3 px-4 py-3 border-b border-border/60 hover:bg-accent/40 transition-colors cursor-pointer">
        <div class="size-8 rounded-full bg-brand-100 dark:bg-brand-950/30 flex items-center justify-center shrink-0">
          <PenSquare class="size-4 text-brand-600 dark:text-brand-400" />
        </div>
        <span class="text-sm text-muted-foreground">Share something with the community…</span>
      </a>

      <!-- Posts -->
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
            <p class="text-sm text-muted-foreground">No posts in this community yet.</p>
          </div>
        {/each}
      </div>

    {:else if activeTab === "members"}
      <div class="p-4 space-y-3">
        <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Moderators</p>
        {#each community.moderators as mod}
          <div class="flex items-center gap-2.5">
            <Avatar.Root class="size-8 shrink-0">
              <Avatar.Fallback class="bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 font-bold text-xs">{mod[0]}</Avatar.Fallback>
            </Avatar.Root>
            <span class="text-sm font-medium text-foreground">{mod}</span>
            <Badge variant="secondary" class="text-[10px] ml-auto">Mod</Badge>
          </div>
        {/each}
        <Separator />
        <p class="text-xs text-muted-foreground">{(community.members / 1000).toFixed(1)}K members total</p>
      </div>

    {:else}
      <div class="p-4 space-y-4 text-sm">
        <div>
          <p class="font-bold text-foreground mb-1">About</p>
          <p class="text-muted-foreground leading-relaxed">{community.description}</p>
        </div>
        <div>
          <p class="font-bold text-foreground mb-1.5">Tags</p>
          <div class="flex gap-1.5">
            {#each community.tags as tag}
              <Badge variant="outline">{tag}</Badge>
            {/each}
          </div>
        </div>
        <div>
          <p class="font-bold text-foreground mb-1">Community Rules</p>
          <ol class="list-decimal list-inside space-y-1 text-muted-foreground text-xs leading-relaxed">
            <li>Be respectful and constructive in all interactions.</li>
            <li>Only post content relevant to the community subject.</li>
            <li>Cite your sources when sharing facts or research.</li>
            <li>No spam, promotional content, or off-topic posts.</li>
            <li>Mark questions as answered when resolved.</li>
          </ol>
        </div>
      </div>
    {/if}
  </div>

  {#snippet pending()}
    <div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen">
      <div class="animate-pulse">
        <div class="h-14 border-b border-border flex items-center px-4 gap-3">
          <div class="size-8 rounded-full bg-muted"></div>
          <div class="h-4 w-32 bg-muted rounded"></div>
        </div>
        <div class="p-4 border-b border-border flex items-start gap-4">
          <div class="size-14 rounded-2xl bg-muted shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-5 w-40 bg-muted rounded"></div>
            <div class="h-4 w-full bg-muted rounded"></div>
            <div class="h-4 w-2/3 bg-muted rounded"></div>
          </div>
        </div>
        <div class="divide-y divide-border/60">
          {#each Array(3) as _}
            <div class="px-4 py-3 space-y-3">
              <div class="flex items-center gap-2">
                <div class="size-8 rounded-full bg-muted"></div>
                <div class="h-3 w-24 bg-muted rounded"></div>
              </div>
              <div class="h-4 w-full bg-muted rounded"></div>
              <div class="h-4 w-3/4 bg-muted rounded"></div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/snippet}

  {#snippet failed(error, reset)}
    <div class="flex flex-col items-center gap-3 py-16 text-center px-4">
      <p class="text-sm text-muted-foreground">Failed to load community info.</p>
      <Button variant="ghost" size="sm" class="text-brand-500 underline" onclick={reset}>Retry</Button>
    </div>
  {/snippet}
</svelte:boundary>
