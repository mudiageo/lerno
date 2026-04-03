<script lang="ts">
  import * as Accordion from "@lerno/ui/components/ui/accordion";
  import { Button } from "@lerno/ui/components/ui/button";
  import { Badge } from "@lerno/ui/components/ui/badge";
  import HelpCircle from "@lucide/svelte/icons/help-circle";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Users from "@lucide/svelte/icons/users";
  import BrainCircuit from "@lucide/svelte/icons/brain-circuit";
  import Shield from "@lucide/svelte/icons/shield";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";

  const categories = [
    {
      id: "courses",
      icon: BookOpen,
      title: "Course Management",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      items: [
        {
          q: "How do I navigate my enrolled courses?",
          a: `Go to the "Courses" tab in the bottom navigation. Your enrolled courses will be displayed along with your current mastery percentage. Simply tap a course to open its dedicated dashboard, which contains tabs for Feed, Study, Videos, Exams, Leaderboard, and Community.`,
        },
        {
          q: "What is the Course Feed?",
          a: `Each course has its own Feed tab. Unlike the global Watch feed, this feed is strictly filtered to only show posts, flashcards, quizzes, and discussions related to that specific course code.`,
        },
        {
          q: "How is the Course Leaderboard ranked?",
          a: `The leaderboard ranks students by the total XP they've earned within a specific course. You earn XP by successfully completing quizzes, flashcards, and mock exams for that course.`,
        }
      ]
    },
    {
      id: "study",
      icon: BrainCircuit,
      title: "Study & Mock Exams",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      items: [
        {
          q: "How does the Mock Exam engine work?",
          a: `Under a course's "Exams" tab, you'll see your tracked exam timetable. Click "Mock Exam" to launch a timed simulation. We currently support three formats:\n\n1. MCQ / Objective: Traditional multiple-choice.\n2. Theory: Open-ended written answer space.\n3. German Objective: Fill-in-the-blank style where you must type the exact missing answer.\n\nScores count towards your course mastery XP!`,
        },
        {
          q: "How do I use Spaced Repetition (FSRS)?",
          a: `Under the "Study" tab, select "Flashcards". The system uses the FSRS algorithm to present cards you're likely to forget right when your brain needs the refresher. Your responses determine when you'll see the card next.`,
        },
        {
          q: "Can I add my own exam schedule?",
          a: `Yes! From the "Exams" tab, tap "Add Exam" to track upcoming quizzes, midterms, or final exams. The dashboard will automatically calculate the countdown timer for you.`,
        }
      ]
    },
    {
      id: "communities",
      icon: Users,
      title: "Communities",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      items: [
        {
          q: "How do I create a new Community?",
          a: `Go to the "Communities" section using the sidebar menus. Click the "Create Community" button. You can set the name, a unique URL slug, and a description.`,
        },
        {
          q: "What is a community 'Slug'?",
          a: `A slug is the URL-friendly name for your community. For example, if your community is called "Lerno Eng 2026", your slug could be "eng-2026", resulting in a shareable link: lerno.app/communities/eng-2026.`,
        },
        {
          q: "Can I filter posts by Community?",
          a: `Yes. When you join a community and navigate to its dedicated page, the internal feed only displays posts submitted specifically to that community.`,
        }
      ]
    },
    {
      id: "settings",
      icon: Shield,
      title: "Settings & Privacy",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      items: [
        {
          q: "Can I download my personal data?",
          a: `Absolutely! Go to Settings > Data & Privacy > Data Export. You can request a full archive covering your profile info, courses, community posts, and flashcard mastery.`,
        },
        {
          q: "How do I disable email summary notifications?",
          a: `Go to Settings > Appearance & Preferences > Display & Notifications. Use the toggle switch under "Email Summaries" to turn them on or off.`,
        }
      ]
    }
  ];
</script>

<svelte:head>
  <title>Help Center — Lerno</title>
</svelte:head>

<div class="max-w-[var(--feed-max)] w-full mx-auto border-x border-border min-h-screen">
  <!-- Header -->
  <div class="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <button class="p-1.5 -ml-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" onclick={() => history.back()}>
        <ChevronLeft class="size-5" />
      </button>
      <h1 class="text-lg font-bold tracking-tight">Help Center</h1>
    </div>
  </div>

  <div class="p-4 md:p-6 space-y-8">
    <div class="flex items-center gap-4 p-5 rounded-2xl bg-muted/50 border border-border">
      <div class="size-12 rounded-xl bg-brand-500/10 border-2 border-brand-500/20 flex items-center justify-center shrink-0">
        <HelpCircle class="size-6 text-brand-500" />
      </div>
      <div>
        <h2 class="text-sm font-bold text-foreground">How can we help?</h2>
        <p class="text-xs text-muted-foreground mt-0.5">Learn how to make the most out of the new Course Management, Study engine, and Community tools.</p>
      </div>
    </div>

    <!-- Accordions categorised by feature -->
    <div class="space-y-6">
      {#each categories as category}
        <section class="space-y-3">
          <div class="flex items-center gap-2">
            <div class="size-6 rounded-md {category.bg} flex items-center justify-center shrink-0">
              <category.icon class="size-3.5 {category.color}" />
            </div>
            <h3 class="text-sm font-bold text-foreground">{category.title}</h3>
          </div>
          
          <div class="px-2">
            <Accordion.Root type="single" class="w-full">
              {#each category.items as item, i}
                <Accordion.Item value="{category.id}-{i}">
                  <Accordion.Trigger class="text-sm text-left hover:no-underline hover:text-brand-500 transition-colors py-3">
                    {item.q}
                  </Accordion.Trigger>
                  <Accordion.Content class="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pb-4">
                    {item.a}
                  </Accordion.Content>
                </Accordion.Item>
              {/each}
            </Accordion.Root>
          </div>
        </section>
      {/each}
    </div>
  </div>
</div>
