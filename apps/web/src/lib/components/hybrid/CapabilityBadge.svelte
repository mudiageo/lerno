<script lang="ts">
	import { Badge } from '@lerno/ui/components/ui/badge';
	import type { OnDeviceCapability } from '#lib/ai/firebase.js';

	let {
		capability,
		configured
	}: {
		capability: OnDeviceCapability | null;
		configured: boolean;
	} = $props();

	type Tone = 'ready' | 'pending' | 'off' | 'muted';

	const TONE_CLASS: Record<Tone, string> = {
		ready:
			'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
		pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
		off: 'border-destructive/30 bg-destructive/10 text-destructive',
		muted: 'border-border bg-muted/60 text-muted-foreground'
	};

	const DOT_CLASS: Record<Tone, string> = {
		ready: 'bg-emerald-500',
		pending: 'bg-amber-500',
		off: 'bg-destructive',
		muted: 'bg-muted-foreground/60'
	};

	const tone = $derived.by((): Tone => {
		if (!capability || !configured) return 'muted';
		if (capability.status === 'available') return 'ready';
		if (capability.status === 'downloadable' || capability.status === 'downloading') {
			return 'pending';
		}
		return 'off';
	});
</script>

<div class="flex flex-wrap items-center gap-2">
	<span
		class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold {TONE_CLASS[
			tone
		]}"
	>
		<span class="size-2 shrink-0 rounded-full {DOT_CLASS[tone]}"></span>
		{capability?.label ?? 'Checking on-device capability…'}
	</span>
	<Badge
		variant={configured ? 'secondary' : 'outline'}
		class="border-border text-[10px] tracking-wide uppercase"
	>
		{configured ? 'Web config loaded' : 'Web config missing'}
	</Badge>
	{#if capability}
		<Badge variant="ghost" class="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
			{capability.status}
		</Badge>
	{/if}
</div>
<p class="mt-1.5 text-xs text-muted-foreground">
	{capability?.detail ?? 'Capability is checked in the browser.'}
</p>
