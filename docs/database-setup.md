# database setup

This guide explains how to set up and configure the PostgreSQL database for CodinIT.

## prerequisites

- PostgreSQL 14+ (local) or Supabase account
- Node.js 20.15.1+
- pnpm installed

## environment configuration

### step 1: configure database URL

Edit your `.env` file with your database connection string:

```bash
DATABASE_URL=postgresql://username:password@host:port/database
```

**Important: URL-encode special characters in passwords**

If your password contains special characters, URL-encode them:
- `$` → `%24`
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `^` → `%5E`
- `&` → `%26`
- `*` → `%2A`

Example:
```bash
# Original password: myPass$123!
# Encoded password: myPass%24123%21
DATABASE_URL=postgresql://postgres:myPass%24123%21@localhost:5432/codinit
```

### step 2: configure other required variables

```bash
# Email service for verification
RESEND_API_KEY=your_resend_api_key

# Application URL for email links
APP_URL=http://localhost:5173  # Dev
APP_URL=https://yourdomain.com # Production
```

## database setup

### option 1: automated setup

Run the migration script to automatically create tables:

```bash
# Install dependencies first
pnpm install

# Run migrations
pnpm db:migrate
```

### option 2: manual setup

1. Generate migration files:
```bash
pnpm db:generate
```

2. Apply migrations manually:
```bash
pnpm db:push
```

3. Or use Drizzle Studio to manage database:
```bash
pnpm db:studio
```

## database schema

The registration system uses the `users` table with the following structure:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  app_version TEXT,
  platform TEXT,
  email_opt_in BOOLEAN DEFAULT true,
  registered_at TIMESTAMP DEFAULT now(),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  -- Email verification
  verification_token TEXT,
  email_verified BOOLEAN DEFAULT false,
  verification_sent_at TIMESTAMP,
  verification_expires_at TIMESTAMP,

  -- GDPR compliance
  consent_given_at TIMESTAMP,
  consent_version TEXT
);
```

## health check

Test database connectivity:

```typescript
import { checkDatabaseHealth } from '~/lib/db/health';

const health = await checkDatabaseHealth();
if (!health.healthy) {
  console.error('Database is not healthy:', health.error);
}
```

## troubleshooting

### connection refused

- Check if PostgreSQL is running
- Verify host and port in DATABASE_URL
- Ensure firewall allows connections

### authentication failed

- Verify username and password are correct
- Check that password special characters are URL-encoded
- For Supabase: use pooler connection string, not direct connection

### SSL errors

For Supabase and cloud databases, ensure SSL mode is set:

```bash
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
```

### table does not exist

Run migrations:

```bash
pnpm db:migrate
```

### migration errors

Reset and re-run migrations:

```bash
# Drop all tables (CAUTION: data loss)
# Then run:
pnpm db:migrate
```

## production considerations

1. **Connection pooling**: The app uses a connection pool with max 1 connection for migrations, adjust for production
2. **SSL**: Always use `sslmode=require` for production databases
3. **Backups**: Set up automated backups for your database
4. **Monitoring**: Use database health checks in production
5. **Secrets**: Never commit `.env` file, only `.env.example`

## available commands

```bash
pnpm db:migrate   # Run migrations
pnpm db:generate  # Generate new migration from schema changes
pnpm db:studio    # Open Drizzle Studio GUI
pnpm db:push      # Push schema changes directly (skip migrations)
```

## supabase-specific setup

1. Create a new Supabase project
2. Go to Project Settings → Database
3. Copy the "Connection string" (Pooler mode recommended)
4. URL-encode the password
5. Add `?sslmode=require` to the connection string
6. Set in `.env` as DATABASE_URL

Example Supabase connection string:
```bash
DATABASE_URL=postgresql://postgres.xxxx:password%24here@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
```
