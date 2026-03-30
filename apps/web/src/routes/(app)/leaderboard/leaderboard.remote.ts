import { query, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { users, follows, userCourses } from '@lerno/db/schema';
import { desc, eq, sql, inArray, gt, and } from 'drizzle-orm';
import * as v from 'valibot';

export const getLeaderboard = query(
  v.object({ scope: v.optional(v.picklist(['global', 'course', 'friends'])) }),
  async ({ scope = 'global' }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    let ids: string[] | null = null;

    if (scope === 'friends') {
      const friendIds = await (db as any)
        .select({ id: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId as any, userId));
      
      ids = [userId, ...friendIds.map((f: any) => f.id)];
    } else if (scope === 'course') {
      const myCourses = await (db as any)
        .select({ code: userCourses.code })
        .from(userCourses)
        .where(eq(userCourses.userId as any, userId));
      
      const codes = myCourses.map((c: any) => c.code);
      if (codes.length > 0) {
        const studentIds = await (db as any)
          .select({ userId: userCourses.userId })
          .from(userCourses)
          .where(inArray(userCourses.code as any, codes));
        
        ids = [...new Set(studentIds.map((s: any) => s.userId))];
      } else {
        ids = [userId];
      }
    }

    const rows = await (db as any)
      .select({
        id: users.id,
        displayName: users.displayName,
        username: users.username,
        avatarUrl: users.avatarUrl,
        xp: users.xp,
        streakDays: users.streakDays,
      })
      .from(users)
      .where(ids ? inArray(users.id as any, ids) : undefined)
      .orderBy(desc(users.xp as any))
      .limit(50);

    return rows.map((u: any, i: number) => ({
      ...u,
      rank: i + 1,
      level: Math.floor((u.xp ?? 0) / 1000) + 1,
      xp: u.xp ?? 0,
    }));
  }
);

export const getUserStats = query(v.object({}), async () => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const [user] = await (db as any)
    .select({ 
      xp: users.xp, 
      streakDays: users.streakDays, 
      plan: users.plan,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
      id: users.id
    })
    .from(users)
    .where(eq(users.id as any, userId))
    .limit(1);

  if (!user) throw new Error('User not found');

  const [rankResult] = await (db as any)
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(gt(users.xp as any, user.xp ?? 0));

  return {
    ...user,
    xp: user.xp ?? 0,
    streakDays: user.streakDays ?? 0,
    level: Math.floor((user.xp ?? 0) / 1000) + 1,
    rank: Number(rankResult.count) + 1,
    xpToNextLevel: 1000 - ((user.xp ?? 0) % 1000),
  };
});
