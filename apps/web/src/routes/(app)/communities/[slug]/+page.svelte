<script lang="ts">
  import { page } from "$app/state";
  import { getCommunity, getCommunityPosts, joinCommunity, leaveCommunity } from "../communities.remote";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Separator } from "@lerno/ui/components/ui/separator";
  import { InfiniteFeed } from "@lerno/ui/components/feed";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import Users from "@lucide/svelte/icons/users";
  import Lock from "@lucide/svelte/icons/lock";
  import Calendar from "@lucide/svelte/icons/calendar";
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";

  const slug = page.params.slug;
  let activeTab = $state<"feed" | "members" | "exams">("feed");
  let joining = $state(false);

  // Data fetching
  const community = await getCommunity({ slug });
  
  // Feed state
  let extraPosts = $state<any[]>([]);
  let loadingMore = $state(false);

  async function loadMore() {
    if (loadingMore || activeTab !== "feed") return;
    loadingMore = true;
    try {
      const current = getCommunityPosts({ communityId: community.id }).current;
      const lastPost = current?.at(-1) ?? extraPosts.at(-1);
      const data = await getCommunityPosts({ communityId: community.id, cursor: lastPost?.createdAt?.toString() });
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
      toast.error("Action failed. Please try again.");
    } finally {
      joining = false;
    }
  }
</script>

<svelte:head>
  <title>{community?.name ?? "Community"} — Lerno</title>
</svelte:head>

<div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen pb-20">
  <svelte:boundary>
    <!-- Header Back Navigation -->
    <div class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-2.5 flex items-center gap-3">
      <a href="/communities" class="p-1.5 -ml-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft class="size-5" />
      </a>
      <h1 class="text-sm font-bold tracking-tight truncate">{community.name}</h1>
    </div>

    <!-- Banner & Header Info -->
    <div class="relative">
      <div class="h-32 w-full bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-900 dark:to-brand-800"></div>
      
      <div class="px-4 pb-4">
        <div class="flex items-end justify-between -mt-10 mb-4 gap-4">
          <div class="size-20 rounded-2xl bg-background border-4 border-background flex items-center justify-center text-4xl shadow-sm shrink-0">
            👥
          </div>
          <Button 
            variant={community.joined ? "outline" : "default"} 
            class="rounded-full shadow-sm"
            disabled={joining}
            onclick={handleToggleMembership}
          >
            {joining ? "…" : community.joined ? "Leave" : "Join Community"}
          </Button>
        </div>

        <div>
          <h1 class="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            {community.name}
            {#if community.isPrivate}
              <Lock class="size-4 text-muted-foreground/60" />
            {/if}
          </h1>
          <p class="text-sm text-muted-foreground mt-1 min-w-0 max-w-lg leading-relaxed">
            {community.description || "A study community for sharing resources and knowledge."}
          </p>
          
          <div class="flex items-center gap-3 mt-4 text-[11px] text-muted-foreground">
            <span class="flex items-center gap-1.5">
              <Users class="size-3.5" />
              <span class="font-bold text-foreground">{community.memberCount}</span> members
            </span>
            {#if community.courseCode}
              <Badge variant="outline" class="text-[10px] h-5 px-1.5 bg-muted/30">
                Course: {community.courseCode}
              </Badge>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex items-center px-2 border-y border-border/60 bg-muted/10">
      {#each [
        { id: "feed", label: "Discussions", icon: MessageSquare },
        { id: "exams", label: "Shared Exams", icon: Calendar },
        { id: "members", label: "Members", icon: Users }
      ] as tab}
        <button
          class="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors
                 {activeTab === tab.id
            ? 'border-brand-500 text-brand-600 dark:text-brand-400'
            : 'border-transparent text-muted-foreground hover:text-foreground'}"
          onclick={() => activeTab = tab.id as any}
        >
          <tab.icon class="size-3.5 hidden sm:block" />
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- Tab Content -->
    <div class="min-h-[400px]">
      {#if activeTab === "feed"}
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
              Failed to load discussions. <button class="underline ml-1" onclick={reset}>Retry</button>
            </div>
          {/snippet}
        </svelte:boundary>
      {:else if activeTab === "exams"}
        <div class="flex flex-col items-center justify-center py-20 text-center px-4">
          <div class="size-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
            <Calendar class="size-8 text-muted-foreground/40" />
          </div>
          <p class="text-sm font-bold text-foreground">Community Exam Schedule</p>
          <p class="text-[13px] text-muted-foreground mt-1 max-w-sm">
            Exams added here will automatically appear on the study calendars of all community members.
          </p>
          <Button variant="outline" class="mt-6 rounded-full text-xs h-8">
            Add Exam Date
          </Button>
        </div>
      {:else if activeTab === "members"}
        <div class="flex flex-col items-center justify-center py-20 text-center px-4">
          <div class="size-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
            <Users class="size-8 text-muted-foreground/40" />
          </div>
          <p class="text-sm font-bold text-foreground">Members List</p>
          <p class="text-[13px] text-muted-foreground mt-1">
            See everyone part of {community.name}.
          </p>
        </div>
      {/if}
    </div>

    {#snippet pending()}
      <div class="p-8 space-y-4">
        <div class="h-32 bg-muted/40 rounded-xl animate-pulse"></div>
        <div class="h-8 w-48 bg-muted/40 rounded animate-pulse"></div>
      </div>
    {/snippet}
    
    {#snippet failed(error, reset)}
      <div class="p-16 text-center text-muted-foreground">
        Community not found.
      </div>
    {/snippet}
  </svelte:boundary>
</div>
