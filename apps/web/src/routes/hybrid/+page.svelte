<script lang="ts">
	import { Button } from '@lerno/ui/components/ui/button';
	import CurriculumBootstrap from '#lib/components/hybrid/CurriculumBootstrap.svelte';
	import HybridLab from '#lib/components/hybrid/HybridLab.svelte';
</script>

<svelte:head>
	<title>Hybrid AI Lab — Lerno</title>
	<meta
		name="description"
		content="Try Lerno's on-device-first hybrid AI tools: revision packs, private redaction, tutoring and marking."
	/>
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	<header
		class="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-lg"
	>
		<div
			class="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 md:px-6"
		>
			<div class="flex min-w-0 flex-1 items-center gap-3">
				<div
					class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 shadow-lg"
				>
					<span class="text-lg font-black text-white">L</span>
				</div>
				<div class="min-w-0">
					<h1 class="truncate text-base font-bold tracking-tight">Hybrid AI Lab</h1>
					<p class="text-[11px] text-muted-foreground">Web/Chrome demo</p>
				</div>
			</div>
			<nav class="flex items-center gap-1">
				<Button href="/" variant="ghost" size="sm">Home</Button>
				<Button href="/sign-in" size="sm">Sign in</Button>
			</nav>
		</div>
	</header>

	<main class="mx-auto max-w-5xl space-y-8 px-4 py-6 md:px-6 md:py-8">
		<section aria-labelledby="lab-heading" class="space-y-3">
			<div>
				<h2 id="lab-heading" class="text-lg font-bold tracking-tight">Study tools, on-device first</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Private work stays on this device. Cloud fallback is used only when needed.
				</p>
			</div>
			<HybridLab />
		</section>

		<section aria-labelledby="curriculum-heading" class="space-y-3">
			<div>
				<h2 id="curriculum-heading" class="text-lg font-bold tracking-tight">
					Curriculum Bootstrap
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Import courses from a prospectus, Drive link or pasted text. Sign in to save them.
				</p>
			</div>
			<div class="rounded-2xl border border-border bg-card p-4 md:p-5">
				<CurriculumBootstrap />
			</div>
		</section>
	</main>
</div>
