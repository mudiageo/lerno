<script lang="ts">
  import { page } from "$app/state";
  import { getCourseMaterials, uploadCourseMaterial } from "../../courses.remote";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import { Input } from "@lerno/ui/components/ui/input";
  import { Label } from "@lerno/ui/components/ui/label";
  import * as Dialog from "@lerno/ui/components/ui/dialog";
  import FileText from "@lucide/svelte/icons/file-text";
  import FileImage from "@lucide/svelte/icons/file-image";
  import Film from "@lucide/svelte/icons/film";
  import Music from "@lucide/svelte/icons/music";
  import Upload from "@lucide/svelte/icons/upload";
  import Download from "@lucide/svelte/icons/download";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import Brain from "@lucide/svelte/icons/brain";
  import Plus from "@lucide/svelte/icons/plus";
  import FolderOpen from "@lucide/svelte/icons/folder-open";

  const courseCode = page.params.code;
  let materials = await getCourseMaterials({ courseCode });

  let uploadOpen = $state(false);
  let uploading = $state(false);
  let dragOver = $state(false);

  let form = $state({ title: "", type: "pdf" as string, file: null as File | null });

  const typeIcons: Record<string, any> = {
    pdf: FileText, slide: FileText, note: FileText,
    image: FileImage, video: Film, audio: Music, other: FileText,
  };

  const typeColors: Record<string, string> = {
    pdf: "text-red-500 bg-red-50 dark:bg-red-950/30",
    slide: "text-orange-500 bg-orange-50 dark:bg-orange-950/30",
    note: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
    image: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
    video: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
    audio: "text-pink-500 bg-pink-50 dark:bg-pink-950/30",
    other: "text-muted-foreground bg-muted",
  };

  function onFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    form.file = file;
    if (!form.title) form.title = file.name.replace(/\.[^/.]+$/, "");
    // Detect type
    if (file.type.includes("pdf")) form.type = "pdf";
    else if (file.type.includes("image")) form.type = "image";
    else if (file.type.includes("video")) form.type = "video";
    else if (file.type.includes("audio")) form.type = "audio";
    else if (file.name.match(/\.(ppt|pptx|key)$/i)) form.type = "slide";
    else form.type = "other";
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) { form.file = file; if (!form.title) form.title = file.name; }
  }

  async function handleUpload() {
    if (!form.file || !form.title) { toast.error("Select a file and add a title"); return; }
    uploading = true;
    try {
      const { uploadUrl } = await uploadCourseMaterial({
        courseCode,
        title: form.title,
        type: form.type,
        filename: form.file.name,
        contentType: form.file.type || "application/octet-stream",
      });

      // Upload directly to storage
      await fetch(uploadUrl, {
        method: "PUT",
        body: form.file,
        headers: { "Content-Type": form.file.type || "application/octet-stream" },
      });

      toast.success("Uploaded successfully");
      materials = await getCourseMaterials({ courseCode });
      uploadOpen = false;
      form = { title: "", type: "pdf", file: null };
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      uploading = false;
    }
  }

  function formatSize(bytes: number) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    return `${d}d ago`;
  }
</script>

<div class="px-4 py-5 space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-base font-bold text-foreground flex items-center gap-2">
      <FolderOpen class="size-4 text-brand-500" />
      Course Materials
    </h2>
    <Button size="sm" class="h-8 text-xs gap-1.5" onclick={() => (uploadOpen = true)}>
      <Upload class="size-3.5" />
      Upload
    </Button>
  </div>

  <!-- Materials list -->
  {#if materials.length === 0}
    <!-- Drag-drop empty state -->
    <div
      class="flex flex-col items-center gap-4 py-16 text-center rounded-2xl border-2 border-dashed transition-colors
             {dragOver ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/10' : 'border-border'}"
      role="region"
      aria-label="Drop files here"
      ondragover={(e) => { e.preventDefault(); dragOver = true; }}
      ondragleave={() => (dragOver = false)}
      ondrop={onDrop}
    >
      <div class="size-14 rounded-2xl bg-muted flex items-center justify-center">
        <FolderOpen class="size-7 text-muted-foreground/40" />
      </div>
      <div>
        <p class="text-sm font-medium text-foreground">No materials yet</p>
        <p class="text-xs text-muted-foreground mt-1">Drop files here or click Upload to add PDFs, slides, notes.</p>
      </div>
      <Button size="sm" onclick={() => (uploadOpen = true)} class="gap-1.5">
        <Upload class="size-3.5" /> Upload Material
      </Button>
    </div>
  {:else}
    <!-- Drop zone hint when files exist -->
    <div
      class="hidden sm:flex items-center gap-2 p-3 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground transition-colors
             {dragOver ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/10 text-brand-500' : ''}"
      ondragover={(e) => { e.preventDefault(); dragOver = true; }}
      ondragleave={() => (dragOver = false)}
      ondrop={onDrop}
    >
      <Upload class="size-3.5 shrink-0" />
      Drop a file here to upload
    </div>

    <div class="space-y-2">
      {#each materials as material (material.id)}
        {@const Icon = typeIcons[material.type] ?? FileText}
        <div class="flex items-center gap-3 p-3.5 rounded-xl border border-border/70 bg-card hover:bg-accent/30 transition-colors group">
          <div class="size-10 rounded-xl {typeColors[material.type] ?? typeColors.other} flex items-center justify-center shrink-0">
            <Icon class="size-5" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate">{material.title}</p>
            <div class="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
              <Badge variant="outline" class="text-[10px] h-4 px-1.5">{material.type.toUpperCase()}</Badge>
              <span>{timeAgo(material.createdAt)}</span>
              {#if material.processed}
                <span class="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                  <Brain class="size-3" /> AI processed
                </span>
              {/if}
            </div>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {#if material.url || material.storageKey}
              <a
                href={material.url ?? `/api/materials/${material.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                class="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Download class="size-4" />
              </a>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Upload Dialog -->
<Dialog.Root bind:open={uploadOpen}>
  <Dialog.Content class="max-w-sm">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Upload class="size-4" />
        Upload Material
      </Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4">
      <!-- Drop zone -->
      <div
        class="rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors
               {dragOver ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/10' : 'border-border hover:border-muted-foreground/40'}"
        ondragover={(e) => { e.preventDefault(); dragOver = true; }}
        ondragleave={() => (dragOver = false)}
        ondrop={onDrop}
        onclick={() => document.getElementById("file-input")?.click()}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && document.getElementById("file-input")?.click()}
      >
        {#if form.file}
          <p class="text-sm font-medium text-foreground">{form.file.name}</p>
          <p class="text-xs text-muted-foreground">{formatSize(form.file.size)}</p>
        {:else}
          <Upload class="size-8 text-muted-foreground/40 mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">Click or drag file here</p>
          <p class="text-xs text-muted-foreground/60">PDF, PPTX, DOCX, images, etc.</p>
        {/if}
        <input
          id="file-input"
          type="file"
          class="hidden"
          accept=".pdf,.pptx,.ppt,.docx,.doc,.png,.jpg,.jpeg,.mp4,.mp3,.wav"
          onchange={onFileInput}
        />
      </div>

      <div class="space-y-1.5">
        <Label>Title</Label>
        <Input placeholder="e.g. Week 3 Lecture Notes" bind:value={form.title} />
      </div>

      <Button class="w-full gap-2" disabled={uploading || !form.file} onclick={handleUpload}>
        {#if uploading}
          <div class="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
          Uploading…
        {:else}
          <Upload class="size-4" />
          Upload
        {/if}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
