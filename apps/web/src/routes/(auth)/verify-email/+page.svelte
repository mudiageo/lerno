<script lang="ts">
  import { authClient } from '$lib/auth.svelte';

  let success = $state(false);
  let error = $state('');

  // Handle auto-verification if token is in URL (often passed by email links)
  $effect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    
    if (token) {
      authClient.verifyEmail({
        query: { token },
        fetchOptions: {
          onSuccess: () => { success = true; },
          onError: (ctx) => { error = ctx.error.message; }
        }
      });
    }
  });

  async function resend() {
    error = '';
    await authClient.sendVerificationEmail({
      // We assume user is logged in but unverified if they hit this button natively
      email: authClient.useSession().current?.user?.email || '',
      fetchOptions: {
        onSuccess: () => { alert('Verification email sent!'); },
        onError: (ctx) => { error = ctx.error.message; }
      }
    });
  }
</script>

<div class="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
  {#if success}
    <h1 class="text-2xl font-bold mb-4 text-emerald-600">Email Verified!</h1>
    <p class="text-zinc-600 dark:text-zinc-400 mb-6">Your email has been successfully verified.</p>
    <a href="/feed" class="inline-block py-2 px-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg font-medium transition-colors">
      Go to Feed
    </a>
  {:else}
    <h1 class="text-2xl font-bold mb-4">Check Your Email</h1>
    <p class="text-zinc-600 dark:text-zinc-400 mb-6">
      We sent a verification link to your email address. Please check your inbox and click the link to verify your account.
    </p>

    {#if error}
      <div class="p-3 mb-6 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">{error}</div>
    {/if}

    <button onclick={resend} class="w-full py-2 px-4 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg font-medium transition-colors">
      Resend Verification Email
    </button>
  {/if}
</div>
