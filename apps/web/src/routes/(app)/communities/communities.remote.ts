import { query, command, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { communities, communityMembers, posts, users } from '@lerno/db/schema';
import { eq, and, desc, sql, ilike, or } from '@lerno/db/drizzle';
import * as v from 'valibot';

export const getCommunities = query(
  v.object({
    search: v.optional(v.string()),
    courseCode: v.optional(v.string()),
    filter: v.optional(v.picklist(['all', 'joined', 'discover'])),
  }),
  async ({ search, courseCode, filter }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const rows = await db
      .select({
        id: communities.id,
        name: communities.name,
        slug: communities.slug,
        description: communities.description,
        memberCount: communities.memberCount,
        courseCode: communities.courseCode,
        isPrivate: communities.isPrivate,
        avatarUrl: communities.avatarUrl,
        bannerUrl: communities.bannerUrl,
        createdAt: communities.createdAt,
      })
      .from(communities)
      .where(
        and(
          courseCode ? eq(communities.courseCode, courseCode) : undefined,
          search
            ? or(
                ilike(communities.name, `%${search}%`),
                ilike(communities.description, `%${search}%`)
              )
            : undefined
        )
      )
      .orderBy(desc(communities.memberCount))
      .limit(60);

    // Fetch which ones the user has joined
    const memberships = await db
      .select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));

    const joinedSet = new Set(memberships.map((m) => m.communityId));

    const withJoined = rows.map((c) => ({
      ...c,
      joined: joinedSet.has(c.id),
      createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
    }));

    if (filter === 'joined') return withJoined.filter((c) => c.joined);
    if (filter === 'discover') return withJoined.filter((c) => !c.joined);
    return withJoined;
  }
);

export const getCommunity = query(v.object({ slug: v.string() }), async ({ slug }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;

  const [row] = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1);

  if (!row) throw new Error('Community not found');

  let joined = false;
  if (userId) {
    const [membership] = await db
      .select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, row.id), eq(communityMembers.userId, userId)))
      .limit(1);
    joined = !!membership;
  }

  return { ...row, joined, createdAt: row.createdAt?.toISOString() ?? new Date().toISOString() };
});

export const getCommunityPosts = query(
  v.object({ communityId: v.string(), cursor: v.optional(v.string()) }),
  async ({ communityId, cursor }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;

    const rows = await db
      .select({
        id: posts.id,
        postType: posts.postType,
        content: posts.content,
        likeCount: posts.likeCount,
        replyCount: posts.replyCount,
        repostCount: posts.repostCount,
        viewCount: posts.viewCount,
        topicTags: posts.topicTags,
        aiGenerated: posts.aiGenerated,
        createdAt: posts.createdAt,
        authorId: posts.authorId,
        author: {
          id: users.id,
          name: users.displayName,
          username: users.username,
          image: users.avatarUrl,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(
        and(
          eq(posts.communityId, communityId),
          eq(posts.isVisible, true),
          cursor ? sql`${posts.createdAt} < ${new Date(cursor)}` : undefined
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(20);

    return rows.map((p) => ({
      ...p,
      createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
  }
);

export const createCommunity = command(
  v.object({
    name: v.string(),
    description: v.optional(v.string()),
    courseCode: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
  }),
  async ({ name, description, courseCode, isPrivate }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);

    const [community] = await db
      .insert(communities)
      .values({
        name,
        description,
        courseCode,
        isPrivate: isPrivate ?? false,
        slug: `${slug}-${Date.now().toString(36)}`,
        memberCount: 1,
        createdBy: userId,
      })
      .returning();

    // Auto-join the creator as admin
    await db.insert(communityMembers).values({
      communityId: community.id,
      userId,
      role: 'admin',
    });

    return { id: community.id, slug: community.slug };
  }
);

export const joinCommunity = command(
  v.object({ communityId: v.string() }),
  async ({ communityId }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    await db
      .insert(communityMembers)
      .values({ communityId, userId, role: 'member' })
      .onConflictDoNothing();

    await db
      .update(communities)
      .set({ memberCount: sql`${communities.memberCount} + 1` })
      .where(eq(communities.id, communityId));
  }
);

export const leaveCommunity = command(
  v.object({ communityId: v.string() }),
  async ({ communityId }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    await db
      .delete(communityMembers)
      .where(
        and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId))
      );

    await db
      .update(communities)
      .set({ memberCount: sql`GREATEST(0, ${communities.memberCount} - 1)` })
      .where(eq(communities.id, communityId));
  }
);
