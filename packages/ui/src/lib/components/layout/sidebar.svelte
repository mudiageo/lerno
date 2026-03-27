<script lang="ts">
  import { page } from "$app/state";
  import Home from "@lucide/svelte/icons/house";
  import Tv from "@lucide/svelte/icons/tv";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Radio from "@lucide/svelte/icons/radio";
  import Users from "@lucide/svelte/icons/users";
  import Trophy from "@lucide/svelte/icons/trophy";
  import Search from "@lucide/svelte/icons/search";
  import PenSquare from "@lucide/svelte/icons/pen-square";
  import Settings from "@lucide/svelte/icons/settings";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Separator } from "$lib/components/ui/separator";
  import Clapperboard from "@lucide/svelte/icons/clapperboard";

  let { user, onCompose }: { user?: any; onCompose?: () => void } = $props();

  const navItems = [
    { href: "/feed", icon: Home, label: "Feed" },
    { href: "/watch", icon: Tv, label: "Watch" },
    { href: "/watch/shorts", icon: Clapperboard, label: "Shorts" },
    { href: "/study", icon: BookOpen, label: "Study" },
    { href: "/live", icon: Radio, label: "Live" },
    { href: "/communities", icon: Users, label: "Communities" },
    { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { href: "/search", icon: Search, label: "Search" },
  ];
</script>

<nav
  class="hidden lg:flex flex-col h-screen w-16 xl:w-[var(--sidebar-width)] sticky top-0 border-r border-border bg-sidebar py-3 px-2 xl:px-3 shrink-0 no-scrollbar overflow-y-auto"
>
  <!-- Logo -->
  <a
    href="/feed"
    class="flex items-center gap-2.5 px-2 py-2 mb-4 rounded-xl hover:bg-accent transition-colors"
  >
    <div
      class="size-8 rounded-xl bg-brand-500 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/25"
    >
      <span class="font-black text-sm text-white">L</span>
    </div>
    <span
      class="hidden xl:block text-lg font-black tracking-tight text-foreground"
      >Lerno</span
    >
  </a>

  <!-- Compose button -->
  <button
    onclick={onCompose}
    class="flex items-center justify-center xl:justify-start gap-3 px-2 xl:px-3 py-2.5 mb-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shadow-sm shadow-brand-500/20"
  >
    <PenSquare class="size-4 shrink-0" />
    <span class="hidden xl:block">New Post</span>
  </button>

  <!-- Nav items -->
  <div class="flex flex-col gap-0.5 flex-1">
    {#each navItems as item}
      {@const active = page.url.pathname.startsWith(item.href)}
      <Tooltip.Root>
        <Tooltip.Trigger>
          <a
            href={item.href}
            class="flex items-center gap-3 px-2 xl:px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                   {active
              ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
          >
            <item.icon class="size-5 shrink-0 {active ? 'stroke-[2.5]' : ''}" />
            <span class="hidden xl:block">{item.label}</span>
            {#if item.href === "/live"}
              <Badge
                variant="destructive"
                class="hidden xl:flex ml-auto text-[10px] px-1.5 h-4"
                >LIVE</Badge
              >
            {/if}
          </a>
        </Tooltip.Trigger>
        <Tooltip.Content side="right" class="xl:hidden">
          {item.label}
        </Tooltip.Content>
      </Tooltip.Root>
    {/each}
  </div>

  <Separator class="my-3" />

  <!-- Settings -->
  <a
    href="/settings"
    class="flex items-center gap-3 px-2 xl:px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
  >
    <Settings class="size-5 shrink-0" />
    <span class="hidden xl:block">Settings</span>
  </a>

  <!-- User profile -->
  <a
    href="/profile"
    class="flex items-center gap-3 px-2 xl:px-3 py-2.5 mt-1 rounded-xl hover:bg-accent transition-colors group"
  >
    <Avatar.Root
      class="size-8 shrink-0 ring-2 ring-border group-hover:ring-brand-400 transition-all"
    >
      <Avatar.Image src={user?.image} alt={user?.name} />
      <Avatar.Fallback
        class="bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 text-xs font-bold"
      >
        {user?.name?.[0] ?? "U"}
      </Avatar.Fallback>
    </Avatar.Root>
    <div class="hidden xl:block min-w-0">
      <p class="text-sm font-semibold text-foreground truncate">
        {user?.name ?? "User"}
      </p>
      <p class="text-xs text-muted-foreground truncate">
        @{user?.username ?? user?.email?.split("@")[0] ?? "user"}
      </p>
    </div>
  </a>
</nav>
