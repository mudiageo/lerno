<script lang="ts">
	import { Button } from '@lerno/ui/components/ui/button';
	import { Separator } from '@lerno/ui/components/ui/separator';
	import * as Avatar from '@lerno/ui/components/ui/avatar';
	import { Badge } from '@lerno/ui/components/ui/badge';
	import { useSession } from '#lib/auth.svelte.js';
	import HelpCircle from '@lucide/svelte/icons/help-circle';
	import User from '@lucide/svelte/icons/user';
	import Bell from '@lucide/svelte/icons/bell';
	import Shield from '@lucide/svelte/icons/shield';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import Palette from '@lucide/svelte/icons/palette';
	import Database from '@lucide/svelte/icons/database';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { goto } from '$app/navigation';
	import { authClient } from '#lib/auth.svelte.js';

	const getSession = useSession();
	const session = $derived($getSession);
	const user = $derived(session.data?.user);

	const sections = [
		{
			title: 'Account',
			items: [
				{ href: '/profile', icon: User, label: 'Edit Profile', desc: 'Name, bio, avatar' },
				{
					href: '/settings/notifications',
					icon: Bell,
					label: 'Notifications',
					desc: 'Alerts and reminders'
				}
			]
		},
		{
			title: 'Appearance & Preferences',
			items: [
				{
					href: '/settings/preferences',
					icon: Palette,
					label: 'Display & Notifications',
					desc: 'Theme, alerts, preferences'
				}
			]
		},
		{
			title: 'Data & Privacy',
			items: [
				{ href: '/settings/privacy', icon: Shield, label: 'Security', desc: 'Password, 2FA' },
				{
					href: '/settings/data-export',
					icon: Database,
					label: 'Data Export',
					desc: 'Download your data archive'
				}
			]
		},
		{
			title: 'Help & Support',
			items: [
				{ href: '/help', icon: HelpCircle, label: 'Help Center', desc: 'Guides, FAQs, and support' }
			]
		}
	];

	async function signOut() {
		await authClient.signOut();
		goto('/sign-in');
	}
</script>

<svelte:head>
	<title>Settings — Lerno</title>
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border">
	<!-- Header -->
	<div class="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg">
		<h1 class="text-lg font-bold tracking-tight">Settings</h1>
	</div>

	<!-- User card -->
	<a
		href="/profile"
		class="flex items-center gap-3 border-b border-border/60 px-4 py-4 transition-colors hover:bg-accent/40"
	>
		<Avatar.Root class="size-12 shrink-0 ring-2 ring-border">
			<Avatar.Image src={user?.image} alt={user?.name} />
			<Avatar.Fallback class="bg-brand-500 text-xl font-black text-white">
				{user?.name?.[0] ?? 'U'}
			</Avatar.Fallback>
		</Avatar.Root>
		<div class="min-w-0 flex-1">
			<p class="text-sm font-bold text-foreground">{user?.name ?? 'User'}</p>
			<p class="text-xs text-muted-foreground">{user?.email ?? ''}</p>
			<Badge variant="secondary" class="mt-1 text-[10px]">Free Plan</Badge>
		</div>
		<ChevronRight class="size-4 text-muted-foreground" />
	</a>

	<!-- Settings sections -->
	<div class="divide-y divide-border/30">
		{#each sections as section}
			<div class="py-2">
				<p
					class="px-4 pt-3 pb-1 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"
				>
					{section.title}
				</p>
				{#each section.items as item}
					<a
						href={item.href}
						class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
					>
						<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
							<item.icon class="size-4 text-foreground" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-foreground">{item.label}</p>
							<p class="text-xs text-muted-foreground">{item.desc}</p>
						</div>
						<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
					</a>
				{/each}
			</div>
		{/each}
	</div>

	<!-- Sign out -->
	<div class="px-4 pt-2 pb-6">
		<Separator class="mb-4" />
		<Button
			variant="ghost"
			class="h-10 w-full justify-start gap-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
			onclick={signOut}
		>
			<LogOut class="size-4" />
			Sign out
		</Button>
		<p class="mt-4 text-center text-[10px] text-muted-foreground">
			Lerno v0.1.0 · Made with ♥ in Africa
		</p>
	</div>
</div>
