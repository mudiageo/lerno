<script lang="ts">
  import { Button } from "@lerno/ui/components/ui/button";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Separator } from "@lerno/ui/components/ui/separator";
  import * as Card from "@lerno/ui/components/ui/card";
  import { useSession } from "$lib/auth.svelte";
  import CreditCard from "@lucide/svelte/icons/credit-card";
  import Zap from "@lucide/svelte/icons/zap";
  import Check from "@lucide/svelte/icons/check";
  import Calendar from "@lucide/svelte/icons/calendar";
  import Shield from "@lucide/svelte/icons/shield";

  const getSession = useSession();
  const session = $derived($getSession);
  const user = $derived(session.data?.user);
  const plan = $derived((user as any)?.plan ?? "free");
  
  // In a real implementation, we'd fetch this from a subscriptions table
  let renewalDate = "May 1, 2026";

  const features = {
    free: [
      "50 AI-generated posts / month",
      "Basic flashcard deck",
      "5 quiz attempts / day",
      "Community access",
      "Standard support",
    ],
    premium: [
      "Unlimited AI content generation",
      "FSRS spaced repetition (full)",
      "Unlimited quiz attempts",
      "Mock exam generator",
      "Offline downloads",
      "Priority support",
      "Ad-free experience",
      "Early access to new features",
    ],
  };
</script>

<svelte:head>
  <title>Billing — Lerno Settings</title>
</svelte:head>

<div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen">
  <!-- Header -->
  <div class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3">
    <h1 class="text-lg font-bold tracking-tight flex items-center gap-2">
      <CreditCard class="size-5" />
      Billing & Plan
    </h1>
  </div>

  <div class="p-4 space-y-4">
    <!-- Current plan card -->
    <Card.Root class="border-border/60">
      <Card.Content class="p-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Current Plan</p>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-black text-foreground">{plan === "premium" ? "Lerno Premium" : plan === "institutional" ? "Lerno Institutional" : "Lerno Free"}</h2>
              {#if plan === "premium" || plan === "institutional"}
                <Badge class="text-[10px] bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold border-0">PRO</Badge>
              {/if}
            </div>
          </div>
          {#if plan !== "free"}
            <div class="text-right">
              <p class="text-xl font-black text-foreground">{plan === "institutional" ? "Managed" : "₦2,500"}<span class="text-sm font-normal text-muted-foreground">{plan === "institutional" ? "" : "/mo"}</span></p>
              {#if plan === "premium"}
                <p class="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                  <Calendar class="size-3" />
                  Renews {renewalDate}
                </p>
              {/if}
            </div>
          {/if}
        </div>

        {#if plan === "free"}
          <!-- Upgrade card -->
          <div class="rounded-xl bg-gradient-to-br from-brand-500/10 to-brand-600/5 border border-brand-500/20 p-4 mt-2">
            <div class="flex items-center gap-2 mb-2">
              <Zap class="size-4 text-brand-500" />
              <span class="text-sm font-bold text-foreground">Upgrade to Premium</span>
            </div>
            <p class="text-xs text-muted-foreground mb-3 leading-relaxed">
              Unlock AI-powered study tools, unlimited quizzes, mock exams, and offline downloads.
            </p>
            <div class="flex flex-col sm:flex-row gap-2">
              <Button class="flex-1 h-9 text-sm bg-brand-500 hover:bg-brand-600 text-white border-0">
                Pay with Paystack — ₦2,500/mo
              </Button>
              <Button variant="outline" class="h-9 text-sm">
                $3.99/mo (Stripe)
              </Button>
            </div>
          </div>
        {:else}
          <Separator class="my-3" />
          <div class="flex gap-2">
            {#if plan === "premium"}
              <Button variant="outline" class="h-8 text-xs">Update payment method</Button>
              <Button variant="ghost" class="h-8 text-xs text-destructive hover:text-destructive">Cancel subscription</Button>
            {:else}
              <p class="text-xs text-muted-foreground">Managed by your institution. Contact your administrator for billing changes.</p>
            {/if}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Feature comparison -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Free -->
      <Card.Root class="border-border/60 {plan === 'free' ? 'ring-2 ring-brand-500/20' : ''}">
        <Card.Content class="p-4">
          <h3 class="text-sm font-bold text-foreground mb-3">Free</h3>
          <ul class="space-y-2">
            {#each features.free as feature}
              <li class="flex items-start gap-2 text-xs text-muted-foreground">
                <Check class="size-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                {feature}
              </li>
            {/each}
          </ul>
        </Card.Content>
      </Card.Root>

      <!-- Premium -->
      <Card.Root class="border-brand-500/30 bg-brand-500/5 {plan !== 'free' ? 'ring-2 ring-brand-500/20' : ''}">
        <Card.Content class="p-4">
          <div class="flex items-center gap-1.5 mb-3">
            <h3 class="text-sm font-bold text-foreground">Premium</h3>
            <Badge class="text-[10px] bg-amber-400 text-black font-bold border-0">PRO</Badge>
          </div>
          <ul class="space-y-2">
            {#each features.premium as feature}
              <li class="flex items-start gap-2 text-xs text-foreground">
                <Check class="size-3.5 text-green-500 mt-0.5 shrink-0" />
                {feature}
              </li>
            {/each}
          </ul>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Security note -->
    <div class="flex items-center gap-2 text-xs text-muted-foreground px-1">
      <Shield class="size-3.5 shrink-0" />
      Payments are processed securely via Paystack and Stripe. We never store your card details.
    </div>
  </div>
</div>
