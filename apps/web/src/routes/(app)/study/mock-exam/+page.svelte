<script lang="ts">
  import { page } from "$app/state";
  import { getQuizSession } from "../study.remote";
  import { MockExamSession } from "@lerno/ui/components/study";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import Zap from "@lucide/svelte/icons/zap";
  import X from "@lucide/svelte/icons/x";
  import type { QuestionType } from "@lerno/ui/components/study/mock-exam-session.svelte";

  const courseCode = page.url.searchParams.get("course");
  const typeParam = page.url.searchParams.get("type") as QuestionType | null;
  const mockType = typeParam || "mcq";

  // Configuration map for time per format
  const formatConfig = {
    mcq: { time: 45, label: "Objective (MCQ)" },
    theory: { time: 180, label: "Theory" },
    german_objective: { time: 60, label: "German Objective" }
  };
  
</script>

<svelte:head>
  <title>Mock Exam — {courseCode || "All Courses"}</title>
</svelte:head>

<div class="fixed inset-0 z-50 bg-background flex flex-col">
  <!-- Top bar -->
  <header class="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
    <div class="flex items-center gap-2">
      <div class="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
        <Zap class="size-4 text-amber-500" />
      </div>
      <div>
        <h1 class="text-sm font-bold text-foreground leading-none">Mock Exam</h1>
        <p class="text-[11px] text-muted-foreground mt-0.5">
          {courseCode || "General"} · {formatConfig[mockType].label}
        </p>
      </div>
    </div>
    <Button variant="ghost" size="icon" class="size-8 rounded-full" onclick={() => history.back()}>
      <X class="size-4" />
    </Button>
  </header>

  <!-- Session Body -->
  <main class="flex-1 overflow-y-auto p-4 md:p-8">
    <svelte:boundary>
      <!-- Re-using getQuizSession for demo, but formatting based on type -->
      {@const request = await getQuizSession({ courseId: undefined })}
      
      <!-- Transform fetched quiz questions to fit the active mock exam format -->
      {@const questions = request.map((q) => {
        const content = q.content as any;
        return {
          id: q.id,
          question: content.question,
          options: mockType === 'mcq' ? content.options : undefined,
          correctOptionId: mockType === 'mcq' ? content.correctOptionId : undefined,
          // Extract the actual answer text for German Objective if it's derived from an option model
          correctAnswer: content.options?.find((o: any) => o.id === content.correctOptionId)?.text || "",
          explanation: content.explanation,
        };
      })}

      {#if questions.length > 0}
        <MockExamSession
          {questions}
          type={mockType}
          timePerQuestion={formatConfig[mockType].time}
          onComplete={(score, total) => {
            console.log(`Mock Exam Finished. Scored ${score}/${total}`);
            // Command to record scores can go here
          }}
        />
      {:else}
        <div class="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto gap-4">
          <div class="size-16 rounded-full bg-muted flex items-center justify-center">
            <Zap class="size-8 text-muted-foreground/40" />
          </div>
          <p class="text-sm font-bold text-foreground">No questions available</p>
          <p class="text-xs text-muted-foreground">
            We couldn't find enough questions in the AI generated bank for {courseCode || "your courses"}.
          </p>
          <Button variant="outline" class="mt-2" onclick={() => history.back()}>Go Back</Button>
        </div>
      {/if}

      {#snippet pending()}
        <div class="max-w-2xl mx-auto space-y-6 animate-pulse">
          <div class="flex justify-between items-center">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-4 w-16" />
          </div>
          <Skeleton class="h-2 w-full" />
          <div class="mt-8 space-y-4">
            <Skeleton class="h-16 w-full rounded-xl" />
            {#if mockType === 'mcq'}
              <Skeleton class="h-12 w-full rounded-xl" />
              <Skeleton class="h-12 w-full rounded-xl" />
              <Skeleton class="h-12 w-full rounded-xl" />
              <Skeleton class="h-12 w-full rounded-xl" />
            {:else}
              <Skeleton class="h-32 w-full rounded-xl" />
              <Skeleton class="h-12 w-full rounded-xl" />
            {/if}
          </div>
        </div>
      {/snippet}

      {#snippet failed(error, reset)}
        <div class="flex flex-col items-center gap-3 py-20 text-center">
          <p class="text-sm text-red-500">Failed to load mock exam data.</p>
          <Button variant="outline" size="sm" onclick={reset}>Retry</Button>
        </div>
      {/snippet}
    </svelte:boundary>
  </main>
</div>
