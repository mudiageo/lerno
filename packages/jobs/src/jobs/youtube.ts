import { db } from '@lerno/db';
import { users, userCourses, posts, youtubeCache } from '@lerno/db/schema';
import { ai } from '@lerno/ai';
import { eq, sql, and } from '@lerno/db/drizzle';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const YOUTUBE_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  durationSecs?: number;
  topicTimestamps?: Array<{ topic: string; startSecs: number }>;
}

// ─── Main job entry point ─────────────────────────────────────────────────────

export async function fetchYouTubeVideosJob() {
  console.log('[YouTube] Starting YouTube fetch job');

  // Get all unique course codes from active users
  const courseCodes = await db
    .selectDistinct({ code: userCourses.code, title: userCourses.title })
    .from(userCourses)
    .where(eq(userCourses.active, true));

  console.log(`[YouTube] Fetching for ${courseCodes.length} courses`);

  for (const course of courseCodes) {
    try {
      await fetchAndCacheForCourse(course.code, course.title ?? '');
      await sleep(500); // Rate limiting between courses
    } catch (err) {
      console.error(`[YouTube] Failed for ${course.code}:`, err);
    }
  }

  console.log('[YouTube] Job complete');
}

// ─── Per-course fetch ─────────────────────────────────────────────────────────

async function fetchAndCacheForCourse(courseCode: string, courseTitle: string) {
  const cacheKey = `yt:${courseCode}:${new Date().toISOString().slice(0, 10)}`;

  // Check if already fetched today
  const existing = await db
    .select({ id: youtubeCache.id })
    .from(youtubeCache)
    .where(eq(youtubeCache.cacheKey, cacheKey))
    .limit(1);

  if (existing.length > 0) {
    console.log(`[YouTube] Cache hit for ${courseCode}, skipping`);
    return;
  }

  const queries = [
    `${courseCode} ${courseTitle} lecture tutorial`,
    `${courseCode} ${courseTitle} explained`,
    `${courseTitle} past questions solutions`,
  ];

  const allVideos: YouTubeVideo[] = [];

  for (const query of queries) {
    const videos = await searchYouTube(query, 10);
    allVideos.push(...videos);
    await sleep(200);
  }

  // Deduplicate by videoId
  const unique = Array.from(new Map(allVideos.map((v) => [v.videoId, v])).values());

  // Generate topic timestamps using AI for the first 5 videos
  const withTimestamps = await Promise.allSettled(
    unique.slice(0, 5).map((v) => addTopicTimestamps(v, courseCode, courseTitle)),
  );
  const enriched = withTimestamps.map((r, i) =>
    r.status === 'fulfilled' ? r.value : unique[i],
  );
  const rest = unique.slice(5);

  const results = [...enriched, ...rest].slice(0, 30); // cap at 30 per course per day

  // Upsert into youtube_cache
  await db
    .insert(youtubeCache)
    .values({ cacheKey, results })
    .onConflictDoUpdate({ target: youtubeCache.cacheKey, set: { results, createdAt: new Date() } });

  // Create video posts for active users' feeds from this course
  await insertVideoPostsForCourse(courseCode, results);

  console.log(`[YouTube] Cached ${results.length} videos for ${courseCode}`);
}

// ─── YouTube Search API ───────────────────────────────────────────────────────

async function searchYouTube(query: string, maxResults = 10): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTube] No API key set — skipping');
    return [];
  }

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoDuration: 'medium', // 4–20 min
    maxResults: String(maxResults),
    safeSearch: 'strict',
    relevanceLanguage: 'en',
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${YOUTUBE_BASE}/search?${params}`);
  if (!res.ok) {
    console.error(`[YouTube] Search error: ${res.status} ${await res.text()}`);
    return [];
  }

  const data = (await res.json()) as any;
  const items: YouTubeVideo[] = [];

  for (const item of data.items ?? []) {
    const videoId = item.id?.videoId;
    if (!videoId) continue;

    // Fetch duration separately
    let durationSecs: number | undefined;
    try {
      durationSecs = await getVideoDuration(videoId);
    } catch { }

    items.push({
      videoId,
      title: item.snippet?.title ?? '',
      description: item.snippet?.description ?? '',
      thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.default?.url ?? '',
      channelTitle: item.snippet?.channelTitle ?? '',
      publishedAt: item.snippet?.publishedAt ?? new Date().toISOString(),
      durationSecs,
    });
  }

  return items;
}

async function getVideoDuration(videoId: string): Promise<number | undefined> {
  const params = new URLSearchParams({
    part: 'contentDetails',
    id: videoId,
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${YOUTUBE_BASE}/videos?${params}`);
  if (!res.ok) return undefined;

  const data = (await res.json()) as any;
  const iso = data.items?.[0]?.contentDetails?.duration;
  if (!iso) return undefined;

  // Parse ISO 8601 duration: PT1H2M3S
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;

  return (parseInt(match[1] ?? '0') * 3600) +
    (parseInt(match[2] ?? '0') * 60) +
    (parseInt(match[3] ?? '0'));
}

// ─── AI Timestamp generation ──────────────────────────────────────────────────

async function addTopicTimestamps(
  video: YouTubeVideo,
  courseCode: string,
  courseTitle: string,
): Promise<YouTubeVideo> {
  const prompt = `Given this YouTube video about ${courseCode} (${courseTitle}):
Title: "${video.title}"
Description: "${video.description.slice(0, 500)}"
Duration: ${video.durationSecs ? `${Math.round(video.durationSecs / 60)} minutes` : 'unknown'}

Extract or estimate topic timestamps. Return JSON array:
[{"topic": "Introduction to...", "startSecs": 0}, {"topic": "...", "startSecs": 120}]
Only return the JSON array, no other text. Max 8 timestamps.`;

  try {
    const raw = await ai.generate({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 300,
      jsonMode: true,
      temperature: 0.3,
    });

    const timestamps = JSON.parse(raw);
    if (Array.isArray(timestamps)) {
      return { ...video, topicTimestamps: timestamps };
    }
  } catch {
    // If AI fails, return video without timestamps
  }

  return video;
}

// ─── Insert as feed posts ─────────────────────────────────────────────────────

async function insertVideoPostsForCourse(courseCode: string, videos: YouTubeVideo[]) {
  // Get all courses matching this code
  const courses = await db
    .select({ id: userCourses.id, userId: userCourses.userId })
    .from(userCourses)
    .where(and(eq(userCourses.code, courseCode), eq(userCourses.active, true)));

  if (courses.length === 0) return;

  // Use the first user's course as the template (or pick any)
  const course = courses[0];

  // Insert one set of video posts per batch (visible to all who share the courseCode via the feed algorithm)
  for (const video of videos.slice(0, 10)) {
    // Check if already posted for this videoId
    const existing = await db
      .select({ id: posts.id })
      .from(posts)
      .where(
        and(
          eq(posts.postType, 'video' as any),
          sql`${posts.content}->>'videoId' = ${video.videoId}`,
        ),
      )
      .limit(1);

    if (existing.length > 0) continue;

    await db.insert(posts).values({
      postType: 'video',
      courseId: course.id,
      authorId: course.userId, // attribute to a course owner; will be aiGenerated = true
      aiGenerated: true,
      isVisible: true,
      topicTags: [courseCode],
      content: {
        videoId: video.videoId,
        title: video.title,
        description: video.description.slice(0, 200),
        thumbnailUrl: video.thumbnailUrl,
        channelTitle: video.channelTitle,
        videoUrl: `https://www.youtube-nocookie.com/embed/${video.videoId}`,
        durationSecs: video.durationSecs,
        topicTimestamps: video.topicTimestamps ?? [],
        source: 'youtube',
      },
    });
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
