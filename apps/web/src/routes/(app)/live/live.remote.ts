import { query, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { streams, users, userCourses } from '@lerno/db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import * as v from 'valibot';

export const getStreams = query(
  v.object({ 
    courseId: v.optional(v.string()),
    status: v.optional(v.enum(['live', 'scheduled', 'ended']))
  }),
  async ({ courseId, status }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const activeStreams = await (db as any)
      .select({
        id: streams.id,
        title: streams.title,
        hostName: users.displayName,
        hostUsername: users.username,
        avatarUrl: users.avatarUrl,
        viewers: streams.viewerCount,
        courseCode: userCourses.code,
        status: streams.status,
        scheduledAt: streams.scheduledAt,
        isAudioOnly: streams.isAudioOnly,
      })
      .from(streams)
      .leftJoin(users, eq(streams.hostId as any, users.id as any))
      .leftJoin(userCourses, eq(streams.courseId as any, userCourses.id as any))
      .where(
        and(
          status ? eq(streams.status as any, status) : or(eq(streams.status as any, 'live'), eq(streams.status as any, 'scheduled')),
          courseId ? eq(streams.courseId as any, courseId) : undefined
        )
      )
      .orderBy(desc(streams.status as any), desc(streams.viewerCount as any))
      .limit(20);

    return activeStreams.map((s: any) => ({
      ...s,
      scheduledAt: s.scheduledAt?.toISOString() ?? null,
      viewerCount: s.viewers ?? 0,
    }));
  }
);

export const createStream = query(
  v.object({ 
    title: v.string(), 
    isAudioOnly: v.boolean(),
    courseId: v.optional(v.string())
  }),
  async ({ title, isAudioOnly, courseId }) => {
    return { success: true };
  }
);
