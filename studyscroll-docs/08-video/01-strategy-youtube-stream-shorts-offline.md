# Video — Complete Strategy, YouTube, Cloudflare Stream & Shorts

## Strategy Summary

| Content Source | Storage | Playback | Download | Notes |
|---|---|---|---|---|
| Student/tutor uploads | Cloudflare Stream | HLS (adaptive) | Premium only (signed URL) | Full control |
| YouTube embeds | YouTube CDN | IFrame API | ❌ Never | ToS compliance |
| YouTube clips / timestamps | YouTube CDN | IFrame + timestamp | ❌ Never | Deep-link to exact second |
| AI-described videos | Cloudflare Stream | HLS | Premium only | AI-generated script narrated |
| Live streams | mediasoup SFU / LiveKit | WebRTC | Premium recording | See `/09-live` |

---

## YouTube Integration

### oEmbed + IFrame API

```typescript
// src/lib/server/remote/video.ts
import { query } from '$app/server';

// Fetch YouTube metadata (title, thumbnail, duration) via YouTube Data API v3
export const getYouTubeMetadata = query(async ({ videoId }: { videoId: string }) => {
  // Check cache first
  const cached = await db.query.youtubeCache.findFirst({
    where: and(
      eq(youtubeCache.cacheKey, `meta:${videoId}`),
      sql`created_at > now() - interval '7 days'`,
    ),
  });
  if (cached) return cached.results as YouTubeVideoMeta;

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('key', process.env.YOUTUBE_API_KEY!);
  url.searchParams.set('id', videoId);
  url.searchParams.set('part', 'snippet,contentDetails,status');

  const res = await fetch(url);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) throw new Error('Video not found or not embeddable');

  // Reject non-embeddable videos
  if (!item.status.embeddable) throw new Error('This video cannot be embedded');

  const meta: YouTubeVideoMeta = {
    videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails.maxres?.url ?? item.snippet.thumbnails.high.url,
    durationISO: item.contentDetails.duration, // e.g. PT4M30S
    durationSecs: parseISO8601Duration(item.contentDetails.duration),
    description: item.snippet.description.slice(0, 300),
  };

  // Cache for 7 days
  await db.insert(youtubeCache).values({
    cacheKey: `meta:${videoId}`,
    results: meta,
  }).onConflictDoUpdate({
    target: youtubeCache.cacheKey,
    set: { results: meta, createdAt: new Date() },
  });

  return meta;
});

// Search YouTube for curriculum-relevant videos
export const searchYouTubeCurriculum = query(async ({
  courseCode, topic, limit = 8,
}: { courseCode: string; topic: string; limit?: number }) => {
  const cacheKey = `search:${courseCode}:${topic}`;

  const cached = await db.query.youtubeCache.findFirst({
    where: and(
      eq(youtubeCache.cacheKey, cacheKey),
      sql`created_at > now() - interval '24 hours'`,
    ),
  });
  if (cached) return cached.results as YouTubeSearchResult[];

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('key', process.env.YOUTUBE_API_KEY!);
  url.searchParams.set('q', `${courseCode} ${topic} lecture tutorial explanation`);
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('videoDuration', 'medium');     // 4-20 min
  url.searchParams.set('relevanceLanguage', 'en');
  url.searchParams.set('maxResults', String(limit));
  url.searchParams.set('part', 'snippet');

  const res = await fetch(url);
  const data = await res.json();

  const results: YouTubeSearchResult[] = data.items?.map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails.high.url,
    publishedAt: item.snippet.publishedAt,
  })) ?? [];

  await db.insert(youtubeCache).values({ cacheKey, results })
    .onConflictDoUpdate({ target: youtubeCache.cacheKey, set: { results, createdAt: new Date() } });

  return results;
});

function parseISO8601Duration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] ?? '0') * 3600) + (parseInt(match[2] ?? '0') * 60) + parseInt(match[3] ?? '0');
}
```

### YouTube Embed Component

```svelte
<!-- src/lib/components/video/YouTubeEmbed.svelte -->
<script lang="ts">
  let {
    videoId,
    title = 'YouTube video',
    startSeconds = 0,
    autoplay = false,
    showControls = true,
  } = $props();

  let loaded = $state(false);

  // Intersection Observer for lazy loading
  let wrapper: HTMLDivElement;
  $effect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loaded = true; },
      { rootMargin: '200px' }
    );
    if (wrapper) observer.observe(wrapper);
    return () => observer.disconnect();
  });

  const embedUrl = $derived(() => {
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      ...(startSeconds > 0 && { start: String(startSeconds) }),
      ...(autoplay && { autoplay: '1' }),
      ...(!showControls && { controls: '0' }),
    });
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
  });
</script>

<div bind:this={wrapper} class="relative aspect-video rounded-xl overflow-hidden bg-[--color-bg-overlay]">
  {#if loaded}
    <iframe
      src={embedUrl}
      {title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
      class="absolute inset-0 w-full h-full"
      loading="lazy"
    />
  {:else}
    <!-- Thumbnail placeholder with play button -->
    <button
      onclick={() => loaded = true}
      class="absolute inset-0 w-full h-full flex items-center justify-center group"
    >
      <img
        src="https://img.youtube.com/vi/{videoId}/maxresdefault.jpg"
        alt={title}
        class="absolute inset-0 w-full h-full object-cover"
        onerror={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; }}
      />
      <div class="relative size-16 rounded-full bg-red-600 flex items-center justify-center
                  scale-90 group-hover:scale-100 transition-transform duration-[--duration-normal]
                  ease-[--ease-spring] shadow-xl">
        <svg class="size-8 text-white ml-1 fill-white" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
    </button>
  {/if}
</div>
```

### Timestamp Deep-Link Component

```svelte
<!-- Renders a "Jump to 4:32 — Memory Addressing" type link -->
<script lang="ts">
  let { videoId, startSeconds, label } = $props();

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
</script>

<button
  onclick={() => {
    // Open YouTube at timestamp (new tab) — respects ToS
    window.open(`https://www.youtube.com/watch?v=${videoId}&t=${startSeconds}s`, '_blank');
  }}
  class="inline-flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600
         hover:underline transition-colors"
>
  ▶ {formatTime(startSeconds)} — {label}
</button>
```

---

## Cloudflare Stream (Own Video Uploads)

### Video Player Component (HLS)

```svelte
<!-- src/lib/components/video/VideoPlayer.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let { src, poster, title = '', autoplay = false } = $props();
  let video: HTMLVideoElement;
  let hls: any;

  onMount(async () => {
    if (src.endsWith('.m3u8')) {
      // HLS via hls.js (Cloudflare Stream always serves HLS)
      const Hls = (await import('hls.js')).default;
      if (Hls.isSupported()) {
        hls = new Hls({ startLevel: -1, autoStartLoad: true });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = src;
      }
    } else {
      video.src = src;
    }
  });

  onDestroy(() => hls?.destroy());
</script>

<video
  bind:this={video}
  {poster}
  {autoplay}
  controls
  playsinline
  class="w-full rounded-xl aspect-video bg-black"
>
  <track kind="captions" />
</video>
```

### Upload to Cloudflare Stream

```typescript
// Full TUS resumable upload flow
// src/lib/components/video/VideoUploader.svelte (simplified)

import * as tus from 'tus-js-client';

export async function uploadToStream(file: File, title: string): Promise<string> {
  // 1. Get upload URL from our server
  const { uploadUrl, streamId } = await getVideoUploadUrl({ title }).then(r => r);

  // 2. Upload via TUS (resumable)
  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      uploadUrl,
      chunkSize: 50 * 1024 * 1024, // 50MB chunks
      metadata: { filename: file.name, filetype: file.type },
      onProgress: (bytesUploaded, bytesTotal) => {
        const pct = Math.round((bytesUploaded / bytesTotal) * 100);
        // emit progress
      },
      onSuccess: resolve,
      onError: reject,
    });
    upload.start();
  });

  // 3. Poll for encoding completion
  let ready = false;
  while (!ready) {
    await new Promise(r => setTimeout(r, 3000));
    const status = await getVideoStatus({ streamId });
    ready = status.ready;
  }

  return streamId;
}
```

---

## Shorts Player

```svelte
<!-- src/routes/(app)/watch/shorts/+page.svelte -->
<script lang="ts">
  import { createInfiniteQuery } from '@tanstack/svelte-query';
  import { getShorts } from '$lib/server/remote/feed';

  let { data } = $props();
  let currentIndex = $state(0);

  const query = createInfiniteQuery({
    queryKey: ['shorts', data.user?.id],
    queryFn: ({ pageParam }) => getShorts({ userId: data.user!.id, cursor: pageParam }),
    getNextPageParam: (last) => last.at(-1)?.createdAt,
  });

  const allShorts = $derived($query.data?.pages.flatMap(p => p) ?? []);

  // Preload next short
  $effect(() => {
    if (currentIndex >= allShorts.length - 2 && $query.hasNextPage) {
      $query.fetchNextPage();
    }
  });

  // Touch/swipe handling
  let startY = 0;
  function onTouchStart(e: TouchEvent) { startY = e.touches[0].clientY; }
  function onTouchEnd(e: TouchEvent) {
    const diff = startY - e.changedTouches[0].clientY;
    if (diff > 60 && currentIndex < allShorts.length - 1) currentIndex++;
    if (diff < -60 && currentIndex > 0) currentIndex--;
  }

  // Keyboard navigation
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' && currentIndex < allShorts.length - 1) currentIndex++;
    if (e.key === 'ArrowUp' && currentIndex > 0) currentIndex--;
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="fixed inset-0 bg-black overflow-hidden" ontouchstart={onTouchStart} ontouchend={onTouchEnd}>
  {#each allShorts as short, i}
    <div
      class="absolute inset-0 transition-transform duration-300 ease-[--ease-snappy]"
      style="transform: translateY({(i - currentIndex) * 100}%)"
    >
      <!-- Only render adjacent shorts (performance) -->
      {#if Math.abs(i - currentIndex) <= 1}
        {#if short.content?.youtubeId}
          <YouTubeEmbed
            videoId={short.content.youtubeId}
            autoplay={i === currentIndex}
            showControls={false}
          />
        {:else}
          <video
            src={short.content?.videoUrl}
            autoplay={i === currentIndex}
            loop muted={i !== currentIndex}
            playsinline
            class="w-full h-full object-cover"
          />
        {/if}

        <!-- Overlay UI -->
        <div class="absolute inset-0 flex">
          <!-- Left: content info -->
          <div class="absolute bottom-0 left-0 right-14 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div class="flex items-center gap-2 mb-2">
              <img src={short.author?.avatarUrl ?? '/ai-avatar.png'} alt=""
                   class="size-8 rounded-full ring-2 ring-white/30" />
              <span class="text-white text-sm font-medium">
                {short.author?.displayName ?? 'StudyScroll AI'}
              </span>
              {#if short.aiGenerated}
                <span class="text-xs px-1.5 py-0.5 rounded-full bg-violet-500/30 text-violet-200">AI</span>
              {/if}
            </div>
            {#if short.content?.caption}
              <p class="text-white text-sm line-clamp-2">{short.content.caption}</p>
            {/if}
            {#if short.topicTags?.length}
              <p class="text-brand-300 text-xs mt-1">#{short.topicTags[0]}</p>
            {/if}
          </div>

          <!-- Right: action buttons -->
          <div class="absolute right-3 bottom-20 flex flex-col gap-5 items-center">
            <ShortActionButton icon="heart" count={short.likeCount} />
            <ShortActionButton icon="chat"  count={short.replyCount} />
            <ShortActionButton icon="share" count={short.repostCount} />
            <ShortActionButton icon="bookmark" />
          </div>
        </div>

        <!-- Progress bar (for own-platform shorts) -->
        {#if !short.content?.youtubeId}
          <div class="absolute top-0 left-0 right-0 h-0.5 bg-white/20">
            <div class="h-full bg-white transition-all" style="width: {i === currentIndex ? 100 : 0}%" />
          </div>
        {/if}
      {/if}
    </div>
  {/each}

  <!-- Navigation arrows (non-touch) -->
  {#if currentIndex > 0}
    <button onclick={() => currentIndex--}
            class="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white text-xl">
      ↑
    </button>
  {/if}
  {#if currentIndex < allShorts.length - 1}
    <button onclick={() => currentIndex++}
            class="absolute bottom-24 right-4 p-2 rounded-full bg-black/40 text-white text-xl">
      ↓
    </button>
  {/if}
</div>
```

---

## Offline Video (Premium — Own Platform Only)

```typescript
// src/lib/server/remote/downloads.ts
import { command, query } from '$app/server';
import crypto from 'crypto';

export const getDownloadToken = command(async ({ userId, postId }) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (user?.plan === 'free') {
    throw new Error('Offline downloads require a Premium subscription');
  }

  const post = await db.query.posts.findFirst({ where: eq(posts.id, postId) });
  if (!post || !['video', 'short'].includes(post.postType)) {
    throw new Error('This content is not available for download');
  }

  // YouTube content CANNOT be downloaded — ever
  if (post.content?.youtubeId) {
    throw new Error('YouTube content cannot be downloaded. Play it online.');
  }

  // Device-bound token: valid for 24 hours
  const deviceId = crypto.randomUUID(); // client should pass their stable device ID
  const token = crypto
    .createHmac('sha256', process.env.DOWNLOAD_SECRET!)
    .update(`${userId}:${postId}:${Math.floor(Date.now() / 86400000)}`)
    .digest('hex');

  // Get time-limited signed URL from R2 or Cloudflare Stream
  let downloadUrl: string;
  if (post.content?.cloudflareStreamId) {
    // Cloudflare Stream: create signed URL with 24h expiry
    downloadUrl = await getStreamSignedUrl(post.content.cloudflareStreamId);
  } else {
    downloadUrl = await storage.getSignedUrl(post.content.videoKey!, 86400);
  }

  return { downloadUrl, token, expiresAt: Date.now() + 86400000 };
});

async function getStreamSignedUrl(streamId: string): Promise<string> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream/${streamId}/token`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}` },
      body: JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 86400 }),
    }
  );
  const { result } = await res.json();
  return `https://customer-${process.env.CF_CUSTOMER_CODE}.cloudflarestream.com/${result.token}/downloads/default.mp4`;
}
```
