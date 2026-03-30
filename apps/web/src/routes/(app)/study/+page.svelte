<script lang="ts">
  import { getStudyDeck, getQuizSession } from "./study.remote";
  import {
    ModeCard,
    FlashcardDeck,
    QuizSession,
    PomodoroTimer,
  } from "@lerno/ui/components/study";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import BrainCircuit from "@lucide/svelte/icons/brain-circuit";
  import Clock from "@lucide/svelte/icons/clock";
  import BarChart3 from "@lucide/svelte/icons/bar-chart-3";
  import { useSession } from "$lib/auth.svelte";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import Loader2 from "@lucide/svelte/icons/loader-2";

  const getSession = useSession();
  const session = $derived($getSession);

  type StudyView = "menu" | "flashcards" | "quiz" | "pomodoro";
  let activeView = $state<StudyView>("menu");

  // In Study mode, we might want to fetch data only when the view changes.
  // However, for the purpose of the top-level await pattern:
  // We can use a pattern where we await the promise conditionally or
  // just await it if the page is dedicated.
  // Since this page handles multiple views, top-level await for EVERYTHING
  // might not be ideal if we don't want to wait for Flashcards if we are going to Quiz.

  // But to stay consistent with the user's advice:
  // "the remote function get calls await getData do not have to be in th svelte:boundary"

  // If I put both awaits at top level, the page waits for both.
  // If I want them to be lazy, I should use a component for each view.
</script>

<svelte:head>
  <title>Study — Lerno</title>
  <meta
    name="description"
    content="Interactive study tools: flashcards, quizzes, and pomodoro timer."
  />
</svelte:head>

<div
  class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen"
>
  <!-- Header -->
  <div
    class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3"
  >
    {#if activeView !== "menu"}
      <button
        class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        onclick={() => (activeView = "menu")}>← Back</button
      >
    {/if}
    <h1 class="text-lg font-bold tracking-tight">
      {activeView === "menu"
        ? "Study"
        : activeView === "flashcards"
          ? "Flashcards"
          : activeView === "quiz"
            ? "Quiz"
            : "Pomodoro"}
    </h1>
  </div>

  <div class="p-4">
    {#if activeView === "menu"}
      <!-- Study mode selection grid -->
      <p class="text-sm text-muted-foreground mb-5">
        Choose a study mode to begin.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ModeCard
          title="Flashcards"
          description="Spaced repetition to reinforce key concepts in your enrolled courses."
          badge="FSRS"
          onchoose={() => (activeView = "flashcards")}
        >
          {#snippet icon()}
            <BookOpen class="size-6 text-brand-500" />
          {/snippet}
        </ModeCard>

        <ModeCard
          title="Quiz"
          description="10-question timed quiz to test your knowledge across topics."
          badge="Timed"
          badgeVariant="outline"
          onchoose={() => (activeView = "quiz")}
        >
          {#snippet icon()}
            <BrainCircuit class="size-6 text-brand-500" />
          {/snippet}
        </ModeCard>

        <ModeCard
          title="Pomodoro"
          description="25-minute focus sessions with short breaks to maintain deep work."
          onchoose={() => (activeView = "pomodoro")}
        >
          {#snippet icon()}
            <Clock class="size-6 text-brand-500" />
          {/snippet}
        </ModeCard>

        <ModeCard
          title="Mock Exam"
          description="Full-length exam simulation under real exam conditions."
          badge="Pro"
          badgeVariant="default"
          isPremium={true}
          onchoose={() => {}}
        >
          {#snippet icon()}
            <BarChart3 class="size-6 text-brand-500" />
          {/snippet}
        </ModeCard>
      </div>
    {:else if activeView === "flashcards"}
      <svelte:boundary>
        {@render FlashcardContent()}
        {#snippet pending()}
          <div class="space-y-4">
            <Skeleton class="h-[300px] w-full rounded-2xl" />
            <div class="flex justify-center gap-4">
              <Skeleton class="h-10 w-24 rounded-full" />
              <Skeleton class="h-10 w-24 rounded-full" />
            </div>
          </div>
        {/snippet}
        {#snippet failed(error, reset)}
          <div class="flex flex-col items-center gap-3 py-20 text-center">
            <p class="text-sm text-muted-foreground">
              Failed to load flashcards.
            </p>
            <Button variant="outline" size="sm" onclick={reset}>Retry</Button>
          </div>
        {/snippet}
      </svelte:boundary>
    {:else if activeView === "quiz"}
      <svelte:boundary>
        {@render QuizContent()}
        {#snippet pending()}
          <div class="space-y-6">
            <Skeleton class="h-32 w-full rounded-xl" />
            <div class="grid grid-cols-1 gap-3">
              {#each Array(4) as _}
                <Skeleton class="h-14 w-full rounded-lg" />
              {/each}
            </div>
          </div>
        {/snippet}

        {#snippet failed(error, reset)}
          <div class="flex flex-col items-center gap-3 py-20 text-center">
            <p class="text-sm text-muted-foreground">Failed to load quiz.</p>
            <Button variant="outline" size="sm" onclick={reset}>Retry</Button>
          </div>
        {/snippet}
      </svelte:boundary>
    {:else if activeView === "pomodoro"}
      <PomodoroTimer
        workMinutes={25}
        breakMinutes={5}
        onSessionEnd={() => console.log("Session ended")}
      />
    {/if}
  </div>
</div>

{#snippet FlashcardContent()}
  {@const deck = await getStudyDeck({})}
  {@const cards = deck.map((d) => ({
    id: d.id,
    front: (d.content as any).front,
    back: (d.content as any).back,
  }))}

  {#if cards.length > 0}
    <FlashcardDeck
      {cards}
      deckTitle="Due for Review"
      onComplete={({ known, unknown }) => {
        console.log("Flashcard session complete:", { known, unknown });
        // In a real implementation, we'd call updateMastery here
      }}
    />
  {:else}
    <div class="flex flex-col items-center gap-4 py-20 text-center">
      <div
        class="size-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center text-green-600"
      >
        <BookOpen class="size-8" />
      </div>
      <div>
        <h3 class="text-base font-bold">All caught up!</h3>
        <p class="text-sm text-muted-foreground mt-1">
          You have no flashcards due for review right now.
        </p>
      </div>
      <Button variant="outline" onclick={() => (activeView = "menu")}
        >Back to Study</Button
      >
    </div>
  {/if}
{/snippet}

{#snippet QuizContent()}
  {@const session = await getQuizSession({})}
  {@const questions = session.map((s) => ({
    id: s.id,
    question: (s.content as any).question,
    options: (s.content as any).options,
    correctOptionId: (s.content as any).correctOptionId,
    explanation: (s.content as any).explanation,
  }))}

  {#if questions.length > 0}
    <QuizSession
      {questions}
      timePerQuestion={30}
      onComplete={(score, total) => {
        console.log("Quiz complete:", score, "/", total);
        // In a real implementation, we'd award XP here via command
      }}
    />
  {:else}
    <div class="flex flex-col items-center gap-4 py-20 text-center">
      <div
        class="size-16 rounded-full bg-muted flex items-center justify-center"
      >
        <BrainCircuit class="size-8 text-muted-foreground/40" />
      </div>
      <p class="text-sm text-muted-foreground">
        No quiz questions found for your courses.
      </p>
      <Button variant="outline" onclick={() => (activeView = "menu")}
        >Back to Study</Button
      >
    </div>
  {/if}
{/snippet}
