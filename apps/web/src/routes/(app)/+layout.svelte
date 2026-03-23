<script lang="ts">
  import { useSession } from '$lib/auth.svelte';
  import { goto } from '$app/navigation';
  
  let { children } = $props();
  
  const session = useSession();

  // Opportunistic client-side route protection
  // This prevents flicker on client-side navigation.
  // The hooks.server.ts handles the actual server-side security.
  $effect(() => {
    if (session && !session.isPending && !session.data?.user) {
      goto('/sign-in');
    }
  });
</script>

{#if session?.isPending}
  <div class="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
    <div class="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin"></div>
  </div>
{:else if session?.data?.user}
  {@render children()}
{/if}
