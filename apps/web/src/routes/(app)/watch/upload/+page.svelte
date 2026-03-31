<script lang="ts">
  import { uploadVideo } from "../watch.remote";
  import { Button } from "@lerno/ui/components/ui/button";
  import * as Card from "@lerno/ui/components/ui/card";
  import { Input } from "@lerno/ui/components/ui/input";
  import { Textarea } from "@lerno/ui/components/ui/textarea";
  import * as Tabs from "@lerno/ui/components/ui/tabs";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import UploadCloud from "@lucide/svelte/icons/upload-cloud";
  import Video from "@lucide/svelte/icons/video";
  import LinkIcon from "@lucide/svelte/icons/link";
  import FileVideo from "@lucide/svelte/icons/file-video";
  import Circle from "@lucide/svelte/icons/circle";
  import Square from "@lucide/svelte/icons/square";
  import CheckCircle2 from "@lucide/svelte/icons/check-circle-2";
  import { onDestroy } from "svelte";

  // Form fields derived from the valibot schema
  const { postType, title, description, mediaContent, videoUrl } = uploadVideo.fields;

  let fileInput = $state<HTMLInputElement>();
  let videoPreview = $state<HTMLVideoElement>();
  let stream = $state<MediaStream | null>(null);
  let mediaRecorder = $state<MediaRecorder | null>(null);
  let isRecording = $state(false);
  let recordedChunks: Blob[] = [];
  let recordedFileReady = $state(false);
  let activeTab = $state<string>("upload");
  let selectedFileName = $state<string | null>(null);

  async function startCamera() {
    recordedFileReady = false;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (videoPreview) {
        videoPreview.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing media devices.", err);
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
  }

  function startRecording() {
    if (!stream) return;
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const file = new File([blob], "recording.webm", { type: "video/webm" });
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        recordedFileReady = true;
      }
      stopCamera();
    };
    mediaRecorder.start();
    isRecording = true;
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      isRecording = false;
    }
  }

  function handleTabChange(v: string | undefined) {
    if (!v) return;
    activeTab = v;
    if (activeTab === "record") startCamera();
    else stopCamera();
  }

  function onFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      selectedFileName = target.files[0].name;
    } else {
      selectedFileName = null;
    }
  }

  onDestroy(() => {
    stopCamera();
  });
</script>

<svelte:head>
  <title>Upload Video — Lerno</title>
</svelte:head>

<div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen">
  <!-- Header -->
  <div class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-4">
    <Button href="/watch" variant="ghost" size="icon" class="size-8 rounded-full">
      <ArrowLeft class="size-4" />
    </Button>
    <h1 class="text-base font-bold">Upload Custom Video</h1>
  </div>

  <div class="p-4 sm:p-6 lg:p-8 space-y-6">
    <form {...uploadVideo} enctype="multipart/form-data">
      <Card.Root>
        <Card.Header>
          <Card.Title>Video Source</Card.Title>
          <Card.Description>Select how you want to provide your video content.</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-6">
          <Tabs.Root value={activeTab} onValueChange={handleTabChange} class="w-full">
            <Tabs.List class="grid w-full grid-cols-3 mb-6">
              <Tabs.Trigger value="upload" class="flex items-center gap-2 text-xs">
                <FileVideo class="size-3.5" /> File
              </Tabs.Trigger>
              <Tabs.Trigger value="record" class="flex items-center gap-2 text-xs">
                <Video class="size-3.5" /> Record
              </Tabs.Trigger>
              <Tabs.Trigger value="url" class="flex items-center gap-2 text-xs">
                <LinkIcon class="size-3.5" /> URL
              </Tabs.Trigger>
            </Tabs.List>

            <!-- Hidden generic file input shared by File and Record modes -->
            <input
              {...mediaContent.as('file')}
              bind:this={fileInput}
              accept="video/*"
              class="hidden"
              onchange={onFileChange}
            />

            <!-- M1: Upload -->
            <Tabs.Content value="upload" class="min-h-[200px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div class="size-12 rounded-full bg-muted flex items-center justify-center mb-2">
                <UploadCloud class="size-6 text-muted-foreground" />
              </div>
              <div>
                <Button type="button" variant="outline" onclick={() => fileInput?.click()}>
                  Browse Files
                </Button>
                {#if selectedFileName && activeTab === 'upload'}
                  <p class="text-sm mt-3 text-brand-600 flex items-center justify-center gap-1"><CheckCircle2 class="size-4"/> {selectedFileName}</p>
                {:else}
                  <p class="text-xs text-muted-foreground mt-2">MP4 or WebM up to 50MB</p>
                {/if}
              </div>
            </Tabs.Content>

            <!-- M2: Record -->
            <Tabs.Content value="record" class="space-y-4">
              <div class="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner flex flex-col items-center justify-center">
                {#if !recordedFileReady}
                  <video bind:this={videoPreview} autoplay muted playsinline class="w-full h-full object-cover"></video>
                  {#if !stream}
                    <div class="absolute inset-0 flex items-center justify-center text-white/50 text-sm">Waiting for camera...</div>
                  {/if}
                {:else}
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-brand-400 gap-3">
                    <CheckCircle2 class="size-12" />
                    <span class="font-bold">Recording Saved!</span>
                    <Button type="button" variant="outline" size="sm" class="text-white border-white/20 hover:bg-white/10 mt-2" onclick={startCamera}>
                      Record Again
                    </Button>
                  </div>
                {/if}

                {#if isRecording}
                  <div class="absolute top-4 right-4 flex items-center gap-2 bg-red-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-red-500/50">
                    <div class="size-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span class="text-xs font-bold text-red-100">REC</span>
                  </div>
                {/if}
              </div>
              
              {#if !recordedFileReady}
                <div class="flex justify-center">
                  {#if !isRecording}
                    <Button type="button" size="lg" variant="default" class="rounded-full px-6 font-bold bg-zinc-800 hover:bg-zinc-700 text-white gap-2" onclick={startRecording} disabled={!stream}>
                      <Circle class="size-4 text-red-500 fill-current" />
                      Start Recording
                    </Button>
                  {:else}
                    <Button type="button" size="lg" variant="destructive" class="rounded-full px-6 font-bold gap-2" onclick={stopRecording}>
                      <Square class="size-4 fill-current" />
                      Stop
                    </Button>
                  {/if}
                </div>
              {/if}
            </Tabs.Content>

            <!-- M3: URL -->
            <Tabs.Content value="url" class="space-y-4 pt-4">
              <div class="space-y-2">
                <label class="text-sm font-medium" for="videoUrl">Video URL (MP4)</label>
                <Input {...videoUrl.as('text')} id="videoUrl" placeholder="https://example.com/video.mp4" type="url" />
                <p class="text-[11px] text-muted-foreground">Provide a standard mp4 or webm public link.</p>
              </div>
            </Tabs.Content>
          </Tabs.Root>

        </Card.Content>
      </Card.Root>

      <!-- Details Section -->
      <Card.Root class="mt-6">
        <Card.Header>
          <Card.Title>Metadata</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Placement Type</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input {...postType.as('text')} type="radio" value="short" checked class="w-4 h-4 text-brand-600 border-border" />
                Short (Vertical feed)
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input {...postType.as('text')} type="radio" value="video" class="w-4 h-4 text-brand-600 border-border" />
                Standard Video
              </label>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium" for="title">Title *</label>
            <Input {...title.as('text')} id="title" placeholder="A catchy title for your video" required />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium" for="description">Description</label>
            <Textarea {...description.as('text')} id="description" placeholder="What is this video about?" class="resize-none" rows={3} />
          </div>
        </Card.Content>
        <Card.Footer>
          <Button type="submit" class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold gap-2">
            <UploadCloud class="size-4" />
            Publish Video
          </Button>
        </Card.Footer>
      </Card.Root>
    </form>
  </div>
</div>
