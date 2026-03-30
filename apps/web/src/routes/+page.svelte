<script lang="ts">
  import { useSession } from '$lib/auth.svelte';
  
  const session = useSession();

  const features = [
    { title: 'AI-Powered Tutoring', description: 'Personalized quizzes and summaries generated from your course material in seconds.', icon: '🤖' },
    { title: 'Social Learning', description: 'Join dedicated course communities to share notes and solve problems together.', icon: '👥' },
    { title: 'Gamified Progress', description: 'Keep your streak alive and climb the leaderboard while mastering your subjects.', icon: '🏆' }
  ];
</script>

<svelte:head>
  <title>Lerno | Personalized AI Education</title>
</svelte:head>

<div class="min-h-screen bg-zinc-950 text-white overflow-hidden selection:bg-indigo-500/30">
  
  <!-- Animated Mesh Gradient Background -->
  <div class="fixed inset-0 -z-10 pointer-events-none">
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]"></div>
    <div class="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full animate-pulse [animation-delay:4s]"></div>
  </div>

  <!-- Navbar -->
  <nav class="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-lg">L</div>
        <span class="text-xl font-bold tracking-tight">Lerno</span>
      </div>
      
      <div class="flex items-center gap-4">
        {#if session?.data?.user}
          <a href="/feed" class="text-sm font-medium hover:text-indigo-400 transition-colors">Go to App</a>
        {:else}
          <a href="/sign-in" class="text-sm font-medium hover:text-indigo-400 transition-colors">Login</a>
          <a href="/sign-up" class="px-4 py-2 bg-white text-zinc-950 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors">
            Get Started
          </a>
        {/if}
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <main class="relative pt-20 pb-16 px-6">
    <div class="max-w-7xl mx-auto text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Now in Beta for University Students
      </div>
      
      <h1 class="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        Education, but <br class="hidden md:block" /> <span class="text-indigo-500">Intelligent.</span>
      </h1>
      
      <p class="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 mb-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
        Lerno uses advanced AI to transform your lecture notes, PDFs, and reading materials into a personalized, gamified study experience.
      </p>
      
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
        <a href="/sign-up" class="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95">
          Start Learning Free
        </a>
        <button class="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-lg transition-all backdrop-blur-sm">
          Watch Demo
        </button>
      </div>

      <!-- Hero Visual (Course Card Mockup) -->
      <div class="mt-20 relative max-w-5xl mx-auto group animate-in fade-in zoom-in-95 duration-1000 delay-500">
        <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div class="relative bg-zinc-900 border border-white/10 rounded-3xl p-4 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
            <!-- Simulated App Interface -->
            <div class="w-full h-full bg-zinc-950/50 rounded-2xl border border-white/5 flex flex-col p-6">
                <div class="flex items-center gap-4 mb-8">
                    <div class="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl">🧪</div>
                    <div class="text-left">
                        <div class="h-4 w-32 bg-white/10 rounded-full mb-2"></div>
                        <div class="h-3 w-20 bg-white/5 rounded-full"></div>
                    </div>
                </div>
                <div class="space-y-4">
                    <div class="h-32 w-full bg-white/5 rounded-xl animate-pulse"></div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="h-20 bg-indigo-500/5 rounded-xl border border-indigo-500/10"></div>
                        <div class="h-20 bg-emerald-500/5 rounded-xl border border-emerald-500/10"></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Features Section -->
  <section class="py-24 px-6 border-t border-white/5">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {#each features as feature}
          <div class="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
            <div class="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-500">{feature.icon}</div>
            <h3 class="text-xl font-bold mb-3">{feature.title}</h3>
            <p class="text-zinc-400 leading-relaxed text-sm">
              {feature.description}
            </p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-12 px-6 border-t border-white/5 text-center text-zinc-500 text-sm">
    <p>&copy; 2026 Lerno AI. All rights reserved.</p>
  </footer>

</div>

<style>
  /* Custom animations for tailwind (since we don't have anime.js or similar yet) */
  :global(.animate-in) {
    animation-fill-mode: both;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  /* Mesh gradient animation */
  @keyframes pulse {
    0%, 100% { opacity: 0.1; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(1.1); }
  }
</style>
