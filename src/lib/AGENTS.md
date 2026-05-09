# LIB KNOWLEDGE BASE

**Scope:** `src/lib/` — Server Actions, Prisma client, auth, schemas, and test setup.

## STRUCTURE

```
actions.ts            # All Server Actions (CRUD for DiaryEntry, CoupleProfile, DiaryImage)
auth.ts               # JWT cookie auth with jose (signAuthToken, getAuthRole, requireAdmin)
dayjs.ts              # dayjs instance with zh-cn locale configured
prisma.ts             # Prisma Client init with better-sqlite3 Driver Adapter
schemas.ts            # Zod schemas for form validation
__tests__/
  actions.test.ts     # Server Action unit tests
test-polyfill.ts      # Jest environment polyfills
test-setup.ts         # Jest setup (jest-dom matchers, etc.)
```

## CONVENTIONS

- **All data mutations** go through `actions.ts` as Next.js Server Actions (`"use server"`).
- **All reads** also go through `actions.ts` (no direct Prisma client import in components/pages).
- **Zod validation** happens in Server Actions before DB operations.
- **Prisma Client** is singleton-ized via `globalThis` in `prisma.ts`.
- **Auth**: `auth.ts` provides JWT-based cookie auth using `jose`. Two roles: `viewer` (read-only) and `admin` (full access). Token expires in 7 days.
- **Dayjs**: Import from `@/lib/dayjs` (not raw `dayjs`) to ensure zh-cn locale is always active.

## ANTI-PATTERNS

- **`redirect()` must be outside try/catch** in Server Actions. Catching the `NEXT_REDIRECT` error prevents the redirect from executing.
- **Do not split actions into multiple files yet** — the project convention is a single `actions.ts` until growth demands separation.
- **Do not add `url` to `schema.prisma`** — the Driver Adapter pattern sets the DB path at runtime in `prisma.ts`.
- **Do not import raw `dayjs`** — always use `@/lib/dayjs` for consistent locale.
