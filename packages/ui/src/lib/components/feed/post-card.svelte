<script lang="ts">
  import Heart from "@lucide/svelte/icons/heart";
  import MessageCircle from "@lucide/svelte/icons/message-circle";
  import Repeat2 from "@lucide/svelte/icons/repeat-2";
  import Bookmark from "@lucide/svelte/icons/bookmark";
  import Share2 from "@lucide/svelte/icons/share-2";
  import Ellipsis from "@lucide/svelte/icons/ellipsis";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import * as Avatar from "$lib/components/ui/avatar";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import QuizPost from "./quiz-post.svelte";
  import FlashcardPost from "./flashcard-post.svelte";
  import PollPost from "./poll-post.svelte";

  interface Post {
    id: string;
    postType: "text" | "quiz" | "flashcard" | "poll" | "image" | "link";
    content: any;
    author?: { name?: string; username?: string; image?: string };
    courseCode?: string;
    topicTags?: string[];
    likeCount: number;
    replyCount: number;
    repostCount: number;
    bookmarkCount?: number;
    aiGenerated?: boolean;
    createdAt: string | Date;
    liked?: boolean;
    bookmarked?: boolean;
  }

  let {
    post,
    index = 0,
    onLike,
    onRepost,
    onReply,
    onBookmark,
    onShare,
  }: {
    post: Post;
    index?: number;
    onLike?: (id: string, currentlyLiked: boolean) => void;
    onRepost?: (id: string) => void;
    onReply?: (id: string) => void;
    onBookmark?: (id: string, currentlyBookmarked: boolean) => void;
    onShare?: (id: string) => void;
  } = $props();

  const liked = $derived(post.liked ?? false);
  const bookmarked = $derived(post.bookmarked ?? false);
  const localLikeCount = $derived(post.likeCount ?? 0);

  function handleLike(e: MouseEvent) {
    e.stopPropagation();
    onLike?.(post.id, liked);
  }

  function handleBookmark(e: MouseEvent) {
    e.stopPropagation();
    onBookmark?.(post.id, bookmarked);
  }

  function relativeTime(date: string | Date) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    });
  }

  function formatCount(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n > 0 ? String(n) : "";
  }
</script>

<article
  class="post-card group border-b border-border/60 px-4 pt-3 pb-2 hover:bg-accent/40 cursor-pointer transition-colors duration-100"
  style="animation-delay: {index * 40}ms"
>
  <div class="flex gap-3">
    <!-- Avatar column -->
    <div class="flex flex-col items-center shrink-0">
      <a
        href="/profile/{post.author?.username}"
        onclick={(e) => e.stopPropagation()}
      >
        <Avatar.Root
          class="size-10 ring-2 ring-transparent hover:ring-brand-400/60 transition-all duration-200"
        >
          <Avatar.Image src={post.author?.image} alt={post.author?.name} />
          <Avatar.Fallback
            class="bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 font-bold text-sm"
          >
            {post.aiGenerated ? "✦" : (post.author?.name?.[0] ?? "U")}
          </Avatar.Fallback>
        </Avatar.Root>
      </a>
    </div>

    <!-- Content column -->
    <div class="flex-1 min-w-0 pb-1">
      <!-- Author row -->
      <div class="flex items-center justify-between gap-1 mb-0.5">
        <div class="flex items-center gap-1.5 flex-wrap min-w-0">
          <span
            class="text-sm font-bold text-foreground truncate leading-tight"
          >
            {post.aiGenerated ? "Lerno AI" : (post.author?.name ?? "User")}
          </span>
          {#if !post.aiGenerated}
            <span class="text-xs text-muted-foreground truncate"
              >@{post.author?.username ?? "user"}</span
            >
          {:else}
            <Badge
              variant="outline"
              class="text-[10px] px-1.5 h-4 border-brand-300/60 text-brand-600 dark:border-brand-700/60 dark:text-brand-400 gap-1 shrink-0"
            >
              <Sparkles class="size-2.5" />AI
            </Badge>
          {/if}
          {#if post.courseCode}
            <span class="text-muted-foreground/50">·</span>
            <Badge variant="secondary" class="text-[10px] h-4 px-1.5 shrink-0"
              >{post.courseCode}</Badge
            >
          {/if}
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <span class="text-[11px] text-muted-foreground whitespace-nowrap"
            >{relativeTime(post.createdAt)}</span
          >
          <!-- 3-dot menu -->
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <button
                class="size-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
              >
                <Ellipsis class="size-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" class="w-44">
              <DropdownMenu.Item>Copy link</DropdownMenu.Item>
              <DropdownMenu.Item
                >Mute @{post.author?.username}</DropdownMenu.Item
              >
              <DropdownMenu.Separator />
              <DropdownMenu.Item class="text-destructive"
                >Report</DropdownMenu.Item
              >
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      <!-- Post content -->
      <div class="text-sm leading-relaxed text-foreground">
        {#if post.postType === "text"}
          <p class="whitespace-pre-wrap break-words">
            {post.content?.body ?? post.content ?? ""}
          </p>
        {:else if post.postType === "image"}
          {#if post.content?.body}
            <p class="mb-2 whitespace-pre-wrap">{post.content.body}</p>
          {/if}
          <img
            src={post.content?.imageUrl}
            alt={post.content?.altText ?? ""}
            class="rounded-2xl overflow-hidden max-h-96 object-cover w-full border border-border/60"
            loading="lazy"
          />
        {:else if post.postType === "link"}
          {#if post.content?.body}
            <p class="mb-2 whitespace-pre-wrap">{post.content.body}</p>
          {/if}
          <a
            href={post.content?.url}
            target="_blank"
            rel="noopener noreferrer"
            class="block rounded-2xl border border-border/60 overflow-hidden hover:border-brand-400/60 transition-colors"
            onclick={(e) => e.stopPropagation()}
          >
            {#if post.content?.previewImage}
              <img
                src={post.content.previewImage}
                alt=""
                class="w-full h-36 object-cover"
                loading="lazy"
              />
            {/if}
            <div class="p-3 bg-muted/30">
              <p
                class="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide"
              >
                {new URL(post.content?.url ?? "https://example.com").hostname}
              </p>
              <p class="text-sm font-medium text-foreground line-clamp-2">
                {post.content?.title}
              </p>
            </div>
          </a>
        {:else if post.postType === "quiz"}
          <QuizPost
            question={post.content?.question ?? ""}
            options={post.content?.options ?? []}
            correctOptionId={post.content?.correctOptionId ?? ""}
            explanation={post.content?.explanation}
          />
        {:else if post.postType === "flashcard"}
          <FlashcardPost
            front={post.content?.front ?? ""}
            back={post.content?.back ?? ""}
          />
        {:else if post.postType === "poll"}
          <PollPost
            question={post.content?.question ?? ""}
            options={post.content?.options ?? []}
            totalVotes={post.content?.totalVotes ?? 0}
            userVotedId={post.content?.userVotedId}
          />
        {/if}
      </div>

      <!-- Topic tags -->
      {#if post.topicTags?.length}
        <div class="flex flex-wrap gap-1 mt-2">
          {#each post.topicTags.slice(0, 4) as tag (tag)}
            <button
              class="text-xs text-brand-600 dark:text-brand-400 hover:underline transition-colors"
              >#{tag}</button
            >
          {/each}
        </div>
      {/if}

      <!-- Action bar — Bluesky style -->
      <div class="flex items-center mt-2 -ml-2 text-muted-foreground">
        <!-- Reply -->
        <Tooltip.Root>
          <Tooltip.Trigger>
            <button
              class="flex items-center gap-1.5 h-8 px-2 rounded-full text-xs hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
              onclick={(e) => {
                e.stopPropagation();
                onReply?.(post.id);
              }}
            >
              <MessageCircle class="size-[17px]" />
              <span class="text-xs tabular-nums"
                >{formatCount(post.replyCount ?? 0)}</span
              >
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content>Reply</Tooltip.Content>
        </Tooltip.Root>

        <!-- Repost -->
        <Tooltip.Root>
          <Tooltip.Trigger>
            <button
              class="flex items-center gap-1.5 h-8 px-2 rounded-full text-xs hover:text-green-500 hover:bg-green-500/10 transition-colors"
              onclick={(e) => {
                e.stopPropagation();
                onRepost?.(post.id);
              }}
            >
              <Repeat2 class="size-[17px]" />
              <span class="text-xs tabular-nums"
                >{formatCount(post.repostCount ?? 0)}</span
              >
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content>Repost</Tooltip.Content>
        </Tooltip.Root>

        <!-- Like -->
        <Tooltip.Root>
          <Tooltip.Trigger>
            <button
              class="flex items-center gap-1.5 h-8 px-2 rounded-full text-xs transition-colors {liked
                ? 'text-rose-500'
                : 'hover:text-rose-500 hover:bg-rose-500/10'}"
              onclick={handleLike}
            >
              <Heart
                class="size-[17px] transition-all duration-150"
                style={liked
                  ? "fill: currentColor; animation: heart-pop 0.3s ease;"
                  : ""}
              />
              <span class="text-xs tabular-nums"
                >{formatCount(localLikeCount)}</span
              >
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content>Like</Tooltip.Content>
        </Tooltip.Root>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Bookmark -->
        <Tooltip.Root>
          <Tooltip.Trigger>
            <button
              class="size-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all {bookmarked
                ? 'text-brand-500 opacity-100'
                : 'hover:text-brand-500 hover:bg-brand-500/10'}"
              onclick={handleBookmark}
            >
              <Bookmark
                class="size-[17px]"
                style={bookmarked ? "fill: currentColor;" : ""}
              />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content>Bookmark</Tooltip.Content>
        </Tooltip.Root>

        <!-- Share -->
        <Tooltip.Root>
          <Tooltip.Trigger>
            <button
              class="size-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-brand-500 hover:bg-brand-500/10 transition-all"
              onclick={(e) => {
                e.stopPropagation();
                onShare?.(post.id);
              }}
            >
              <Share2 class="size-[17px]" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content>Share</Tooltip.Content>
        </Tooltip.Root>
      </div>
    </div>
  </div>
</article>
