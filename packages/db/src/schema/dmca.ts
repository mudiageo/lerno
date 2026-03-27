import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { posts } from './posts';

export const dmcaStatusEnum = pgEnum('dmca_status', ['pending', 'actioned', 'counter_filed', 'resolved']);

export const dmcaRequests = pgTable('dmca_requests', {
  id:             uuid('id').primaryKey().defaultRandom(),
  postId:         uuid('post_id').references(() => posts.id).notNull(),
  reason:         text('reason').notNull(),
  reporterEmail:  text('reporter_email').notNull(),
  status:         dmcaStatusEnum('status').default('pending'),
  resolutionNote: text('resolution_note'),
  createdAt:      timestamp('created_at').defaultNow(),
  resolvedAt:     timestamp('resolved_at'),
});
