import { boolean, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { reports } from './reports.js';

export const reportAiAnalyses = pgTable('report_ai_analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('report_id')
    .notNull()
    .unique()
    .references(() => reports.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  isValidReport: boolean('is_valid_report'),
  confidenceScore: integer('confidence_score'),
  severity: varchar('severity', { length: 20 }),
  category: varchar('category', { length: 50 }),
  reason: text('reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
