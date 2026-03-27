import { pgTable, uuid, text, integer, real, timestamp, primaryKey, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { userCourses } from './courses';

export const topicMastery = pgTable('topic_mastery', {
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId:     uuid('course_id').references(() => userCourses.id, { onDelete: 'cascade' }).notNull(),
  topic:        text('topic').notNull(),
  score:        integer('score').default(50).notNull(),
  attempts:     integer('attempts').default(0),
  correct:      integer('correct').default(0),
  fsrsDue:      timestamp('fsrs_due'),
  fsrsStability:real('fsrs_stability'),
  fsrsDifficulty: real('fsrs_difficulty'),
  fsrsReps:     integer('fsrs_reps').default(0),
  fsrsLapses:   integer('fsrs_lapses').default(0),
  updatedAt:    timestamp('updated_at').defaultNow(),
}, (t) => ({ 
  pk: primaryKey({ columns: [t.userId, t.courseId, t.topic] }),
  idx_mastery_user_course: index('idx_mastery_user_course').on(t.userId, t.courseId),
  idx_mastery_fsrs_due: index('idx_mastery_fsrs_due').on(t.fsrsDue).where(sql`${t.fsrsDue} IS NOT NULL`)
}));

export const xpEvents = pgTable('xp_events', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  eventType:    text('event_type').notNull(),
  xpAwarded:    integer('xp_awarded').notNull(),
  metadata:     jsonb('metadata'),
  createdAt:    timestamp('created_at').defaultNow(),
});

export const achievements = pgTable('achievements', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  badge:        text('badge').notNull(),
  earnedAt:     timestamp('earned_at').defaultNow(),
});
