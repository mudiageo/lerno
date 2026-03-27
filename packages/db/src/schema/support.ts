import { pgTable, uuid, text, timestamp, pgEnum, integer, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { staffMembers } from './staff';

export const ticketStatusEnum = pgEnum('ticket_status', ['open','in_progress','waiting_user','resolved','closed']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low','normal','high','urgent']);
export const ticketCategoryEnum = pgEnum('ticket_category', [
  'billing','account','content','technical','abuse','feature_request','other',
]);

export const supportTickets = pgTable('support_tickets', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id),
  assignedTo:   uuid('assigned_to').references(() => staffMembers.id),
  category:     ticketCategoryEnum('category').notNull(),
  priority:     ticketPriorityEnum('priority').default('normal'),
  status:       ticketStatusEnum('status').default('open'),
  subject:      text('subject').notNull(),
  firstResponse:timestamp('first_response_at'),
  resolvedAt:   timestamp('resolved_at'),
  satisfactionScore: integer('satisfaction_score'),    // 1-5 CSAT
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
});

export const ticketMessages = pgTable('ticket_messages', {
  id:         uuid('id').primaryKey().defaultRandom(),
  ticketId:   uuid('ticket_id').references(() => supportTickets.id, { onDelete: 'cascade' }).notNull(),
  authorId:   uuid('author_id').references(() => users.id),
  body:       text('body').notNull(),
  isInternal: boolean('is_internal').default(false),   // staff-only note
  createdAt:  timestamp('created_at').defaultNow(),
});
