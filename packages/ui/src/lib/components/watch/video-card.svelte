<script lang="ts">
  import * as AspectRatio from "$lib/components/ui/aspect-ratio";
  import * as Avatar from "$lib/components/ui/avatar";
  import { Badge } from "$lib/components/ui/badge";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import Play from "@lucide/svelte/icons/play";

  let {
    id,
    title,
    channelName,
    channelAvatar,
    thumbnailUrl,
    duration,
    viewCount,
    courseTag,
    href,
  }: {
    id: string;
    title: string;
    channelName: string;
    channelAvatar?: string;
    thumbnailUrl?: string;
    duration?: string;
    viewCount?: number;
    courseTag?: string;
    href?: string;
  } = $props();

  function formatViews(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
  }
</script>

<a
  href={href ?? `/watch/${id}`}
  class="group flex flex-col gap-2.5 hover:opacity-95 transition-opacity"
>
  <!-- Thumbnail -->
  <div class="relative rounded-xl overflow-hidden bg-muted">
    <AspectRatio.Root ratio={16 / 9}>
      {#if thumbnailUrl}
        <img
          src={thumbnailUrl}
          alt={title}
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      {:else}
        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-500/20 to-brand-700/10">
          <Play class="size-10 text-brand-400/60" />
        </div>
      {/if}
    </AspectRatio.Root>

    <!-- Duration badge -->
    {#if duration}
      <div class="absolute bottom-2 right-2">
        <Badge class="text-[10px] font-bold bg-black/80 text-white border-0 px-1.5 py-0.5 font-mono">
          {duration}
        </Badge>
      </div>
    {/if}

    <!-- Play overlay -->
    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
      <div class="size-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center
                  opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
        <Play class="size-5 text-foreground ml-0.5" />
      </div>
    </div>
  </div>

  <!-- Metadata -->
  <div class="flex gap-2.5">
    <Avatar.Root class="size-8 shrink-0 mt-0.5">
      <Avatar.Image src={channelAvatar} alt={channelName} />
      <Avatar.Fallback class="text-[10px] font-bold bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
        {channelName[0]}
      </Avatar.Fallback>
    </Avatar.Root>

    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {title}
      </p>
      <p class="text-xs text-muted-foreground mt-1">{channelName}</p>
      <div class="flex items-center gap-1.5 mt-0.5">
        {#if viewCount !== undefined}
          <span class="text-[11px] text-muted-foreground">{formatViews(viewCount)} views</span>
        {/if}
        {#if courseTag}
          <span class="text-muted-foreground/40">·</span>
          <Badge variant="secondary" class="text-[10px] px-1.5 h-4">{courseTag}</Badge>
        {/if}
      </div>
    </div>
  </div>
</a>
