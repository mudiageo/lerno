<script lang="ts">
  import { page } from "$app/state";
  import Home from "@lucide/svelte/icons/house";
  import GraduationCap from "@lucide/svelte/icons/graduation-cap";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Clapperboard from "@lucide/svelte/icons/clapperboard";
  import User from "@lucide/svelte/icons/user";

  const tabs = [
    { href: "/feed", icon: Home, label: "Feed" },
    { href: "/watch/shorts", icon: Clapperboard, label: "Shorts" },
    { href: "/courses", icon: GraduationCap, label: "Courses" },
    { href: "/study", icon: BookOpen, label: "Study" },
    { href: "/profile", icon: User, label: "Me" },
  ];
</script>

<nav
  class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 dark:bg-background/95 backdrop-blur-lg border-t border-border pb-safe"
>
  <div class="flex">
    {#each tabs as tab}
      {@const active = page.url.pathname.startsWith(tab.href)}
      {@const Icon = tab.icon}
      <a
        href={tab.href}
        class="flex-1 flex flex-col items-center gap-1 py-2.5 px-1 relative transition-colors
               {active ? 'text-brand-500' : 'text-muted-foreground'}"
      >
        {#if active}
          <span
            class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-500 rounded-full"
          ></span>
        {/if}
        <Icon class="size-5 {active ? 'stroke-[2.5]' : ''}" />
        <span class="text-[10px] font-medium">{tab.label}</span>
      </a>
    {/each}
  </div>
</nav>
