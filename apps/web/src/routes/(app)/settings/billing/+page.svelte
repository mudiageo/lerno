<script lang="ts">
	import { Button } from '@lerno/ui/components/ui/button';
	import { Badge } from '@lerno/ui/components/ui/badge';
	import { Separator } from '@lerno/ui/components/ui/separator';
	import * as Card from '@lerno/ui/components/ui/card';
	import { useSession } from '#lib/auth.svelte.js';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import Zap from '@lucide/svelte/icons/zap';
	import Check from '@lucide/svelte/icons/check';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Shield from '@lucide/svelte/icons/shield';

	const getSession = useSession();
	const session = $derived($getSession);
	const user = $derived(session.data?.user);
	const plan = $derived((user as any)?.plan ?? 'free');

	// In a real implementation, we'd fetch this from a subscriptions table
	let renewalDate = 'May 1, 2026';

	const features = {
		free: [
			'50 AI-generated posts / month',
			'Basic flashcard deck',
			'5 quiz attempts / day',
			'Community access',
			'Standard support'
		],
		premium: [
			'Unlimited AI content generation',
			'FSRS spaced repetition (full)',
			'Unlimited quiz attempts',
			'Mock exam generator',
			'Offline downloads',
			'Priority support',
			'Ad-free experience',
			'Early access to new features'
		]
	};
</script>

<svelte:head>
	<title>Billing — Lerno Settings</title>
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-[var(--feed-max)] border-x border-border">
	<!-- Header -->
	<div class="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg">
		<h1 class="flex items-center gap-2 text-lg font-bold tracking-tight">
			<CreditCard class="size-5" />
			Billing & Plan
		</h1>
	</div>

	<div class="space-y-4 p-4">
		<!-- Current plan card -->
		<Card.Root class="border-border/60">
			<Card.Content class="p-4">
				<div class="mb-3 flex items-center justify-between">
					<div>
						<p class="mb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
							Current Plan
						</p>
						<div class="flex items-center gap-2">
							<h2 class="text-lg font-black text-foreground">
								{plan === 'premium'
									? 'Lerno Premium'
									: plan === 'institutional'
										? 'Lerno Institutional'
										: 'Lerno Free'}
							</h2>
							{#if plan === 'premium' || plan === 'institutional'}
								<Badge
									class="border-0 bg-gradient-to-r from-amber-400 to-amber-500 text-[10px] font-bold text-black"
									>PRO</Badge
								>
							{/if}
						</div>
					</div>
					{#if plan !== 'free'}
						<div class="text-right">
							<p class="text-xl font-black text-foreground">
								{plan === 'institutional' ? 'Managed' : '₦2,500'}<span
									class="text-sm font-normal text-muted-foreground"
									>{plan === 'institutional' ? '' : '/mo'}</span
								>
							</p>
							{#if plan === 'premium'}
								<p class="mt-0.5 flex items-center justify-end gap-1 text-xs text-muted-foreground">
									<Calendar class="size-3" />
									Renews {renewalDate}
								</p>
							{/if}
						</div>
					{/if}
				</div>

				{#if plan === 'free'}
					<!-- Upgrade card -->
					<div
						class="mt-2 rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-brand-600/5 p-4"
					>
						<div class="mb-2 flex items-center gap-2">
							<Zap class="size-4 text-brand-500" />
							<span class="text-sm font-bold text-foreground">Upgrade to Premium</span>
						</div>
						<p class="mb-3 text-xs leading-relaxed text-muted-foreground">
							Unlock AI-powered study tools, unlimited quizzes, mock exams, and offline downloads.
						</p>
						<div class="flex flex-col gap-2 sm:flex-row">
							<Button
								class="h-9 flex-1 border-0 bg-brand-500 text-sm text-white hover:bg-brand-600"
							>
								Pay with Paystack — ₦2,500/mo
							</Button>
							<Button variant="outline" class="h-9 text-sm">$3.99/mo (Stripe)</Button>
						</div>
					</div>
				{:else}
					<Separator class="my-3" />
					<div class="flex gap-2">
						{#if plan === 'premium'}
							<Button variant="outline" class="h-8 text-xs">Update payment method</Button>
							<Button variant="ghost" class="h-8 text-xs text-destructive hover:text-destructive"
								>Cancel subscription</Button
							>
						{:else}
							<p class="text-xs text-muted-foreground">
								Managed by your institution. Contact your administrator for billing changes.
							</p>
						{/if}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Feature comparison -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<!-- Free -->
			<Card.Root class="border-border/60 {plan === 'free' ? 'ring-2 ring-brand-500/20' : ''}">
				<Card.Content class="p-4">
					<h3 class="mb-3 text-sm font-bold text-foreground">Free</h3>
					<ul class="space-y-2">
						{#each features.free as feature}
							<li class="flex items-start gap-2 text-xs text-muted-foreground">
								<Check class="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
								{feature}
							</li>
						{/each}
					</ul>
				</Card.Content>
			</Card.Root>

			<!-- Premium -->
			<Card.Root
				class="border-brand-500/30 bg-brand-500/5 {plan !== 'free'
					? 'ring-2 ring-brand-500/20'
					: ''}"
			>
				<Card.Content class="p-4">
					<div class="mb-3 flex items-center gap-1.5">
						<h3 class="text-sm font-bold text-foreground">Premium</h3>
						<Badge class="border-0 bg-amber-400 text-[10px] font-bold text-black">PRO</Badge>
					</div>
					<ul class="space-y-2">
						{#each features.premium as feature}
							<li class="flex items-start gap-2 text-xs text-foreground">
								<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
								{feature}
							</li>
						{/each}
					</ul>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Security note -->
		<div class="flex items-center gap-2 px-1 text-xs text-muted-foreground">
			<Shield class="size-3.5 shrink-0" />
			Payments are processed securely via Paystack and Stripe. We never store your card details.
		</div>
	</div>
</div>
