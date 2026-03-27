<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import AlertCircle from "@lucide/svelte/icons/circle-alert";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import WifiOff from "@lucide/svelte/icons/wifi-off";

  let {
    message = "Something went wrong",
    onretry,
    compact = false,
  }: {
    message?: string;
    onretry?: () => void;
    compact?: boolean;
  } = $props();

  const isNetworkError = $derived(
    message.toLowerCase().includes("network") ||
    message.toLowerCase().includes("fetch") ||
    message.toLowerCase().includes("failed")
  );
</script>

{#if compact}
  <!-- Inline compact version for components -->
  <div class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
    <AlertCircle class="size-4 shrink-0" />
    <span class="flex-1 leading-snug line-clamp-2">{message}</span>
    {#if onretry}
      <button
        class="shrink-0 flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity"
        onclick={onretry}
      >
        <RefreshCw class="size-3.5" />
        Retry
      </button>
    {/if}
  </div>
{:else}
  <!-- Full-page error state -->
  <div class="flex flex-col items-center justify-center gap-5 py-20 px-6 text-center">
    <div class="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
      {#if isNetworkError}
        <WifiOff class="size-8 text-destructive/70" />
      {:else}
        <AlertCircle class="size-8 text-destructive/70" />
      {/if}
    </div>
    <div class="space-y-1.5 max-w-xs">
      <p class="text-base font-bold text-foreground">
        {isNetworkError ? "Connection issues" : "Something went wrong"}
      </p>
      <p class="text-sm text-muted-foreground leading-relaxed">{message}</p>
    </div>
    {#if onretry}
      <Button variant="outline" class="gap-2 h-9" onclick={onretry}>
        <RefreshCw class="size-4" />
        Try again
      </Button>
    {/if}
  </div>
{/if}
