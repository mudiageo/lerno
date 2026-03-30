<script lang="ts">
  import { YoutubeEmbed } from "@lerno/ui/components/watch";
  import { VideoCard } from "@lerno/ui/components/watch";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Separator } from "@lerno/ui/components/ui/separator";
  import * as Avatar from "@lerno/ui/components/ui/avatar";
  import ThumbsUp from "@lucide/svelte/icons/thumbs-up";
  import Share2 from "@lucide/svelte/icons/share-2";
  import Bookmark from "@lucide/svelte/icons/bookmark";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import { page } from "$app/state";

  const videoId = $derived(page.params.id);

  // Related videos (demo — will come from YouTube Data API)
  const related = [
    { id: "dQw4w9WgXcQ", title: "Advanced Calculus: Integration Techniques", channelName: "MathAcademy", duration: "22:15", viewCount: 187000, courseTag: "MATH201" },
    { id: "jNQXAC9IVRw", title: "Cell Division: Mitosis vs Meiosis", channelName: "BiologyPro", duration: "18:42", viewCount: 124000, courseTag: "BIO201" },
    { id: "aircAruvnKk", title: "Machine Learning Fundamentals", channelName: "AI Academy", duration: "35:08", viewCount: 312000, courseTag: "CS301" },
    { id: "7bUVjJWA6Vw", title: "Microeconomics: Market Equilibrium", channelName: "EconLab", duration: "28:55", viewCount: 98000, courseTag: "ECON101" },
    { id: "HluANRwPyNo", title: "Organic Chemistry: Mechanisms", channelName: "ChemTutor", duration: "41:22", viewCount: 74000, courseTag: "CHEM301" },
  ];

  let descExpanded = $state(false);
  const title = "Introduction to Calculus: Limits and Derivatives";
  const channelName = "MathAcademy";
  const viewCount = 245000;
  const description = `In this comprehensive lecture, we explore the foundational concepts of calculus — limits, continuity, and derivatives. We work through multiple examples and real-world applications to build deep intuition.

Topics covered:
• The concept of a limit
• One-sided limits and continuity
• The formal definition of a derivative
• Differentiation rules: power, product, chain
• Applications: velocity, rates of change

This is part of the MATH101 curriculum at Lerno.`;
</script>

<svelte:head>
  <title>{title} — Lerno Watch</title>
  <meta name="description" content={description.slice(0, 160)} />
</svelte:head>

<div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen xl:max-w-none xl:flex xl:gap-0">
  <!-- Main column -->
  <div class="xl:flex-1 xl:min-w-0">
    <!-- Video player -->
    <div class="xl:px-4 xl:pt-4">
      <YoutubeEmbed videoId={videoId ?? "dQw4w9WgXcQ"} title={title} autoload={false} />
    </div>

    <div class="px-4 py-3">
      <!-- Title + metadata -->
      <h1 class="text-base font-bold text-foreground leading-snug mt-2">{title}</h1>

      <div class="flex items-center justify-between gap-2 mt-3">
        <div class="flex items-center gap-2.5">
          <Avatar.Root class="size-9">
            <Avatar.Fallback class="bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 font-bold text-sm">M</Avatar.Fallback>
          </Avatar.Root>
          <div>
            <p class="text-sm font-semibold text-foreground leading-tight">{channelName}</p>
            <p class="text-xs text-muted-foreground">{(viewCount / 1000).toFixed(0)}K views</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button size="sm" class="h-8 gap-1.5 text-xs rounded-full bg-foreground text-background hover:bg-foreground/90">
            <ThumbsUp class="size-3.5" />
            Like
          </Button>
          <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs rounded-full">
            <Bookmark class="size-3.5" />
            Save
          </Button>
          <Button variant="outline" size="icon" class="size-8 rounded-full">
            <Share2 class="size-3.5" />
          </Button>
        </div>
      </div>

      <Separator class="my-3" />

      <!-- Description -->
      <div class="bg-muted/40 rounded-xl p-3.5">
        <div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
          <Badge variant="secondary" class="text-[10px]">MATH101</Badge>
          <span>{new Date().toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>
        <p class="text-sm text-foreground whitespace-pre-wrap leading-relaxed {descExpanded ? '' : 'line-clamp-3'}">
          {description}
        </p>
        <button
          class="flex items-center gap-1 text-xs font-semibold mt-2 hover:text-foreground text-muted-foreground transition-colors"
          onclick={() => (descExpanded = !descExpanded)}
        >
          {#if descExpanded}
            <ChevronUp class="size-3.5" /> Show less
          {:else}
            <ChevronDown class="size-3.5" /> Show more
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Related videos (desktop sidebar) -->
  <div class="hidden xl:block w-[380px] shrink-0 border-l border-border px-4 py-4 overflow-y-auto">
    <h2 class="text-sm font-bold text-foreground mb-4">Up next</h2>
    <div class="flex flex-col gap-4">
      {#each related as video}
        <VideoCard
          id={video.id}
          title={video.title}
          channelName={video.channelName}
          duration={video.duration}
          viewCount={video.viewCount}
          courseTag={video.courseTag}
        />
      {/each}
    </div>
  </div>

  <!-- Related (mobile below video) -->
  <div class="xl:hidden px-4 pb-6">
    <h2 class="text-sm font-bold text-foreground mb-4">Up next</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {#each related.slice(0, 4) as video}
        <VideoCard
          id={video.id}
          title={video.title}
          channelName={video.channelName}
          duration={video.duration}
          viewCount={video.viewCount}
          courseTag={video.courseTag}
        />
      {/each}
    </div>
  </div>
</div>
