<script lang="ts">
  import { authClient } from '$lib/auth.svelte';

  let email = $state('');
  let success = $state(false);
  let error = $state('');
  let loading = $state(false);

  async function handleReset(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';
    
    await authClient.forgetPassword({
      email,
      fetchOptions: {
        onSuccess: () => { success = true; },
        onError: (ctx) => { error = ctx.error.message; loading = false; }
      }
    });
  }
</script>

<div class="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
  <h1 class="text-2xl font-bold mb-2 text-center">Reset Password</h1>
  <p class="text-sm text-zinc-500 mb-6 text-center">Enter your email and we'll send you a reset link.</p>
  
  {#if error}
    <div class="p-3 mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>
  {/if}

  {#if success}
    <div class="p-4 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
      Check your email for the reset link!
    </div>
  {:else}
    <form onsubmit={handleReset} class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Email</label>
        <input type="email" bind:value={email} required class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent" />
      </div>

      <button type="submit" disabled={loading} class="w-full py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-lg font-medium transition-colors disabled:opacity-50">
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  {/if}

  <p class="mt-6 text-center text-sm">
    <a href="/sign-in" class="font-medium text-zinc-900 dark:text-white hover:underline">← Back to Sign In</a>
  </p>
</div>
