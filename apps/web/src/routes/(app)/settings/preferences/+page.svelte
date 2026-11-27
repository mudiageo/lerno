<script lang="ts">
	import { Button } from '@lerno/ui/components/ui/button';
	import { Label } from '@lerno/ui/components/ui/label';
	import { Switch } from '@lerno/ui/components/ui/switch';
	import * as RadioGroup from '@lerno/ui/components/ui/radio-group';
	import { toast } from '@lerno/ui/components/ui/sonner';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Palette from '@lucide/svelte/icons/palette';

	let saving = $state(false);
	let theme = $state('system');

	let notifications = $state({
		push: true,
		email: false,
		mentions: true,
		reminders: true
	});

	async function savePreferences() {
		saving = true;
		try {
			// simulate API call
			await new Promise((r) => setTimeout(r, 800));
			toast.success('Preferences updated successfully.');

			// Attempt to apply simple dark mode if document is available
			if (typeof document !== 'undefined') {
				const root = document.documentElement;
				if (theme === 'dark') {
					root.classList.add('dark');
				} else if (theme === 'light') {
					root.classList.remove('dark');
				} else {
					// System preference
					if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
						root.classList.add('dark');
					} else {
						root.classList.remove('dark');
					}
				}
			}
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Preferences — Lerno</title>
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border">
	<!-- Header -->
	<div
		class="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg"
	>
		<div class="flex items-center gap-3">
			<a
				href="/settings"
				class="-ml-1.5 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			>
				<ChevronLeft class="size-5" />
			</a>
			<h1 class="text-lg font-bold tracking-tight">Preferences</h1>
		</div>
		<Button size="sm" class="h-8 px-3 text-xs" disabled={saving} onclick={savePreferences}>
			{saving ? 'Saving...' : 'Save'}
		</Button>
	</div>

	<div class="space-y-8 p-4 md:p-6">
		<!-- Appearance Section -->
		<section class="space-y-4">
			<div class="flex items-center gap-2 text-brand-500">
				<Palette class="size-4" />
				<h2 class="text-sm font-bold tracking-widest text-foreground uppercase">Appearance</h2>
			</div>

			<div class="space-y-3 rounded-xl border border-border p-4">
				<RadioGroup.Root bind:value={theme}>
					<div class="flex items-center space-y-0 space-x-3">
						<RadioGroup.Item value="light" id="theme-light" />
						<Label for="theme-light" class="cursor-pointer font-normal">Light</Label>
					</div>
					<div class="flex items-center space-y-0 space-x-3 pt-2">
						<RadioGroup.Item value="dark" id="theme-dark" />
						<Label for="theme-dark" class="cursor-pointer font-normal">Dark</Label>
					</div>
					<div class="flex items-center space-y-0 space-x-3 pt-2">
						<RadioGroup.Item value="system" id="theme-system" />
						<Label for="theme-system" class="cursor-pointer font-normal">System Default</Label>
					</div>
				</RadioGroup.Root>
			</div>
		</section>

		<!-- Notifications Section -->
		<section class="space-y-4">
			<div class="flex items-center gap-2 text-brand-500">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="size-4"
					><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path
						d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
					/></svg
				>
				<h2 class="text-sm font-bold tracking-widest text-foreground uppercase">Notifications</h2>
			</div>

			<div class="space-y-4 rounded-xl border border-border p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-0.5 pr-4">
						<Label class="text-base font-medium">Push Notifications</Label>
						<p class="text-xs text-muted-foreground">Receive real-time alerts in your browser.</p>
					</div>
					<Switch bind:checked={notifications.push} />
				</div>

				<div class="flex items-center justify-between">
					<div class="space-y-0.5 pr-4">
						<Label class="text-base font-medium">Email Summaries</Label>
						<p class="text-xs text-muted-foreground">Weekly wrap-up of your study progress.</p>
					</div>
					<Switch bind:checked={notifications.email} />
				</div>

				<div class="flex items-center justify-between">
					<div class="space-y-0.5 pr-4">
						<Label class="text-base font-medium">Mentions & Replies</Label>
						<p class="text-xs text-muted-foreground">When someone tags you in a community.</p>
					</div>
					<Switch bind:checked={notifications.mentions} />
				</div>

				<div class="flex items-center justify-between">
					<div class="space-y-0.5 pr-4">
						<Label class="text-base font-medium">Study Reminders</Label>
						<p class="text-xs text-muted-foreground">
							Alerts for upcoming flashcard reviews and mock exams.
						</p>
					</div>
					<Switch bind:checked={notifications.reminders} />
				</div>
			</div>
		</section>
	</div>
</div>
