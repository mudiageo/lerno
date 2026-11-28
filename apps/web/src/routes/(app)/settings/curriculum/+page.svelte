<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import CurriculumBootstrap from '#lib/components/hybrid/CurriculumBootstrap.svelte';
</script>

<svelte:head>
	<title>Curriculum Bootstrap — Lerno</title>
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border">
	<div
		class="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg"
	>
		<a
			href="/settings"
			class="-ml-1.5 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			aria-label="Back to settings"
		>
			<ChevronLeft class="size-5" />
		</a>
		<h1 class="text-lg font-bold tracking-tight">Curriculum Bootstrap</h1>
	</div>

	<div class="space-y-4 p-4 md:p-6">
		<p class="text-sm text-muted-foreground">
			Add the courses from your prospectus. Review every row before saving — nothing is stored until
			you confirm.
		</p>
		<div class="rounded-2xl border border-border bg-card p-4 md:p-5">
			<CurriculumBootstrap />
		</div>
	</div>
</div>
