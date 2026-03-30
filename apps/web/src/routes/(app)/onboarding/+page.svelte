<script lang="ts">
  import { useSession } from "$lib/auth.svelte";
  import { completeOnboarding } from "./onboarding.remote";

  const session = useSession();

  let currentStep = $state(1);
  let loading = $state(false);
  let error = $state<string | null>(null);

  // Form State
  let username = $state("");
  let courses = $state([{ code: "", title: "", semester: "Fall 2026" }]);
  let theme = $state("system");
  let aiEnabled = $state(true);

  // Automatically pre-fill username based on email
  $effect(() => {
    if (session?.data?.user?.email && !username) {
      username = session.data.user.email.split("@")[0];
    }
  });

  function nextStep() {
    currentStep += 1;
  }
  function prevStep() {
    currentStep -= 1;
  }

  function addCourse() {
    courses.push({ code: "", title: "", semester: "Fall 2026" });
  }
  function removeCourse(i: number) {
    courses.splice(i, 1);
  }

  async function submit() {
    loading = true;
    error = null;
    try {
      const result = await completeOnboarding({
        username,
        courses: courses.filter((c) => c.code.trim() !== ""),
        events: [], // we skip events in simple onboarding for now
        preferences: { theme, aiEnabled },
      });

      if (result.success) {
        window.location.href = "/feed";
      }
    } catch (e: any) {
      console.error("Onboarding failed:", e);
      error = e.message || "Something went wrong. Please try again.";
    } finally {
      loading = false;
    }
  }
</script>

<div
  class="max-w-2xl mx-auto mt-12 p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800"
>
  <div class="mb-8 flex items-center justify-between">
    <h1 class="text-2xl font-bold">Welcome to Lerno</h1>
    <span
      class="text-sm font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full"
      >Step {currentStep} of 5</span
    >
  </div>

  <div
    class="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full mb-10 overflow-hidden"
  >
    <div
      class="h-full bg-zinc-900 dark:bg-white transition-all duration-300"
      style="width: {(currentStep / 5) * 100}%"
    ></div>
  </div>

  {#if error}
    <div
      class="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm"
    >
      {error}
    </div>
  {/if}

  {#if currentStep === 1}
    <div class="animate-in fade-in slide-in-from-bottom-4">
      <h2 class="text-xl font-semibold mb-4">Choose your username</h2>
      <p class="text-zinc-500 mb-6">
        This is how other students will see you in communities and leaderboards.
      </p>

      <label for="username" class="block text-sm font-medium mb-1"
        >Username</label
      >
      <input
        id="username"
        type="text"
        bind:value={username}
        class="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-lg"
        placeholder="johndoe"
      />
    </div>
  {/if}

  {#if currentStep === 2}
    <div class="animate-in fade-in slide-in-from-bottom-4">
      <h2 class="text-xl font-semibold mb-4">Add your courses</h2>
      <p class="text-zinc-500 mb-6">
        We use this to personalize your feed and generate AI study content.
      </p>

      {#each courses as course, i}
        <div class="flex gap-4 mb-4">
          <input
            type="text"
            bind:value={course.code}
            placeholder="CS101"
            class="w-1/3 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent uppercase"
          />
          <input
            type="text"
            bind:value={course.title}
            placeholder="Intro to Computer Science"
            class="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
          />

          {#if i > 0}
            <button
              onclick={() => removeCourse(i)}
              class="text-red-500 hover:text-red-600 px-2 py-2"
              aria-label="Remove course"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path></svg
              >
            </button>
          {/if}
        </div>
      {/each}

      <button
        onclick={addCourse}
        class="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >+ Add another course</button
      >
    </div>
  {/if}

  {#if currentStep === 3}
    <div class="animate-in fade-in slide-in-from-bottom-4">
      <h2 class="text-xl font-semibold mb-4">Exam Dates (Optional)</h2>
      <p class="text-zinc-500 mb-6">
        We'll send you reminders 1, 3, and 7 days before exams.
      </p>

      <div
        class="text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50"
      >
        <p class="text-zinc-500 text-sm mb-4">
          Skip this for now. You can sync your calendar or add dates manually
          later.
        </p>
      </div>
    </div>
  {/if}

  {#if currentStep === 4}
    <div class="animate-in fade-in slide-in-from-bottom-4">
      <h2 class="text-xl font-semibold mb-4">
        Upload initial notes (Optional)
      </h2>
      <p class="text-zinc-500 mb-6">
        Upload course syllabi or initial lecture notes to kickstart your
        personalized AI generation.
      </p>

      <div
        class="text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50"
      >
        <p class="text-zinc-500 text-sm mb-4">
          Skip this for now. File uploads will be available in the main app
          feed.
        </p>
      </div>
    </div>
  {/if}

  {#if currentStep === 5}
    <div class="animate-in fade-in slide-in-from-bottom-4">
      <h2 class="text-xl font-semibold mb-4">Personalization</h2>
      <p class="text-zinc-500 mb-6">Configure how Lerno behaves for you.</p>

      <div class="space-y-6">
        <div>
          <label for="theme" class="block text-sm font-medium mb-2">Theme</label
          >
          <select
            id="theme"
            bind:value={theme}
            class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
          >
            <option value="system">System Default</option>
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
            <option value="oled">OLED Pitch Black</option>
          </select>
        </div>

        <div
          class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800"
        >
          <div>
            <h4 class="font-medium">AI Tutor & Content Generation</h4>
            <p class="text-sm text-zinc-500">
              Allow Lerno to automatically generate quizzes and flashcards from
              your courses.
            </p>
          </div>
          <input
            type="checkbox"
            bind:checked={aiEnabled}
            class="w-5 h-5 rounded text-zinc-900 focus:ring-zinc-900"
          />
        </div>
      </div>
    </div>
  {/if}

  <div
    class="mt-8 flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800"
  >
    {#if currentStep > 1}
      <button
        onclick={prevStep}
        class="px-6 py-2 font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >Back</button
      >
    {:else}
      <div></div>
    {/if}

    {#if currentStep < 5}
      <button
        onclick={nextStep}
        class="px-6 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 rounded-lg font-medium transition-opacity"
        >Continue</button
      >
    {:else}
      <button
        onclick={submit}
        disabled={loading}
        class="px-8 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
      >
        {loading ? "Finishing setup..." : "Get Started!"}
      </button>
    {/if}
  </div>
</div>
