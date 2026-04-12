import { pgTable, uuid , serial, doublePrecision, varchar } from 'drizzle-orm/pg-core';

export const bins = pgTable('bins', {
  id: uuid('id').defaultRandom().primaryKey(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  zone: varchar('zone', { length: 100 }),
});