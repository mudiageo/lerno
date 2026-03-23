<script lang="ts">
  import { signIn } from '$lib/auth.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleSignIn(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';
    
    await signIn.email({
      email, password,
      fetchOptions: {
        onSuccess: () => { window.location.href = '/feed'; },
        onError: (ctx) => { error = ctx.error.message; loading = false; }
      }
    });
  }

  async function handleGoogle() {
    await signIn.social({
      provider: 'google',
      callbackURL: '/feed'
    });
  }
</script>

<div class="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
  <h1 class="text-2xl font-bold mb-6 text-center">Sign in to Lerno</h1>
  
  {#if error}
    <div class="p-3 mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>
  {/if}

  <form onsubmit={handleSignIn} class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Email</label>
      <input type="email" bind:value={email} required class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent" />
    </div>
    
    <div>
      <div class="flex justify-between items-center mb-1">
        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
        <a href="/forgot-password" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</a>
      </div>
      <input type="password" bind:value={password} required class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent" />
    </div>

    <button type="submit" disabled={loading} class="w-full py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-lg font-medium transition-colors disabled:opacity-50">
      {loading ? 'Signing in...' : 'Sign In'}
    </button>
  </form>

  <div class="my-6 flex items-center gap-4">
    <div class="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
    <span class="text-sm text-zinc-500">or</span>
    <div class="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
  </div>

  <button onclick={handleGoogle} class="w-full py-2 px-4 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
    <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
    Sign in with Google
  </button>
  
  <p class="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
    Don't have an account? <a href="/sign-up" class="font-medium text-zinc-900 dark:text-white hover:underline">Sign up</a>
  </p>
</div>
