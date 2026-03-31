# Landing Page & Marketing Site

## App: `apps/landing`
**URL:** `studyscroll.dev`  
**Stack:** SvelteKit 2, `adapter-static` (fully pre-rendered), Tailwind v4  
**Deploy:** Vercel static CDN — no server, zero cost

---

## Route Map

```
/                          ← Homepage (hero, features, social proof, pricing, CTA)
/pricing                   ← Detailed pricing comparison
/for-students              ← Student-focused landing
/for-institutions          ← Institution/school landing
/blog/                     ← Blog index
/blog/[slug]               ← Individual blog post
/about                     ← Company story, team
/careers                   ← Open positions (static list)
/press                     ← Press kit, media assets
/legal/terms               ← Terms of Service
/legal/privacy             ← Privacy Policy
/legal/cookies             ← Cookie Policy
```

---

## Homepage Sections

```svelte
<!-- apps/landing/src/routes/+page.svelte -->

<!-- 1. HERO -->
<section class="hero">
  <h1>Stop doomscrolling. Start scrolling smarter.</h1>
  <p>StudyScroll transforms your social media habit into a powerful study engine.
     Quiz questions, flashcards, and study videos — matched to your exact courses.</p>
  <a href="https://app.studyscroll.dev/register" class="cta-button">
    Start for free → no card needed
  </a>
  <!-- Hero visual: mockup of the app in phone frame -->
</section>

<!-- 2. SOCIAL PROOF (numbers) -->
<section class="stats">
  <Stat value="120,000+"  label="Students enrolled" />
  <Stat value="4.8M"      label="Quiz answers submitted" />
  <Stat value="2,400+"    label="Courses covered" />
  <Stat value="91%"       label="Say their grades improved" />
</section>

<!-- 3. HOW IT WORKS (3 steps) -->
<section class="how-it-works">
  <Step n="1" title="Add your courses"
    desc="Enter your course codes. We map them to your syllabus automatically." />
  <Step n="2" title="Just scroll"
    desc="Your feed fills up with quizzes, flashcards, and explainer videos for your specific topics." />
  <Step n="3" title="The algorithm does the rest"
    desc="StudyScroll tracks what you know, what you don't, and focuses your feed on what matters most before each exam." />
</section>

<!-- 4. THREE MODES SHOWCASE -->
<section class="modes">
  <ModeShowcase
    mode="Scroll Mode"
    desc="Your curriculum, served as a social media feed. Quiz yourself without even trying."
    visual="scroll-mockup.png"
  />
  <ModeShowcase
    mode="Watch Mode"
    desc="Short lecture summaries and student-made walkthroughs, organized by course and topic."
    visual="watch-mockup.png"
  />
  <ModeShowcase
    mode="Study Mode"
    desc="Focused flashcard sessions with proven spaced repetition. AI mock exams on demand."
    visual="study-mockup.png"
  />
</section>

<!-- 5. GAMIFICATION -->
<section class="gamification">
  <h2>Studying should feel rewarding</h2>
  <p>Earn XP, build streaks, climb leaderboards, unlock badges.
     Compete with your classmates — and win.</p>
  <GamePreview />
</section>

<!-- 6. TESTIMONIALS -->
<section class="testimonials">
  <Testimonial
    name="Chinyere O." course="Medicine, Year 3"
    quote="I went from barely passing pharmacology to top 10 in my cohort.
           I didn't even feel like I was studying — I was just scrolling." />
  <!-- etc -->
</section>

<!-- 7. PRICING -->
<PricingSection />

<!-- 8. FOR INSTITUTIONS -->
<section class="institutions">
  <h2>Built for universities and secondary schools</h2>
  <a href="/for-institutions">Learn more about institutional licensing →</a>
</section>

<!-- 9. FINAL CTA -->
<section class="final-cta">
  <h2>Your next exam is sooner than you think.</h2>
  <a href="https://app.studyscroll.dev/register" class="cta-button">Get started free</a>
</section>
```

---

## Pricing Page

```svelte
<!-- apps/landing/src/routes/pricing/+page.svelte -->
<script>
  let currency = $state<'NGN'|'USD'>('NGN');
  let period = $state<'monthly'|'yearly'>('yearly');

  const prices = {
    NGN: { monthly: 3000, yearly: 25000 },
    USD: { monthly: 3, yearly: 25 },
  };
</script>

<div class="max-w-4xl mx-auto p-8">
  <h1 class="text-4xl font-bold text-center mb-4">Simple, honest pricing</h1>
  <p class="text-center text-muted mb-8">Free forever for students. Premium when you need more.</p>

  <!-- Currency + period toggle -->
  <div class="flex justify-center gap-4 mb-12">
    <div class="flex rounded-full border p-1">
      <button onclick={() => currency = 'NGN'}
              class="px-4 py-1.5 rounded-full text-sm {currency === 'NGN' ? 'bg-brand-500 text-white' : ''}">
        ₦ NGN
      </button>
      <button onclick={() => currency = 'USD'}
              class="px-4 py-1.5 rounded-full text-sm {currency === 'USD' ? 'bg-brand-500 text-white' : ''}">
        $ USD
      </button>
    </div>
    <div class="flex rounded-full border p-1">
      <button onclick={() => period = 'monthly'}
              class="px-4 py-1.5 rounded-full text-sm {period === 'monthly' ? 'bg-brand-500 text-white' : ''}">
        Monthly
      </button>
      <button onclick={() => period = 'yearly'}
              class="px-4 py-1.5 rounded-full text-sm {period === 'yearly' ? 'bg-brand-500 text-white' : ''}">
        Yearly <span class="text-xs text-green-600">Save 30%</span>
      </button>
    </div>
  </div>

  <!-- Plan cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Free -->
    <div class="border rounded-2xl p-6">
      <h3 class="text-xl font-bold">Free</h3>
      <div class="text-3xl font-black my-4">₦0</div>
      <p class="text-sm text-muted mb-6">Everything you need to start.</p>
      <ul class="space-y-2 text-sm mb-8">
        {#each freeFeatures as f}
          <li class="flex gap-2"><span class="text-green-500">✓</span>{f}</li>
        {/each}
      </ul>
      <a href="https://app.studyscroll.dev/register" class="btn-secondary w-full block text-center">
        Start free
      </a>
    </div>

    <!-- Premium (highlighted) -->
    <div class="border-2 border-brand-500 rounded-2xl p-6 relative">
      <span class="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1
                   bg-brand-500 text-white rounded-full">Most popular</span>
      <h3 class="text-xl font-bold">Premium Student</h3>
      <div class="text-3xl font-black my-4">
        {currency === 'NGN' ? '₦' : '$'}{prices[currency][period].toLocaleString()}
        <span class="text-base font-normal text-muted">/{period === 'monthly' ? 'mo' : 'yr'}</span>
      </div>
      <ul class="space-y-2 text-sm mb-8">
        {#each premiumFeatures as f}
          <li class="flex gap-2"><span class="text-brand-500">✓</span>{f}</li>
        {/each}
      </ul>
      <a href="https://app.studyscroll.dev/upgrade" class="btn-primary w-full block text-center">
        Upgrade now
      </a>
    </div>

    <!-- Institutional -->
    <div class="border rounded-2xl p-6">
      <h3 class="text-xl font-bold">Institution</h3>
      <div class="text-3xl font-black my-4">Custom</div>
      <p class="text-sm text-muted mb-6">Per-seat pricing for schools and universities.</p>
      <ul class="space-y-2 text-sm mb-8">
        {#each institutionFeatures as f}
          <li class="flex gap-2"><span class="text-green-500">✓</span>{f}</li>
        {/each}
      </ul>
      <a href="mailto:schools@studyscroll.dev" class="btn-secondary w-full block text-center">
        Contact sales
      </a>
    </div>
  </div>
</div>
```

---

## Institution Landing Page

```svelte
<!-- apps/landing/src/routes/for-institutions/+page.svelte -->
<section class="hero bg-brand-950 text-white">
  <h1>Give every student a personal study engine.</h1>
  <p>StudyScroll for institutions gives your students curriculum-aligned,
     AI-powered study content — and gives you the analytics to see who needs help.</p>
  <a href="mailto:schools@studyscroll.dev" class="cta-button">Request a demo</a>
</section>

<section class="features">
  <Feature icon="🧠" title="AI content from your materials"
    desc="Upload your lecture slides and past exam papers. AI generates quiz cards, flashcards, and explainer posts automatically." />
  <Feature icon="📊" title="At-risk student detection"
    desc="See which students have gone quiet before exams. Automated alerts let you intervene before it's too late." />
  <Feature icon="🏫" title="Lecturer dashboard"
    desc="Each lecturer manages their courses, uploads materials, and monitors their students' topic mastery in real time." />
  <Feature icon="🎨" title="Optional white-labeling"
    desc="Add your institution's logo and brand colors to the student experience." />
</section>

<section class="pricing">
  <h2>Per-seat pricing, billed annually</h2>
  <p class="text-muted">Starting at ₦2,500 per student per month (NGN) / $2.50 (USD)</p>
  <p>Volume discounts available for 500+ students.</p>
  <a href="mailto:schools@studyscroll.dev">Get a quote →</a>
</section>
```
