<script lang="ts">
  import { page } from "$app/state";
  import {
    getExamSchedule,
    addExamDate,
    deleteExamDate,
    getCourseStats,
  } from "../../courses.remote";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import { Input } from "@lerno/ui/components/ui/input";
  import { Label } from "@lerno/ui/components/ui/label";
  import { Skeleton } from "@lerno/ui/components/ui/skeleton";
  import { toast } from "@lerno/ui/components/ui/sonner";
  import * as Dialog from "@lerno/ui/components/ui/dialog";
  import * as Select from "@lerno/ui/components/ui/select";
  import * as Tabs from "@lerno/ui/components/ui/tabs";
  import { Calendar } from "@lerno/ui/components/ui/calendar";
  import CalendarDays from "@lucide/svelte/icons/calendar-days";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import Clock from "@lucide/svelte/icons/clock";
  import Zap from "@lucide/svelte/icons/zap";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import FileText from "@lucide/svelte/icons/file-text";
  import PenLine from "@lucide/svelte/icons/pen-line";

  const courseCode = page.params.code;

  let exams = await getExamSchedule({ courseCode });
  let addOpen = $state(false);
  let mockOpen = $state(false);
  let deleting = $state<Record<string, boolean>>({});

  // Add exam form
  let form = $state({
    title: "",
    eventType: "exam",
    scheduledAt: "",
    durationMins: 180,
    weightPct: undefined as number | undefined,
    location: "",
  });

  // Mock exam state
  type QuestionType = "mcq" | "theory" | "german_objective";
  let mockType = $state<QuestionType>("mcq");
  let mockGenerating = $state(false);

  // Upcoming vs past
  const now = new Date();
  const upcoming = $derived(exams.filter((e) => new Date(e.scheduledAt) >= now));
  const past = $derived(exams.filter((e) => new Date(e.scheduledAt) < now));

  const examTypeIcons: Record<string, string> = {
    exam: "🎓", quiz: "📝", lab: "🔬",
    assignment: "📋", presentation: "🎤", other: "📌",
  };

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  }

  function formatCountdown(iso: string) {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days === 0) return hours === 0 ? "Less than 1h" : `${hours}h left`;
    if (days === 1) return "Tomorrow";
    return `${days} days left`;
  }

  async function handleAddExam() {
    if (!form.title || !form.scheduledAt) {
      toast.error("Title and date are required");
      return;
    }
    try {
      await addExamDate({
        courseCode,
        ...form,
        durationMins: form.durationMins || undefined,
        weightPct: form.weightPct,
      }).updates(getExamSchedule({ courseCode }).invalidate());
      toast.success("Exam added to timetable");
      addOpen = false;
      form = { title: "", eventType: "exam", scheduledAt: "", durationMins: 180, weightPct: undefined, location: "" };
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add exam");
    }
  }

  async function handleDelete(id: string) {
    deleting[id] = true;
    try {
      await deleteExamDate({ scheduleId: id }).updates(
        getExamSchedule({ courseCode }).invalidate(),
      );
      toast.success("Removed");
    } catch {
      toast.error("Failed to remove");
    } finally {
      deleting[id] = false;
    }
  }

  const mockTypeConfig = {
    mcq: {
      label: "MCQ / Objective",
      icon: BookOpen,
      description: "Multiple-choice questions. Auto-marked with timer.",
      color: "bg-blue-500",
    },
    theory: {
      label: "Theory",
      icon: PenLine,
      description: "Open-ended written answers. AI-graded or manual mark.",
      color: "bg-emerald-500",
    },
    german_objective: {
      label: "German Objective",
      icon: FileText,
      description: "Fill-in-the-blank / complete the sentence. Auto-marked by fuzzy match.",
      color: "bg-amber-500",
    },
  };
</script>

<div class="px-4 py-5 space-y-5">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-base font-bold text-foreground flex items-center gap-2">
      <CalendarDays class="size-4 text-brand-500" />
      Exam Timetable
    </h2>
    <div class="flex gap-2">
      <Button size="sm" variant="outline" class="h-8 text-xs gap-1.5" onclick={() => (mockOpen = true)}>
        <Zap class="size-3.5" />
        Mock Exam
      </Button>
      <Button size="sm" class="h-8 text-xs gap-1.5" onclick={() => (addOpen = true)}>
        <Plus class="size-3.5" />
        Add Exam
      </Button>
    </div>
  </div>

  <!-- Upcoming exams -->
  {#if upcoming.length > 0}
    <section class="space-y-2">
      <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest">Upcoming</p>
      {#each upcoming as exam (exam.id)}
        <div class="flex items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:border-brand-300/50 transition-colors">
          <span class="text-2xl mt-0.5 shrink-0">{examTypeIcons[exam.eventType] ?? "📌"}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-bold text-foreground">{exam.title}</p>
                <p class="text-xs text-muted-foreground mt-0.5">
                  {formatDate(exam.scheduledAt)} · {formatTime(exam.scheduledAt)}
                  {#if exam.durationMins} · {exam.durationMins}min{/if}
                  {#if exam.location} · 📍 {exam.location}{/if}
                </p>
              </div>
              <button
                class="text-muted-foreground/40 hover:text-red-500 transition-colors shrink-0"
                disabled={deleting[exam.id]}
                onclick={() => handleDelete(exam.id)}
              >
                <Trash2 class="size-4" />
              </button>
            </div>
            <div class="flex items-center gap-2 mt-2">
              {#if exam.weightPct}
                <Badge variant="outline" class="text-[10px] h-4 px-1.5">{exam.weightPct}% weight</Badge>
              {/if}
              {@const countdown = formatCountdown(exam.scheduledAt)}
              {#if countdown}
                <span class="text-xs font-bold text-red-500 dark:text-red-400 flex items-center gap-1">
                  <Clock class="size-3" />
                  {countdown}
                </span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </section>
  {:else}
    <div class="flex flex-col items-center gap-3 py-12 text-center rounded-2xl border border-dashed border-border">
      <CalendarDays class="size-10 text-muted-foreground/30" />
      <div>
        <p class="text-sm font-medium text-foreground">No upcoming exams</p>
        <p class="text-xs text-muted-foreground">Add your exam dates to get countdown reminders.</p>
      </div>
      <Button size="sm" onclick={() => (addOpen = true)} class="gap-1.5">
        <Plus class="size-3.5" /> Add Exam Date
      </Button>
    </div>
  {/if}

  <!-- Past exams -->
  {#if past.length > 0}
    <section class="space-y-2">
      <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest">Past</p>
      {#each past as exam (exam.id)}
        <div class="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 opacity-60">
          <span class="text-lg shrink-0">{examTypeIcons[exam.eventType] ?? "📌"}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate">{exam.title}</p>
            <p class="text-[11px] text-muted-foreground">{formatDate(exam.scheduledAt)}</p>
          </div>
          <button
            class="text-muted-foreground/30 hover:text-red-400 transition-colors"
            onclick={() => handleDelete(exam.id)}
          >
            <Trash2 class="size-3.5" />
          </button>
        </div>
      {/each}
    </section>
  {/if}
</div>

<!-- Add Exam Dialog -->
<Dialog.Root bind:open={addOpen}>
  <Dialog.Content class="max-w-sm">
    <Dialog.Header>
      <Dialog.Title>Add Exam / Event</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-4">
      <div class="space-y-1.5">
        <Label>Title</Label>
        <Input placeholder="e.g. CPE375 Final Exam" bind:value={form.title} />
      </div>
      <div class="space-y-1.5">
        <Label>Type</Label>
        <Select.Root type="single" bind:value={form.eventType}>
          <Select.Trigger class="w-full">{form.eventType}</Select.Trigger>
          <Select.Content>
            {#each ["exam", "quiz", "lab", "assignment", "presentation", "other"] as t}
              <Select.Item value={t}>{examTypeIcons[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
      <div class="space-y-1.5">
        <Label>Date & Time</Label>
        <Input type="datetime-local" bind:value={form.scheduledAt} />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <Label>Duration (mins)</Label>
          <Input type="number" placeholder="180" bind:value={form.durationMins} />
        </div>
        <div class="space-y-1.5">
          <Label>Weight (%)</Label>
          <Input type="number" placeholder="30" bind:value={form.weightPct} />
        </div>
      </div>
      <div class="space-y-1.5">
        <Label>Location (optional)</Label>
        <Input placeholder="e.g. Hall A, Block C" bind:value={form.location} />
      </div>
      <Button class="w-full" onclick={handleAddExam}>Add to Timetable</Button>
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Mock Exam Dialog -->
<Dialog.Root bind:open={mockOpen}>
  <Dialog.Content class="max-w-sm">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Zap class="size-4 text-amber-500" />
        Launch Mock Exam
      </Dialog.Title>
      <Dialog.Description>
        Choose an exam format for {courseCode}
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-3">
      {#each Object.entries(mockTypeConfig) as [key, config]}
        {@const Icon = config.icon}
        <button
          class="w-full flex items-center gap-4 p-3.5 rounded-2xl border-2 text-left transition-all
                 {mockType === key ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20' : 'border-border hover:border-muted-foreground/30'}"
          onclick={() => (mockType = key as QuestionType)}
        >
          <div class="size-10 rounded-xl {config.color} flex items-center justify-center shrink-0">
            <Icon class="size-5 text-white" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-bold text-foreground">{config.label}</p>
            <p class="text-xs text-muted-foreground leading-snug">{config.description}</p>
          </div>
          {#if mockType === key}
            <div class="size-4 rounded-full bg-brand-500 shrink-0 ml-auto"></div>
          {/if}
        </button>
      {/each}
    </div>

    <div class="pt-2">
      <Button
        class="w-full gap-2"
        disabled={mockGenerating}
        onclick={() => {
          mockGenerating = true;
          mockOpen = false;
          window.location.href = `/study/mock-exam?course=${courseCode}&type=${mockType}`;
        }}
      >
        <Zap class="size-4" />
        {mockGenerating ? "Generating…" : "Start Mock Exam"}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
