<script lang="ts">
  import Heart from "@lucide/svelte/icons/heart";
  import MessageCircle from "@lucide/svelte/icons/message-circle";
  import Repeat2 from "@lucide/svelte/icons/repeat-2";
  import Bookmark from "@lucide/svelte/icons/bookmark";
  import Share2 from "@lucide/svelte/icons/share-2";
  import Ellipsis from "@lucide/svelte/icons/ellipsis";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Eye from "@lucide/svelte/icons/eye";
  import UserPlus from "@lucide/svelte/icons/user-plus";
  import UserMinus from "@lucide/svelte/icons/user-minus";
  import Play from "@lucide/svelte/icons/play";
  import Quote from "@lucide/svelte/icons/quote";
  import Send from "@lucide/svelte/icons/send";
  import * as Avatar from "$lib/components/ui/avatar";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Sheet from "$lib/components/ui/sheet";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as RadioGroup from "$lib/components/ui/radio-group";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Separator } from "$lib/components/ui/separator";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { goto } from "$app/navigation";
  import QuizPost from "./quiz-post.svelte";
  import FlashcardPost from "./flashcard-post.svelte";
  import PollPost from "./poll-post.svelte";

  interface Author {
    name?: string;
    username?: string;
    image?: string;
  }

  interface Comment {
    id: string;
    content: { body: string };
    author: Author;
    createdAt: string;
    likeCount: number;
  }

  interface Post {
    id: string;
    postType:
      | "text"
      | "quiz"
      | "flashcard"
      | "poll"
      | "image"
      | "link"
      | "video"
      | "short";
    content: any;
    author?: Author;
    courseCode?: string;
    topicTags?: string[];
    likeCount: number;
    replyCount: number;
    repostCount: number;
    viewCount?: number;
    bookmarkCount?: number;
    aiGenerated?: boolean;
    createdAt: string | Date;
    liked?: boolean;
    bookmarked?: boolean;
    authorId?: string;
  }

  let {
    post,
    index = 0,
    currentUserId = undefined,
    onLike,
    onRepost,
    onQuote,
    onReply,
    onBookmark,
    onShare,
    onFollow,
    onMutePost,
    onMuteUser,
    onBlockUser,
    onReport,
    onNotInterested,
    onImpression,
  }: {
    post: Post;
    index?: number;
    currentUserId?: string;
    onLike?: (id: string, currentlyLiked: boolean) => void;
    onRepost?: (id: string) => void;
    onQuote?: (id: string, body: string) => void;
    onReply?: (id: string, body: string) => Promise<void>;
    onBookmark?: (id: string, currentlyBookmarked: boolean) => void;
    onShare?: (id: string) => void;
    onFollow?: (authorId: string) => void;
    onMutePost?: (id: string) => void;
    onMuteUser?: (authorId: string) => void;
    onBlockUser?: (authorId: string) => void;
    onReport?: (id: string, reason: string) => void;
    onNotInterested?: (id: string) => void;
    onImpression?: (id: string) => void;
  } = $props();

  const liked = $derived(post.liked ?? false);
  const bookmarked = $derived(post.bookmarked ?? false);
  const isOwnPost = $derived(currentUserId === post.authorId);

  // ─── Local state ──────────────────────────────────────────────────────────
  let commentOpen = $state(false);
  let reportOpen = $state(false);
  let quoteOpen = $state(false);
  let commentBody = $state("");
  let quoteBody = $state("");
  let reportReason = $state("spam");
  let submittingComment = $state(false);
  let comments: Comment[] = $state([]);
  let loadingComments = $state(false);
  let videoPlaying = $state(false);

  // ─── Impression tracking via {@attach} ──────────────────────────────────
  function impressionAttachment(el: HTMLElement) {
    if (!onImpression) return;
    let fired = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!fired && entries[0]?.isIntersecting) {
          fired = true;
          onImpression!(post.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
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
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n > 0 ? String(n) : "";
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
  }

  async function openComments() {
    commentOpen = true;
    if (comments.length === 0) {
      loadingComments = true;
      // Comments will be loaded by parent via onReply side-effect or a dedicated loader
      loadingComments = false;
    }
  }

  async function submitComment() {
    if (!commentBody.trim() || submittingComment) return;
    submittingComment = true;
    try {
      await onReply?.(post.id, commentBody);
      commentBody = "";
    } finally {
      submittingComment = false;
    }
  }

  function submitQuote() {
    if (!quoteBody.trim()) return;
    onQuote?.(post.id, quoteBody);
    quoteBody = "";
    quoteOpen = false;
  }

  function submitReport() {
    onReport?.(post.id, reportReason);
    reportOpen = false;
  }

  function formatDuration(secs?: number) {
    if (!secs) return "";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
</script>

<!-- Intersection observer for impression -->
<article
  {@attach impressionAttachment}
  class="post-card group border-b border-border/60 px-4 pt-3 pb-2 hover:bg-accent/40 cursor-pointer transition-colors duration-100 relative"
  style="animation-delay: {index * 40}ms"
  onclick={() => { goto(`/post/${post.id}`); }}
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
          <!-- Follow button — only on others' posts -->
          {#if !isOwnPost && post.authorId && !post.aiGenerated}
            <button
              onclick={(e) => {
                e.stopPropagation();
                onFollow?.(post.authorId!);
              }}
              class="text-[10px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <UserPlus class="size-2.5" />Follow
            </button>
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
            <DropdownMenu.Content align="end" class="w-52">
              <DropdownMenu.Item onclick={copyLink}>Copy link</DropdownMenu.Item
              >
              <DropdownMenu.Item
                onclick={() => {
                  onNotInterested?.(post.id);
                }}>Not interested</DropdownMenu.Item
              >
              <DropdownMenu.Item
                onclick={() => {
                  onMutePost?.(post.id);
                }}>Mute this post</DropdownMenu.Item
              >
              {#if !isOwnPost}
                <DropdownMenu.Item
                  onclick={() => {
                    onMuteUser?.(post.authorId!);
                  }}
                >
                  Mute @{post.author?.username}
                </DropdownMenu.Item>
              {/if}
              <DropdownMenu.Separator />
              {#if !isOwnPost}
                <DropdownMenu.Item
                  class="text-destructive focus:text-destructive"
                  onclick={() => {
                    reportOpen = true;
                  }}
                >
                  Report post
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  class="text-destructive focus:text-destructive"
                  onclick={() => {
                    onBlockUser?.(post.authorId!);
                  }}
                >
                  Block @{post.author?.username}
                </DropdownMenu.Item>
              {/if}
              <DropdownMenu.Item
                onclick={() => {
                  onShare?.(post.id);
                }}>Share / Embed</DropdownMenu.Item
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
          <button
            class="w-full rounded-2xl overflow-hidden border border-border/60 focus:outline-none"
            onclick={(e) => e.stopPropagation()}
          >
            <img
              src={post.content?.imageUrl}
              alt={post.content?.altText ?? ""}
              class="max-h-96 object-cover w-full"
              loading="lazy"
            />
          </button>
        {:else if post.postType === "video" || post.postType === "short"}
          {#if post.content?.body}
            <p class="mb-2 whitespace-pre-wrap">{post.content.body}</p>
          {/if}
          <div
            class="relative rounded-2xl overflow-hidden border border-border/60 bg-black aspect-video"
            onclick={(e) => e.stopPropagation()}
          >
            {#if videoPlaying}
              <video
                src={post.content?.videoUrl}
                class="w-full h-full object-contain"
                controls
                autoplay
              >
                <track kind="captions" />
              </video>
            {:else}
              <!-- Thumbnail with play overlay -->
              <img
                src={post.content?.thumbnailUrl ?? post.content?.imageUrl}
                alt={post.content?.title ?? "Video"}
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div
                class="absolute inset-0 flex flex-col items-center justify-center bg-black/30"
              >
                <button
                  onclick={() => (videoPlaying = true)}
                  class="size-14 rounded-full bg-white/90 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                >
                  <Play class="size-6 text-brand-600 fill-brand-600 ml-0.5" />
                </button>
                {#if post.content?.durationSecs}
                  <span
                    class="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded"
                  >
                    {formatDuration(post.content.durationSecs)}
                  </span>
                {/if}
              </div>
            {/if}
          </div>
          <!-- Watch full link -->
          <a
            href="/watch/{post.id}"
            onclick={(e) => e.stopPropagation()}
            class="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline mt-1"
          >
            <Play class="size-3" /> Watch full video
          </a>
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

      <!-- ─── Action bar ─────────────────────────────────────────────────── -->
      <div class="flex items-center mt-2 -ml-2 text-muted-foreground">
        <!-- Reply / Comment -->
        <Tooltip.Root>
          <Tooltip.Trigger>
            <button
              class="flex items-center gap-1.5 h-8 px-2 rounded-full text-xs hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
              onclick={(e) => {
                e.stopPropagation();
                openComments();
              }}
            >
              <MessageCircle class="size-[17px]" />
              <span class="text-xs tabular-nums"
                >{formatCount(post.replyCount ?? 0)}</span
              >
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content>Comment</Tooltip.Content>
        </Tooltip.Root>

        <!-- Repost / Quote dropdown -->
        <Tooltip.Root>
          <Tooltip.Trigger>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <button
                  class="flex items-center gap-1.5 h-8 px-2 rounded-full text-xs hover:text-green-500 hover:bg-green-500/10 transition-colors"
                  onclick={(e) => e.stopPropagation()}
                >
                  <Repeat2 class="size-[17px]" />
                  <span class="text-xs tabular-nums"
                    >{formatCount(post.repostCount ?? 0)}</span
                  >
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="start" class="w-40">
                <DropdownMenu.Item onclick={() => onRepost?.(post.id)}>
                  <Repeat2 class="size-4 mr-2" /> Repost
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onclick={() => {
                    quoteOpen = true;
                  }}
                >
                  <Quote class="size-4 mr-2" /> Quote post
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
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
              onclick={(e) => {
                e.stopPropagation();
                onLike?.(post.id, liked);
              }}
            >
              <Heart
                class="size-[17px] transition-all duration-150"
                style={liked ? "fill: currentColor;" : ""}
              />
              <span class="text-xs tabular-nums"
                >{formatCount(post.likeCount ?? 0)}</span
              >
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content>Like</Tooltip.Content>
        </Tooltip.Root>

        <!-- Impressions / Views -->
        <Tooltip.Root>
          <Tooltip.Trigger>
            <div
              class="flex items-center gap-1 h-8 px-2 text-xs text-muted-foreground/60"
            >
              <Eye class="size-[15px]" />
              <span class="text-xs tabular-nums"
                >{formatCount(post.viewCount ?? 0)}</span
              >
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content>Impressions</Tooltip.Content>
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
              onclick={(e) => {
                e.stopPropagation();
                onBookmark?.(post.id, bookmarked);
              }}
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

<!-- ─── Comments Sheet (shadcn Sheet) ──────────────────────────────────── -->
<Sheet.Root bind:open={commentOpen}>
  <Sheet.Content side="bottom" class="h-[70vh] flex flex-col p-0">
    <Sheet.Header class="px-4 pt-4 pb-2 border-b border-border/60">
      <Sheet.Title class="text-base">Replies</Sheet.Title>
    </Sheet.Header>
    <ScrollArea class="flex-1 px-4 py-2">
      {#if loadingComments}
        {#each { length: 3 } as _}
          <div class="flex gap-3 mb-4">
            <Skeleton class="size-8 rounded-full" />
            <div class="flex-1 space-y-1">
              <Skeleton class="h-3 w-24" />
              <Skeleton class="h-4 w-full" />
            </div>
          </div>
        {/each}
      {:else if comments.length === 0}
        <div class="text-center py-12 text-muted-foreground">
          <MessageCircle class="size-8 mx-auto mb-2 opacity-30" />
          <p class="text-sm">No replies yet. Be first!</p>
        </div>
      {:else}
        {#each comments as comment (comment.id)}
          <div class="flex gap-3 py-3 border-b border-border/40 last:border-0">
            <Avatar.Root class="size-8 shrink-0">
              <Avatar.Image
                src={comment.author?.image}
                alt={comment.author?.name}
              />
              <Avatar.Fallback class="text-xs"
                >{comment.author?.name?.[0] ?? "U"}</Avatar.Fallback
              >
            </Avatar.Root>
            <div>
              <div class="flex items-center gap-1.5 mb-0.5">
                <span class="text-xs font-semibold"
                  >{comment.author?.name ?? "User"}</span
                >
                <span class="text-[11px] text-muted-foreground"
                  >{relativeTime(comment.createdAt)}</span
                >
              </div>
              <p class="text-sm">{comment.content.body}</p>
            </div>
          </div>
        {/each}
      {/if}
    </ScrollArea>
    <!-- Comment composer -->
    <div class="border-t border-border/60 px-4 py-3 flex gap-2 items-end">
      <Textarea
        bind:value={commentBody}
        placeholder="Add a reply…"
        class="min-h-[40px] max-h-28 resize-none text-sm"
        rows={1}
        onkeydown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitComment();
          }
        }}
      />
      <Button
        size="icon"
        disabled={!commentBody.trim() || submittingComment}
        onclick={submitComment}
        class="shrink-0"
      >
        <Send class="size-4" />
      </Button>
    </div>
  </Sheet.Content>
</Sheet.Root>

<!-- ─── Quote Post Dialog (shadcn Dialog) ─────────────────────────────── -->
<Dialog.Root bind:open={quoteOpen}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Quote post</Dialog.Title>
    </Dialog.Header>
    <!-- Preview of quoted post -->
    <div
      class="rounded-xl border border-border/60 p-3 bg-muted/30 text-sm text-muted-foreground line-clamp-3"
    >
      {post.content?.body ?? post.content?.question ?? "Media post"}
    </div>
    <Textarea
      bind:value={quoteBody}
      placeholder="Add your thoughts…"
      class="min-h-[80px] resize-none"
      maxlength={500}
    />
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (quoteOpen = false)}
        >Cancel</Button
      >
      <Button onclick={submitQuote} disabled={!quoteBody.trim()}>Post</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- ─── Report Dialog (shadcn Dialog + RadioGroup) ────────────────────── -->
<Dialog.Root bind:open={reportOpen}>
  <Dialog.Content class="max-w-sm">
    <Dialog.Header>
      <Dialog.Title>Report post</Dialog.Title>
      <Dialog.Description
        >Help us understand what's wrong with this post.</Dialog.Description
      >
    </Dialog.Header>
    <RadioGroup.Root bind:value={reportReason} class="gap-2">
      {#each [{ value: "spam", label: "Spam or misleading" }, { value: "harassment", label: "Harassment or bullying" }, { value: "misinformation", label: "False information" }, { value: "inappropriate", label: "Inappropriate content" }, { value: "plagiarism", label: "Plagiarism" }, { value: "other", label: "Other" }] as item}
        <div class="flex items-center space-x-2">
          <RadioGroup.Item value={item.value} id="report-{item.value}" />
          <Label for="report-{item.value}">{item.label}</Label>
        </div>
      {/each}
    </RadioGroup.Root>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (reportOpen = false)}
        >Cancel</Button
      >
      <Button variant="destructive" onclick={submitReport}>Report</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
