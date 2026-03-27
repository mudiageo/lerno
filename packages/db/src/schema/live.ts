import { pgTable, uuid, text, boolean, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { userCourses } from './courses';

export const streamStatusEnum = pgEnum('stream_status', ['scheduled', 'live', 'ended']);
export const streamProviderEnum = pgEnum('stream_provider', ['custom_webrtc', 'livekit']);

export const streams = pgTable('streams', {
  id:           uuid('id').primaryKey().defaultRandom(),
  hostId:       uuid('host_id').references(() => users.id).notNull(),
  courseId:     uuid('course_id').references(() => userCourses.id),
  title:        text('title').notNull(),
  description:  text('description'),
  thumbnailUrl: text('thumbnail_url'),
  status:       streamStatusEnum('status').default('scheduled'),
  provider:     streamProviderEnum('provider').default('custom_webrtc'),
  roomId:       text('room_id'),
  rtmpKey:      text('rtmp_key'),
  viewerCount:  integer('viewer_count').default(0),
  peakViewers:  integer('peak_viewers').default(0),
  isAudioOnly:  boolean('is_audio_only').default(false),
  scheduledAt:  timestamp('scheduled_at'),
  startedAt:    timestamp('started_at'),
  endedAt:      timestamp('ended_at'),
  recordingUrl: text('recording_url'),
  createdAt:    timestamp('created_at').defaultNow(),
});
