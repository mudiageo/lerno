<script lang="ts">
	import { useSession } from '#lib/auth.svelte.js';

	const session = useSession();

	const features = [
		{
			title: 'AI-Powered Tutoring',
			description:
				'Personalized quizzes and summaries generated from your course material in seconds.',
			icon: '🤖'
		},
		{
			title: 'Social Learning',
			description: 'Join dedicated course communities to share notes and solve problems together.',
			icon: '👥'
		},
		{
			title: 'Gamified Progress',
			description:
				'Keep your streak alive and climb the leaderboard while mastering your subjects.',
			icon: '🏆'
		}
	];
</script>

<svelte:head>
	<title>Lerno | Personalized AI Education</title>
</svelte:head>

<div class="min-h-screen overflow-hidden bg-zinc-950 text-white selection:bg-indigo-500/30">
	<!-- Animated Mesh Gradient Background -->
	<div class="pointer-events-none fixed inset-0 -z-10">
		<div
			class="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] animate-pulse rounded-full bg-indigo-600/20 blur-[120px]"
		></div>
		<div
			class="absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] animate-pulse rounded-full bg-emerald-600/10 blur-[120px] [animation-delay:2s]"
		></div>
		<div
			class="absolute top-[20%] right-[10%] h-[30%] w-[30%] animate-pulse rounded-full bg-blue-600/10 blur-[100px] [animation-delay:4s]"
		></div>
	</div>

	<!-- Navbar -->
	<nav class="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
		<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-lg font-bold"
				>
					L
				</div>
				<span class="text-xl font-bold tracking-tight">Lerno</span>
			</div>

			<div class="flex items-center gap-4">
				<a href="/hybrid" class="text-sm font-medium transition-colors hover:text-indigo-400"
					>Hybrid AI</a
				>
				{#if session?.data?.user}
					<a href="/feed" class="text-sm font-medium transition-colors hover:text-indigo-400"
						>Go to App</a
					>
				{:else}
					<a href="/sign-in" class="text-sm font-medium transition-colors hover:text-indigo-400"
						>Login</a
					>
					<a
						href="/sign-up"
						class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
					>
						Get Started
					</a>
				{/if}
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<main class="relative px-6 pt-20 pb-16">
		<div class="mx-auto max-w-7xl text-center">
			<div
				class="mb-8 inline-flex animate-in items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400 duration-1000 fade-in slide-in-from-bottom-4"
			>
				<span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
				Now in Beta for University Students
			</div>

			<h1
				class="mb-6 animate-in bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-5xl font-black tracking-tight text-transparent duration-1000 fade-in slide-in-from-bottom-8 md:text-7xl lg:text-8xl"
			>
				Education, but <br class="hidden md:block" />
				<span class="text-indigo-500">Intelligent.</span>
			</h1>

			<p
				class="mx-auto mb-10 max-w-2xl animate-in text-lg text-zinc-400 delay-200 duration-1000 slide-in-from-bottom-10 fade-in md:text-xl"
			>
				Lerno uses advanced AI to transform your lecture notes, PDFs, and reading materials into a
				personalized, gamified study experience.
			</p>

			<div
				class="flex animate-in flex-col items-center justify-center gap-4 delay-300 duration-1000 fade-in slide-in-from-bottom-12 sm:flex-row"
			>
				<a
					href="/sign-up"
					class="w-full rounded-2xl bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:scale-105 hover:bg-indigo-500 active:scale-95 sm:w-auto"
				>
					Start Learning Free
				</a>
				<a
					href="/hybrid"
					class="w-full rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 sm:w-auto"
				>
					Try Hybrid AI
				</a>
			</div>

			<!-- Hero Visual (Course Card Mockup) -->
			<div
				class="group relative mx-auto mt-20 max-w-5xl animate-in delay-500 duration-1000 zoom-in-95 fade-in"
			>
				<div
					class="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-emerald-500 opacity-20 blur transition duration-1000 group-hover:opacity-30"
				></div>
				<div
					class="relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-2xl"
				>
					<!-- Simulated App Interface -->
					<div
						class="flex h-full w-full flex-col rounded-2xl border border-white/5 bg-zinc-950/50 p-6"
					>
						<div class="mb-8 flex items-center gap-4">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/20 text-xl"
							>
								🧪
							</div>
							<div class="text-left">
								<div class="mb-2 h-4 w-32 rounded-full bg-white/10"></div>
								<div class="h-3 w-20 rounded-full bg-white/5"></div>
							</div>
						</div>
						<div class="space-y-4">
							<div class="h-32 w-full animate-pulse rounded-xl bg-white/5"></div>
							<div class="grid grid-cols-2 gap-4">
								<div class="h-20 rounded-xl border border-indigo-500/10 bg-indigo-500/5"></div>
								<div class="h-20 rounded-xl border border-emerald-500/10 bg-emerald-500/5"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>

	<!-- Features Section -->
	<section class="border-t border-white/5 px-6 py-24">
		<div class="mx-auto max-w-7xl">
			<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
				{#each features as feature}
					<div
						class="group rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-colors hover:border-white/10"
					>
						<div
							class="mb-6 text-4xl grayscale transition-all duration-500 group-hover:grayscale-0"
						>
							{feature.icon}
						</div>
						<h3 class="mb-3 text-xl font-bold">{feature.title}</h3>
						<p class="text-sm leading-relaxed text-zinc-400">
							{feature.description}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-white/5 px-6 py-12 text-center text-sm text-zinc-500">
		<p>&copy; 2026 Lerno AI. All rights reserved.</p>
	</footer>
</div>

<style>
	/* Custom animations for tailwind (since we don't have anime.js or similar yet) */
	:global(.animate-in) {
		animation-fill-mode: both;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	/* Mesh gradient animation */
	@keyframes pulse {
		0%,
		100% {
			opacity: 0.1;
			transform: scale(1);
		}
		50% {
			opacity: 0.3;
			transform: scale(1.1);
		}
	}
</style>
