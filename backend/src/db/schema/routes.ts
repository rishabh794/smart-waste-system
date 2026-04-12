import { pgTable,uuid, serial, integer, date, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { bins } from './bins.js';

export const routes = pgTable('routes', {
  id: uuid('id').defaultRandom().primaryKey(),
  driverId: uuid('driver_id').references(() => users.id).notNull(),
  assignedDate: date('assigned_date').notNull(),
  status: varchar('status', { length: 50 }).default('pending'), 
});

export const routeBins = pgTable('route_bins', {
  id: uuid('id').defaultRandom().primaryKey(),
  routeId: uuid('route_id').references(() => routes.id).notNull(),
  binId: uuid('bin_id').references(() => bins.id).notNull(),
  sequenceNumber: integer('sequence_number').notNull(), 
  fillStatus: varchar('fill_status', { length: 50 }).default('unknown'), 
});