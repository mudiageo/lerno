# Help Center & Documentation Site

## App: `apps/docs`
**URL:** `docs.studyscroll.dev`  
**Stack:** SvelteKit 2 with `adapter-static` (pre-rendered, zero server needed)  
**Content:** Markdown files in `apps/docs/src/content/`

---

## Content Structure

```
apps/docs/src/content/
│
├── getting-started/
│   ├── what-is-studyscroll.md
│   ├── creating-an-account.md
│   ├── adding-your-courses.md
│   ├── setting-up-your-exam-schedule.md
│   └── uploading-notes.md
│
├── scroll-mode/
│   ├── how-the-feed-works.md
│   ├── post-types-explained.md
│   ├── quiz-posts-and-xp.md
│   ├── surprise-questions.md
│   └── creating-posts.md
│
├── watch-mode/
│   ├── finding-videos.md
│   ├── youtube-videos.md
│   ├── uploading-your-own-video.md
│   └── shorts.md
│
├── study-mode/
│   ├── flashcard-sessions.md
│   ├── spaced-repetition-explained.md
│   ├── quiz-sessions.md
│   ├── mock-exam-generator.md
│   └── pomodoro-timer.md
│
├── live/
│   ├── watching-streams.md
│   ├── hosting-a-stream.md
│   └── audio-spaces.md
│
├── gamification/
│   ├── xp-and-levels.md
│   ├── streaks.md
│   ├── leaderboards.md
│   └── badges-and-achievements.md
│
├── premium/
│   ├── what-is-premium.md
│   ├── how-to-upgrade.md
│   ├── offline-downloads.md
│   ├── ai-tutor.md
│   └── institutional-plans.md
│
├── account/
│   ├── changing-your-password.md
│   ├── notification-settings.md
│   ├── accessibility-settings.md
│   ├── deleting-your-account.md
│   └── data-export.md
│
├── billing/
│   ├── payment-methods.md
│   ├── cancelling-your-subscription.md
│   ├── refund-policy.md
│   └── invoices.md
│
├── communities/
│   ├── joining-communities.md
│   ├── creating-a-community.md
│   └── community-rules.md
│
├── technical/
│   ├── supported-devices.md
│   ├── desktop-app.md
│   ├── android-app.md
│   ├── offline-mode.md
│   └── troubleshooting.md
│
└── institutions/
    ├── getting-started-institution.md
    ├── adding-students.md
    ├── lecturer-guide.md
    ├── analytics-guide.md
    └── billing-institutions.md
```

---

## Key Help Articles (Full Content)

### What is StudyScroll?

```markdown
# What is StudyScroll?

StudyScroll is a social learning platform that turns scrolling into studying.
Instead of wasting time on social media, you scroll through quiz questions,
flashcards, and short videos — all matched to the courses you're actually studying.

## Three Modes

**Scroll Mode** looks like Twitter/X. Your feed fills up with bite-sized content
from your courses: quiz questions to test yourself, flashcards to build memory,
polls to gauge your understanding, and short posts explaining tricky concepts.

**Watch Mode** looks like YouTube. Discover short educational videos, AI-generated
lecture summaries, and student-uploaded walkthroughs — all tagged to your course
topics.

**Study Mode** is focused, distraction-free study. Work through flashcard sessions
using spaced repetition (the proven technique), take timed quizzes, or generate a
full AI mock exam paper to practice under exam conditions.

## How the algorithm works

StudyScroll tracks which topics you struggle with (from your quiz answers and
flashcard reviews) and gradually fills your feed with more content on those weak
topics. It also detects when an exam is approaching and increases the amount of
exam-style content in your feed.

You don't have to think about this — just scroll. The platform adapts to you.
```

### Spaced Repetition Explained

```markdown
# Spaced Repetition — How It Works

Spaced repetition is a memorization technique proven to be the most effective
way to retain information long-term. Instead of cramming everything at once,
you review each piece of information at increasing intervals.

## The FSRS Algorithm

StudyScroll uses the FSRS algorithm (Free Spaced Repetition Scheduler) to
calculate when each flashcard should be reviewed. After you review a card,
you tell us whether you knew it or not:

- **Got it** → the card's interval increases (you'll see it later)
- **Didn't know** → the card is reset and appears again soon

## What the numbers mean

When you're in a flashcard session, you'll see numbers like "32 cards due today."
These are the cards that the algorithm has scheduled for review today — not
all at once, but spread across days based on your memory curve.

## Why it works

Without spaced repetition, you'd forget 70% of what you study within a week.
With spaced repetition, the same material can be retained for months — or even
permanently — with just a few minutes of review per day.
```

### How to Upgrade to Premium

```markdown
# How to Upgrade to Premium

## What you get with Premium

- **Unlimited AI content** — no daily cap on AI-generated quiz questions and flashcards
- **Unlimited AI Tutor** — ask the AI tutor as many questions as you need
- **Offline downloads** — download videos for studying without internet
- **AI Mock Exam Generator** — generate complete practice papers for any course
- **All courses** — no limit on how many courses you enroll in
- **Full analytics** — track your mastery progress over your entire history

## How to upgrade

1. Go to **Settings → Billing** in the app
2. Choose your plan: Monthly (₦3,000/month) or Yearly (₦25,000/year — save ₦11,000)
3. Click **Upgrade Now**
4. You'll be redirected to our secure payment page (Paystack for Nigeria/Africa, Stripe globally)
5. Complete payment — your account upgrades instantly

## Payment methods accepted

**Paystack (Nigeria, Ghana, Kenya):**
- Debit/credit card (Visa, Mastercard, Verve)
- Bank transfer
- USSD

**Stripe (Global):**
- Debit/credit card
- Apple Pay / Google Pay

## Cancellation

You can cancel anytime in **Settings → Billing → Cancel Subscription**.
Your Premium features remain active until the end of your billing period.
No refunds for partial months (see our Refund Policy).
```

---

## Help Center Search

```typescript
// apps/docs/src/lib/search.ts
// Build a client-side search index from all markdown files at build time

import FlexSearch from 'flexsearch';
import { getAllArticles } from './content';

let searchIndex: FlexSearch.Index;

export async function buildSearchIndex() {
  searchIndex = new FlexSearch.Index({ tokenize: 'forward', resolution: 9 });
  const articles = await getAllArticles();
  for (const article of articles) {
    searchIndex.add(article.id, `${article.title} ${article.body}`);
  }
}

export function searchHelp(query: string) {
  if (!searchIndex) return [];
  const ids = searchIndex.search(query, 10);
  return ids.map(id => getArticleById(id));
}
```

---

## In-App Help Widget

A contextual help button appears in the student app that links to relevant help articles based on the current route:

```typescript
// src/lib/utils/contextual-help.ts
const ROUTE_HELP_MAP: Record<string, { title: string; url: string }[]> = {
  '/feed':                [{ title: 'How the feed works', url: '/feed-algorithm' },
                           { title: 'Post types explained', url: '/post-types' }],
  '/study/flashcards':   [{ title: 'Spaced repetition explained', url: '/spaced-repetition' }],
  '/study/mock-exam':    [{ title: 'Mock exam generator', url: '/mock-exam' }],
  '/settings/billing':   [{ title: 'How to upgrade', url: '/upgrade' },
                           { title: 'Refund policy', url: '/refunds' }],
  '/live':               [{ title: 'Watching streams', url: '/streams' },
                           { title: 'Hosting a stream', url: '/hosting' }],
};

export function getContextualHelp(pathname: string) {
  return ROUTE_HELP_MAP[pathname] ?? [{ title: 'Help Center', url: '/' }];
}
```

```svelte
<!-- Floating help button in student app layout -->
<button
  class="fixed bottom-20 right-4 z-40 size-12 rounded-full bg-brand-500 text-white
         shadow-lg flex items-center justify-center hover:bg-brand-600 transition-colors
         lg:bottom-6"
  onclick={() => helpOpen = true}
>
  ?
</button>

<!-- Sheet with contextual help links + link to submit ticket -->
<Sheet bind:open={helpOpen}>
  <SheetHeader>Need help?</SheetHeader>
  <SheetContent>
    <div class="space-y-2">
      {#each contextualHelp as link}
        <a href="https://docs.studyscroll.dev/help/{link.url}" target="_blank"
           class="flex items-center justify-between p-3 rounded-lg border hover:border-brand-500 transition-colors">
          <span class="text-sm">{link.title}</span>
          <ExternalLink class="size-3.5 text-muted" />
        </a>
      {/each}
    </div>
    <div class="mt-6 pt-4 border-t">
      <p class="text-sm text-muted mb-3">Can't find what you need?</p>
      <a href="/settings/help" class="btn-primary w-full text-center block">
        Contact Support
      </a>
    </div>
  </SheetContent>
</Sheet>
```
