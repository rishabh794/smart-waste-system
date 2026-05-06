import { pgTable, uuid, integer, date, varchar, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { bins } from './bins.js';

export const routes = pgTable(
  'routes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    driverId: uuid('driver_id').references(() => users.id).notNull(),
    assignedDate: date('assigned_date').notNull(),
    status: varchar('status', { length: 50 }).default('pending'),
  },
  (table) => ({
    pendingDriverUnique: uniqueIndex('routes_pending_driver_unique')
      .on(table.driverId)
      .where(sql`${table.status} = 'pending'`),
  })
);

export const routeBins = pgTable(
  'route_bins',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    routeId: uuid('route_id').references(() => routes.id).notNull(),
    binId: uuid('bin_id').references(() => bins.id).notNull(),
    sequenceNumber: integer('sequence_number').notNull(),
    fillStatus: varchar('fill_status', { length: 50 }).default('unknown'),
    wasOverflowing: boolean('was_overflowing').default(false).notNull(),
    missedReason: varchar('missed_reason', { length: 50 }),
    missedNote: varchar('missed_note', { length: 255 }),
  },
  (table) => ({
    routeBinUnique: uniqueIndex('route_bins_route_bin_unique').on(table.routeId, table.binId),
  })
);