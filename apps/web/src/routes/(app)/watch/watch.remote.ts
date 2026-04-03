import { query, command, form, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { posts, users, userCourses } from '@lerno/db/schema';
import { eq, desc, and } from '@lerno/db/drizzle';
import * as v from 'valibot';
import { storage } from '@lerno/storage';
import { redirect } from '@sveltejs/kit';

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

export const uploadVideo = form(
  v.object({
    postType: v.union([v.literal('video'), v.literal('short')]),
    title: v.string(),
    description: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    mediaContent: v.optional(v.file()), // Accepts the multipart File object
    courseId: v.optional(v.string()),
  }),
  async ({ postType, title, description, videoUrl, mediaContent, courseId }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    let finalUrl = videoUrl;

    // Handle Native File Upload
    if (mediaContent && mediaContent instanceof Blob && mediaContent.size > 0) {
      const buffer = Buffer.from(await mediaContent.arrayBuffer());
      const format = mediaContent.type || 'video/mp4';
      const key = `videos/${crypto.randomUUID()}.${format.split('/')[1] || 'mp4'}`;
      finalUrl = await storage.upload(key, buffer, format);
    }

    if (!finalUrl) {
      throw new Error("You must provide either a URL or upload a video file.");
    }

    const [post] = await (db as any)
      .insert(posts)
      .values({
        authorId: userId,
        courseId: courseId ?? null,
        postType,
        content: {
          title,
          body: description ?? '',
          videoUrl: finalUrl,
          thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
        },
      })
      .returning({ id: posts.id });

    // The remote form function runs as an action, so we must redirect manually
    if (postType === 'short') {
      redirect(303, '/watch/shorts');
    } else {
      redirect(303, '/watch');
    }
  }
);
