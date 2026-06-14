import { pgTable, uuid, varchar, doublePrecision, timestamp } from 'drizzle-orm/pg-core';

export const cities = pgTable('cities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  depotLat: doublePrecision('depot_lat'),
  depotLng: doublePrecision('depot_lng'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
