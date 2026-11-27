<script lang="ts">
	import { authClient } from '#lib/auth.svelte.js';

	let success = $state(false);
	let error = $state('');
	const session = authClient.useSession();

	// Handle auto-verification if token is in URL (often passed by email links)
	$effect(() => {
		const url = new URL(window.location.href);
		const token = url.searchParams.get('token');

		if (token) {
			authClient.verifyEmail({
				query: { token },
				fetchOptions: {
					onSuccess: () => {
						success = true;
					},
					onError: (ctx) => {
						error = ctx.error.message;
					}
				}
			});
		}
	});

	async function resend() {
		error = '';
		const url = new URL(window.location.href);
		await authClient.sendVerificationEmail({
			// We assume user is logged in but unverified if they hit this button natively
			email: $session.data?.user?.email || url.searchParams.get('email') || '',
			fetchOptions: {
				onSuccess: () => {
					alert('Verification email sent!');
				},
				onError: (ctx) => {
					error = ctx.error.message;
				}
			}
		});
	}
</script>

<div
	class="mx-auto mt-20 max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
>
	{#if success}
		<h1 class="mb-4 text-2xl font-bold text-emerald-600">Email Verified!</h1>
		<p class="mb-6 text-zinc-600 dark:text-zinc-400">Your email has been successfully verified.</p>
		<a
			href="/feed"
			class="inline-block rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition-colors dark:bg-white dark:text-zinc-900"
		>
			Go to Feed
		</a>
	{:else}
		<h1 class="mb-4 text-2xl font-bold">Check Your Email</h1>
		<p class="mb-6 text-zinc-600 dark:text-zinc-400">
			We sent a verification link to your email address. Please check your inbox and click the link
			to verify your account.
		</p>

		{#if error}
			<div class="mb-6 rounded-lg bg-red-50 p-3 text-left text-sm text-red-500 dark:bg-red-900/20">
				{error}
			</div>
		{/if}

		<button
			onclick={resend}
			class="w-full rounded-lg border border-zinc-300 px-4 py-2 font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
		>
			Resend Verification Email
		</button>
	{/if}
</div>
