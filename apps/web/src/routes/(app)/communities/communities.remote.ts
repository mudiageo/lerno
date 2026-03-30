import { query, command, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { communities, posts, interactions, userCourses } from '@lerno/db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import * as v from 'valibot';

export const getCommunities = query(
  v.object({
    search: v.optional(v.string()),
    courseCode: v.optional(v.string()),
  }),
  async ({ search, courseCode }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const rows = await (db as any)
      .select({
        id: communities.id,
        name: communities.name,
        slug: communities.slug,
        description: communities.description,
        memberCount: communities.memberCount,
        courseCode: communities.courseCode,
        isPrivate: communities.isPrivate,
      })
      .from(communities)
      .where(
        and(
          courseCode ? eq(communities.courseCode as any, courseCode) : undefined,
          search ? sql`${communities.name} ILIKE ${`%${search}%`}` : undefined,
        ),
      )
      .orderBy(desc(communities.memberCount as any))
      .limit(50);

    return rows;
  },
);

export const getCommunity = query(v.object({ id: v.string() }), async ({ id }) => {
  const [row] = await (db as any)
    .select()
    .from(communities)
    .where(eq(communities.slug as any, id))
    .limit(1);

  if (!row) throw new Error('Community not found');
  return row;
});

export const getCommunityPosts = query(
  v.object({ communityId: v.string() }),
  async ({ communityId }) => {
    const rows = await (db as any)
      .select({
        id: posts.id,
        postType: posts.postType,
        content: posts.content,
        likeCount: posts.likeCount,
        replyCount: posts.replyCount,
        repostCount: posts.repostCount,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(eq(posts.communityId as any, communityId))
      .orderBy(desc(posts.createdAt as any))
      .limit(20);

    return rows.map((p: any) => ({
      ...p,
      createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
  },
);
