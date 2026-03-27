import { pgTable, uuid, varchar, text, boolean, timestamp, integer, pgEnum, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const eventTypeEnum = pgEnum('event_type', ['exam', 'quiz', 'lab', 'assignment', 'presentation', 'other']);
export const semesterEnum = pgEnum('semester', ['first', 'second', 'summer', 'trimester_1', 'trimester_2', 'trimester_3']);

export const userCourses = pgTable('user_courses', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  code:         varchar('code', { length: 20 }).notNull(),
  title:        text('title').notNull(),
  description:  text('description'),
  semester:     semesterEnum('semester'),
  year:         integer('year'),
  creditUnits:  integer('credit_units'),
  active:       boolean('active').default(true),
  color:        varchar('color', { length: 7 }),
  createdAt:    timestamp('created_at').defaultNow(),
});

export const courseSchedule = pgTable('course_schedule', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId:      uuid('course_id').references(() => userCourses.id, { onDelete: 'cascade' }).notNull(),
  eventType:     eventTypeEnum('event_type').notNull(),
  title:         text('title').notNull(),
  description:   text('description'),
  scheduledAt:   timestamp('scheduled_at').notNull(),
  durationMins:  integer('duration_mins'),
  weightPct:     integer('weight_pct'),
  location:      text('location'),
  reminderSent:  boolean('reminder_sent').default(false),
  createdAt:     timestamp('created_at').defaultNow(),
}, (t) => ({
  idx_schedule_user_upcoming: index('idx_schedule_user_upcoming')
    .on(t.userId, t.scheduledAt)
    .where(sql`${t.scheduledAt} > now()`)
}));

export const courseMaterials = pgTable('course_materials', {
  id:          uuid('id').primaryKey().defaultRandom(),
  courseId:    uuid('course_id').references(() => userCourses.id, { onDelete: 'cascade' }).notNull(),
  userId:      uuid('user_id').references(() => users.id).notNull(),
  type:        varchar('type', { length: 20 }).notNull(),
  title:       text('title').notNull(),
  storageKey:  text('storage_key'),
  url:         text('url'),
  ocrText:     text('ocr_text'),
  processed:   boolean('processed').default(false),
  createdAt:   timestamp('created_at').defaultNow(),
});
