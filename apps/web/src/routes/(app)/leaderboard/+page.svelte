<script lang="ts">
	import { getLeaderboard, getUserStats } from './leaderboard.remote';
	import { LeaderboardItem, UserStatsCard } from '@lerno/ui/components/leaderboard';
	import { Button } from '@lerno/ui/components/ui/button';
	import { Badge } from '@lerno/ui/components/ui/badge';
	import Trophy from '@lucide/svelte/icons/trophy';
	import Users from '@lucide/svelte/icons/users';
	import Globe from '@lucide/svelte/icons/globe';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';

	let scope = $state<'global' | 'course' | 'friends'>('global');

	// Initial data fetch with top-level await
	const stats = await getUserStats({});

	// For the leaderboard list, we want it to react to scope changes.
	// We can use a derived promise or just await it inside a block.
	let leaderboardPromise = $derived(getLeaderboard({ scope }));
</script>

<svelte:head>
	<title>Leaderboard — Lerno</title>
	<meta name="description" content="Compete with students globally or in your courses." />
</svelte:head>

<div
	class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border pb-20 lg:pb-0"
>
	<!-- Header -->
	<div class="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg">
		<h1 class="flex items-center gap-2 text-lg font-bold tracking-tight">
			<Trophy class="size-5 text-yellow-500" />
			Leaderboard
		</h1>
	</div>

	<div class="space-y-6 p-4">
		<!-- User's current rank & stats -->
		<UserStatsCard
			rank={stats.rank}
			xp={stats.xp}
			level={stats.level}
			streakDays={stats.streakDays}
			xpToNextLevel={stats.xpToNextLevel}
			displayName={stats.displayName ?? stats.username ?? 'Anonymous'}
			avatarUrl={stats.avatarUrl}
		/>

		<!-- Scope Selector -->
		<div class="flex gap-2 rounded-xl bg-muted/50 p-1">
			{#each [{ id: 'global', label: 'Global', icon: Globe }, { id: 'course', label: 'Course', icon: GraduationCap }, { id: 'friends', label: 'Friends', icon: Users }] as item}
				<button
					class="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all
                 {scope === item.id
						? 'bg-background text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (scope = item.id as any)}
				>
					<item.icon class="size-3.5" />
					{item.label}
				</button>
			{/each}
		</div>

		<!-- Leaderboard List -->
		<div class="space-y-1">
			<svelte:boundary>
				{#await leaderboardPromise}
					{#each Array(5) as _}
						<div class="flex animate-pulse items-center gap-4 p-3">
							<div class="size-6 rounded bg-muted"></div>
							<div class="size-10 rounded-full bg-muted"></div>
							<div class="flex-1 space-y-2">
								<div class="h-4 w-1/3 rounded bg-muted"></div>
								<div class="h-3 w-1/4 rounded bg-muted"></div>
							</div>
							<div class="size-8 rounded bg-muted"></div>
						</div>
					{/each}
				{:then records}
					{#each records as record (record.id)}
						<LeaderboardItem
							rank={record.rank}
							displayName={record.displayName ?? record.username ?? 'Anonymous'}
							username={record.username}
							xp={record.xp}
							avatarUrl={record.avatarUrl}
							isCurrentUser={record.id === stats.id}
						/>
					{:else}
						<div class="py-20 text-center space-y-3">
							<Users class="size-10 text-muted-foreground/30 mx-auto" />
							<p class="text-sm text-muted-foreground">No students found in this scope.</p>
						</div>
					{/each}
				{/await}

				{#snippet failed(error, reset)}
					<div class="space-y-4 py-10 text-center">
						<p class="text-sm text-muted-foreground">Failed to load leaderboard.</p>
						<Button variant="outline" size="sm" onclick={reset}>Try Again</Button>
					</div>
				{/snippet}
			</svelte:boundary>
		</div>
	</div>
</div>
