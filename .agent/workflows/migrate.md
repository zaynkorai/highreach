---
description: Run or manage Supabase database migrations
---

## Run Migrations

// turbo-all

1. Check which migrations are pending:
```bash
cd /Users/zayn/ground/gal/app && pnpm run db:migrate:status
```

2. Apply all pending migrations:
```bash
cd /Users/zayn/ground/gal/app && pnpm run db:migrate
```

## Scaffold a New Migration

1. Create a new migration file (replace `<name>` with a descriptive snake_case name):
```bash
cd /Users/zayn/ground/gal/app && pnpm run db:migrate:create <name>
```

2. Open the generated file and write your SQL.

3. Apply:
```bash
cd /Users/zayn/ground/gal/app && pnpm run db:migrate
```
