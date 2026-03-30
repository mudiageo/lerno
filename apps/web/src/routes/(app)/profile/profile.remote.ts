import { query, command, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { users, posts, follows } from '@lerno/db/schema';
import { eq, and, count, desc } from 'drizzle-orm';
import * as v from 'valibot';

export const getProfile = query(v.object({ username: v.string() }), async ({ username }) => {
  const event = getRequestEvent();
  const viewerId = event.locals?.user?.id;

  const [user] = await (db as any)
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      xp: users.xp,
      streakDays: users.streakDays,
      plan: users.plan,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username as any, username))
    .limit(1);

  if (!user) throw new Error('User not found');

  const [followerCount] = await (db as any).select({ count: count() }).from(follows).where(eq(follows.followingId as any, user.id));
  const [followingCount] = await (db as any).select({ count: count() }).from(follows).where(eq(follows.followerId as any, user.id));
  const [postCount] = await (db as any).select({ count: count() }).from(posts).where(eq(posts.authorId as any, user.id));

  let isFollowing = false;
  if (viewerId && viewerId !== user.id) {
    const [f] = await (db as any).select({ followerId: follows.followerId })
      .from(follows)
      .where(and(eq(follows.followerId as any, viewerId), eq(follows.followingId as any, user.id)))
      .limit(1);
    isFollowing = !!f;
  }

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    level: Math.floor((user.xp ?? 0) / 1000) + 1,
    followers: followerCount.count,
    following: followingCount.count,
    posts: postCount.count,
    isFollowing,
    isOwnProfile: viewerId === user.id,
  };
});

export const getProfilePosts = query(
  v.object({ username: v.string(), cursor: v.optional(v.string()) }),
  async ({ username }) => {
    const [user] = await (db as any).select({ id: users.id }).from(users).where(eq(users.username as any, username)).limit(1);
    if (!user) throw new Error('User not found');

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
      .where(eq(posts.authorId as any, user.id))
      .orderBy(desc(posts.createdAt as any))
      .limit(20);

    return rows.map((p: any) => ({ ...p, createdAt: p.createdAt?.toISOString() ?? new Date().toISOString() }));
  }
);

export const toggleFollow = command(v.object({ targetUserId: v.string() }), async ({ targetUserId }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');
  if (userId === targetUserId) throw new Error('Cannot follow yourself');

  const [existing] = await (db as any).select({ followerId: follows.followerId })
    .from(follows)
    .where(and(eq(follows.followerId as any, userId), eq(follows.followingId as any, targetUserId)))
    .limit(1);

  if (existing) {
    await (db as any).delete(follows).where(and(eq(follows.followerId as any, userId), eq(follows.followingId as any, targetUserId)));
    return { following: false };
  } else {
    await (db as any).insert(follows).values({ followerId: userId, followingId: targetUserId });
    return { following: true };
  }
});
