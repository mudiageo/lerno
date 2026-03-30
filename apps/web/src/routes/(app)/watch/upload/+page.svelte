<script lang="ts">
  import { uploadVideo } from "../watch.remote";
  import { goto } from "$app/navigation";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import { Button } from "@lerno/ui/components/ui/button";
  import * as Card from "@lerno/ui/components/ui/card";
  import { Input } from "@lerno/ui/components/ui/input";
  import { Textarea } from "@lerno/ui/components/ui/textarea";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import UploadCloud from "@lucide/svelte/icons/upload-cloud";

  let isSubmitting = $state(false);
  let postType = $state<"video" | "short">("short");
  let title = $state("");
  let description = $state("");
  let videoUrl = $state("");

  async function handleSubmit() {
    if (!title || !videoUrl) {
      toast.error("Title and Video URL are required");
      return;
    }

    isSubmitting = true;
    try {
      await uploadVideo({
        postType,
        title,
        description,
        videoUrl,
      });
      toast.success("Video uploaded successfully!");
      if (postType === "short") {
        goto("/watch/shorts");
      } else {
        goto("/watch");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload video");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Upload Video — Lerno</title>
</svelte:head>

<div
  class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen"
>
  <!-- Header -->
  <div
    class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-4"
  >
    <Button
      href="/watch"
      variant="ghost"
      size="icon"
      class="size-8 rounded-full"
    >
      <ArrowLeft class="size-4" />
    </Button>
    <h1 class="text-base font-bold">Upload Custom Video</h1>
  </div>

  <div class="p-4 sm:p-6 lg:p-8 space-y-6">
    <Card.Root>
      <Card.Header>
        <Card.Title>Video Details</Card.Title>
        <Card.Description
          >Provide metadata and a publicly accessible MP4 URL.</Card.Description
        >
      </Card.Header>
      <Card.Content class="space-y-4">
        <!-- Video Type -->
        <div class="space-y-2">
          <label class="text-sm font-medium" for="type">Video Type</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="type"
                value="short"
                bind:group={postType}
                class="w-4 h-4 text-brand-600 border-border focus:ring-brand-500"
              />
              Short (Vertical)
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="type"
                value="video"
                bind:group={postType}
                class="w-4 h-4 text-brand-600 border-border focus:ring-brand-500"
              />
              Standard Video
            </label>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium" for="title">Title *</label>
          <Input
            id="title"
            bind:value={title}
            placeholder="A catchy title for your video"
            required
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium" for="description"
            >Description</label
          >
          <Textarea
            id="description"
            bind:value={description}
            placeholder="What is this video about?"
            class="resize-none"
            rows={3}
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium" for="videoUrl"
            >Video URL * (MP4)</label
          >
          <Input
            id="videoUrl"
            bind:value={videoUrl}
            placeholder="https://example.com/video.mp4"
            type="url"
            required
          />
          <p class="text-[11px] text-muted-foreground">
            Standard mp4 public link required for beta native hosting.
          </p>
        </div>
      </Card.Content>
      <Card.Footer>
        <Button
          class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold gap-2"
          onclick={handleSubmit}
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <span
              class="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"
            ></span>
            Uploading...
          {:else}
            <UploadCloud class="size-4" />
            Publish Video
          {/if}
        </Button>
      </Card.Footer>
    </Card.Root>
  </div>
</div>
