<script lang="ts">
	import { Badge } from '@lerno/ui/components/ui/badge';
	import { Button } from '@lerno/ui/components/ui/button';
	import { Input } from '@lerno/ui/components/ui/input';
	import { Separator } from '@lerno/ui/components/ui/separator';
	import { Textarea } from '@lerno/ui/components/ui/textarea';
	import ClipboardPaste from '@lucide/svelte/icons/clipboard-paste';
	import FileText from '@lucide/svelte/icons/file-text';
	import Link2 from '@lucide/svelte/icons/link-2';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Save from '@lucide/svelte/icons/save';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { saveCurriculumCourses } from '../../../routes/hybrid/hybrid.remote';
	import {
		extractCurriculum,
		extractPdf,
		fetchGoogleDriveText,
		type ExtractedCourse
	} from '#lib/ai/curriculum.js';
	import { inferenceSourceLabel, isFirebaseAIConfigured, type HybridImage } from '#lib/ai/firebase.js';
	import type { PrivatePassResult } from '#lib/ai/privacy.js';

	type Mode = 'pdf' | 'drive' | 'paste';

	// `id` is only a local key for editable rows; it is not saved.
	type EditableCourse = {
		id: string;
		code: string;
		title: string;
		units: string;
		topics: string;
		outline: string;
	};

	type Extraction = {
		privatePass: PrivatePassResult;
		source: string;
		pageCount: number;
		usedPageImages: number;
	};

	let {
		onCourses,
		compact = false
	}: {
		onCourses?: (courses: ExtractedCourse[]) => void;
		compact?: boolean;
	} = $props();

	const MODES = [
		{ id: 'pdf' as const, label: 'PDF', icon: FileText },
		{ id: 'drive' as const, label: 'Drive link', icon: Link2 },
		{ id: 'paste' as const, label: 'Paste text', icon: ClipboardPaste }
	];

	let mode = $state<Mode>('pdf');
	let busy = $state(false);
	let error = $state('');
	let saveNote = $state('');

	let pdfFile = $state<File | null>(null);
	let driveLink = $state('');
	let pastedText = $state('');
	let extraction = $state<Extraction | null>(null);
	let rows = $state<EditableCourse[]>([]);

	function describeError(reason: unknown): string {
		if (reason instanceof Error && reason.message.trim()) return reason.message;
		return 'Could not read that curriculum. Try another source.';
	}

	function newRow(course?: ExtractedCourse): EditableCourse {
		return {
			id: crypto.randomUUID(),
			code: course?.code ?? '',
			title: course?.title ?? '',
			units: course?.units ? String(course.units) : '',
			topics: course?.topics.join(', ') ?? '',
			outline: course?.outline ?? ''
		};
	}

	async function onPdfSelected(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		pdfFile = input.files?.[0] ?? null;
		error = '';
	}

	async function readCurriculum() {
		if (busy) return;
		busy = true;
		error = '';
		saveNote = '';
		extraction = null;
		rows = [];

		if (!isFirebaseAIConfigured()) {
			error = 'Public Firebase web config missing. Add the values from .env.example, then reload.';
			busy = false;
			return;
		}

		try {
			let text = '';
			let images: HybridImage[] = [];
			let pageCount = 0;

			if (mode === 'pdf') {
				if (!pdfFile) throw new Error('Choose a PDF prospectus first.');
				({ text, images, pageCount } = await extractPdf(pdfFile));
			} else if (mode === 'drive') {
				({ text, images, pageCount } = await fetchGoogleDriveText(driveLink));
			} else {
				text = pastedText;
			}

			const result = await extractCurriculum({ text, images, pageCount });
			extraction = {
				privatePass: result.privatePass,
				source: inferenceSourceLabel(result.source),
				pageCount: result.pageCount,
				usedPageImages: result.usedPageImages
			};
			rows = result.courses.map((course) => newRow(course));
		} catch (reason) {
			error = describeError(reason);
		} finally {
			busy = false;
		}
	}

	function toCourses(): ExtractedCourse[] {
		return rows
			.map((row) => {
				const units = Number(row.units.trim());
				return {
					code: row.code.trim().toUpperCase(),
					title: row.title.trim(),
					...(row.units.trim() && Number.isFinite(units) ? { units } : {}),
					...(row.outline.trim() ? { outline: row.outline.trim() } : {}),
					topics: row.topics
						.split(',')
						.map((topic) => topic.trim())
						.filter(Boolean)
				};
			})
			.filter((course) => course.code && course.title);
	}

	async function confirmCourses() {
		if (busy) return;
		const courses = toCourses();
		if (courses.length === 0) {
			error = 'Add a course code and title before saving.';
			return;
		}

		busy = true;
		error = '';
		saveNote = '';
		try {
			if (onCourses) {
				onCourses(courses);
				saveNote = `${courses.length} course${courses.length === 1 ? '' : 's'} added to your plan.`;
			} else {
				const result = await saveCurriculumCourses({ courses });
				saveNote = `Saved ${result.saved}, skipped ${result.skipped} already on your account.`;
			}
		} catch (reason) {
			const message = describeError(reason);
			error = /sign in|unauthori[sz]ed|401/i.test(message)
				? 'Sign in to save courses.'
				: message;
		} finally {
			busy = false;
		}
	}
</script>

<div class={compact ? 'space-y-3' : 'space-y-6'}>
	<div class="flex flex-wrap items-center gap-2">
		{#each MODES as item (item.id)}
			<Button
				variant={mode === item.id ? 'default' : 'outline'}
				size="sm"
				onclick={() => (mode = item.id)}
			>
				<item.icon class="size-4" />
				{item.label}
			</Button>
		{/each}
	</div>

	{#if mode === 'pdf'}
		<div class="space-y-1.5">
			<label for="curriculum-pdf" class="text-xs font-medium text-foreground">
				Prospectus or curriculum PDF
			</label>
			<Input id="curriculum-pdf" type="file" accept="application/pdf" onchange={onPdfSelected} />
			{#if pdfFile}
				<p class="text-xs text-muted-foreground">{pdfFile.name}</p>
			{/if}
		</div>
	{:else if mode === 'drive'}
		<div class="space-y-1.5">
			<label for="curriculum-drive" class="text-xs font-medium text-foreground">
				Public Google Drive link
			</label>
			<Input
				id="curriculum-drive"
				bind:value={driveLink}
				placeholder="https://drive.google.com/file/d/…/view"
			/>
		</div>
	{:else}
		<div class="space-y-1.5">
			<label for="curriculum-text" class="text-xs font-medium text-foreground">
				Paste curriculum text
			</label>
			<Textarea
				id="curriculum-text"
				bind:value={pastedText}
				rows={compact ? 4 : 8}
				placeholder="CS101 — Introduction to Computing…"
			/>
		</div>
	{/if}

	<div class="flex flex-wrap items-center gap-3">
		<Button size="sm" onclick={readCurriculum} disabled={busy}>
			{#if busy}
				<LoaderCircle class="size-4 animate-spin" />
			{:else}
				<FileText class="size-4" />
			{/if}
			Read curriculum
		</Button>
		<p class="text-xs text-muted-foreground">Private Pass runs before any cloud extraction</p>
	</div>

	{#if error}
		<div
			role="alert"
			class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
		>
			<TriangleAlert class="mt-0.5 size-4 shrink-0" />
			<span>{error}</span>
		</div>
	{/if}

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

	{#if extraction}
		<div class="rounded-xl border border-border bg-muted/30 p-3">
			<div class="flex flex-wrap items-center gap-2">
				<p class="text-xs font-semibold text-foreground">Extraction summary</p>
				{@render sourceBadge(extraction.source)}
			</div>
			<p class="mt-2 text-xs text-muted-foreground">
				Private Pass kept {extraction.privatePass.keptLocal} identifiers local · {extraction
					.privatePass.contextualRedactions} contextual redactions ·
				{extraction.privatePass.fallback
					? 'regex-only fallback'
					: 'on-device pass completed'}
			</p>
			<p class="mt-1 text-xs text-muted-foreground">
				{extraction.pageCount} pages read · {extraction.usedPageImages} page images used
			</p>
			<p class="mt-2 text-xs font-medium text-brand-600 dark:text-brand-300">
				Nothing is saved until you confirm.
			</p>
		</div>

		<div class="space-y-3">
			<div class="flex items-center justify-between gap-2">
				<h3 class="text-sm font-bold text-foreground">Review courses</h3>
				<span class="text-xs text-muted-foreground">{rows.length} found</span>
			</div>

			{#each rows as row, index (row.id)}
				<div class="rounded-xl border border-border bg-card p-3">
					<div class="grid gap-2 sm:grid-cols-[8rem_1fr_5rem_auto]">
						<Input bind:value={row.code} placeholder="CS101" aria-label="Course code" />
						<Input bind:value={row.title} placeholder="Course title" aria-label="Course title" />
						<Input bind:value={row.units} placeholder="Units" aria-label="Credit units" />
						<Button
							variant="ghost"
							size="icon-sm"
							onclick={() => (rows = rows.filter((item) => item.id !== row.id))}
							aria-label="Remove course"
						>
							<Trash2 class="size-4 text-muted-foreground" />
						</Button>
					</div>
					<div class="mt-2">
						<Input
							bind:value={row.topics}
							placeholder="Topics, separated by commas"
							aria-label="Topics for {row.code || `course ${index + 1}`}"
						/>
					</div>
				</div>
			{/each}

			<Button variant="outline" size="sm" onclick={() => (rows = [...rows, newRow()])}>
				Add course
			</Button>
		</div>

		<Separator />

		<div class="flex flex-wrap items-center gap-3">
			<Button size="sm" onclick={confirmCourses} disabled={busy || rows.length === 0}>
				<Save class="size-4" />
				Save courses
			</Button>
			{#if saveNote}
				<p class="text-xs font-medium text-emerald-700 dark:text-emerald-300">{saveNote}</p>
			{/if}
		</div>
	{/if}
</div>
