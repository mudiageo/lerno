# Lerno — Vision & Core Concept

## The Problem

Students doomscroll for 4–6 hours daily on TikTok, Instagram, X, and YouTube. This time is entirely lost from an academic perspective. Meanwhile, exam anxiety peaks as students realise they haven't studied enough. The two behaviours — compulsive scrolling and the need to study — exist in direct opposition.

## The Solution

**Lerno collapses the gap between doomscrolling and studying.** It is a social media platform that looks, feels, and behaves exactly like the apps students are already addicted to — but every piece of content is derived from their own curriculum.

Instead of scrolling memes, students scroll their course material. Instead of watching random YouTube clips, they watch AI-summarised lecture breakdowns. Instead of mindlessly liking posts, they answer quiz questions that adapt to their weaknesses.

The student doesn't have to *decide* to study. They just scroll.

---

## Core Principles

### 1. Zero Friction
The app must feel like entertainment, not work. No "study session" to start. No timer to set. Just open and scroll. Study happens passively by design.

### 2. Curriculum-First
Every piece of content — whether AI-generated or student-posted — is tagged to a course code and topic. The feed only surfaces content from the student's enrolled courses unless they explicitly browse communities.

### 3. Adaptive Intelligence
The algorithm tracks what topics a student struggles with (via quiz answers, flashcard flips, dwell time) and quietly increases the proportion of content on those weak topics — without the student ever being told they're being "remediated."

### 4. Social Proof for Studying
Leaderboards, streaks, badges, and community posts make academic achievement visible and social. Studying becomes a flex.

### 5. AI-Augmented, Human-Curated
AI generates starter content at scale. Students and tutors create premium content. The blend makes the feed always fresh, even for niche courses.

---

## Three Modes

### 📱 Scroll Mode (BlueSky/X)
- Vertical infinite scroll feed
- Posts: text, images, quiz cards, flashcard cards, polls, threads, shorts
- Surprise questions appear organically in feed
- Interactions: likes, reposts, quotes, replies, bookmarks
- Spaces: audio-only live rooms for study groups

### 📺 Watch Mode (YouTube)
- Horizontal video grid
- AI-generated lecture summary videos
- Student-uploaded walkthroughs and explainers
- YouTube embeds (curriculum-tagged, no download)
- Shorts player (vertical, swipeable)
- Live streams for tutors and study sessions

### 📚 Study Mode (Focused)
- Spaced repetition flashcard sessions (FSRS algorithm)
- Timed practice quizzes per topic
- AI-generated mock exam papers
- Past exam question bank
- Pomodoro timer integrated
- Personal mastery heatmap

---

## Platform Targets

| Platform | Method | Source |
|---|---|---|
| Web | SvelteKit + Vercel | `apps/web` |
| Desktop (macOS/Win/Linux) | Tauri v2 | Same `apps/web` source |
| Android | Tauri v2 Android | Same `apps/web` source |
| iOS | Future — Capacitor or Tauri iOS | TBD |

---

## Business Model

### Free Tier
- Unlimited scroll, watch, and study
- AI content (limited: 50 AI-generated posts/day in feed)
- Community participation
- 3 course enrollments max
- Basic analytics

### Premium (Student) — via Paystack or Stripe
- Unlimited AI content generation
- Offline download of own-platform videos (not YouTube)
- AI tutor chatbot (unlimited)
- AI mock exam paper generator (unlimited)
- All courses enrolled
- Detailed mastery analytics
- Ad-free (no promoted content)
- Priority feed of upcoming exam content

### Institutional — School/University License
- All premium features for enrolled students
- Lecturer dashboard: upload course materials, set exam dates
- Admin analytics: cohort performance, at-risk student detection
- Custom course catalog
- Branded experience (logo, colors)
- Bulk seat pricing

### One-Time Purchases
- Individual AI mock exam paper (per course)
- Premium flashcard deck (student-created, sold in marketplace — future)

---

## Success Metrics

- **DAU/MAU ratio** — target >40% (social apps average 25%)
- **Average session length** — target >18 minutes
- **Quiz answer rate** — % of users who answer quiz posts in feed
- **Topic mastery improvement** — delta in topic_mastery.score over 30 days
- **Exam outcome correlation** — (long-term) correlation between platform usage and grade improvement
