import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'driver', 'user']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(), 
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  phone: varchar('phone', { length: 20 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
