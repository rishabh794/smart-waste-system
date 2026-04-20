import { pgTable, uuid, integer, timestamp, doublePrecision, varchar } from 'drizzle-orm/pg-core';

export const bins = pgTable('bins', {
  id: uuid('id').defaultRandom().primaryKey(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  fillLevel: integer('fill_level').default(0).notNull(),
  fillRatePerDay: integer('fill_rate_per_day').default(20).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  zone: varchar('zone', { length: 100 }),
  lastEmptiedAt: timestamp('last_emptied_at'),
});