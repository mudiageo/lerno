<script lang="ts">
  import { Button } from "@lerno/ui/components/ui/button";
  import { Label } from "@lerno/ui/components/ui/label";
  import { Switch } from "@lerno/ui/components/ui/switch";
  import * as RadioGroup from "@lerno/ui/components/ui/radio-group";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Palette from "@lucide/svelte/icons/palette";

  let saving = $state(false);
  let theme = $state("system");
  
  let notifications = $state({
    push: true,
    email: false,
    mentions: true,
    reminders: true,
  });

  async function savePreferences() {
    saving = true;
    try {
      // simulate API call
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Preferences updated successfully.");
      
      // Attempt to apply simple dark mode if document is available
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'light') {
          root.classList.remove('dark');
        } else {
          // System preference
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      }
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Preferences — Lerno</title>
</svelte:head>

<div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen">
  <!-- Header -->
  <div class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <a href="/settings" class="p-1.5 -ml-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft class="size-5" />
      </a>
      <h1 class="text-lg font-bold tracking-tight">Preferences</h1>
    </div>
    <Button size="sm" class="h-8 text-xs px-3" disabled={saving} onclick={savePreferences}>
      {saving ? "Saving..." : "Save"}
    </Button>
  </div>

  <div class="p-4 md:p-6 space-y-8">
    
    <!-- Appearance Section -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 text-brand-500">
        <Palette class="size-4" />
        <h2 class="text-sm font-bold uppercase tracking-widest text-foreground">Appearance</h2>
      </div>
      
      <div class="space-y-3 p-4 rounded-xl border border-border">
        <RadioGroup.Root bind:value={theme}>
          <div class="flex items-center space-x-3 space-y-0">
            <RadioGroup.Item value="light" id="theme-light" />
            <Label for="theme-light" class="font-normal cursor-pointer">Light</Label>
          </div>
          <div class="flex items-center space-x-3 space-y-0 pt-2">
            <RadioGroup.Item value="dark" id="theme-dark" />
            <Label for="theme-dark" class="font-normal cursor-pointer">Dark</Label>
          </div>
          <div class="flex items-center space-x-3 space-y-0 pt-2">
            <RadioGroup.Item value="system" id="theme-system" />
            <Label for="theme-system" class="font-normal cursor-pointer">System Default</Label>
          </div>
        </RadioGroup.Root>
      </div>
    </section>

    <!-- Notifications Section -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 text-brand-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        <h2 class="text-sm font-bold uppercase tracking-widest text-foreground">Notifications</h2>
      </div>
      
      <div class="space-y-4 p-4 rounded-xl border border-border">
        <div class="flex items-center justify-between">
          <div class="space-y-0.5 pr-4">
            <Label class="text-base font-medium">Push Notifications</Label>
            <p class="text-xs text-muted-foreground">Receive real-time alerts in your browser.</p>
          </div>
          <Switch bind:checked={notifications.push} />
        </div>

        <div class="flex items-center justify-between">
          <div class="space-y-0.5 pr-4">
            <Label class="text-base font-medium">Email Summaries</Label>
            <p class="text-xs text-muted-foreground">Weekly wrap-up of your study progress.</p>
          </div>
          <Switch bind:checked={notifications.email} />
        </div>

        <div class="flex items-center justify-between">
          <div class="space-y-0.5 pr-4">
            <Label class="text-base font-medium">Mentions & Replies</Label>
            <p class="text-xs text-muted-foreground">When someone tags you in a community.</p>
          </div>
          <Switch bind:checked={notifications.mentions} />
        </div>

        <div class="flex items-center justify-between">
          <div class="space-y-0.5 pr-4">
            <Label class="text-base font-medium">Study Reminders</Label>
            <p class="text-xs text-muted-foreground">Alerts for upcoming flashcard reviews and mock exams.</p>
          </div>
          <Switch bind:checked={notifications.reminders} />
        </div>
      </div>
    </section>

  </div>
</div>
