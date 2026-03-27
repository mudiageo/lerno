import { pgTable, uuid, jsonb, timestamp, primaryKey, pgEnum, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { posts } from './posts';

export const interactionTypeEnum = pgEnum('interaction_type', [
  'like', 'repost', 'bookmark', 'view',
  'quiz_answer', 'flashcard_flip', 'poll_vote',
  'follow', 'block', 'report',
]);

export const interactions = pgTable('interactions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId:      uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  targetUserId:uuid('target_user_id').references(() => users.id, { onDelete: 'cascade' }),
  type:        interactionTypeEnum('type').notNull(),
  payload:     jsonb('payload'),
  createdAt:   timestamp('created_at').defaultNow(),
}, (t) => ({
  idx_interactions_post: index('idx_interactions_post').on(t.postId, t.type),
  idx_interactions_user: index('idx_interactions_user').on(t.userId, t.type, sql`${t.createdAt} DESC`),
}));

export const follows = pgTable('follows', {
  followerId:  uuid('follower_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followingId: uuid('following_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt:   timestamp('created_at').defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.followerId, t.followingId] }) }));
