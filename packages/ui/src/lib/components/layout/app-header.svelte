<script lang="ts">
  import Search from "@lucide/svelte/icons/search";
  import Bell from "@lucide/svelte/icons/bell";
  import Moon from "@lucide/svelte/icons/moon";
  import Sun from "@lucide/svelte/icons/sun";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { mode, toggleMode } from "mode-watcher";

  let {
    user,
    unreadNotifications = 0,
    onSearchOpen,
  }: {
    user?: any;
    unreadNotifications?: number;
    onSearchOpen?: () => void;
  } = $props();
</script>

<header
  class="lg:hidden sticky top-0 z-40 flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-lg border-b border-border pt-safe"
>
  <!-- Logo -->
  <a href="/feed" class="flex items-center gap-2 mr-2">
    <div
      class="size-7 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm"
    >
      <span class="text-xs font-black text-white">L</span>
    </div>
    <span class="text-base font-black tracking-tight text-foreground"
      >Lerno</span
    >
  </a>

  <!-- Search trigger -->
  <button
    onclick={onSearchOpen}
    class="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors text-left"
  >
    <Search class="size-3.5 shrink-0" />
    <span class="hidden sm:block">Search...</span>
  </button>

  <!-- Notifications -->
  <Tooltip.Root>
    <Tooltip.Trigger>
      <Button
        variant="ghost"
        size="icon"
        class="relative size-9"
        href="/notifications"
      >
        <Bell class="size-4" />
        {#if unreadNotifications > 0}
          <span
            class="absolute top-1 right-1 size-4 rounded-full bg-brand-500 text-[10px] font-bold text-white flex items-center justify-center"
          >
            {unreadNotifications > 9 ? "9+" : unreadNotifications}
          </span>
        {/if}
      </Button>
    </Tooltip.Trigger>
    <Tooltip.Content>Notifications</Tooltip.Content>
  </Tooltip.Root>

  <!-- Theme toggle -->
  <Button variant="ghost" size="icon" class="size-9" onclick={toggleMode}>
    {#if mode.current === "dark"}
      <Sun class="size-4" />
    {:else}
      <Moon class="size-4" />
    {/if}
  </Button>
</header>
