import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  appVersion: text('app_version'),
  platform: text('platform'),
  emailOptIn: boolean('email_opt_in').default(true),
  registeredAt: timestamp('registered_at').defaultNow(),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),

  // Email verification fields
  verificationToken: text('verification_token'),
  emailVerified: boolean('email_verified').default(false),
  verificationSentAt: timestamp('verification_sent_at'),
  verificationExpiresAt: timestamp('verification_expires_at'),

  // GDPR consent tracking
  consentGivenAt: timestamp('consent_given_at'),
  consentVersion: text('consent_version'),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
