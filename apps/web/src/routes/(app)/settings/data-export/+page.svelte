<script lang="ts">
	import { Button } from '@lerno/ui/components/ui/button';
	import { Checkbox } from '@lerno/ui/components/ui/checkbox';
	import { Label } from '@lerno/ui/components/ui/label';
	import { toast } from '@lerno/ui/components/ui/sonner';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Download from '@lucide/svelte/icons/download';
	import Database from '@lucide/svelte/icons/database';

	let requesting = $state(false);
	let types = $state({
		profile: true,
		courses: true,
		flashcards: true,
		activity: true
	});

	async function requestDataExport() {
		requesting = true;
		try {
			// simulate API call
			await new Promise((r) => setTimeout(r, 1500));
			toast.success("Data export requested! We'll email you a link when it's ready.");
		} finally {
			requesting = false;
		}
	}
</script>

<svelte:head>
	<title>Data Export — Lerno</title>
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border">
	<!-- Header -->
	<div
		class="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg"
	>
		<a
			href="/settings"
			class="-ml-1.5 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
		>
			<ChevronLeft class="size-5" />
		</a>
		<h1 class="text-lg font-bold tracking-tight">Data Export</h1>
	</div>

	<div class="space-y-8 p-4 md:p-6">
		<div
			class="flex items-center gap-4 rounded-2xl border border-brand-500/20 bg-brand-500/10 p-5 text-brand-700 dark:text-brand-300"
		>
			<div
				class="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-background bg-brand-500"
			>
				<Database class="size-6 text-white" />
			</div>
			<div>
				<h2 class="text-sm font-bold">Your data is yours.</h2>
				<p class="mt-0.5 text-xs text-brand-600/80 dark:text-brand-300/80">
					Download a copy of your Lerno data to keep offline or move to another platform.
				</p>
			</div>
		</div>

		<!-- Export Options -->
		<div class="space-y-4">
			<h3 class="text-base font-bold text-foreground">Select data to export</h3>

			<div class="space-y-3 rounded-xl border border-border p-4">
				<div class="flex items-start gap-3">
					<Checkbox id="export-profile" bind:checked={types.profile} />
					<div class="space-y-1 pt-0.5 leading-none">
						<Label for="export-profile" class="font-medium">Profile & Account Info</Label>
						<p class="text-xs text-muted-foreground">
							Your personal information, bio, and account settings.
						</p>
					</div>
				</div>
				<div class="flex items-start gap-3">
					<Checkbox id="export-courses" bind:checked={types.courses} />
					<div class="space-y-1 pt-0.5 leading-none">
						<Label for="export-courses" class="font-medium">Courses & Materials</Label>
						<p class="text-xs text-muted-foreground">
							Your enrolled courses, uploaded files, and generated study guides.
						</p>
					</div>
				</div>
				<div class="flex items-start gap-3">
					<Checkbox id="export-flashcards" bind:checked={types.flashcards} />
					<div class="space-y-1 pt-0.5 leading-none">
						<Label for="export-flashcards" class="font-medium">Flashcards & Mastery</Label>
						<p class="text-xs text-muted-foreground">
							Your spaced repetition flashcard history and mastery progress.
						</p>
					</div>
				</div>
				<div class="flex items-start gap-3">
					<Checkbox id="export-activity" bind:checked={types.activity} />
					<div class="space-y-1 pt-0.5 leading-none">
						<Label for="export-activity" class="font-medium">Community Posts</Label>
						<p class="text-xs text-muted-foreground">
							Topics, discussions, and items shared in groups.
						</p>
					</div>
				</div>
			</div>
		</div>

		<div>
			<Button disabled={requesting} class="h-11 w-full gap-2" onclick={requestDataExport}>
				<Download class="size-4" />
				{requesting ? 'Preparing Request...' : 'Request Data Archive'}
			</Button>
			<p class="mt-3 text-center text-[11px] text-muted-foreground">
				Exports may take up to a few hours depending on the size of your materials. It will be
				emailed to your registered address.
			</p>
		</div>
	</div>
</div>
