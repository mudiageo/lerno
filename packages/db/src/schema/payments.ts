import { pgTable, uuid, text, varchar, integer, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const paymentProviderEnum = pgEnum('payment_provider', ['paystack', 'stripe']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'active', 'cancelled', 'expired', 'failed']);
export const billingPeriodEnum = pgEnum('billing_period', ['monthly', 'yearly', 'one_time', 'institutional']);

export const subscriptions = pgTable('subscriptions', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider:         paymentProviderEnum('provider').notNull(),
  providerSubId:    text('provider_sub_id').notNull(),
  plan:             varchar('plan', { length: 30 }).notNull(),
  status:           paymentStatusEnum('status').default('pending'),
  billingPeriod:    billingPeriodEnum('billing_period').notNull(),
  amount:           integer('amount').notNull(),
  currency:         varchar('currency', { length: 3 }).notNull(),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtEnd:      boolean('cancel_at_end').default(false),
  createdAt:        timestamp('created_at').defaultNow(),
  updatedAt:        timestamp('updated_at').defaultNow(),
});

export const paymentEvents = pgTable('payment_events', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id),
  provider:     paymentProviderEnum('provider').notNull(),
  eventType:    text('event_type').notNull(),
  amount:       integer('amount'),
  currency:     varchar('currency', { length: 3 }),
  status:       paymentStatusEnum('status'),
  rawPayload:   jsonb('raw_payload'),
  createdAt:    timestamp('created_at').defaultNow(),
});

export const institutions = pgTable('institutions', {
  id:             uuid('id').primaryKey().defaultRandom(),
  name:           text('name').notNull(),
  domain:         varchar('domain', { length: 100 }),
  logoUrl:        text('logo_url'),
  brandColor:     varchar('brand_color', { length: 7 }),
  seatLimit:      integer('seat_limit').notNull(),
  seatsUsed:      integer('seats_used').default(0),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  active:         boolean('active').default(true),
  createdAt:      timestamp('created_at').defaultNow(),
});
