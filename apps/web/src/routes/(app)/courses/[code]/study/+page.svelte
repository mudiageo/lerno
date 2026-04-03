<script lang="ts">
  import { page } from "$app/state";
  import { getStudyDeck, getQuizSession } from "../../../study/study.remote";
  import { getCourseStats } from "../../courses.remote";
  import { FlashcardDeck, QuizSession } from "@lerno/ui/components/study";
  import { Button } from "@lerno/ui/components/ui/button";
  import Brain from "@lucide/svelte/icons/brain";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Zap from "@lucide/svelte/icons/zap";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";

  const courseCode = page.params.code;
  const stats = await getCourseStats({ courseCode });
  const courseId = stats.course.id;

  type Mode = "select" | "flashcards" | "quiz";
  let mode = $state<Mode>("select");

  const flashcards = $derived.by(async () =>
    mode === "flashcards" ? await getStudyDeck({ courseId }) : [],
  );
  const quizzes = $derived.by(async () =>
    mode === "quiz" ? await getQuizSession({ courseId }) : [],
  );
</script>

<div class="px-4 py-5 space-y-5">
  {#if mode === "select"}
    <!-- Mode selection card -->
    <div class="space-y-3">
      <div class="text-center py-4">
        <Brain class="size-12 text-brand-500 mx-auto mb-2" />
        <h2 class="text-xl font-black text-foreground">
          {courseCode} Study Session
        </h2>
        <p class="text-sm text-muted-foreground mt-1">{stats.course.title}</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-3">
        <div
          class="rounded-2xl bg-muted/40 border border-border p-3 text-center"
        >
          <p class="text-2xl font-black text-foreground">
            {stats.flashcardCount}
          </p>
          <p class="text-[11px] text-muted-foreground">Flashcards</p>
        </div>
        <div
          class="rounded-2xl bg-muted/40 border border-border p-3 text-center"
        >
          <p class="text-2xl font-black text-foreground">{stats.quizCount}</p>
          <p class="text-[11px] text-muted-foreground">Quizzes</p>
        </div>
        <div
          class="rounded-2xl bg-muted/40 border border-border p-3 text-center"
        >
          <p class="text-2xl font-black text-foreground">{stats.masteryPct}%</p>
          <p class="text-[11px] text-muted-foreground">Mastery</p>
        </div>
      </div>

      <!-- Mode buttons -->
      <div class="space-y-3 pt-2">
        <button
          class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-brand-500/30 bg-brand-50/50 dark:bg-brand-950/20 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-all text-left group"
          onclick={() => (mode = "flashcards")}
        >
          <div
            class="size-12 rounded-2xl bg-brand-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
          >
            <Brain class="size-6 text-white" />
          </div>
          <div>
            <p class="text-sm font-bold text-foreground">Flashcard Deck</p>
            <p class="text-xs text-muted-foreground">
              Spaced repetition — flip cards to reinforce memory
            </p>
          </div>
        </button>

        <button
          class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-all text-left group"
          onclick={() => (mode = "quiz")}
        >
          <div
            class="size-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
          >
            <BookOpen class="size-6 text-white" />
          </div>
          <div>
            <p class="text-sm font-bold text-foreground">Quiz Session</p>
            <p class="text-xs text-muted-foreground">
              Timed MCQ — test your knowledge with a score
            </p>
          </div>
        </button>

        <a
          href="/courses/{courseCode}/exams"
          class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-all text-left group"
        >
          <div
            class="size-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
          >
            <Zap class="size-6 text-white" />
          </div>
          <div>
            <p class="text-sm font-bold text-foreground">Mock Exam</p>
            <p class="text-xs text-muted-foreground">
              Full-length timed exam (MCQ, Theory, Objective)
            </p>
          </div>
        </a>
      </div>
    </div>
  {:else if mode === "flashcards"}
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <button
          onclick={() => (mode = "select")}
          class="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw class="size-4" />
        </button>
        <h2 class="text-sm font-bold text-foreground">
          Flashcard Deck — {courseCode}
        </h2>
      </div>

      <svelte:boundary>
        {#await flashcards}
          <div class="flex justify-center py-10">
            <div
              class="w-8 h-8 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin"
            ></div>
          </div>
        {:then cards}
          {#if cards.length > 0}
            <FlashcardDeck
              flashcards={cards.map((c: any) => ({
                id: c.id,
                front: c.content?.front ?? c.content?.body ?? "?",
                back: c.content?.back ?? c.content?.explanation ?? "",
                tags: c.topicTags ?? [],
              }))}
              onComplete={() => (mode = "select")}
            />
          {:else}
            <div class="flex flex-col items-center gap-3 py-16 text-center">
              <Brain class="size-10 text-muted-foreground/30" />
              <p class="text-sm text-muted-foreground">
                No flashcards yet for {courseCode}.
              </p>
              <Button size="sm" onclick={() => (mode = "select")}>Back</Button>
            </div>
          {/if}
        {/await}
      </svelte:boundary>
    </div>
  {:else if mode === "quiz"}
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <button
          onclick={() => (mode = "select")}
          class="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw class="size-4" />
        </button>
        <h2 class="text-sm font-bold text-foreground">
          Quiz Session — {courseCode}
        </h2>
      </div>

      <svelte:boundary>
        {#await quizzes}
          <div class="flex justify-center py-10">
            <div
              class="w-8 h-8 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin"
            ></div>
          </div>
        {:then qs}
          {#if qs.length > 0}
            <QuizSession
              questions={qs.map((q: any) => ({
                id: q.id,
                question: q.content?.question ?? "?",
                options: q.content?.options ?? [],
                correctOptionId: q.content?.correctOptionId ?? "",
                explanation: q.content?.explanation,
              }))}
              timePerQuestion={30}
              onComplete={(score, total) => {
                setTimeout(() => (mode = "select"), 3000);
              }}
            />
          {:else}
            <div class="flex flex-col items-center gap-3 py-16 text-center">
              <BookOpen class="size-10 text-muted-foreground/30" />
              <p class="text-sm text-muted-foreground">
                No quizzes yet for {courseCode}.
              </p>
              <Button size="sm" onclick={() => (mode = "select")}>Back</Button>
            </div>
          {/if}
        {/await}
      </svelte:boundary>
    </div>
  {/if}
</div>
