<script lang="ts">
  import {
    getCommunities,
    joinCommunity,
    leaveCommunity,
  } from "./communities.remote";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Input } from "@lerno/ui/components/ui/input";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import Search from "@lucide/svelte/icons/search";
  import Plus from "@lucide/svelte/icons/plus";
  import Users from "@lucide/svelte/icons/users";
  import Lock from "@lucide/svelte/icons/lock";

  let searchQuery = $state("");
  let joining = $state<Record<string, boolean>>({});

  // Top-level await for communities
  const allCommunities = await getCommunities({});
  const filtered = $derived(
    allCommunities.filter(
      (c: any) =>
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  async function handleToggleMembership(community: any) {
    joining[community.id] = true;
    try {
      if (community.joined) {
        await leaveCommunity({ communityId: community.id }).updates(
          getCommunities({}).withOverride((list) =>
            list?.map((c: any) =>
              c.id === community.id
                ? {
                    ...c,
                    joined: false,
                    memberCount: Math.max(0, (c.memberCount ?? 0) - 1),
                  }
                : c,
            ),
          ),
        );
      } else {
        await joinCommunity({ communityId: community.id }).updates(
          getCommunities({}).withOverride((list) =>
            list?.map((c: any) =>
              c.id === community.id
                ? { ...c, joined: true, memberCount: (c.memberCount ?? 0) + 1 }
                : c,
            ),
          ),
        );
      }
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      joining[community.id] = false;
    }
  }

  function formatCount(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n ?? 0);
  }
</script>

<svelte:head>
  <title>Communities — Lerno</title>
  <meta
    name="description"
    content="Join study communities for your courses and subjects."
  />
</svelte:head>

<div
  class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen"
>
  <svelte:boundary>
    <div
      class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between gap-3"
    >
      <h1
        class="text-lg font-bold tracking-tight flex items-center gap-2 shrink-0"
      >
        <Users class="size-5" />
        Communities
      </h1>
      <Button size="sm" class="h-8 gap-1.5 text-xs shrink-0">
        <Plus class="size-3.5" />
        Create
      </Button>
    </div>

    <div class="px-4 py-3 border-b border-border/60">
      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        />
        <Input
          class="pl-9 h-9 text-sm"
          placeholder="Search communities…"
          bind:value={searchQuery}
        />
      </div>
    </div>

    <div class="divide-y divide-border/60">
      {#each filtered as community (community.id)}
        <div
          class="flex items-start gap-3 px-4 py-4 hover:bg-accent/40 transition-colors"
        >
          <a
            href="/communities/{community.slug}"
            class="size-12 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center text-2xl shrink-0"
          >
            👥
          </a>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <a
                    href="/communities/{community.slug}"
                    class="text-sm font-bold text-foreground hover:underline"
                    >{community.name}</a
                  >
                  {#if community.isPrivate}
                    <Lock class="size-3 text-muted-foreground/60 shrink-0" />
                  {/if}
                  {#if community.joined}
                    <Badge variant="secondary" class="text-[10px] h-4 px-1.5"
                      >Joined</Badge
                    >
                  {/if}
                </div>
                <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {community.description}
                </p>
              </div>
              <Button
                size="sm"
                variant={community.joined ? "outline" : "default"}
                class="h-7 text-xs shrink-0 rounded-full"
                disabled={joining[community.id]}
                onclick={() => handleToggleMembership(community)}
              >
                {joining[community.id]
                  ? "…"
                  : community.joined
                    ? "Leave"
                    : "Join"}
              </Button>
            </div>
            <div
              class="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground"
            >
              <span
                ><span class="font-bold text-foreground"
                  >{formatCount(community.memberCount)}</span
                > members</span
              >
              {#each community.tags ?? [] as tag}
                <Badge variant="outline" class="text-[10px] h-4 px-1"
                  >{tag}</Badge
                >
              {/each}
              {#if community.courseCode}
                <Badge variant="outline" class="text-[10px] h-4 px-1"
                  >{community.courseCode}</Badge
                >
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div class="flex flex-col items-center gap-3 py-16 text-center">
          <Users class="size-10 text-muted-foreground/40" />
          <p class="text-sm text-muted-foreground">
            {searchQuery
              ? `No communities found for "${searchQuery}"`
              : "No communities yet."}
          </p>
        </div>
      {/each}
    </div>

    {#snippet pending()}
      <div class="divide-y divide-border/60">
        {#each Array(5) as _}
          <div class="flex items-start gap-3 px-4 py-4">
            <Skeleton class="size-12 rounded-2xl shrink-0" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-32 rounded" />
              <Skeleton class="h-3 w-full rounded" />
              <Skeleton class="h-3 w-24 rounded" />
            </div>
            <Skeleton class="h-7 w-14 rounded-full shrink-0" />
          </div>
        {/each}
      </div>
    {/snippet}

    {#snippet failed(error, reset)}
      <div class="flex flex-col items-center gap-3 py-16 text-center">
        <Users class="size-10 text-muted-foreground/40" />
        <p class="text-sm text-muted-foreground">Could not load communities.</p>
        <Button
          variant="ghost"
          size="sm"
          class="text-brand-500 underline"
          onclick={reset}>Retry</Button
        >
      </div>
    {/snippet}
  </svelte:boundary>
</div>
