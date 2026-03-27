<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Progress } from "$lib/components/ui/progress";
  import Play from "@lucide/svelte/icons/play";
  import Pause from "@lucide/svelte/icons/pause";
  import SkipForward from "@lucide/svelte/icons/skip-forward";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";

  let {
    workMinutes = 25,
    breakMinutes = 5,
    onSessionEnd,
  }: {
    workMinutes?: number;
    breakMinutes?: number;
    onSessionEnd?: () => void;
  } = $props();

  type Phase = "work" | "break";
  let phase = $state<Phase>("work");
  let running = $state(false);
  let secondsLeft = $state(workMinutes * 60);
  let completedSessions = $state(0);
  let interval = $state<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = $derived(phase === "work" ? workMinutes * 60 : breakMinutes * 60);
  const progress = $derived(((totalSeconds - secondsLeft) / totalSeconds) * 100);
  const minutes = $derived(Math.floor(secondsLeft / 60).toString().padStart(2, "0"));
  const seconds = $derived((secondsLeft % 60).toString().padStart(2, "0"));

  function tick() {
    if (secondsLeft <= 0) {
      clearInterval(interval!);
      running = false;
      if (phase === "work") {
        completedSessions++;
        onSessionEnd?.();
        phase = "break";
      } else {
        phase = "work";
      }
      secondsLeft = phase === "work" ? workMinutes * 60 : breakMinutes * 60;
      return;
    }
    secondsLeft--;
  }

  function toggle() {
    if (running) {
      clearInterval(interval!);
      running = false;
    } else {
      interval = setInterval(tick, 1000);
      running = true;
    }
  }

  function skip() {
    clearInterval(interval!);
    running = false;
    if (phase === "work") {
      completedSessions++;
      phase = "break";
    } else {
      phase = "work";
    }
    secondsLeft = phase === "work" ? workMinutes * 60 : breakMinutes * 60;
  }

  function reset() {
    clearInterval(interval!);
    running = false;
    phase = "work";
    secondsLeft = workMinutes * 60;
  }

  $effect(() => () => { if (interval) clearInterval(interval); });
</script>

<div class="flex flex-col items-center gap-8 py-8">
  <!-- Phase label -->
  <Badge
    variant={phase === "work" ? "default" : "secondary"}
    class="text-xs font-bold px-3 py-1 uppercase tracking-widest
           {phase === 'work' ? 'bg-brand-500 text-white' : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'}"
  >
    {phase === "work" ? "🎯 Focus" : "☕ Break"}
  </Badge>

  <!-- Timer ring -->
  <div class="relative size-52">
    <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
      <circle
        cx="50" cy="50" r="44"
        fill="none"
        stroke="currentColor"
        stroke-width="6"
        class="text-muted/30"
      />
      <circle
        cx="50" cy="50" r="44"
        fill="none"
        stroke-width="6"
        stroke-linecap="round"
        stroke-dasharray="{2 * Math.PI * 44}"
        stroke-dashoffset="{2 * Math.PI * 44 * (1 - progress / 100)}"
        class="transition-all duration-1000 ease-linear {phase === 'work' ? 'text-brand-500' : 'text-green-500'}"
        stroke="currentColor"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <span class="text-5xl font-black font-mono text-foreground tracking-tight">{minutes}:{seconds}</span>
      <span class="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
        {completedSessions} sessions
      </span>
    </div>
  </div>

  <!-- Progress bar -->
  <div class="w-full max-w-xs">
    <Progress
      value={progress}
      class="h-2 [&>[data-slot=indicator]]:transition-all [&>[data-slot=indicator]]:duration-1000
             {phase === 'work' ? '[&>[data-slot=indicator]]:bg-brand-500' : '[&>[data-slot=indicator]]:bg-green-500'}"
    />
  </div>

  <!-- Controls -->
  <div class="flex items-center gap-3">
    <Button variant="ghost" size="icon" class="size-10" onclick={reset}>
      <RotateCcw class="size-4" />
    </Button>
    <Button
      class="size-16 rounded-full text-white shadow-lg {phase === 'work' ? 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/30' : 'bg-green-600 hover:bg-green-700 shadow-green-500/30'}"
      onclick={toggle}
    >
      {#if running}
        <Pause class="size-6" />
      {:else}
        <Play class="size-6 ml-0.5" />
      {/if}
    </Button>
    <Button variant="ghost" size="icon" class="size-10" onclick={skip}>
      <SkipForward class="size-4" />
    </Button>
  </div>

  <p class="text-xs text-muted-foreground text-center leading-relaxed max-w-xs">
    {phase === "work"
      ? `Focus for ${workMinutes} minutes, then take a ${breakMinutes}-minute break.`
      : `Great work! Take ${breakMinutes} minutes to rest your mind.`}
  </p>
</div>
