ALTER TABLE "users" ADD COLUMN "verification_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "consent_given_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "consent_version" text;