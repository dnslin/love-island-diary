# PRISMA KNOWLEDGE BASE

**Scope:** `prisma/` — Database schema, migrations, seed data, and SQLite configuration.

## STRUCTURE

```
schema.prisma           # Prisma schema (sqlite provider, no url field)
dev.db                  # Development SQLite database
seed.ts                 # Seed script for development data
migrations/             # Prisma migration files
migration_lock.toml     # Auto-generated — do not edit manually
```

**Project root also has:**
```
prisma.config.ts        # Prisma config (new format): schema path, migrations path, datasource url
```

## CRITICAL: DRIVER ADAPTER PATTERN

This project uses Prisma's **Driver Adapter** for `better-sqlite3` instead of the built-in SQLite engine.

- **`schema.prisma`** has `provider = "sqlite"` but **no `url` field** in the `datasource` block.
- **Runtime DB path** is set in `src/lib/prisma.ts` via the `PrismaBetterSqlite3` adapter:
  ```ts
  const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  const adapter = new PrismaBetterSqlite3({ url });
  ```
- **Docker** mounts `./data:/data` and sets `DATABASE_URL=file:/data/love-diary.db`.
- **`prisma.config.ts`** at project root uses the new Prisma config format.

## CONVENTIONS

- Run `npx prisma migrate dev` after schema changes.
- Run `npx prisma generate` to regenerate the client (also done in Dockerfile).
- Run `npx prisma db seed` to execute `prisma/seed.ts`.

## ANTI-PATTERNS

- **Do not add `url = env("DATABASE_URL")` to `schema.prisma`** — the Driver Adapter handles connection strings at runtime.
- **Do not edit `migration_lock.toml` manually**.
- **Do not commit `dev.db`** to version control (it is gitignored).
