<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Progress } from "$lib/components/ui/progress";
  import { Input } from "$lib/components/ui/input";
  import CheckCircle2 from "@lucide/svelte/icons/check-circle-2";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import Clock from "@lucide/svelte/icons/clock";
  import { fade, slide } from "svelte/transition";
  import { untrack, onDestroy } from "svelte";

  export type QuestionType = "mcq" | "theory" | "german_objective";

  export interface MockQuestion {
    id: string;
    question: string;
    options?: { id: string; text: string }[];
    correctOptionId?: string; // For MCQ
    correctAnswer?: string;   // For German Objective
    explanation?: string;
  }

  let {
    questions,
    type = "mcq",
    timePerQuestion = 60,
    onComplete,
  }: {
    questions: MockQuestion[];
    type?: QuestionType;
    timePerQuestion?: number;
    onComplete?: (score: number, total: number) => void;
  } = $props();

  let currentIndex = $state(0);
  let selectedId = $state<string | null>(null);
  let textAnswer = $state<string>("");
  let revealed = $state(false);
  let score = $state(0);
  let completed = $state(false);
  let timeLeft = $derived(timePerQuestion);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let hasStarted = false;

  const current = $derived(questions[currentIndex]);
  const progress = $derived(
    questions.length > 0 ? (currentIndex / questions.length) * 100 : 0,
  );

  function checkAnswerCorrect(): boolean {
    if (!current) return false;
    if (type === "mcq") {
      return selectedId === current.correctOptionId;
    }
    if (type === "german_objective") {
      const correct = current.correctAnswer || current.options?.find(o => o.id === current.correctOptionId)?.text || "";
      return textAnswer.trim().toLowerCase() === correct.trim().toLowerCase();
    }
    if (type === "theory") {
      // Theory can't be perfectly auto graded yet, we just give credit for trying > 15 chars
      return textAnswer.trim().length > 15;
    }
    return false;
  }

  const isCorrect = $derived(checkAnswerCorrect());

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
    if (checkAnswerCorrect()) score++;
  }

  function handleSelectOption(id: string) {
    if (revealed || type !== "mcq") return;
    selectedId = id;
    revealAnswer();
  }

  function handleSubmitText() {
    if (revealed || (type !== "theory" && type !== "german_objective")) return;
    if (!textAnswer.trim()) return;
    revealAnswer();
  }

  function next() {
    if (currentIndex >= questions.length - 1) {
      completed = true;
      onComplete?.(score, questions.length);
    } else {
      currentIndex++;
      selectedId = null;
      textAnswer = "";
      revealed = false;
      startTimer();
    }
  }

  $effect(() => {
    if (questions.length > 0 && !hasStarted) {
      untrack(() => {
        hasStarted = true;
        startTimer();
      });
    }
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });
</script>

<div class="flex flex-col gap-5 max-w-2xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <p class="text-sm text-muted-foreground font-medium">
      Question <span class="font-bold text-foreground">{currentIndex + 1}</span>
      / {questions.length}
    </p>
    <div
      class="flex items-center gap-1.5 text-sm font-mono font-bold
                {timeLeft <= 15
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground'}"
    >
      <Clock class="size-3.5" />
      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
    </div>
  </div>

  <Progress
    value={progress}
    class="h-1.5 [&>[data-slot=indicator]]:bg-brand-500"
  />

  {#if completed}
    <div
      transition:fade
      class="flex flex-col items-center gap-6 py-12 text-center"
    >
      <div
        class="size-20 rounded-full bg-brand-500/10 flex items-center justify-center"
      >
        <span class="text-3xl font-black text-brand-600 dark:text-brand-400"
          >{score}/{questions.length}</span
        >
      </div>
      <div>
        <h3 class="text-xl font-bold text-foreground mb-1">Mock Exam Completed</h3>
        <p class="text-sm text-muted-foreground">
          You scored {Math.round((score / questions.length) * 100)}%
        </p>
      </div>
    </div>
  {:else if current}
    <div class="space-y-6">
      <h3 class="text-lg font-semibold text-foreground leading-relaxed">
        {current.question}
      </h3>

      <!-- MCQ FORMAT -->
      {#if type === "mcq"}
        <div class="grid gap-3">
          {#each current.options ?? [] as option}
            {@const isOptionSelected = selectedId === option.id}
            {@const isOptionCorrect = option.id === current.correctOptionId}

            <button
              class="w-full text-left px-5 py-3.5 rounded-xl border text-sm font-medium transition-all relative overflow-hidden
                     {revealed
                ? isOptionCorrect
                  ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                  : isOptionSelected
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                    : 'border-border bg-background opacity-60'
                : 'border-border bg-background hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-950/10'}"
              onclick={() => handleSelectOption(option.id)}
              disabled={revealed}
            >
              <span class="flex items-center gap-3">
                <span
                  class="size-6 rounded-full border flex items-center justify-center shrink-0 text-[11px] font-bold
                             {revealed && isOptionCorrect
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-muted-foreground/30'}"
                >
                  {String.fromCharCode(65 + (current.options?.indexOf(option) ?? 0))}
                </span>
                {option.text}
              </span>
            </button>
          {/each}
        </div>

      <!-- THEORY FORMAT & GERMAN OBJECTIVE FORMAT -->
      {:else}
        <div class="space-y-4">
          {#if type === "theory"}
            <textarea
              class="w-full min-h-[150px] p-4 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-y"
              placeholder="Write your detailed answer here..."
              bind:value={textAnswer}
              disabled={revealed}
            ></textarea>
          {:else}
            <Input 
              type="text" 
              class="h-12 text-base px-4" 
              placeholder="Type your short answer..." 
              bind:value={textAnswer}
              disabled={revealed}
              onkeydown={(e) => { if (e.key === "Enter") handleSubmitText(); }}
            />
          {/if}

          {#if !revealed}
            <Button class="w-full h-11" onclick={handleSubmitText} disabled={!textAnswer.trim()}>
              Submit Answer
            </Button>
          {/if}
        </div>
      {/if}

      <!-- REVEALED STATE (Explanation / Correct Answer) -->
      {#if revealed}
        <div transition:slide class="space-y-4">
          <!-- Show correct answer for text-based questions -->
          {#if type !== "mcq"}
            <div class="p-4 rounded-xl border {!isCorrect && type !== 'theory' ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400' : 'border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'}">
              <p class="text-sm font-bold block mb-1">
                {type === "theory" ? "AI Grading (Simulated)" : isCorrect ? "Correct!" : "Incorrect"}
              </p>
              {#if type === "german_objective" && !isCorrect}
                <p class="text-sm">The correct answer is: <span class="font-bold">{current.correctAnswer || current.options?.find(o => o.id === current.correctOptionId)?.text}</span></p>
              {:else if type === "theory"}
                <p class="text-sm">{isCorrect ? 'Good effort. Your answer covers some necessary points.' : 'Your answer was too short to pass grading.'}</p>
              {/if}
            </div>
          {/if}

          <!-- Explanation box -->
          {#if current.explanation}
            <div
              class="p-4 rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground leading-relaxed"
            >
              <span class="font-bold text-foreground block mb-1"
                >Explanation / Grading Rubric:</span
              >
              {current.explanation}
            </div>
          {/if}

          <Button class="w-full h-11" onclick={next}>
            {currentIndex >= questions.length - 1
              ? "See Final Results"
              : "Next Question →"}
          </Button>
        </div>
      {/if}
    </div>
  {/if}
</div>
