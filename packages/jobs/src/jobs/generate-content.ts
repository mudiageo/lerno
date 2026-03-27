import { db } from '@lerno/db';
import { users, userCourses, topicMastery, courseSchedule, courseMaterials, posts } from '@lerno/db/schema';
import { ai } from '@lerno/ai';
import {
  buildQuizPrompt, buildFlashcardPrompt, buildTextPostPrompt,
  buildPollPrompt, CONTENT_GENERATION_SYSTEM_PROMPT,
} from '@lerno/ai';
import { and, eq, asc, sql } from 'drizzle-orm';

const POST_TYPES_PER_TOPIC = ['quiz', 'flashcard', 'text', 'poll'] as const;
const MIN_POOL_SIZE = 50; 

export async function generateContentJob() {
  await generateContentForAllUsers();
}

export async function generateContentForAllUsers() {
  const activeUsers = await db.select({ id: users.id, plan: users.plan })
    .from(users)
    .where(sql`last_active_date > now() - interval '30 days'`);

  for (let i = 0; i < activeUsers.length; i += 10) {
    const batch = activeUsers.slice(i, i + 10);
    await Promise.allSettled(batch.map(u => generateContentForUser(u.id)));
    await sleep(2000); 
  }
}

async function generateContentForUser(userId: string) {
  const [courses, masteryRecords] = await Promise.all([
    db.select().from(userCourses).where(and(eq(userCourses.userId, userId), eq(userCourses.active, true))),
    db.select().from(topicMastery).where(eq(topicMastery.userId, userId)),
  ]);

  for (const course of courses) {
    const poolSizeResponse = await db.select({ count: sql<number>\`cast(count(*) as integer)\` }).from(posts).where(and(
      eq(posts.courseId, course.id),
      eq(posts.aiGenerated, true),
      eq(posts.isVisible, true),
      sql`created_at > now() - interval '7 days'`,
    ));

    const poolSize = poolSizeResponse[0]?.count ?? 0;

    if (poolSize >= MIN_POOL_SIZE) continue; 

    const upcoming = await db.select().from(courseSchedule)
      .where(and(eq(courseSchedule.courseId, course.id), sql`scheduled_at > now()`))
      .orderBy(asc(courseSchedule.scheduledAt)).limit(1);

    const urgency = upcoming.length > 0
      ? Math.max(0, 1 - (new Date(upcoming[0].scheduledAt).getTime() - Date.now()) / (14 * 86400000))
      : 0;

    const courseMastery = masteryRecords.filter(m => m.courseId === course.id);
    const weakTopics = courseMastery.sort((a, b) => a.score - b.score).slice(0, 5);

    const materials = await db.select({ ocrText: courseMaterials.ocrText })
      .from(courseMaterials)
      .where(and(eq(courseMaterials.courseId, course.id), eq(courseMaterials.processed, true)))
      .limit(3);
    const context = materials.map(m => m.ocrText?.slice(0, 800)).filter(Boolean).join('\n\n---\n\n');

    for (const topicRecord of weakTopics.slice(0, 3)) {
      for (const postType of POST_TYPES_PER_TOPIC) {
        try {
          const content = await generateSinglePost({
            postType, course, topic: topicRecord.topic,
            masteryScore: topicRecord.score, urgency, context,
          });

          if (!content) continue;

          const { topicTags, ...postContent } = content;
          await db.insert(posts).values({
            courseId: course.id,
            postType,
            content: postContent,
            topicTags: topicTags ?? [topicRecord.topic],
            aiGenerated: true,
            isVisible: true,
            authorId: userId,
          });

          await sleep(300);
        } catch (err) {
          console.error(`[AI] Failed ${postType} for ${course.code}/${topicRecord.topic}:`, err);
        }
      }
    }
  }
}

async function generateSinglePost({ postType, course, topic, masteryScore, urgency, context }: any) {
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
      prompt = buildTextPostPrompt({ courseCode: course.code, courseTitle: course.title, topic, masteryScore, urgencyLevel: urgency, context });
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
