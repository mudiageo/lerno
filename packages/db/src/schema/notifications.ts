import { pgTable, uuid, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const notifications = pgTable('notifications', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type:        text('type').notNull(),
  actorId:     uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  targetId:    uuid('target_id'),
  body:        text('body'),
  metadata:    jsonb('metadata'),
  read:        boolean('read').default(false),
  createdAt:   timestamp('created_at').defaultNow(),
}, (t) => ({
  idx_notifications_user_unread: index('idx_notifications_user_unread')
    .on(t.userId, sql`${t.createdAt} DESC`)
    .where(sql`${t.read} = false`)
}));

export const pushSubscriptions = pgTable('push_subscriptions', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  endpoint:     text('endpoint').notNull(),
  p256dh:       text('p256dh').notNull(),
  auth:         text('auth').notNull(),
  platform:     text('platform'),
  createdAt:    timestamp('created_at').defaultNow(),
});
