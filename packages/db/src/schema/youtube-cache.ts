import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const youtubeCache = pgTable('youtube_cache', {
  id:         uuid('id').primaryKey().defaultRandom(),
  cacheKey:   text('cache_key').unique().notNull(),
  results:    jsonb('results').notNull(),
  createdAt:  timestamp('created_at').defaultNow(),
}, (t) => ({
  idx_yt_cache_key: index('idx_yt_cache_key').on(t.cacheKey),
  idx_yt_cache_age: index('idx_yt_cache_age').on(t.createdAt),
}));
