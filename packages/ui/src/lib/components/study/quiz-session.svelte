<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Progress } from "$lib/components/ui/progress";
  import CheckCircle2 from "@lucide/svelte/icons/check-circle-2";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import Clock from "@lucide/svelte/icons/clock";
  import { fade, slide } from "svelte/transition";

  interface QuizQuestion {
    id: string;
    question: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
    explanation?: string;
  }

  let {
    questions,
    timePerQuestion = 30,
    onComplete,
  }: {
    questions: QuizQuestion[];
    timePerQuestion?: number;
    onComplete?: (score: number, total: number) => void;
  } = $props();

  let currentIndex = $state(0);
  let selectedId = $state<string | null>(null);
  let revealed = $state(false);
  let score = $state(0);
  let completed = $state(false);
  let timeLeft = $state(timePerQuestion);
  let timerInterval = $state<ReturnType<typeof setInterval> | null>(null);

  const current = $derived(questions[currentIndex]);
  const progress = $derived(questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0);
  const isCorrect = $derived(selectedId === current?.correctOptionId);

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timeLeft = timePerQuestion;
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timerInterval!);
        if (!revealed) revealAnswer();
      }
    }, 1000);
  }

  function revealAnswer() {
    if (revealed) return;
    revealed = true;
    if (timerInterval) clearInterval(timerInterval);
    if (selectedId === current?.correctOptionId) score++;
  }

  function handleSelect(id: string) {
    if (revealed) return;
    selectedId = id;
    revealAnswer();
  }

  function next() {
    if (currentIndex >= questions.length - 1) {
      completed = true;
      onComplete?.(score, questions.length);
    } else {
      currentIndex++;
      selectedId = null;
      revealed = false;
      startTimer();
    }
  }

  $effect(() => {
    if (questions.length > 0) startTimer();
    return () => { if (timerInterval) clearInterval(timerInterval); };
  });
</script>

<div class="flex flex-col gap-5">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <p class="text-sm text-muted-foreground font-medium">
      Question <span class="font-bold text-foreground">{currentIndex + 1}</span> / {questions.length}
    </p>
    <div class="flex items-center gap-1.5 text-sm font-mono font-bold
                {timeLeft <= 10 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}">
      <Clock class="size-3.5" />
      {timeLeft}s
    </div>
  </div>

  <Progress value={progress} class="h-1.5 [&>[data-slot=indicator]]:bg-brand-500" />

  {#if completed}
    <div transition:fade class="flex flex-col items-center gap-6 py-12 text-center">
      <div class="size-20 rounded-full bg-brand-500/10 flex items-center justify-center">
        <span class="text-3xl font-black text-brand-600 dark:text-brand-400">{score}/{questions.length}</span>
      </div>
      <div>
        <h3 class="text-xl font-bold text-foreground mb-1">
          {score >= questions.length * 0.8 ? '🎉 Excellent!' : score >= questions.length * 0.5 ? '👍 Good Job!' : '📚 Keep Studying'}
        </h3>
        <p class="text-sm text-muted-foreground">You scored {Math.round((score / questions.length) * 100)}%</p>
      </div>
      <Badge variant="secondary" class="text-sm px-4 py-2 font-bold">+{score * 10} XP earned</Badge>
    </div>
  {:else if current}
    <div class="space-y-5">
      <h3 class="text-base font-semibold text-foreground leading-snug">{current.question}</h3>

      <div class="grid gap-2">
        {#each current.options as option}
          {@const isOptionSelected = selectedId === option.id}
          {@const isOptionCorrect = option.id === current.correctOptionId}

          <button
            class="w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all relative overflow-hidden
                   {revealed 
                     ? isOptionCorrect 
                       ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400' 
                       : isOptionSelected 
                         ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                         : 'border-border bg-background opacity-60'
                     : 'border-border bg-background hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-950/10'}"
            onclick={() => handleSelect(option.id)}
            disabled={revealed}
          >
            <span class="flex items-center gap-3">
              <span class="size-6 rounded-full border flex items-center justify-center shrink-0 text-[11px] font-bold
                           {revealed && isOptionCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground/30'}">
                {String.fromCharCode(65 + current.options.indexOf(option))}
              </span>
              {option.text}
            </span>
          </button>
        {/each}
      </div>

      {#if revealed}
        <div transition:slide>
          {#if current.explanation}
            <div class="p-3 rounded-xl border-l-4 bg-muted/40 {isCorrect ? 'border-green-500' : 'border-amber-500'} text-xs text-muted-foreground leading-relaxed">
              <span class="font-bold text-foreground block mb-1">Explanation</span>
              {current.explanation}
            </div>
          {/if}
          <Button class="w-full mt-3 h-10" onclick={next}>
            {currentIndex >= questions.length - 1 ? 'See Results' : 'Next Question →'}
          </Button>
        </div>
      {/if}
    </div>
  {/if}
</div>
