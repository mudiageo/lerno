import { query, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { users, posts, communities } from '@lerno/db/schema';
import { sql, ilike, or, eq, desc } from 'drizzle-orm';
import * as v from 'valibot';

const SearchInput = v.object({
  q: v.string(),
  tab: v.optional(v.picklist(['posts', 'people', 'communities'])),
});

export const searchAll = query(SearchInput, async ({ q, tab = 'posts' }) => {
  if (!q || q.trim().length < 2) return { posts: [], people: [], communities: [] };
  const term = q.trim();

  if (tab === 'posts') {
    const rows = await (db as any)
      .select({
        id: posts.id,
        postType: posts.postType,
        content: posts.content,
        likeCount: posts.likeCount,
        createdAt: posts.createdAt,
        authorId: posts.authorId,
        authorName: users.displayName,
        authorUsername: users.username,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId as any, users.id as any))
      .where(
        sql`to_tsvector('english', coalesce(${posts.content}->>'body', '')) @@ plainto_tsquery('english', ${term})`
      )
      .orderBy(desc(posts.createdAt as any))
      .limit(20);

    return {
      posts: rows.map((p: any) => ({ ...p, createdAt: p.createdAt?.toISOString() ?? '' })),
      people: [],
      communities: [],
    };
  }

  if (tab === 'people') {
    const rows = await (db as any)
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        bio: users.bio,
        avatarUrl: users.avatarUrl,
        xp: users.xp,
      })
      .from(users)
      .where(
        or(ilike(users.username as any, `%${term}%`), ilike(users.displayName as any, `%${term}%`))
      )
      .orderBy(desc(users.xp as any))
      .limit(20);

    return { posts: [], people: rows, communities: [] };
  }

  if (tab === 'communities') {
    const rows = await (db as any)
      .select({
        id: communities.id,
        slug: communities.slug,
        name: communities.name,
        description: communities.description,
        memberCount: communities.memberCount,
        courseCode: communities.courseCode,
        isPrivate: communities.isPrivate,
      })
      .from(communities)
      .where(
        or(
          ilike(communities.name as any, `%${term}%`),
          ilike(communities.description as any, `%${term}%`)
        )
      )
      .orderBy(desc(communities.memberCount as any))
      .limit(20);

    return { posts: [], people: [], communities: rows };
  }

  return { posts: [], people: [], communities: [] };
});
