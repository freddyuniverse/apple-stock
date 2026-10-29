import { sql } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const alertSubscriptions = pgTable('alert_subscriptions', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  partNumber: text('part_number').notNull(),
  modelName: text('model_name').notNull(),
  zip: text('zip').notNull(),
  radiusMiles: integer('radius_miles').notNull(),
  stripeSessionId: text('stripe_session_id').notNull().unique(),
  status: text('status').notNull().default('pending'),
  notifiedKeys: text('notified_keys').array().notNull().default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

export type AlertSubscription = typeof alertSubscriptions.$inferSelect;
