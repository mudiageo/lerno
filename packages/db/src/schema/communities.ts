import { pgTable, uuid, text, varchar, boolean, timestamp, integer, pgEnum, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';

export const communityRoleEnum = pgEnum('community_role', ['member', 'moderator', 'admin']);

export const communities = pgTable('communities', {
  id:           uuid('id').primaryKey().defaultRandom(),
  slug:         varchar('slug', { length: 60 }).unique().notNull(),
  name:         text('name').notNull(),
  description:  text('description'),
  avatarUrl:    text('avatar_url'),
  bannerUrl:    text('banner_url'),
  isPrivate:    boolean('is_private').default(false),
  courseCode:   varchar('course_code', { length: 20 }),
  memberCount:  integer('member_count').default(0),
  createdBy:    uuid('created_by').references(() => users.id),
  createdAt:    timestamp('created_at').defaultNow(),
});

export const communityMembers = pgTable('community_members', {
  communityId:  uuid('community_id').references(() => communities.id, { onDelete: 'cascade' }).notNull(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role:         communityRoleEnum('role').default('member'),
  joinedAt:     timestamp('joined_at').defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.communityId, t.userId] }) }));
