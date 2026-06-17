import { pgEnum, pgTable, text, timestamp, uuid, varchar, doublePrecision } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { bins } from './bins.js';

export const reportStatusEnum = pgEnum('report_status', ['submitted', 'in_review', 'resolved', 'rejected']);

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  binId: uuid('bin_id').references(() => bins.id),
  clientReportId: varchar('client_report_id', { length: 255 }).unique(),
  title: varchar('title', { length: 120 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }).notNull().default('general'),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  imageUrl: text('image_url').notNull(),
  address: text('address'),
  status: reportStatusEnum('status').notNull().default('submitted'),
  adminNotes: text('admin_notes'),
  resolvedAt: timestamp('resolved_at'),
  resolvedById: uuid('resolved_by_id').references(() => users.id),
  resolvedByName: text('resolved_by_name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date()),
});
