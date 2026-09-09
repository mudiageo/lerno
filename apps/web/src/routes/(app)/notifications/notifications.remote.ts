import { query, command, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { notifications, users } from '@lerno/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import * as v from 'valibot';

export const getNotifications = query(v.object({}), async () => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const rows = await (db as any)
    .select({
      id: notifications.id,
      type: notifications.type,
      body: notifications.body,
      read: notifications.read,
      createdAt: notifications.createdAt,
      actorId: notifications.actorId,
      targetId: notifications.targetId,
      actorName: users.displayName,
      actorUsername: users.username,
      actorImage: users.avatarUrl,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.actorId as any, users.id as any))
    .where(eq(notifications.userId as any, userId))
    .orderBy(desc(notifications.createdAt as any))
    .limit(50);

  return rows.map((r: any) => ({
    ...r,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    actorName: r.actorName ?? 'Lerno',
    actorUsername: r.actorUsername ?? 'lerno',
  }));
});

export const markAllRead = command(v.object({}), async () => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  await (db as any)
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId as any, userId), eq(notifications.read as any, false)));

  return { success: true };
});

export const markOneRead = command(v.object({ id: v.string() }), async ({ id }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  await (db as any)
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId as any, userId), eq(notifications.id as any, id)));

  return { success: true };
});
