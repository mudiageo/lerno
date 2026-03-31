# Frontend — Setup, Theming, Animations, Accessibility & Offline

## SvelteKit Configuration

```javascript
// apps/web/svelte.config.js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $db:       '../../packages/db/src',
      $ai:       '../../packages/ai/src',
      $storage:  '../../packages/storage/src',
      $email:    '../../packages/email/src',
      $payments: '../../packages/payments/src',
    },
    csrf: { checkOrigin: true },
    env: { publicPrefix: 'PUBLIC_' },
  },
};
```

```typescript
// apps/web/vite.config.ts (app-level, extends root Vite+ config)
import { sveltekit } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port: 5173,
    proxy: {
      // Proxy to Render workers in dev if needed
    },
  },
};
```

---

## Root Layout — Theme, Toast & Query Client

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { Toaster } from '$lib/components/ui/toast';
  import { theme } from '$lib/stores/theme.svelte';
  import { onMount } from 'svelte';
  import { isTauri } from '$lib/utils/platform';

  let { data, children } = $props();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime:    5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  // Apply theme class to <html>
  $effect(() => {
    document.documentElement.classList.remove('dark', 'oled', 'light');
    if ($theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add($theme);
    }
  });

  // Apply reduced motion
  $effect(() => {
    if (data.user?.reducedMotion) {
      document.documentElement.style.setProperty('--duration-fast', '0ms');
      document.documentElement.style.setProperty('--duration-normal', '0ms');
      document.documentElement.style.setProperty('--duration-slow', '0ms');
    }
  });

  // Apply dyslexia font
  $effect(() => {
    document.documentElement.classList.toggle('dyslexia', data.user?.dyslexiaFont ?? false);
  });
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
  <Toaster richColors position="top-right" />
</QueryClientProvider>
```

---

## Theme Store

```typescript
// src/lib/stores/theme.svelte.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'oled' | 'system';

function createThemeStore() {
  const stored = browser ? (localStorage.getItem('theme') as Theme) ?? 'system' : 'system';
  const { subscribe, set } = writable<Theme>(stored);

  return {
    subscribe,
    set(value: Theme) {
      if (browser) localStorage.setItem('theme', value);
      set(value);
    },
  };
}

export const theme = createThemeStore();
```

```svelte
<!-- src/lib/components/layout/ThemeToggle.svelte -->
<script lang="ts">
  import { theme } from '$lib/stores/theme.svelte';
  import { Sun, Moon, Zap, Monitor } from 'lucide-svelte';
  import { DropdownMenu } from '$lib/components/ui/dropdown-menu';

  const options = [
    { value: 'light', label: 'Light',  icon: Sun },
    { value: 'dark',  label: 'Dark',   icon: Moon },
    { value: 'oled',  label: 'OLED',   icon: Zap },
    { value: 'system',label: 'System', icon: Monitor },
  ] as const;
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="p-2 rounded-lg hover:bg-[--color-bg-overlay] transition-colors">
    {#if $theme === 'light'}<Sun class="size-5" />
    {:else if $theme === 'dark'}<Moon class="size-5" />
    {:else if $theme === 'oled'}<Zap class="size-5" />
    {:else}<Monitor class="size-5" />{/if}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    {#each options as opt}
      <DropdownMenu.Item onclick={() => theme.set(opt.value)} class="gap-2">
        <svelte:component this={opt.icon} class="size-4" />
        {opt.label}
        {#if $theme === opt.value}
          <span class="ml-auto text-brand-500">✓</span>
        {/if}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

---

## Platform Detection

```typescript
// src/lib/utils/platform.ts
export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const isAndroid = isTauri
  && typeof navigator !== 'undefined'
  && /Android/i.test(navigator.userAgent);

export const isDesktop = isTauri && !isAndroid;
export const isWeb = !isTauri;

// Conditionally import Tauri APIs
export async function getTauriInvoke() {
  if (!isTauri) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke;
}

// Tauri-aware share
export async function shareContent(url: string, title: string) {
  if (isAndroid || isDesktop) {
    const invoke = await getTauriInvoke();
    await invoke?.('share', { url, title });
  } else if (navigator.share) {
    await navigator.share({ url, title });
  } else {
    await navigator.clipboard.writeText(url);
  }
}
```

---

## Animation Utilities

```typescript
// src/lib/utils/animations.ts
import { cubicOut, cubicIn, backOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

// Slide-up-fade for post cards
export function slideUpFade(node: Element, { delay = 0, duration = 300 } = {}): TransitionConfig {
  return {
    delay,
    duration,
    easing: cubicOut,
    css: (t) => `
      opacity: ${t};
      transform: translateY(${(1 - t) * 12}px);
    `,
  };
}

// Scale-in for modals and sheets
export function scaleIn(node: Element, { delay = 0, duration = 200 } = {}): TransitionConfig {
  return {
    delay,
    duration,
    easing: backOut,
    css: (t) => `
      opacity: ${t};
      transform: scale(${0.92 + t * 0.08});
    `,
  };
}

// Horizontal slide for tabs and Shorts
export function slideX(node: Element, { from = 1 } = {}): TransitionConfig {
  return {
    duration: 300,
    easing: cubicOut,
    css: (t) => `transform: translateX(${(1 - t) * 100 * from}%)`,
  };
}

// Confetti burst for achievements
export function triggerConfetti(originX = 0.5, originY = 0.5) {
  // Uses canvas-confetti if available
  if (typeof window !== 'undefined' && (window as any).confetti) {
    (window as any).confetti({ particleCount: 80, spread: 70, origin: { x: originX, y: originY } });
  }
}
```

```svelte
<!-- Usage in PostCard -->
<article transition:slideUpFade={{ delay: index * 40 }}>
  ...
</article>
```

---

## Accessibility

```svelte
<!-- All interactive elements have aria labels -->
<button
  aria-label="Like post by {post.author?.displayName}"
  aria-pressed={liked}
  onclick={handleLike}
>
  <Heart aria-hidden="true" />
  <span class="sr-only">{liked ? 'Unlike' : 'Like'}</span>
  {likeCount}
</button>

<!-- Focus-visible for keyboard users (Tailwind v4) -->
<style>
  :focus-visible {
    outline: 2px solid var(--color-brand-500);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }
</style>
```

```typescript
// src/routes/(app)/settings/accessibility/+page.svelte
// Key accessibility toggles:
// 1. Reduced motion — sets CSS duration tokens to 0ms
// 2. Dyslexia font — applies OpenDyslexic globally
// 3. High contrast — increases border and text contrast
// 4. Screen reader mode — simplifies feed, removes decorative elements
// 5. Font size — base font size +1 to +4
```

### ARIA Live Region for Notifications

```svelte
<!-- src/lib/components/layout/NotificationAnnouncer.svelte -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
>
  {latestNotification?.body ?? ''}
</div>
```

---

## Service Worker & Offline Strategy

```typescript
// src/service-worker.ts (SvelteKit built-in SW)
import { build, files, version } from '$service-worker';

const CACHE_NAME = `studyscroll-${version}`;

// Cache shell on install
self.addEventListener('install', (e: any) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([
      ...build,   // JS/CSS chunks
      ...files,   // static assets
      '/offline', // offline fallback page
    ]))
  );
  (self as any).skipWaiting();
});

// Cache-first for assets, network-first for API
self.addEventListener('fetch', (e: any) => {
  const url = new URL(e.request.url);

  // API calls: network-first, don't cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/__data.json')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Static assets: cache-first
  if (build.includes(url.pathname) || files.includes(url.pathname)) {
    e.respondWith(caches.match(e.request).then(cached => cached ?? fetch(e.request)));
    return;
  }

  // Pages: network-first with offline fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match('/offline') ?? new Response('Offline'))
  );
});

// Cleanup old caches
self.addEventListener('activate', (e: any) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  (self as any).clients.claim();
});
```

### Offline Flashcard Cache

```typescript
// src/lib/utils/offline-flashcards.ts
// Premium: cache due flashcards in IndexedDB for offline Study Mode

const DB_NAME = 'studyscroll-offline';
const STORE = 'flashcards';

export async function cacheFlashcardsForOffline(cards: FlashcardContent[]) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) { db.createObjectStore(STORE, { keyPath: 'id' }); },
  });
  const tx = db.transaction(STORE, 'readwrite');
  for (const card of cards) await tx.store.put(card);
  await tx.done;
}

export async function getOfflineFlashcards(): Promise<FlashcardContent[]> {
  const db = await openDB(DB_NAME, 1);
  return db.getAll(STORE);
}
```

### Offline Fallback Page

```svelte
<!-- src/routes/offline/+page.svelte -->
<div class="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center">
  <div class="text-6xl">📚</div>
  <h1 class="text-2xl font-bold text-[--color-text]">You're offline</h1>
  <p class="text-[--color-text-muted] max-w-sm">
    No internet connection detected. Your cached flashcards are still available in Study Mode.
  </p>
  <a href="/study/flashcards"
     class="px-6 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors">
    Open Flashcards
  </a>
</div>
```
