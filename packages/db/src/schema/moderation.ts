import { pgTable, uuid, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { posts } from './posts';

// User-scoped mutes: suppresses a user's posts from showing in feed
export const mutes = pgTable('mutes', {
  muterId: uuid('muter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  mutedId: uuid('muted_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.muterId, t.mutedId] }),
  // idx_mutes_muter: index('idx_mutes_muter').on(t.muterId),
}));

// Post-level mutes: hides a specific post for the user
export const mutedPosts = pgTable('muted_posts', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.postId] }),
}));

// User blocks: stronger than mute; mutual suppression
export const blocks = pgTable('blocks', {
  blockerId: uuid('blocker_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  blockedId: uuid('blocked_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.blockerId, t.blockedId] }),
  // idx_blocks_blocker: index('idx_blocks_blocker').on(t.blockerId),
}));

// Content reports
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  details: text('details'),
  status: text('status').default('pending'),  // pending | reviewed | dismissed | actioned
  createdAt: timestamp('created_at').defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
}, (t) => ({
  // idx_reports_status: index('idx_reports_status').on(t.status, sql`${t.createdAt} DESC`),
}));

// "Not interested" signals — used to tune feed algorithm
export const notInterested = pgTable('not_interested', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.postId] }),
}));
