import { pgTable, uuid, integer, timestamp, doublePrecision, varchar } from 'drizzle-orm/pg-core';
import { cities } from './cities.js';

export const bins = pgTable('bins', {
  id: uuid('id').defaultRandom().primaryKey(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  fillLevel: integer('fill_level').default(0).notNull(),
  fillRatePerDay: integer('fill_rate_per_day').default(20).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  cityId: uuid('city_id').references(() => cities.id).notNull(),
  lastEmptiedAt: timestamp('last_emptied_at'),
});