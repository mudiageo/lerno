<script lang="ts">
	import { useSession } from '#lib/auth.svelte.js';
	import { goto } from '$app/navigation';
	import { ModeWatcher } from 'mode-watcher';
	import {
		Sidebar,
		BottomNav,
		RightPanel,
		AppHeader,
		CommandPalette
	} from '@lerno/ui/components/layout';

	let { children } = $props();

	const getSession = useSession();
	const session = $derived($getSession);
	const user = $derived(session.data?.user);

	let commandOpen = $state(false);

	$effect(() => {
		function handleKey(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				commandOpen = true;
			}
		}
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	});

	$effect(() => {
		if (session && !session.isPending && !session.data?.user) {
			goto('/sign-in');
		}
	});
</script>

<ModeWatcher />
<CommandPalette bind:open={commandOpen} />

{#if session?.isPending}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="flex flex-col items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-xl bg-brand-500 shadow-lg">
				<span class="text-xl font-black text-white">L</span>
			</div>
			<div
				class="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500"
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
		<div class="flex min-w-0 flex-1 flex-col">
			<!-- Mobile header -->
			<AppHeader {user} onSearchOpen={() => (commandOpen = true)} />

			<main class="flex-1 overflow-y-auto">
				<svelte:boundary>
					{@render children()}
					{#snippet pending()}
						<div class="flex flex-1 items-center justify-center p-12">
							<div
								class="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500"
							></div>
						</div>
					{/snippet}
					{#snippet failed(error, reset)}
						<div class="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
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
