<script lang="ts">
  import { useSession } from "$lib/auth.svelte";
  import { goto } from "$app/navigation";
  import { ModeWatcher } from "mode-watcher";
  import {
    Sidebar,
    BottomNav,
    RightPanel,
    AppHeader,
    CommandPalette,
  } from "@lerno/ui/components/layout";

  let { children } = $props();

  const getSession = useSession();
  const session = $derived($getSession);
  const user = $derived(session.data?.user);

  let commandOpen = $state(false);

  $effect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        commandOpen = true;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  $effect(() => {
    if (session && !session.isPending && !session.data?.user) {
      goto("/sign-in");
    }
  });
</script>

<ModeWatcher />
<CommandPalette bind:open={commandOpen} />

{#if session?.isPending}
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="flex flex-col items-center gap-3">
      <div
        class="size-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg"
      >
        <span class="text-xl font-black text-white">L</span>
      </div>
      <div
        class="w-6 h-6 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin"
      ></div>
    </div>
  </div>
{:else if session?.data?.user}
  <!-- App shell: sidebar (desktop) | main | right panel (xl) -->
  <div class="flex min-h-screen bg-background">
    <!-- Desktop sidebar -->
    <Sidebar
      {user}
      onCompose={() => {
        /* TODO: open composer sheet */
      }}
    />

    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Mobile header -->
      <AppHeader {user} onSearchOpen={() => (commandOpen = true)} />

      <main class="flex-1 overflow-y-auto">
        <svelte:boundary>
          {@render children()}
          {#snippet pending()}
            <div class="flex-1 flex items-center justify-center p-12">
              <div class="w-8 h-8 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin"></div>
            </div>
          {/snippet}
          {#snippet failed(error, reset)}
            <div class="flex-1 flex flex-col items-center justify-center p-12 text-center gap-4">
              <p class="text-sm text-muted-foreground">Something went wrong.</p>
              <button class="text-xs text-brand-500 underline" onclick={reset}>Try again</button>
            </div>
          {/snippet}
        </svelte:boundary>
      </main>
    </div>

    <!-- Desktop right panel -->
    <RightPanel {user} />
  </div>

  <!-- Mobile bottom nav -->
  <BottomNav />
{/if}
