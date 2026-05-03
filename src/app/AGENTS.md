# APP ROUTER KNOWLEDGE BASE

**Scope:** `src/app/` — Next.js App Router pages, layouts, and global styles.

## STRUCTURE

```
layout.tsx              # Root layout: font loading, CSS imports, metadata
error.tsx               # Root error boundary (Client Component)
globals.css             # Tailwind v4 @theme + body styles + global overrides
fonts/
  HYTiaoTiao.ttf        # Local font file (next/font/local)
(protected)/
  layout.tsx            # Auth/init guard — redirects to /settings if no profile
  page.tsx              # Homepage / (cover page with diary timeline)
settings/
  page.tsx              # First-time setup + settings form
diary/
  new/
    page.tsx            # Create new diary entry
  [id]/
    page.tsx            # Diary entry detail
```

## CRITICAL: NO `app/page.tsx`

The root route `/` is served by `(protected)/page.tsx`. **Do not create `app/page.tsx`** — it would conflict with the route group's purpose.

## CONVENTIONS

- **Route group `(protected)`** is the application entry point. Its `layout.tsx` checks `getCoupleProfile()` and redirects uninitalized users to `/settings`.
- **`dynamic = 'force-dynamic'`** on `(protected)/layout.tsx` to prevent caching of the auth check.
- **No `middleware.ts`** — all route protection is done at the layout level.
- **Global styles** in `globals.css` override `animal-island-ui` defaults (e.g., input focus border color).

## ANTI-PATTERNS

- **Do not add `page.tsx` directly under `app/`** — root content belongs in `(protected)/page.tsx`.
- **Do not remove `suppressHydrationWarning`** from `<html>` in `layout.tsx` — the local font variable causes harmless hydration mismatch.
- **`redirect()` in layouts/actions must not be inside try/catch**.
