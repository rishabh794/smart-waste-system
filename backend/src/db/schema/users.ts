import { pgTable,uuid, serial, text, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(), 
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('driver'),
  phone: varchar('phone', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
});