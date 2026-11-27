<script lang="ts">
	import { useSession } from '#lib/auth.svelte.js';
	import { completeOnboarding } from './onboarding.remote';

	const session = useSession();

	let currentStep = $state(1);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Form State
	let username = $state('');
	let courses = $state([{ code: '', title: '', semester: 'Fall 2026' }]);
	let theme = $state('system');
	let aiEnabled = $state(true);

	// Automatically pre-fill username based on email
	$effect(() => {
		if (session?.data?.user?.email && !username) {
			username = session.data.user.email.split('@')[0];
		}
	});

	function nextStep() {
		currentStep += 1;
	}
	function prevStep() {
		currentStep -= 1;
	}

	function addCourse() {
		courses.push({ code: '', title: '', semester: 'Fall 2026' });
	}
	function removeCourse(i: number) {
		courses.splice(i, 1);
	}

	async function submit() {
		loading = true;
		error = null;
		try {
			const result = await completeOnboarding({
				username,
				courses: courses.filter((c) => c.code.trim() !== ''),
				events: [], // we skip events in simple onboarding for now
				preferences: { theme, aiEnabled }
			});

			if (result.success) {
				window.location.href = '/feed';
			}
		} catch (e: any) {
			console.error('Onboarding failed:', e);
			error = e.message || 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="mx-auto mt-12 max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
>
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Welcome to Lerno</h1>
		<span
			class="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-500 dark:bg-zinc-800"
			>Step {currentStep} of 5</span
		>
	</div>

	<div class="mb-10 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
		<div
			class="h-full bg-zinc-900 transition-all duration-300 dark:bg-white"
			style="width: {(currentStep / 5) * 100}%"
		></div>
	</div>

	{#if error}
		<div
			class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/10 dark:text-red-400"
		>
			{error}
		</div>
	{/if}

	{#if currentStep === 1}
		<div class="animate-in fade-in slide-in-from-bottom-4">
			<h2 class="mb-4 text-xl font-semibold">Choose your username</h2>
			<p class="mb-6 text-zinc-500">
				This is how other students will see you in communities and leaderboards.
			</p>

			<label for="username" class="mb-1 block text-sm font-medium">Username</label>
			<input
				id="username"
				type="text"
				bind:value={username}
				class="w-full rounded-xl border border-zinc-300 bg-transparent px-4 py-3 text-lg dark:border-zinc-700"
				placeholder="johndoe"
			/>
		</div>
	{/if}

	{#if currentStep === 2}
		<div class="animate-in fade-in slide-in-from-bottom-4">
			<h2 class="mb-4 text-xl font-semibold">Add your courses</h2>
			<p class="mb-6 text-zinc-500">
				We use this to personalize your feed and generate AI study content.
			</p>

			{#each courses as course, i}
				<div class="mb-4 flex gap-4">
					<input
						type="text"
						bind:value={course.code}
						placeholder="CS101"
						class="w-1/3 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 uppercase dark:border-zinc-700"
					/>
					<input
						type="text"
						bind:value={course.title}
						placeholder="Intro to Computer Science"
						class="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
					/>

					{#if i > 0}
						<button
							onclick={() => removeCourse(i)}
							class="px-2 py-2 text-red-500 hover:text-red-600"
							aria-label="Remove course"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								></path></svg
							>
						</button>
					{/if}
				</div>
			{/each}

			<button
				onclick={addCourse}
				class="mt-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
				>+ Add another course</button
			>
		</div>
	{/if}

	{#if currentStep === 3}
		<div class="animate-in fade-in slide-in-from-bottom-4">
			<h2 class="mb-4 text-xl font-semibold">Exam Dates (Optional)</h2>
			<p class="mb-6 text-zinc-500">We'll send you reminders 1, 3, and 7 days before exams.</p>

			<div
				class="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="mb-4 text-sm text-zinc-500">
					Skip this for now. You can sync your calendar or add dates manually later.
				</p>
			</div>
		</div>
	{/if}

	{#if currentStep === 4}
		<div class="animate-in fade-in slide-in-from-bottom-4">
			<h2 class="mb-4 text-xl font-semibold">Upload initial notes (Optional)</h2>
			<p class="mb-6 text-zinc-500">
				Upload course syllabi or initial lecture notes to kickstart your personalized AI generation.
			</p>

			<div
				class="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="mb-4 text-sm text-zinc-500">
					Skip this for now. File uploads will be available in the main app feed.
				</p>
			</div>
		</div>
	{/if}

	{#if currentStep === 5}
		<div class="animate-in fade-in slide-in-from-bottom-4">
			<h2 class="mb-4 text-xl font-semibold">Personalization</h2>
			<p class="mb-6 text-zinc-500">Configure how Lerno behaves for you.</p>

			<div class="space-y-6">
				<div>
					<label for="theme" class="mb-2 block text-sm font-medium">Theme</label>
					<select
						id="theme"
						bind:value={theme}
						class="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
					>
						<option value="system">System Default</option>
						<option value="light">Light Mode</option>
						<option value="dark">Dark Mode</option>
						<option value="oled">OLED Pitch Black</option>
					</select>
				</div>

				<div
					class="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50"
				>
					<div>
						<h4 class="font-medium">AI Tutor & Content Generation</h4>
						<p class="text-sm text-zinc-500">
							Allow Lerno to automatically generate quizzes and flashcards from your courses.
						</p>
					</div>
					<input
						type="checkbox"
						bind:checked={aiEnabled}
						class="h-5 w-5 rounded text-zinc-900 focus:ring-zinc-900"
					/>
				</div>
			</div>
		</div>
	{/if}

	<div
		class="mt-8 flex items-center justify-between border-t border-zinc-100 pt-6 dark:border-zinc-800"
	>
		{#if currentStep > 1}
			<button
				onclick={prevStep}
				class="px-6 py-2 font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
				>Back</button
			>
		{:else}
			<div></div>
		{/if}

		{#if currentStep < 5}
			<button
				onclick={nextStep}
				class="rounded-lg bg-zinc-900 px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-900"
				>Continue</button
			>
		{:else}
			<button
				onclick={submit}
				disabled={loading}
				class="rounded-lg bg-emerald-600 px-8 py-2 font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
			>
				{loading ? 'Finishing setup...' : 'Get Started!'}
			</button>
		{/if}
	</div>
</div>
