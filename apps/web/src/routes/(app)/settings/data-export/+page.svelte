<script lang="ts">
  import { Button } from "@lerno/ui/components/ui/button";
  import { Checkbox } from "@lerno/ui/components/ui/checkbox";
  import { Label } from "@lerno/ui/components/ui/label";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Download from "@lucide/svelte/icons/download";
  import Database from "@lucide/svelte/icons/database";

  let requesting = $state(false);
  let types = $state({
    profile: true,
    courses: true,
    flashcards: true,
    activity: true
  });

  async function requestDataExport() {
    requesting = true;
    try {
      // simulate API call
      await new Promise((r) => setTimeout(r, 1500));
      toast.success("Data export requested! We'll email you a link when it's ready.");
    } finally {
      requesting = false;
    }
  }
</script>

<svelte:head>
  <title>Data Export — Lerno</title>
</svelte:head>

<div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen">
  <!-- Header -->
  <div class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
    <a href="/settings" class="p-1.5 -ml-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
      <ChevronLeft class="size-5" />
    </a>
    <h1 class="text-lg font-bold tracking-tight">Data Export</h1>
  </div>

  <div class="p-4 md:p-6 space-y-8">
    <div class="flex items-center gap-4 p-5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-700 dark:text-brand-300">
      <div class="size-12 rounded-xl bg-brand-500 border-2 border-background flex items-center justify-center shrink-0">
        <Database class="size-6 text-white" />
      </div>
      <div>
        <h2 class="text-sm font-bold">Your data is yours.</h2>
        <p class="text-xs text-brand-600/80 dark:text-brand-300/80 mt-0.5">Download a copy of your Lerno data to keep offline or move to another platform.</p>
      </div>
    </div>

    <!-- Export Options -->
    <div class="space-y-4">
      <h3 class="text-base font-bold text-foreground">Select data to export</h3>
      
      <div class="space-y-3 p-4 rounded-xl border border-border">
        <div class="flex items-start gap-3">
          <Checkbox id="export-profile" bind:checked={types.profile} />
          <div class="space-y-1 leading-none pt-0.5">
            <Label for="export-profile" class="font-medium">Profile & Account Info</Label>
            <p class="text-xs text-muted-foreground">Your personal information, bio, and account settings.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <Checkbox id="export-courses" bind:checked={types.courses} />
          <div class="space-y-1 leading-none pt-0.5">
            <Label for="export-courses" class="font-medium">Courses & Materials</Label>
            <p class="text-xs text-muted-foreground">Your enrolled courses, uploaded files, and generated study guides.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <Checkbox id="export-flashcards" bind:checked={types.flashcards} />
          <div class="space-y-1 leading-none pt-0.5">
            <Label for="export-flashcards" class="font-medium">Flashcards & Mastery</Label>
            <p class="text-xs text-muted-foreground">Your spaced repetition flashcard history and mastery progress.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <Checkbox id="export-activity" bind:checked={types.activity} />
          <div class="space-y-1 leading-none pt-0.5">
            <Label for="export-activity" class="font-medium">Community Posts</Label>
            <p class="text-xs text-muted-foreground">Topics, discussions, and items shared in groups.</p>
          </div>
        </div>
      </div>
    </div>

    <div>
      <Button disabled={requesting} class="w-full gap-2 h-11" onclick={requestDataExport}>
        <Download class="size-4" />
        {requesting ? "Preparing Request..." : "Request Data Archive"}
      </Button>
      <p class="text-[11px] text-muted-foreground text-center mt-3">
        Exports may take up to a few hours depending on the size of your materials. It will be emailed to your registered address.
      </p>
    </div>
  </div>
</div>
