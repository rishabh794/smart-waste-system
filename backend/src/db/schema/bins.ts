import { pgTable, serial, doublePrecision, varchar } from 'drizzle-orm/pg-core';

export const bins = pgTable('bins', {
  id: serial('id').primaryKey(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  zone: varchar('zone', { length: 100 }), // e.g., 'North District'
});