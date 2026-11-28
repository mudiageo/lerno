<script lang="ts">
	import { Badge } from '@lerno/ui/components/ui/badge';
	import { Button } from '@lerno/ui/components/ui/button';
	import { Input } from '@lerno/ui/components/ui/input';
	import { Separator } from '@lerno/ui/components/ui/separator';
	import { Textarea } from '@lerno/ui/components/ui/textarea';
	import { onMount } from 'svelte';
	import CloudOff from '@lucide/svelte/icons/cloud-off';
	import Download from '@lucide/svelte/icons/download';
	import FileImage from '@lucide/svelte/icons/file-image';
	import Info from '@lucide/svelte/icons/info';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import ScanLine from '@lucide/svelte/icons/scan-line';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Zap from '@lucide/svelte/icons/zap';
	import {
		currentDataSaved,
		generateInstantEnhanced,
		generateRevisionPack,
		markPastQuestion,
		type InstantEnhancedResult,
		type MarkResult
	} from '#lib/ai/actions.js';
	import {
		formatBytes,
		getDataSaved,
		listRevisionPacks,
		markRevisionPackSynced,
		type DataSavedStats,
		type RevisionPack
	} from '#lib/ai/cache.js';
	import {
		fileToHybridImage,
		getOnDeviceCapability,
		inferenceSourceLabel,
		isFirebaseAIConfigured,
		prepareOnDeviceModel,
		type HybridImage,
		type OnDeviceCapability
	} from '#lib/ai/firebase.js';
	import { maskObviousIdentifiers, runPrivatePass, type PrivatePassResult } from '#lib/ai/privacy.js';
	import { syncRevisionPacks } from '../../../routes/hybrid/hybrid.remote';
	import CapabilityBadge from './CapabilityBadge.svelte';

	const TABS = [
		{ id: 'revision', label: 'Revision Pack', icon: Sparkles },
		{ id: 'private', label: 'Private Pass', icon: ShieldCheck },
		{ id: 'instant', label: 'Instant + Enhanced', icon: Zap },
		{ id: 'mark', label: 'Snap-and-Mark', icon: ScanLine }
	] as const;

	type TabId = (typeof TABS)[number]['id'];

	let capability = $state<OnDeviceCapability | null>(null);
	let configured = $state(false);
	let online = $state(true);
	let busy = $state(false);
	let error = $state('');
	let activeTab = $state<TabId>('revision');
	let stats = $state<DataSavedStats>({
		onDeviceAnswers: 0,
		cloudAnswers: 0,
		bytesAvoided: 0
	});
	let packs = $state<RevisionPack[]>([]);

	let preparing = $state(false);
	let progress = $state<number | null>(null);
	let syncNote = $state('');

	let revision = $state({ courseCode: '', topic: '', notes: '' });
	let revisionPack = $state<RevisionPack | null>(null);

	let privateText = $state('');
	let privateResult = $state<PrivatePassResult | null>(null);
	let privateNote = $state('');

	let tutor = $state({ question: '', courseCode: '', topic: '' });
	let tutorResult = $state<InstantEnhancedResult | null>(null);

	let markCourseCode = $state('');
	let answerKey = $state('');
	let markImage = $state<HybridImage | null>(null);
	let markFileName = $state('');
	let markResult = $state<MarkResult | null>(null);

	const unsyncedPacks = $derived(packs.filter((pack) => !pack.synced));
	const canGenerate = $derived(!busy && configured);

	function describeError(reason: unknown): string {
		if (reason instanceof Error && reason.message.trim()) return reason.message;
		return 'That did not work. Try again with shorter input.';
	}

	function toPercent(value: number): number {
		return Math.round(value <= 1 ? value * 100 : value);
	}

	onMount(() => {
		let disposed = false;

		configured = isFirebaseAIConfigured();
		online = navigator.onLine;
		stats = getDataSaved();

		void (async () => {
			try {
				const [nextCapability, nextPacks] = await Promise.all([
					getOnDeviceCapability(),
					listRevisionPacks().catch(() => [] as RevisionPack[])
				]);
				if (disposed) return;
				capability = nextCapability;
				packs = nextPacks;
			} catch {
				if (!disposed) error = 'Could not check the local model or cached packs.';
			}
		})();

		function handleOnline() {
			online = true;
		}

		function handleOffline() {
			online = false;
		}

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			disposed = true;
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	async function prepareModel() {
		if (preparing || !configured) return;
		preparing = true;
		progress = 0;
		error = '';
		try {
			await prepareOnDeviceModel((value) => {
				progress = Math.min(100, Math.max(0, toPercent(value)));
			});
			progress = 100;
			capability = await getOnDeviceCapability();
		} catch (reason) {
			error = describeError(reason);
		} finally {
			preparing = false;
		}
	}

	async function generatePack() {
		if (!canGenerate) return;
		busy = true;
		error = '';
		syncNote = '';
		try {
			revisionPack = await generateRevisionPack(revision);
			packs = await listRevisionPacks();
			stats = currentDataSaved();
		} catch (reason) {
			error = describeError(reason);
		} finally {
			busy = false;
		}
	}

	async function syncPacks() {
		if (!canGenerate || unsyncedPacks.length === 0) return;
		busy = true;
		error = '';
		syncNote = '';
		try {
			const queued = unsyncedPacks.map((pack) => ({
				id: pack.id,
				courseCode: pack.courseCode,
				topic: pack.topic,
				cards: pack.cards.map((card) => ({
					front: card.front,
					back: card.back,
					...(card.hint ? { hint: card.hint } : {}),
					...(card.topicTags ? { topicTags: card.topicTags } : {})
				}))
			}));
			const result = await syncRevisionPacks(queued);
			for (const pack of queued) {
				await markRevisionPackSynced(pack.id);
			}
			packs = await listRevisionPacks();
			syncNote = `${result.synced} cards synced to your study deck.`;
		} catch (reason) {
			error = describeError(reason).includes('Sign in')
				? 'Sign in to sync revision packs.'
				: describeError(reason);
		} finally {
			busy = false;
		}
	}

	async function runPass() {
		if (!canGenerate || !privateText.trim()) return;
		busy = true;
		error = '';
		privateNote = '';
		privateResult = null;
		try {
			privateResult = await runPrivatePass(privateText);
		} catch {
			const masked = maskObviousIdentifiers(privateText);
			privateResult = {
				safeText: masked.masked,
				keptLocal: masked.total,
				regexCounts: masked.counts,
				contextualRedactions: 0,
				inferenceSource: 'unknown',
				fallback: true
			};
			privateNote = 'Regex only; on-device unavailable.';
		} finally {
			busy = false;
		}
	}

	async function generateAnswers() {
		if (!canGenerate || !tutor.question.trim()) return;
		busy = true;
		error = '';
		tutorResult = null;
		try {
			tutorResult = await generateInstantEnhanced(tutor);
			stats = currentDataSaved();
		} catch (reason) {
			error = describeError(reason);
		} finally {
			busy = false;
		}
	}

	async function onMarkFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		markImage = null;
		markFileName = file?.name ?? '';
		markResult = null;
		if (!file) return;
		error = '';
		try {
			markImage = await fileToHybridImage(file);
		} catch (reason) {
			error = describeError(reason);
		}
	}

	async function markAnswer() {
		if (!canGenerate || !markImage) return;
		busy = true;
		error = '';
		markResult = null;
		try {
			markResult = await markPastQuestion({
				image: markImage,
				answerKey,
				courseCode: markCourseCode
			});
			stats = currentDataSaved();
		} catch (reason) {
			error = describeError(reason);
		} finally {
			busy = false;
		}
	}
</script>

<div class="space-y-5">
	<div class="rounded-2xl border border-border bg-card p-4">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="min-w-0 flex-1">
				<p class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
					Data saved locally
				</p>
				<p class="mt-1 text-sm font-semibold text-foreground">
					{stats.onDeviceAnswers} on-device · {stats.cloudAnswers} cloud · {formatBytes(
						stats.bytesAvoided
					)} avoided
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={prepareModel}
					disabled={!canGenerate || preparing}
				>
					{#if preparing}
						<LoaderCircle class="size-4 animate-spin" />
					{:else}
						<Download class="size-4" />
					{/if}
					{preparing ? 'Preparing…' : 'Prepare model'}
				</Button>
			</div>
		</div>

		{#if progress !== null}
			<div class="mt-3 max-w-sm">
				<div class="h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-brand-500 transition-all" style="width: {progress}%"></div>
				</div>
				<p class="mt-1 text-[11px] text-muted-foreground">Model download {progress}%</p>
			</div>
		{/if}

		<Separator class="my-3" />
		<CapabilityBadge {capability} {configured} />
	</div>

	{#if !configured}
		<div
			role="status"
			class="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"
		>
			<Info class="mt-0.5 size-4 shrink-0" />
			<div>
				<p class="font-semibold">Public Firebase web config missing</p>
				<p class="mt-0.5 text-xs text-amber-700/80 dark:text-amber-200/80">
					Add the FIREBASE_* values listed in .env.example, then reload. Generation is
					paused until the web config is present.
				</p>
			</div>
		</div>
	{/if}

	{#if !online}
		<div
			role="status"
			class="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
		>
			<CloudOff class="size-4" />
			Offline — using on-device only
		</div>
	{/if}

	{#if error}
		<div
			role="alert"
			class="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
		>
			{error}
		</div>
	{/if}

	<div role="tablist" aria-label="Hybrid AI tools" class="flex flex-wrap gap-1 border-b border-border">
		{#each TABS as tab (tab.id)}
			<button
				type="button"
				role="tab"
				id="lab-tab-{tab.id}"
				aria-controls="lab-panel-{tab.id}"
				aria-selected={activeTab === tab.id}
				onclick={() => (activeTab = tab.id)}
				class="-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors {activeTab ===
				tab.id
					? 'border-brand-500 text-brand-500'
					: 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				<tab.icon class="size-4" />
				{tab.label}
			</button>
		{/each}
	</div>

	{#snippet sourceBadge(source: string)}
		<Badge
			variant={source === 'ON_DEVICE' ? 'secondary' : source === 'IN_CLOUD' ? 'outline' : 'ghost'}
			class="font-mono text-[10px] tracking-wide {source === 'ON_DEVICE'
				? 'text-emerald-700 dark:text-emerald-300'
				: 'text-muted-foreground'}"
		>
			{source}
		</Badge>
	{/snippet}

	{#if activeTab === 'revision'}
		<div id="lab-panel-revision" role="tabpanel" aria-labelledby="lab-tab-revision" class="space-y-4">
			<div class="grid gap-3 sm:grid-cols-2">
				<div class="space-y-1.5">
					<label for="rev-code" class="text-xs font-medium text-foreground">Course code</label>
					<Input id="rev-code" bind:value={revision.courseCode} placeholder="CS101" />
				</div>
				<div class="space-y-1.5">
					<label for="rev-topic" class="text-xs font-medium text-foreground">Topic</label>
					<Input id="rev-topic" bind:value={revision.topic} placeholder="Big-O notation" />
				</div>
			</div>
			<div class="space-y-1.5">
				<label for="rev-notes" class="text-xs font-medium text-foreground">Lecture notes</label>
				<Textarea
					id="rev-notes"
					bind:value={revision.notes}
					rows={5}
					placeholder="Paste the notes you want to revise…"
				/>
			</div>
			<div class="flex flex-wrap items-center gap-3">
				<Button size="sm" onclick={generatePack} disabled={!canGenerate || !revision.notes.trim()}>
					{#if busy}<LoaderCircle class="size-4 animate-spin" />{:else}<Sparkles class="size-4" />{/if}
					Generate pack
				</Button>
				<p class="text-xs text-muted-foreground">
					{packs.length} cached · {unsyncedPacks.length} queued to sync
				</p>
				<Button
					variant="outline"
					size="sm"
					onclick={syncPacks}
					disabled={!canGenerate || unsyncedPacks.length === 0}
				>
					Sync now
				</Button>
			</div>
			{#if syncNote}
				<p class="text-xs text-emerald-700 dark:text-emerald-300">{syncNote}</p>
			{/if}

			{#if revisionPack}
				<div class="rounded-xl border border-border bg-card p-4">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-sm font-semibold text-foreground">
							{revisionPack.courseCode} · {revisionPack.topic}
						</p>
						{@render sourceBadge(inferenceSourceLabel(revisionPack.inferenceSource))}
					</div>
					<div class="mt-3 divide-y divide-border/60">
						{#each revisionPack.cards as card, index (index)}
							<div class="py-3 first:pt-0 last:pb-0">
								<p class="text-sm font-medium text-foreground">{index + 1}. {card.front}</p>
								<p class="mt-1 text-sm text-muted-foreground">{card.back}</p>
								{#if card.hint}
									<p class="mt-1 text-xs text-muted-foreground">Hint: {card.hint}</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else if activeTab === 'private'}
		<div id="lab-panel-private" role="tabpanel" aria-labelledby="lab-tab-private" class="space-y-4">
			<div class="space-y-1.5">
				<label for="private-text" class="text-xs font-medium text-foreground">Text to redact</label>
				<Textarea
					id="private-text"
					bind:value={privateText}
					rows={6}
					placeholder="Paste notes containing names, emails or matric numbers…"
				/>
			</div>
			<Button size="sm" onclick={runPass} disabled={!canGenerate || !privateText.trim()}>
				<ShieldCheck class="size-4" />
				Run Private Pass
			</Button>
			{#if privateNote}
				<p class="text-xs font-medium text-amber-700 dark:text-amber-300">{privateNote}</p>
			{/if}
			{#if privateResult}
				<div class="rounded-xl border border-border bg-card p-4">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-sm font-semibold text-foreground">Redacted copy</p>
						{@render sourceBadge(inferenceSourceLabel(privateResult.inferenceSource))}
					</div>
					<pre
						class="mt-3 max-h-64 overflow-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap text-foreground">{privateResult.safeText ||
						'Nothing left after redaction.'}</pre>
					<p class="mt-3 text-xs text-muted-foreground">
						{privateResult.keptLocal} kept local · {privateResult.contextualRedactions} contextual
						redactions · regex {privateResult.regexCounts.email}/{privateResult.regexCounts
							.phone}/{privateResult.regexCounts.studentId}/{privateResult.regexCounts.url}
					</p>
					<p class="mt-1 text-xs text-muted-foreground">
						The original text is not sent to the cloud. Only this redacted copy is used downstream.
					</p>
				</div>
			{/if}
		</div>
	{:else if activeTab === 'instant'}
		<div id="lab-panel-instant" role="tabpanel" aria-labelledby="lab-tab-instant" class="space-y-4">
			<div class="space-y-1.5">
				<label for="tutor-question" class="text-xs font-medium text-foreground">Question</label>
				<Textarea
					id="tutor-question"
					bind:value={tutor.question}
					rows={3}
					placeholder="Ask a course question…"
				/>
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				<div class="space-y-1.5">
					<label for="tutor-code" class="text-xs font-medium text-foreground">Course code</label>
					<Input id="tutor-code" bind:value={tutor.courseCode} placeholder="CS101" />
				</div>
				<div class="space-y-1.5">
					<label for="tutor-topic" class="text-xs font-medium text-foreground">Topic</label>
					<Input id="tutor-topic" bind:value={tutor.topic} placeholder="Sorting algorithms" />
				</div>
			</div>
			<Button size="sm" onclick={generateAnswers} disabled={!canGenerate || !tutor.question.trim()}>
				<Zap class="size-4" />
				Answer both ways
			</Button>

			{#if tutorResult}
				<p class="text-xs text-muted-foreground">
					Private Pass kept {tutorResult.privatePass.keptLocal} identifiers local · {tutorResult
						.privatePass.contextualRedactions} contextual redactions
				</p>
				<div class="grid gap-4 lg:grid-cols-2">
					<div class="rounded-xl border border-border bg-card p-4">
						<div class="flex items-center gap-2">
							<p class="text-sm font-bold text-foreground">Instant</p>
							{@render sourceBadge(inferenceSourceLabel(tutorResult.instant.source))}
						</div>
						<p
							class="mt-3 max-h-80 overflow-auto text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground"
						>
							{tutorResult.instant.text}
						</p>
					</div>
					<div class="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
						<div class="flex items-center gap-2">
							<p class="text-sm font-bold text-brand-600 dark:text-brand-300">Enhanced</p>
							{@render sourceBadge(inferenceSourceLabel(tutorResult.enhanced.source))}
						</div>
						<p
							class="mt-3 max-h-80 overflow-auto text-sm leading-relaxed whitespace-pre-wrap text-foreground"
						>
							{tutorResult.enhanced.text}
						</p>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div id="lab-panel-mark" role="tabpanel" aria-labelledby="lab-tab-mark" class="space-y-4">
			<div class="grid gap-3 sm:grid-cols-2">
				<div class="space-y-1.5">
					<label for="mark-code" class="text-xs font-medium text-foreground">Course code</label>
					<Input id="mark-code" bind:value={markCourseCode} placeholder="CS101" />
				</div>
				<div class="space-y-1.5">
					<label for="mark-key" class="text-xs font-medium text-foreground">Answer key</label>
					<Input id="mark-key" bind:value={answerKey} placeholder="B, then derivation…" />
				</div>
			</div>
			<div class="space-y-1.5">
				<label for="mark-image" class="text-xs font-medium text-foreground">
					Question photo (JPEG or PNG)
				</label>
				<Input
					id="mark-image"
					type="file"
					accept="image/jpeg,image/png"
					onchange={onMarkFile}
				/>
				{#if markFileName}
					<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
						<FileImage class="size-3.5" />
						{markFileName}
					</p>
				{/if}
			</div>
			<Button size="sm" onclick={markAnswer} disabled={!canGenerate || !markImage}>
				<ScanLine class="size-4" />
				Mark answer
			</Button>

			{#if markResult}
				<div class="space-y-3 rounded-xl border border-border bg-card p-4">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-sm font-semibold text-foreground">Marking result</p>
						{@render sourceBadge(inferenceSourceLabel(markResult.firstSource))}
						{#if markResult.escalatedToCloud}
							<Badge variant="outline" class="text-[10px]">Escalated to cloud for review</Badge>
						{/if}
						{#if typeof markResult.score === 'number'}
							<Badge variant="secondary" class="text-[10px]">Score {markResult.score}</Badge>
						{/if}
					</div>
					<div class="grid gap-3 sm:grid-cols-2">
						<div>
							<p class="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
								Question
							</p>
							<p class="mt-1 text-sm whitespace-pre-wrap text-foreground">
								{markResult.extractedQuestion}
							</p>
						</div>
						<div>
							<p class="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
								Student answer
							</p>
							<p class="mt-1 text-sm whitespace-pre-wrap text-foreground">
								{markResult.extractedAnswer}
							</p>
						</div>
					</div>
					<Separator />
					<div>
						<p class="text-sm font-semibold text-foreground">{markResult.verdict}</p>
						<p class="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
							{markResult.feedback}
						</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
