import { query, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { posts, users, userCourses, topicMastery } from '@lerno/db/schema';
import { eq, and, desc, sql, lte, isNull, or } from 'drizzle-orm';
import * as v from 'valibot';

export const getStudyDeck = query(
  v.object({ courseId: v.optional(v.string()) }),
  async ({ courseId }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const now = new Date();
    const dueTopics = await (db as any)
      .select({ topic: topicMastery.topic, courseId: topicMastery.courseId })
      .from(topicMastery)
      .where(
        and(
          eq(topicMastery.userId as any, userId),
          courseId ? eq(topicMastery.courseId as any, courseId) : undefined,
          or(lte(topicMastery.fsrsDue as any, now), isNull(topicMastery.fsrsDue as any)),
        )
      )
      .limit(30);

    const flashcards = await (db as any)
      .select({
        id: posts.id,
        postType: posts.postType,
        content: posts.content,
        topicTags: posts.topicTags,
        courseId: posts.courseId,
        createdAt: posts.createdAt,
        authorName: users.displayName,
        authorUsername: users.username,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId as any, users.id as any))
      .where(
        and(
          eq(posts.postType as any, 'flashcard'),
          eq(posts.isVisible as any, true),
          courseId ? eq(posts.courseId as any, courseId) : undefined,
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(20);

    return flashcards.map((c: any) => ({
      ...c,
      createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
  }
);

export const getQuizSession = query(
  v.object({ courseId: v.optional(v.string()) }),
  async ({ courseId }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const quizPosts = await (db as any)
      .select({
        id: posts.id,
        content: posts.content,
        topicTags: posts.topicTags,
        courseCode: userCourses.code,
        createdAt: posts.createdAt,
        authorName: users.displayName,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId as any, users.id as any))
      .leftJoin(userCourses, eq(posts.courseId as any, userCourses.id as any))
      .where(
        and(
          eq(posts.postType as any, 'quiz'),
          eq(posts.isVisible as any, true),
          courseId ? eq(posts.courseId as any, courseId) : undefined,
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(10);

    return quizPosts.map((q: any) => ({
      ...q,
      createdAt: q.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
  }
);
