<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { useSession } from "$lib/auth.svelte";
  import { getPostById, getComments, createComment, likePost, bookmarkPost, repostPost } from "../../feed/feed.remote";
  import { PostCard } from "@lerno/ui/components/feed";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Textarea } from "@lerno/ui/components/ui/textarea";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";

  const getSession = useSession();
  const session = $derived($getSession);
  const user = $derived(session.data?.user);

  let replyBody = $state("");
  let submittingReply = $state(false);

  // We are going to use queries for the post and comments
  const postId = $derived(page.params.id);
</script>

<svelte:head>
  <title>Post — Lerno</title>
</svelte:head>

<div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen pb-safe pb-20">
  <!-- Header -->
  <div class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
    <button class="p-1.5 -ml-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" onclick={() => history.back()}>
      <ChevronLeft class="size-5" />
    </button>
    <h1 class="text-lg font-bold tracking-tight">Post</h1>
  </div>

  <svelte:boundary>
    {@const postRequest = await getPostById({ postId })}
    
    <div class="border-b border-border/60">
      <PostCard
        post={postRequest}
        currentUserId={user?.id}
        onLike={async (id, current) => {
          await likePost({ postId: id }).updates(
             getPostById({ postId: id }).withOverride(prev => prev ? { ...prev, liked: !current, likeCount: prev.likeCount + (current ? -1 : 1) } : prev)
          );
        }}
        onBookmark={async (id, current) => {
          await bookmarkPost({ postId: id }).updates(
             getPostById({ postId: id }).withOverride(prev => prev ? { ...prev, bookmarked: !current } : prev)
          );
        }}
        onRepost={async (id) => {
          await repostPost({ postId: id }).updates(
             getPostById({ postId: id }).withOverride(prev => prev ? { ...prev, repostCount: prev.repostCount + 1 } : prev)
          );
          toast.success("Reposted!");
        }}
        onReply={async (id, body) => {
          await createComment({ postId: id, body }).updates(
            getPostById({ postId: id }).withOverride(prev => prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev),
            getComments({ postId }).withOverride(prev => ({ nextCursor: prev?.nextCursor, comments: [{ id: crypto.randomUUID(), content: { body }, author: { name: user?.name, username: user?.email?.split('@')[0], image: user?.image }, createdAt: new Date().toISOString(), likeCount: 0 }, ...(prev?.comments ?? [])] }))
          );
          toast.success("Reply posted!");
        }}
      />
    </div>

    <!-- Inline Reply Composer -->
    <div class="flex gap-3 px-4 py-3 border-b border-border/60 bg-muted/20">
      <img src={user?.image} alt={user?.name} class="size-10 rounded-full border border-border" />
      <div class="flex-1 space-y-2">
        <Textarea bind:value={replyBody} placeholder="Post your reply..." class="min-h-[60px] resize-none text-base border-transparent shadow-none bg-transparent hover:bg-muted/10 transition-colors" />
        <div class="flex justify-end">
          <Button disabled={!replyBody.trim() || submittingReply} onclick={async () => {
            if (!replyBody.trim() || submittingReply) return;
            submittingReply = true;
            try {
              await createComment({ postId, body: replyBody }).updates(
                getPostById({ postId }).withOverride(prev => prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev),
                getComments({ postId }).withOverride(prev => ({ nextCursor: prev?.nextCursor, comments: [{ id: crypto.randomUUID(), content: { body: replyBody }, author: { name: user?.name, username: user?.email?.split('@')[0], image: user?.image }, createdAt: new Date().toISOString(), likeCount: 0 }, ...(prev?.comments ?? [])] }))
              );
              replyBody = "";
              toast.success("Reply posted!");
            } catch {
              toast.error("Failed to post reply.");
            } finally {
              submittingReply = false;
            }
          }}>Reply</Button>
        </div>
      </div>
    </div>

    <!-- Comments List -->
    {@const commentsReq = await getComments({ postId, limit: 50 })}
    <div class="flex flex-col">
      {#if commentsReq.comments.length === 0}
        <div class="text-center py-12 text-muted-foreground">
          <p class="text-sm">No replies yet.</p>
        </div>
      {/if}
      {#each commentsReq.comments as comment (comment.id)}
        <div class="border-b border-border/60">
          <PostCard
            post={{ ...comment, postType: 'text', replyCount: 0, repostCount: 0, bookmarked: false, liked: false }}
            currentUserId={user?.id}
          />
        </div>
      {/each}
    </div>

    {#snippet pending()}
      <div class="p-6 space-y-4">
        <div class="flex items-center gap-3">
          <Skeleton class="size-12 rounded-full" />
          <div class="space-y-2">
            <Skeleton class="h-4 w-32" />
            <Skeleton class="h-3 w-20" />
          </div>
        </div>
        <Skeleton class="h-24 w-full" />
      </div>
    {/snippet}

    {#snippet failed(error, reset)}
      <div class="flex flex-col items-center gap-3 py-16 text-center px-4">
        <p class="text-sm text-destructive">{error.message ?? 'Failed to load post.'}</p>
        <button class="text-sm text-brand-500 underline" onclick={reset}>Retry</button>
      </div>
    {/snippet}
  </svelte:boundary>
</div>
