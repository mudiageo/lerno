import { pgTable, uuid, text, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const staffRoleEnum = pgEnum('staff_role', [
  'superadmin',         // full access to everything
  'staff_admin',        // admin of admin panel, can manage staff
  'moderator',          // content moderation only
  'support',            // customer support tickets, user management (limited)
  'analyst',            // read-only analytics and reporting
  'finance',            // subscription, payment, revenue data
  'content_editor',     // edit/create AI-generated content, manage courses
]);

export const staffMembers = pgTable('staff_members', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role:         staffRoleEnum('role').notNull(),
  department:   text('department'),                  // e.g. "Engineering", "Support", "Content"
  employeeId:   text('employee_id'),
  active:       boolean('active').default(true),
  permissions:  jsonb('permissions'),                // fine-grained overrides
  createdBy:    uuid('created_by').references(() => users.id),
  createdAt:    timestamp('created_at').defaultNow(),
  lastLoginAt:  timestamp('last_login_at'),
});

// Audit log for all admin actions
export const auditLog = pgTable('audit_log', {
  id:         uuid('id').primaryKey().defaultRandom(),
  actorId:    uuid('actor_id').references(() => users.id).notNull(),
  action:     text('action').notNull(),               // e.g. "user.suspend", "post.delete"
  targetType: text('target_type'),                    // "user", "post", "institution", etc.
  targetId:   uuid('target_id'),
  metadata:   jsonb('metadata'),                      // before/after state
  ipAddress:  text('ip_address'),
  userAgent:  text('user_agent'),
  createdAt:  timestamp('created_at').defaultNow(),
});
