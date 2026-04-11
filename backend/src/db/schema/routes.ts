import { pgTable, serial, integer, date, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { bins } from './bins.js';

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  driverId: integer('driver_id').references(() => users.id).notNull(),
  assignedDate: date('assigned_date').notNull(),
  status: varchar('status', { length: 50 }).default('pending'), 
});

export const routeBins = pgTable('route_bins', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').references(() => routes.id).notNull(),
  binId: integer('bin_id').references(() => bins.id).notNull(),
  sequenceNumber: integer('sequence_number').notNull(), 
  fillStatus: varchar('fill_status', { length: 50 }).default('unknown'), 
});