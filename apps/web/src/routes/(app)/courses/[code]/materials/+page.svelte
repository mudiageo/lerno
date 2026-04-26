<script lang="ts">
  import { page } from "$app/state";
  import { getCourseMaterials, uploadCourseMaterial, generateAIPost, saveAIPost, getMaterialGeneratedPosts } from "../../courses.remote";
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
  import Brain from "@lucide/svelte/icons/brain";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import Send from "@lucide/svelte/icons/send";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Clapperboard from "@lucide/svelte/icons/clapperboard";
  import Video from "@lucide/svelte/icons/video";

  let materials = await getCourseMaterials({ courseCode: page.params.code });

  let uploadOpen = $state(false);
  let uploading = $state(false);
  let dragOver = $state(false);

  // AI Generate Post dialog state
  let generateOpen = $state(false);
  let selectedMaterialId = $state<string | null>(null);
  let selectedPostType = $state<'text' | 'quiz' | 'flashcard' | 'poll' | 'thread' | 'short' | 'video'>('quiz');
  let customTopic = $state('');
  let generating = $state(false);
  let saving = $state(false);
  let draft = $state<any>(null);
  let draftPostType = $state<string>('');
  let draftCourseId = $state<string>('');
  let draftMaterialId = $state<string | null>(null);

  // Per-material expanded AI info
  let expandedMaterials = $state<Set<string>>(new Set());

  const { courseCode, title, file } = uploadCourseMaterial.fields;

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

  const postTypeLabels: Record<string, string> = {
    text: "Text Post",
    quiz: "Quiz Question",
    flashcard: "Flashcard",
    poll: "Poll",
    thread: "Thread",
    short: "Short (Video Card)",
    video: "Video Concept",
  };

  const postTypeIcons: Record<string, any> = {
    text: BookOpen,
    quiz: Brain,
    flashcard: Brain,
    poll: Brain,
    thread: BookOpen,
    short: Clapperboard,
    video: Video,
  };

  function onFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    if (!title.value()) title.set(f.name.replace(/\.[^/.]+$/, ""));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    uploadCourseMaterial.fields.file.set(f);
    if (!title.value()) title.set(f.name.replace(/\.[^/.]+$/, ""));
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

  function toggleExpanded(id: string) {
    if (expandedMaterials.has(id)) {
      expandedMaterials.delete(id);
    } else {
      expandedMaterials.add(id);
    }
    expandedMaterials = new Set(expandedMaterials);
  }

  function openGenerateDialog(materialId?: string) {
    selectedMaterialId = materialId ?? null;
    draft = null;
    generateOpen = true;
  }

  async function handleGenerate() {
    generating = true;
    try {
      const result = await generateAIPost({
        courseCode: page.params.code,
        postType: selectedPostType,
        materialId: selectedMaterialId ?? undefined,
        topic: customTopic.trim() || undefined,
      });
      draft = result.draft;
      draftPostType = result.postType;
      draftCourseId = result.courseId;
      draftMaterialId = result.materialId;
    } catch (e: any) {
      toast.error(e.message ?? "Generation failed");
    } finally {
      generating = false;
    }
  }

  async function handleSavePost() {
    if (!draft || !draftCourseId) return;
    saving = true;
    try {
      let content: Record<string, unknown> = {};
      if (draftPostType === 'quiz') {
        content = {
          question: draft.question,
          options: (draft.options as string[]).map((o: string, i: number) => ({ id: String(i), text: o })),
          correctOptionId: String(draft.correctIndex),
          explanation: draft.explanation,
        };
      } else if (draftPostType === 'flashcard') {
        content = { front: draft.front, back: draft.back, hint: draft.hint ?? null };
      } else if (draftPostType === 'poll') {
        content = {
          question: draft.question,
          options: (draft.options as string[]).map((o: string, i: number) => ({ id: String(i), text: o, votes: 0 })),
        };
      } else if (draftPostType === 'thread') {
        content = { posts: draft.posts };
      } else if (draftPostType === 'short') {
        content = { front: draft.front, back: draft.back, hint: draft.hint ?? null };
      } else if (draftPostType === 'video') {
        content = { title: draft.title, description: draft.description, script: draft.script ?? [] };
      } else {
        content = { body: draft.body };
      }

      await saveAIPost({
        courseId: draftCourseId,
        postType: draftPostType as any,
        content,
        topicTags: draft.topicTags ?? [],
        materialId: draftMaterialId ?? undefined,
      });

      toast.success("Post created! 🎉");
      generateOpen = false;
      draft = null;
      draftMaterialId = null;
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save post");
    } finally {
      saving = false;
    }
  }
</script>

<div class="px-4 py-5 space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-base font-bold text-foreground flex items-center gap-2">
      <FolderOpen class="size-4 text-brand-500" />
      Course Materials
    </h2>
    <div class="flex gap-2">
      <Button size="sm" variant="outline" class="h-8 text-xs gap-1.5" onclick={() => openGenerateDialog()}>
        <Sparkles class="size-3.5" />
        AI Create
      </Button>
      <Button size="sm" class="h-8 text-xs gap-1.5" onclick={() => (uploadOpen = true)}>
        <Upload class="size-3.5" />
        Upload
      </Button>
    </div>
  </div>

  <!-- Materials list -->
  {#if materials.length === 0}
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
        {@const isExpanded = expandedMaterials.has(material.id)}
        {@const topics = (material.topics as string[] | null) ?? []}
        <div class="rounded-xl border border-border/70 bg-card overflow-hidden">
          <div class="flex items-center gap-3 p-3.5 hover:bg-accent/30 transition-colors group">
            <div class="size-10 rounded-xl {typeColors[material.type] ?? typeColors.other} flex items-center justify-center shrink-0">
              <Icon class="size-5" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground truncate">{material.title}</p>
              <div class="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                <Badge variant="outline" class="text-[10px] h-4 px-1.5">{material.type.toUpperCase()}</Badge>
                <span>{timeAgo(material.createdAt)}</span>
                {#if material.processed}
                  <span class="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                    <Brain class="size-3" /> AI processed
                  </span>
                {:else if !material.processingError}
                  <span class="text-amber-500 font-medium text-[10px]">AI processing...</span>
                {/if}
              </div>
              {#if topics.length > 0}
                <div class="flex flex-wrap gap-1 mt-1.5">
                  {#each topics.slice(0, 4) as t (t)}
                    <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                      {t}
                    </span>
                  {/each}
                  {#if topics.length > 4}
                    <span class="text-[10px] text-muted-foreground">+{topics.length - 4} more</span>
                  {/if}
                </div>
              {/if}
            </div>
            <div class="flex items-center gap-1 shrink-0">
              {#if material.processed}
                <button
                  class="size-8 rounded-lg flex items-center justify-center text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors opacity-0 group-hover:opacity-100"
                  title="Generate AI post from this material"
                  onclick={() => openGenerateDialog(material.id)}
                >
                  <Sparkles class="size-4" />
                </button>
              {/if}
              {#if material.url || material.storageKey}
                <a
                  href={material.url ?? `/api/materials/${material.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Download class="size-4" />
                </a>
              {/if}
              {#if material.processed && (material.summary || topics.length > 0)}
                <button
                  class="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  onclick={() => toggleExpanded(material.id)}
                >
                  {#if isExpanded}
                    <ChevronUp class="size-4" />
                  {:else}
                    <ChevronDown class="size-4" />
                  {/if}
                </button>
              {/if}
            </div>
          </div>

          {#if isExpanded && material.processed}
            <div class="border-t border-border/60 px-3.5 py-3 bg-muted/30 space-y-3">
              {#if material.summary}
                <div>
                  <p class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">AI Summary</p>
                  <p class="text-xs text-foreground leading-relaxed">{material.summary}</p>
                </div>
              {/if}
              {#if (material.keyPoints as any[] | null)?.length}
                <div>
                  <p class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Key Points</p>
                  <ul class="space-y-0.5">
                    {#each ((material.keyPoints as any[]) ?? []).slice(0, 5) as kp, i (i)}
                      <li class="text-xs text-foreground flex gap-1.5">
                        <span class="text-brand-500 shrink-0">*</span>
                        {kp.point}
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
              {#if (material.potentialQuestions as string[] | null)?.length}
                <div>
                  <p class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Potential Exam Questions</p>
                  <ul class="space-y-0.5">
                    {#each ((material.potentialQuestions as string[]) ?? []).slice(0, 3) as q, i (i)}
                      <li class="text-xs text-muted-foreground flex gap-1.5">
                        <span class="text-amber-500 shrink-0">{i + 1}.</span>
                        {q}
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}

              <!-- Generated content from this material -->
              <svelte:boundary>
                {@const materialPosts = await getMaterialGeneratedPosts({ materialId: material.id })}
                {#if materialPosts.length > 0}
                  <div>
                    <p class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Sparkles class="size-3 text-brand-500" />
                      Generated Content ({materialPosts.length})
                    </p>
                    <div class="space-y-1.5">
                      {#each materialPosts as mp (mp.id)}
                        {@const TypeIcon = postTypeIcons[mp.postType] ?? BookOpen}
                        <div class="flex items-start gap-2 p-2 rounded-lg bg-background border border-border/60 text-xs">
                          <div class="size-6 rounded-md bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center shrink-0 mt-0.5">
                            <TypeIcon class="size-3.5 text-brand-500" />
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5 mb-0.5">
                              <Badge variant="outline" class="text-[9px] h-3.5 px-1">{mp.postType}</Badge>
                              <span class="text-muted-foreground text-[10px]">{timeAgo(mp.createdAt)}</span>
                            </div>
                            {#if mp.postType === 'quiz'}
                              <p class="text-foreground truncate">{(mp.content as any).question ?? ''}</p>
                            {:else if mp.postType === 'flashcard' || mp.postType === 'short'}
                              <p class="text-foreground truncate">{(mp.content as any).front ?? ''}</p>
                            {:else if mp.postType === 'poll'}
                              <p class="text-foreground truncate">{(mp.content as any).question ?? ''}</p>
                            {:else if mp.postType === 'video'}
                              <p class="text-foreground truncate">{(mp.content as any).title ?? ''}</p>
                            {:else}
                              <p class="text-foreground truncate">{(mp.content as any).body ?? ''}</p>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                {#snippet pending()}
                  <div class="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <div class="size-3 rounded-full border border-muted-foreground/30 border-t-brand-500 animate-spin"></div>
                    Loading generated content...
                  </div>
                {/snippet}
              </svelte:boundary>

              <Button size="sm" variant="outline" class="h-7 text-xs gap-1.5 w-full" onclick={() => openGenerateDialog(material.id)}>
                <Sparkles class="size-3" />
                Generate study content from this material
              </Button>
            </div>
          {/if}
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

    <form {...uploadCourseMaterial.enhance(async ({ form, data, submit }) => {
      if (!data.file || !data.title) { toast.error("Select a file and add a title"); return; }
      uploading = true;
      try {
        if (await submit()) {
          form.reset();
          toast.success("Uploaded! AI is processing in the background...");
          uploadOpen = false;
        } else {
          toast.error('Invalid form data!');
          console.log(uploadCourseMaterial.fields.allIssues());
        }
      } catch (e: any) {
        toast.error(e.message ?? "Upload failed");
      } finally {
        uploading = false;
      }
    })} enctype="multipart/form-data">

      <div class="space-y-4">
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
          {#if file.value()}
            <p class="text-sm font-medium text-foreground">{file.value().name}</p>
            <p class="text-xs text-muted-foreground">{formatSize(file.value().size)}</p>
          {:else}
            <Upload class="size-8 text-muted-foreground/40 mx-auto mb-2" />
            <p class="text-sm text-muted-foreground">Click or drag file here</p>
            <p class="text-xs text-muted-foreground/60">PDF, PPTX, DOCX, images, etc.</p>
          {/if}
          <input
            id="file-input"
            {...file.as("file")}
            class="hidden"
            accept=".pdf,.pptx,.ppt,.docx,.doc,.png,.jpg,.jpeg,.mp4,.mp3,.wav"
            onchange={onFileInput}
          />
        </div>

        <div class="space-y-1.5">
          <Label>Title</Label>
          <Input placeholder="e.g. Week 3 Lecture Notes" {...title.as("text")} />
        </div>
        <input {...courseCode.as("hidden", page.params.code)}>

        <div class="flex items-start gap-2 p-3 rounded-lg bg-brand-50 dark:bg-brand-950/20 text-xs text-brand-700 dark:text-brand-300">
          <Brain class="size-3.5 mt-0.5 shrink-0" />
          <span>AI will automatically generate a summary, topics, key points and potential exam questions after upload.</span>
        </div>

        <Button type="submit" class="w-full gap-2" disabled={uploading || !file.value()}>
          {#if uploading}
            <div class="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            Uploading...
          {:else}
            <Upload class="size-4" />
            Upload
          {/if}
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>

<!-- AI Generate Post Dialog -->
<Dialog.Root bind:open={generateOpen}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Sparkles class="size-4 text-brand-500" />
        AI Content Generator
      </Dialog.Title>
      <Dialog.Description class="text-xs">
        Generate quiz questions, flashcards, polls, shorts and more from your course materials.
      </Dialog.Description>
    </Dialog.Header>

    {#if !draft}
      <div class="space-y-4">
        <div class="space-y-1.5">
          <Label>Content type</Label>
          <div class="flex flex-wrap gap-2">
            {#each Object.entries(postTypeLabels) as [val, label] (val)}
              <button
                class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                       {selectedPostType === val
                         ? 'bg-brand-500 text-white border-brand-500'
                         : 'bg-muted text-muted-foreground border-border hover:border-muted-foreground/50'}"
                onclick={() => (selectedPostType = val as any)}
              >
                {label}
              </button>
            {/each}
          </div>
          {#if selectedPostType === 'short'}
            <p class="text-[11px] text-muted-foreground flex items-center gap-1"><Clapperboard class="size-3" /> Saved to the Shorts section of this course</p>
          {:else if selectedPostType === 'video'}
            <p class="text-[11px] text-muted-foreground flex items-center gap-1"><Video class="size-3" /> Saved to the Videos section of this course</p>
          {:else}
            <p class="text-[11px] text-muted-foreground flex items-center gap-1"><BookOpen class="size-3" /> Also appears in the course feed</p>
          {/if}
        </div>

        {#if materials.filter((m) => m.processed).length > 0}
          <div class="space-y-1.5">
            <Label>Source material <span class="text-muted-foreground">(optional)</span></Label>
            <div class="space-y-1 max-h-40 overflow-y-auto">
              <button
                class="w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors
                       {selectedMaterialId === null ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300' : 'border-border hover:border-muted-foreground/40 text-muted-foreground'}"
                onclick={() => (selectedMaterialId = null)}
              >
                No specific material (use topic below)
              </button>
              {#each materials.filter((m) => m.processed) as m (m.id)}
                <button
                  class="w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors
                         {selectedMaterialId === m.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300' : 'border-border hover:border-muted-foreground/40'}"
                  onclick={() => (selectedMaterialId = m.id)}
                >
                  <span class="font-medium text-foreground">{m.title}</span>
                  {#if (m.topics as string[] | null)?.length}
                    <span class="ml-2 text-muted-foreground">{(m.topics as string[]).slice(0, 2).join(', ')}</span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <div class="space-y-1.5">
          <Label>Specific topic <span class="text-muted-foreground">(optional)</span></Label>
          <Input placeholder="e.g. Newton's Laws of Motion" bind:value={customTopic} />
        </div>

        <Button class="w-full gap-2" onclick={handleGenerate} disabled={generating}>
          {#if generating}
            <div class="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            Generating...
          {:else}
            <Sparkles class="size-4" />
            Generate
          {/if}
        </Button>
      </div>
    {:else}
      <div class="space-y-4">
        <div class="p-3 rounded-xl bg-muted/50 border border-border space-y-2 text-sm max-h-72 overflow-y-auto">
          {#if draftPostType === 'quiz'}
            <p class="font-semibold text-foreground">{draft.question}</p>
            <ul class="space-y-1">
              {#each draft.options as opt, i (i)}
                <li class="flex items-center gap-2 text-xs {i === draft.correctIndex ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}">
                  <span class="size-5 rounded-full border flex items-center justify-center text-[10px] shrink-0
                               {i === draft.correctIndex ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-border'}">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </li>
              {/each}
            </ul>
            {#if draft.explanation}
              <p class="text-xs text-muted-foreground italic border-t border-border pt-2">{draft.explanation}</p>
            {/if}
          {:else if draftPostType === 'flashcard'}
            <div class="space-y-2">
              <div class="p-2.5 rounded-lg bg-background border border-border">
                <p class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Front</p>
                <p class="text-sm font-medium">{draft.front}</p>
              </div>
              <div class="p-2.5 rounded-lg bg-background border border-border">
                <p class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Back</p>
                <p class="text-sm">{draft.back}</p>
              </div>
            </div>
          {:else if draftPostType === 'poll'}
            <p class="font-semibold text-foreground">{draft.question}</p>
            <ul class="space-y-1">
              {#each draft.options as opt, i (i)}
                <li class="text-xs px-2.5 py-1.5 rounded-lg bg-background border border-border text-foreground">{opt}</li>
              {/each}
            </ul>
          {:else if draftPostType === 'thread'}
            {#each draft.posts as post, i (i)}
              <div class="p-2 rounded-lg bg-background border border-border">
                <p class="text-[10px] text-muted-foreground mb-1">Post {i + 1}</p>
                <p class="text-xs">{post.body}</p>
              </div>
            {/each}
          {:else if draftPostType === 'short'}
            <div class="space-y-2">
              <div class="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-700/40">
                <p class="text-[10px] text-indigo-300 uppercase tracking-wide mb-1 flex items-center gap-1"><Clapperboard class="size-3" /> Short Front</p>
                <p class="text-sm font-bold text-white">{draft.front}</p>
              </div>
              <div class="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-700/30">
                <p class="text-[10px] text-indigo-300 uppercase tracking-wide mb-1">Answer</p>
                <p class="text-sm text-white/90">{draft.back}</p>
              </div>
            </div>
          {:else if draftPostType === 'video'}
            <div class="space-y-2">
              <div class="p-2.5 rounded-lg bg-background border border-border">
                <p class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1"><Video class="size-3" /> Video Title</p>
                <p class="text-sm font-bold">{draft.title}</p>
              </div>
              {#if draft.description}
                <p class="text-xs text-muted-foreground italic">{draft.description}</p>
              {/if}
              {#if draft.script?.length}
                <div class="space-y-1">
                  <p class="text-[10px] text-muted-foreground uppercase tracking-wide">Script outline</p>
                  {#each draft.script as point, i (i)}
                    <div class="flex gap-2 text-xs">
                      <span class="text-brand-500 shrink-0">{i + 1}.</span>
                      <span>{point}</span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {:else}
            <p class="text-sm">{draft.body}</p>
          {/if}

          {#if draft.topicTags?.length}
            <div class="flex flex-wrap gap-1 pt-1 border-t border-border">
              {#each draft.topicTags as tag (tag)}
                <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400">#{tag}</span>
              {/each}
            </div>
          {/if}
        </div>

        <div class="flex gap-2">
          <Button variant="outline" class="flex-1 gap-1.5 text-xs" onclick={() => { draft = null; }} disabled={saving}>
            <RefreshCw class="size-3.5" />
            Regenerate
          </Button>
          <Button class="flex-1 gap-1.5 text-xs" onclick={handleSavePost} disabled={saving}>
            {#if saving}
              <div class="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              Posting...
            {:else}
              <Send class="size-3.5" />
              Post to feed
            {/if}
          </Button>
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
