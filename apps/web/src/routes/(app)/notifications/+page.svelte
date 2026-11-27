<script lang="ts">
	import { getNotifications, markAllRead } from './notifications.remote';
	import * as Card from '@lerno/ui/components/ui/card';
	import { Button } from '@lerno/ui/components/ui/button';
	import { Skeleton } from '@lerno/ui/components/ui/skeleton';
	import Bell from '@lucide/svelte/icons/bell';
	import BellOff from '@lucide/svelte/icons/bell-off';
	import { Badge } from '@lerno/ui/components/ui/badge';
	import { toast } from '@lerno/ui/components/ui/sonner';

	// Top-level await for notifications
	const notifications = await getNotifications({});

	async function handleMarkAllRead() {
		try {
			await markAllRead({});
			toast.success('Marked all as read');
		} catch {
			toast.error('Failed to mark as read');
		}
	}
</script>

<svelte:head>
	<title>Notifications — Lerno</title>
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border">
	<div
		class="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg"
	>
		<h1 class="text-lg font-bold tracking-tight">Notifications</h1>
		<Button variant="ghost" size="sm" class="text-xs text-brand-500" onclick={handleMarkAllRead}>
			Mark all read
		</Button>
	</div>

	<svelte:boundary>
		<div class="divide-y divide-border/50">
			{#each notifications as notification (notification.id)}
				<div
					class="flex gap-4 px-4 py-4 transition-colors hover:bg-muted/30 {notification.read
						? 'opacity-70'
						: ''}"
				>
					<div
						class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-500/10"
					>
						<Bell class="size-5 text-brand-500" />
					</div>
					<div class="flex-1 space-y-1">
						<div class="flex items-center justify-between gap-2">
							<p class="text-sm leading-none font-medium">
								{notification.actorName ?? 'Notification'}
							</p>
							<span class="text-[10px] whitespace-nowrap text-muted-foreground">
								{new Date(notification.createdAt).toLocaleDateString()}
							</span>
						</div>
						<p class="line-clamp-2 text-xs text-muted-foreground">
							{notification.body ?? notification.content}
						</p>
						{#if !notification.read}
							<Badge
								variant="secondary"
								class="h-4 border-0 bg-brand-500 px-1 text-[9px] text-white">New</Badge
							>
						{/if}
					</div>
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center py-24 text-center px-4">
					<div class="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
						<BellOff class="size-8 text-muted-foreground/30" />
					</div>
					<h3 class="text-base font-bold text-foreground">No notifications yet</h3>
					<p class="text-sm text-muted-foreground mt-1 max-w-[240px]">
						We'll alert you when there's an update to years or community activity.
					</p>
				</div>
			{/each}
		</div>

		{#snippet pending()}
			<div class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border">
				<div
					class="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg"
				>
					<h1 class="flex items-center gap-2 text-lg font-bold tracking-tight">
						<Bell class="size-5" />Notifications
					</h1>
				</div>
				{#each Array(6) as _}
					<div class="flex items-start gap-3 border-b border-border/60 px-4 py-3">
						<Skeleton class="size-8 shrink-0 rounded-full" />
						<div class="flex-1 space-y-2">
							<Skeleton class="h-3 w-3/4 rounded" />
							<Skeleton class="h-2.5 w-1/2 rounded" />
						</div>
					</div>
				{/each}
			</div>
		{/snippet}

		{#snippet failed(error, reset)}
			<div
				class="mx-auto flex min-h-screen w-full max-w-[var(--feed-max)] flex-col items-center gap-3 border-x border-border px-4 pt-24 text-center"
			>
				<Bell class="size-10 text-muted-foreground/30" />
				<p class="text-sm text-muted-foreground">Could not load notifications.</p>
				<button class="text-sm text-brand-500 underline" onclick={reset}>Retry</button>
			</div>
		{/snippet}
	</svelte:boundary>
</div>
