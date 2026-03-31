# Video Strategy — Hybrid Approach

## Priority: Embed-First, No Server Downloads

StudyScroll never downloads YouTube or external video to its own servers. This is both legally correct (YouTube ToS compliance) and technically simpler. Own-platform video (student/tutor uploads) is stored on Cloudflare Stream for adaptive bitrate playback.

---

## Three Video Sources

| Source | Method | Download to Server | Premium Offline |
|---|---|---|---|
| YouTube | IFrame embed (privacy-enhanced) | ❌ Never | ❌ Not permitted |
| Other platforms (Vimeo, etc.) | oEmbed | ❌ Never | ❌ Not permitted |
| Own platform uploads | Cloudflare Stream | ✅ Stored on Stream | ✅ Signed URL download |

---

## YouTube Clips / Timestamps

Instead of downloading clips, we use deep-link timestamps to let students jump to the exact part of a YouTube video relevant to their topic.

```typescript
// Link to a specific timestamp in a YouTube video
function buildYouTubeTimestampUrl(videoId: string, startSeconds: number) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?start=${startSeconds}&autoplay=1`;
}

// When AI processes a YouTube video for a course, it extracts topic timestamps:
interface YouTubeTopicTimestamp {
  videoId: string;
  title: string;
  topic: string;
  startSeconds: number;
  endSeconds: number;
  thumbnailUrl: string;
}
```

---

## Shorts Player

Vertical, swipeable shorts player — similar to TikTok/YouTube Shorts.

```svelte
<!-- src/lib/components/video/ShortsPlayer.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  let { shorts } = $props();
  let currentIndex = $state(0);
  let container: HTMLDivElement;
  
  let startY = 0;
  
  function handleTouchStart(e: TouchEvent) {
    startY = e.touches[0].clientY;
  }
  
  function handleTouchEnd(e: TouchEvent) {
    const diff = startY - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < shorts.length - 1) currentIndex++;
      if (diff < 0 && currentIndex > 0) currentIndex--;
    }
  }
</script>

<div
  bind:this={container}
  class="relative h-screen overflow-hidden bg-black"
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
>
  {#each shorts as short, i}
    <div
      class="absolute inset-0 transition-transform duration-300 ease-[--ease-snappy]"
      style="transform: translateY({(i - currentIndex) * 100}%)"
    >
      {#if short.youtubeId}
        <iframe
          src="https://www.youtube-nocookie.com/embed/{short.youtubeId}?autoplay={i === currentIndex ? 1 : 0}&loop=1&controls=0"
          class="w-full h-full"
          allow="autoplay"
        />
      {:else}
        <video
          src={short.videoUrl}
          autoplay={i === currentIndex}
          loop
          playsinline
          class="w-full h-full object-cover"
        />
      {/if}
      <!-- Overlay: topic tag, course, caption -->
      <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80">
        <span class="text-xs text-brand-300">#{short.topicTags?.[0]}</span>
        <p class="text-white text-sm mt-1">{short.content?.caption}</p>
      </div>
    </div>
  {/each}
</div>
```

---

# Gamification — XP, Streaks, Leaderboards & Badges

## XP System

```typescript
// XP values per action
const XP_TABLE = {
  daily_login:       5,
  quiz_correct:      10,
  quiz_incorrect:    2,     // still reward for trying
  flashcard_knew:    5,
  flashcard_new:     3,
  post_created:      15,
  video_watched:     8,     // per video, once per day per video
  streak_day:        20,    // bonus per day in streak
  streak_7:          50,    // streak milestone bonus
  streak_30:         200,
  first_post:        50,    // one-time achievement
  first_quiz:        25,
  mock_exam_complete: 30,
  community_post:    10,
  helpful_reply:     15,    // reply with 5+ likes
};

// Level thresholds (XP required to reach level)
const LEVELS = [
  { level: 1,  xp: 0,     title: 'Freshman' },
  { level: 2,  xp: 100,   title: 'Scholar' },
  { level: 3,  xp: 300,   title: 'Analyst' },
  { level: 4,  xp: 600,   title: 'Researcher' },
  { level: 5,  xp: 1000,  title: 'Expert' },
  { level: 6,  xp: 1500,  title: 'Dean\'s List' },
  { level: 7,  xp: 2500,  title: 'Honours' },
  { level: 8,  xp: 4000,  title: 'First Class' },
  { level: 9,  xp: 6000,  title: 'Valedictorian' },
  { level: 10, xp: 10000, title: 'Legend' },
];
```

## Streak System

```typescript
// Called on each daily login
export const recordDailyLogin = command(async ({ userId }) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const lastActive = user?.lastActiveDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  let newStreak = 1;
  
  if (lastActive) {
    const lastDate = new Date(lastActive);
    lastDate.setHours(0, 0, 0, 0);
    
    if (lastDate.getTime() === yesterday.getTime()) {
      // Consecutive day — extend streak
      newStreak = (user?.streakDays ?? 0) + 1;
    } else if (lastDate.getTime() === today.getTime()) {
      // Already logged in today
      return { streak: user?.streakDays ?? 1, xpAwarded: 0 };
    }
    // else: streak broken, reset to 1
  }
  
  // Award XP
  let xp = XP_TABLE.daily_login + (newStreak > 1 ? XP_TABLE.streak_day : 0);
  if (newStreak === 7)  xp += XP_TABLE.streak_7;
  if (newStreak === 30) xp += XP_TABLE.streak_30;
  
  await db.update(users).set({
    streakDays: newStreak,
    lastActiveDate: new Date(),
    xp: sql`xp + ${xp}`,
  }).where(eq(users.id, userId));
  
  // Check for streak milestones → achievement
  if ([7, 30, 100].includes(newStreak)) {
    await db.insert(achievements).values({
      userId,
      badge: `streak_${newStreak}`,
    }).onConflictDoNothing();
  }
  
  return { streak: newStreak, xpAwarded: xp };
});
```

## Leaderboard

```typescript
// apps/web/src/lib/server/remote/leaderboard.ts

export const getLeaderboard = query(async ({ scope, userId, courseId }) => {
  // scope: 'global' | 'course' | 'institution' | 'friends'
  
  let baseQuery = db.select({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    avatarUrl: users.avatarUrl,
    xp: users.xp,
    streakDays: users.streakDays,
    level: sql<number>`(
      SELECT level FROM (VALUES
        (1,0),(2,100),(3,300),(4,600),(5,1000),(6,1500),(7,2500),(8,4000),(9,6000),(10,10000)
      ) AS l(level, threshold)
      WHERE threshold <= ${users.xp}
      ORDER BY threshold DESC
      LIMIT 1
    )`,
  }).from(users);
  
  if (scope === 'course' && courseId) {
    // Users enrolled in the same course
    baseQuery = baseQuery
      .innerJoin(userCourses, and(
        eq(userCourses.userId, users.id),
        eq(userCourses.code, sql`(SELECT code FROM user_courses WHERE id = ${courseId})`),
      ));
  }
  
  if (scope === 'friends') {
    const friendIds = await db.select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    baseQuery = baseQuery.where(
      inArray(users.id, [...friendIds.map(f => f.followingId), userId])
    );
  }
  
  const results = await baseQuery
    .orderBy(desc(users.xp))
    .limit(50);
  
  const userRank = results.findIndex(r => r.id === userId) + 1;
  
  return { leaderboard: results, userRank };
});
```

## Achievement Badges

```typescript
const BADGES = {
  // Streak badges
  streak_7:         { name: 'Week Warrior',       icon: '🔥', description: '7-day study streak' },
  streak_30:        { name: 'Monthly Master',      icon: '⚡', description: '30-day study streak' },
  streak_100:       { name: 'Century Scholar',     icon: '💎', description: '100-day study streak' },
  
  // Engagement badges
  first_post:       { name: 'First Post',          icon: '✍️', description: 'Created your first post' },
  post_100:         { name: 'Content Creator',     icon: '🎬', description: '100 posts created' },
  first_quiz:       { name: 'Quiz Taker',          icon: '🧠', description: 'Answered your first quiz' },
  quiz_master:      { name: 'Quiz Master',         icon: '🏆', description: '500 correct quiz answers' },
  flashcard_100:    { name: 'Card Shark',          icon: '🃏', description: '100 flashcards reviewed' },
  
  // Mastery badges
  topic_expert:     { name: 'Topic Expert',        icon: '🎓', description: 'Mastery score 90+ on a topic' },
  course_complete:  { name: 'Course Ace',          icon: '📚', description: '80+ mastery across a whole course' },
  
  // Social badges
  top_poster:       { name: 'Top Poster',          icon: '⭐', description: 'Ranked #1 in course leaderboard' },
  community_hero:   { name: 'Community Hero',      icon: '🦸', description: '50 helpful replies' },
  
  // Special
  early_bird:       { name: 'Early Bird',          icon: '🌅', description: 'Studied before 7am 10 times' },
  night_owl:        { name: 'Night Owl',           icon: '🦉', description: 'Studied after midnight 10 times' },
  exam_ace:         { name: 'Exam Ace',            icon: '🏅', description: 'Completed a full mock exam' },
};
```

## XP Float Animation (UI)

```svelte
<!-- Shows "+10 XP" floating up after correct quiz answer -->
<script>
  let { xp, visible } = $props();
</script>

{#if visible}
  <div
    class="fixed pointer-events-none font-bold text-[--color-xp-gold] text-lg"
    style="animation: xp-float 1.5s ease-out forwards"
  >
    +{xp} XP
  </div>
{/if}

<style>
  @keyframes xp-float {
    0%   { opacity: 1; transform: translateY(0) scale(1); }
    20%  { transform: translateY(-10px) scale(1.2); }
    100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
  }
</style>
```
