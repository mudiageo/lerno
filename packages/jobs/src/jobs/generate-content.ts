import { db } from '@lerno/db';
import {
  ai,
  buildQuizPrompt, buildFlashcardPrompt, buildTextPostPrompt,
  buildPollPrompt, CONTENT_GENERATION_SYSTEM_PROMPT,
  BananaOrchestrator
} from '@lerno/ai';
import { and, eq, sql } from '@lerno/db/drizzle';
import { postTypeEnum, users, userCourses, topicMastery, courseMaterials, posts, courseSchedule } from '@lerno/db/schema';

const POST_TYPES_PER_TOPIC = ['quiz', 'flashcard', 'text', 'poll', 'short'] as const;
const MIN_CONTENT_POOL_SIZE = 50;
const MIN_VIDEO_POOL_SIZE = 10;

/**
 * Job: Standard Content Generation (Quiz, Flashcard, text, Poll)
 */
export async function generateContentJob() {
  const activeUsers = await getActiveUsers();
  for (let i = 0; i < activeUsers.length; i += 10) {
    const batch = activeUsers.slice(i, i + 10);
    await Promise.allSettled(batch.map(u => generateStandardContentForUser(u.id)));
    await sleep(2000);
  }
}

/**
 * Job: Video (Shorts) Generation
 */
export async function generateVideosJob() {
  const activeUsers = await getActiveUsers();
  for (let i = 0; i < activeUsers.length; i += 5) { // Slower batch processing for high-compute video jobs
    const batch = activeUsers.slice(i, i + 5);
    await Promise.allSettled(batch.map(u => generateVideosForUser(u.id)));
    await sleep(5000); // More spacing for video jobs
  }
}

async function getActiveUsers() {
  return db.select({ id: users.id, plan: users.plan })
    .from(users)
    .where(sql`last_active_date > now() - interval '30 days'`);
}

/**
 * Logic for standard content items.
 */
async function generateStandardContentForUser(userId: string) {
  const { courses, masteryRecords, context } = await getUserDataContext(userId);

  for (const course of courses) {
    const poolSize = await getRecentPoolSize(course.id, POST_TYPES_PER_TOPIC);
    if (poolSize >= MIN_CONTENT_POOL_SIZE) continue;

    const weakTopics = masteryRecords.filter(m => m.courseId === course.id)
      .sort((a, b) => a.score - b.score).slice(0, 3);

    for (const topicRecord of weakTopics) {
      for (const postType of POST_TYPES_PER_TOPIC) {
        try {
          const urgency = await getUrgency(course.id);
          const content = await generateSinglePost({
            postType, course, topic: topicRecord.topic,
            masteryScore: topicRecord.score, context, urgency
          });

          if (!content) continue;
          await insertAIPost(userId, course.id, postType, content, [topicRecord.topic]);
          await sleep(300);
        } catch (err) {
          console.error(`[AI-Content] Failed ${postType} for ${course.code}/${topicRecord.topic}:`, err);
        }
      }
    }
  }
}

/**
 * Logic for automated educational shorts.
 */
async function generateVideosForUser(userId: string) {
  const { courses, masteryRecords, context } = await getUserDataContext(userId);

  for (const course of courses) {
    const poolSize = await getRecentPoolSize(course.id, ['short']);
    if (poolSize >= MIN_VIDEO_POOL_SIZE) continue;

    const weakTopics = masteryRecords.filter(m => m.courseId === course.id)
      .sort((a, b) => a.score - b.score).slice(0, 2);

    for (const topicRecord of weakTopics) {
      try {
        const orchestrator = new BananaOrchestrator();
        const strategy = (process.env.AI_VIDEO_STRATEGY as 'single' | 'step') || 'step';

        console.log(`[AI-Video] Job: Generating short for ${topicRecord.topic} (${course.code})...`);

        const result = await orchestrator.generateFullVideo(
          `Educational short video about ${topicRecord.topic} in the context of ${course.title} (${course.code}). 
           Focus on high engagement, cinematic visuals, and a clear educational takeaway.
           Context: ${context.slice(0, 500)}`,
          { mode: strategy }
        );

        const content = {
          body: result.description || `Learning about ${topicRecord.topic}! 🎥 #Education #Study`,
          url: result.url,
          scenes: result.scenes,
          title: result.title,
        };

        await insertAIPost(userId, course.id, 'short', content, [topicRecord.topic, 'Shorts', course.code]);
        console.log(`[AI-Video] Successfully created short: ${result.title}`);
      } catch (err) {
        console.error(`[AI-Video] Failed video generation for ${course.code}/${topicRecord.topic}:`, err);
      }
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUserDataContext(userId: string) {
  const [courses, masteryRecords, materials] = await Promise.all([
    db.select().from(userCourses).where(and(eq(userCourses.userId, userId), eq(userCourses.active, true))),
    db.select().from(topicMastery).where(eq(topicMastery.userId, userId)),
    db.select({ ocrText: courseMaterials.ocrText }).from(courseMaterials).where(eq(courseMaterials.processed, true)).limit(3)
  ]);

  const context = materials.map(m => m.ocrText?.slice(0, 800)).filter(Boolean).join('\n\n---\n\n');
  return { courses, masteryRecords, context };
}

async function getRecentPoolSize(courseId: string, types: readonly string[]) {
  const res = await db.select({ count: sql<number>`cast(count(*) as integer)` })
    .from(posts)
    .where(and(
      eq(posts.courseId, courseId),
      eq(posts.aiGenerated, true),
      eq(posts.isVisible, true),
      sql`created_at > now() - interval '7 days'`,
      sql`post_type IN ${types}`
    ));
  return res[0]?.count ?? 0;
}

async function insertAIPost(userId: string, courseId: string, postType: string, content: any, topicTags: string[]) {
  const { topicTags: _, ...postContent } = content;
  await db.insert(posts).values({
    courseId: courseId,
    postType: postType as (typeof postTypeEnum.enumValues)[number],
    content: postContent,
    topicTags,
    aiGenerated: true,
    isVisible: true,
    authorId: userId,
  });
}

async function getUrgency(courseId: string) {
  const upcoming = await db.select().from(courseSchedule)
    .where(and(eq(courseSchedule.courseId, courseId), sql`scheduled_at > now()`))
    .orderBy(sql`scheduled_at ASC`).limit(1);

  return upcoming.length > 0
    ? Math.max(0, 1 - (new Date(upcoming[0].scheduledAt).getTime() - Date.now()) / (14 * 86400000))
    : 0;
}

async function generateSinglePost({ postType, course, topic, masteryScore, context, urgency }: any) {
  let prompt: string;
  switch (postType) {
    case 'quiz':
      prompt = buildQuizPrompt({ courseCode: course.code, courseTitle: course.title, topic, masteryScore, context });
      break;
    case 'flashcard':
      prompt = buildFlashcardPrompt({ courseCode: course.code, topic, context });
      break;
    case 'poll':
      prompt = buildPollPrompt({ courseCode: course.code, topic });
      break;
    default:
      prompt = buildTextPostPrompt({ courseCode: course.code, courseTitle: course.title, topic, masteryScore, context, urgencyLevel: urgency });
  }

  const raw = await ai.generate({
    messages: [{ role: 'user', content: prompt }],
    systemPrompt: CONTENT_GENERATION_SYSTEM_PROMPT,
    maxTokens: 512,
    jsonMode: true,
    temperature: 0.8,
  });

  return JSON.parse(raw);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
