import { query, command, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { posts, users, userCourses } from '@lerno/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import * as v from 'valibot';

export const getVideos = query(v.object({}), async () => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const rows = await (db as any)
    .select({
      id: posts.id,
      postType: posts.postType,
      content: posts.content,
      likeCount: posts.likeCount,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      authorName: users.displayName,
      authorUsername: users.username,
      authorImage: users.avatarUrl,
      courseCode: userCourses.code,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId as any, users.id as any))
    .leftJoin(userCourses, eq(posts.courseId as any, userCourses.id as any))
    .where(and(eq(posts.postType as any, 'video'), eq(posts.isVisible as any, true)))
    .orderBy(desc(posts.createdAt as any))
    .limit(20);

  return rows.map((r: any) => ({
    ...r,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
});

export const getShorts = query(v.object({}), async () => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const rows = await (db as any)
    .select({
      id: posts.id,
      postType: posts.postType,
      content: posts.content,
      likeCount: posts.likeCount,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      authorName: users.displayName,
      authorUsername: users.username,
      authorImage: users.avatarUrl,
      courseCode: userCourses.code,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId as any, users.id as any))
    .leftJoin(userCourses, eq(posts.courseId as any, userCourses.id as any))
    .where(and(eq(posts.postType as any, 'short'), eq(posts.isVisible as any, true)))
    .orderBy(desc(posts.createdAt as any))
    .limit(20);

  return rows.map((r: any) => ({
    ...r,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
});

export const uploadVideo = command(
  v.object({
    postType: v.union([v.literal('video'), v.literal('short')]),
    title: v.string(),
    description: v.string(),
    videoUrl: v.string(),
    courseId: v.optional(v.string()),
  }),
  async ({ postType, title, description, videoUrl, courseId }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const [post] = await (db as any)
      .insert(posts)
      .values({
        authorId: userId,
        courseId: courseId ?? null,
        postType,
        content: {
          title,
          body: description,
          videoUrl,
          thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
        },
      })
      .returning({ id: posts.id });

    return post;
  }
);
