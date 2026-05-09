# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-09
**Commit:** 7253c42

## OVERVIEW

恋爱小岛日记 — A private couple's diary web app built with Next.js 16 (App Router), Tailwind CSS v4, and Prisma + SQLite. Mobile-first, single-user, cream-color hand-drawn aesthetic using the `animal-island-ui` component library.

## STRUCTURE

```
src/
  app/              # Next.js routes — root page is (protected)/page.tsx, NOT app/page.tsx
  components/       # React components — __tests__ subdirs alongside source
  lib/              # Server Actions, Prisma client, auth, schemas, test helpers
  hooks/            # Custom React hooks with co-located tests
  types/            # Empty — types live in lib/schemas.ts and Prisma Client
prisma/             # Schema + SQLite DB (Driver Adapter pattern, no url in schema)
docs/               # Design specs and implementation plans
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add/edit a page | `src/app/` | Root `/` is `(protected)/page.tsx`, not `app/page.tsx` |
| Add a component | `src/components/` | Use `animal-island-ui` components when available |
| Add a Server Action | `src/lib/actions.ts` | All CRUD lives here (not split by domain yet) |
| Change auth logic | `src/lib/auth.ts` | JWT cookie auth with `jose` |
| Change theme colors | `src/app/globals.css` | Tailwind v4 `@theme` block — no `tailwind.config.ts` |
| Change font | `src/app/layout.tsx` + `src/app/fonts/` | `HYTiaoTiao.ttf` loaded via `next/font/local` |
| Add a DB model | `prisma/schema.prisma` | Then run `npx prisma migrate dev` |
| Write tests | `src/{components,lib,hooks}/__tests__/` | Jest + jsdom + Testing Library |
| Middleware / route guard | `src/proxy.ts` | Non-standard filename — JWT-based route protection |

## CONVENTIONS

- **Tailwind v4 CSS-first config**: Theme variables live in `globals.css` `@theme`. No `tailwind.config.ts`.
- **Font**: Body font is `HYTiaoTiao.ttf` (跳跳体) via `next/font/local` with `variable: "--font-body"`.
- **UI library**: `animal-island-ui/dist/index.css` imported in `layout.tsx` **before** `globals.css`.
- **No Emoji**: Use `animal-island-ui` Icon component or custom SVG icons only.
- **Mobile-first**: Content max-width 480px, centered on larger screens.
- **No bottom nav bar**: App should feel like a physical diary, not a conventional mobile app.
- **Server Actions**: All data mutations go through `src/lib/actions.ts` using Next.js Server Actions.
- **Prisma Driver Adapter**: Uses `PrismaBetterSqlite3` adapter; `schema.prisma` has no `url` field. Runtime DB path set via `DATABASE_URL` env or defaults to `file:./prisma/dev.db`.
- **Auth**: JWT cookie-based auth via `src/lib/auth.ts` using `jose`. Two roles: `viewer` and `admin`. Route guard is in `src/proxy.ts` (non-standard middleware filename).

## ANTI-PATTERNS (THIS PROJECT)

- **No `src/app/page.tsx`**: Root route `/` is served by `(protected)/page.tsx`. Do not create `app/page.tsx`.
- **No middleware.ts**: Auth/initialization guard is in `src/proxy.ts` (non-standard filename) and `(protected)/layout.tsx`.
- **`redirect()` must be outside try/catch**: Catching `NEXT_REDIRECT` error swallows the redirect.
- **No cold colors**: Never use #000, #111, cold gray backgrounds, or blue focus rings. Stick to the warm palette in `@theme`.
- **No font-weight < 400**: Always 400 or higher.
- **No sharp corners**: All interactive elements need rounded corners.
- **No flat design without shadow**: Interactive elements need bottom box-shadow.
- **No pure white backgrounds**: Use `--color-cream` (#FFF9F5) or warm parchment.
- **Delete actions must confirm**: Use `animal-island-ui` Modal for destructive actions.
- **No future dates**: Date inputs block future dates via `max` + zod refine.
- **Do not introduce new colors** without updating the `@theme` block in `globals.css`.

## COMMANDS

```bash
pnpm dev      # Start dev server (Turbopack)
pnpm build    # Production build (standalone output for Docker)
pnpm start    # Start production server
pnpm lint     # ESLint (v9 flat config)
pnpm test     # Jest test suite
```
