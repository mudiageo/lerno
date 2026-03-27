import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { institutions } from './payments';

export const apiKeys = pgTable('api_keys', {
  id:            uuid('id').primaryKey().defaultRandom(),
  institutionId: uuid('institution_id').references(() => institutions.id).notNull(),
  keyHash:       text('key_hash').unique().notNull(),     // SHA-256 of the raw key
  name:          text('name').notNull(),                  // e.g. "Moodle Integration"
  scopes:        text('scopes').array().notNull(),        // ['students:read', 'courses:write']
  lastUsedAt:    timestamp('last_used_at'),
  expiresAt:     timestamp('expires_at'),
  active:        boolean('active').default(true),
  createdAt:     timestamp('created_at').defaultNow(),
});
