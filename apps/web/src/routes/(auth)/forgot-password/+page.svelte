<script lang="ts">
	import { authClient } from '#lib/auth.svelte.js';

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
				onSuccess: () => {
					success = true;
				},
				onError: (ctx) => {
					error = ctx.error.message;
					loading = false;
				}
			}
		});
	}
</script>

<div
	class="mx-auto mt-20 max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
>
	<h1 class="mb-2 text-center text-2xl font-bold">Reset Password</h1>
	<p class="mb-6 text-center text-sm text-zinc-500">
		Enter your email and we'll send you a reset link.
	</p>

	{#if error}
		<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/20">{error}</div>
	{/if}

	{#if success}
		<div
			class="rounded-lg bg-emerald-50 p-4 text-center text-sm text-emerald-600 dark:bg-emerald-900/20"
		>
			Check your email for the reset link!
		</div>
	{:else}
		<form onsubmit={handleReset} class="space-y-4">
			<div>
				<label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
				<input
					type="email"
					bind:value={email}
					required
					class="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
			>
				{loading ? 'Sending...' : 'Send Reset Link'}
			</button>
		</form>
	{/if}

	<p class="mt-6 text-center text-sm">
		<a href="/sign-in" class="font-medium text-zinc-900 hover:underline dark:text-white"
			>← Back to Sign In</a
		>
	</p>
</div>
