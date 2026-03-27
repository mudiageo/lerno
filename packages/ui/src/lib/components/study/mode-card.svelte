<script lang="ts">
  import type { Snippet } from "svelte";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";

  let {
    title,
    description,
    icon,
    badge,
    badgeVariant = "secondary",
    href,
    isPremium = false,
    onchoose,
  }: {
    title: string;
    description: string;
    icon: Snippet;
    badge?: string;
    badgeVariant?: "default" | "secondary" | "destructive" | "outline";
    href?: string;
    isPremium?: boolean;
    onchoose?: () => void;
  } = $props();
</script>

<Card.Root class="group relative border-border/60 bg-card hover:border-brand-400/60 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-200 cursor-pointer overflow-hidden">
  {#if isPremium}
    <div class="absolute top-3 right-3">
      <Badge variant="default" class="text-[10px] bg-xp-gold text-black font-bold border-0 shadow-sm">PRO</Badge>
    </div>
  {/if}

  <Card.Content class="p-6">
    <div class="size-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
      {@render icon()}
    </div>

    <div class="space-y-1.5 mb-4">
      <div class="flex items-center gap-2">
        <h3 class="text-base font-bold text-foreground">{title}</h3>
        {#if badge}
          <Badge variant={badgeVariant} class="text-[10px] px-1.5 h-4">{badge}</Badge>
        {/if}
      </div>
      <p class="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>

    <Button
      class="w-full h-9 text-sm {isPremium ? 'opacity-60 pointer-events-none' : ''}"
      variant={isPremium ? 'outline' : 'default'}
      href={href}
      onclick={onchoose}
    >
      {isPremium ? '🔒 Unlock Pro' : 'Start Session'}
    </Button>
  </Card.Content>
</Card.Root>
