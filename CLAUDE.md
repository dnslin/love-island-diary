# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**恋爱小岛日记** — A private, intimate couple's diary web app. Mobile-first, single-user (no public registration), designed with a gentle cream-color hand-drawn aesthetic.

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 (CSS-first config, no `tailwind.config.ts`)
- **UI Library**: `animal-island-ui` (Animal Crossing-style component library)
- **Font**: `HYTiaoTiao.ttf` (跳跳体) loaded via `next/font/local` as body font
- **Database**: Prisma + SQLite (not yet configured, see Issue #2)
- **Package Manager**: pnpm

## Common Commands

```bash
# Install dependencies
pnpm install

# Start dev server (Turbopack)
pnpm dev

# Production build
pnpm build

# Run ESLint
pnpm lint

# Start production server
pnpm start
```

## Architecture & Conventions

### Tailwind CSS v4 Theme

Custom theme variables are defined in `src/app/globals.css` via `@theme`. No `tailwind.config.ts` exists.

```css
@theme {
  --color-cream: #FFF9F5;        /* page background */
  --color-card: #FFFFFF;         /* card background */
  --color-primary: #F7C8D0;      /* main accent */
  --color-accent: #E8AEB7;       /* hover/active */
  --color-text-main: #5B4B49;    /* primary text */
  --color-text-sub: #8A7C78;     /* secondary text */
  --color-border-soft: #F1E4DD;  /* borders/dividers */
}
```

### Font Loading

`HYTiaoTiao.ttf` is loaded in `src/app/layout.tsx` via `next/font/local` with `variable: "--font-body"`. The font is applied to `<body>` in `globals.css` with a system font fallback stack.

### UI Library Usage

`animal-island-ui/dist/index.css` is imported in `layout.tsx` **before** `globals.css` so custom styles can override defaults.

Components are imported from `animal-island-ui` (e.g., `import { Button } from "animal-island-ui"`).

### Design Rules

- **No Emoji**: Use `animal-island-ui` Icon component or custom SVG icons only.
- **Mobile-first**: Content max-width 480px, centered on larger screens.
- **No bottom navigation bar**: The app should feel like a physical diary/photo album, not a conventional mobile app.
- **Color palette**: Stick to the cream-color system defined in `@theme`. Do not introduce new colors without updating the theme.

### Project Structure

```
src/
  app/              # Next.js App Router
    fonts/          # Local font files (next/font/local)
    layout.tsx      # Root layout: font loading, UI lib CSS import, metadata
    globals.css     # Tailwind v4 @theme + body styles
    page.tsx        # Cover page (/)
    diary/          # Diary routes (timeline, single entry, new/edit)
    memories/       # Photo wall (P1)
    calendar/       # Calendar page (P1)
    settings/       # First-time setup + settings
  components/       # Business components (empty, to be filled)
  lib/              # Utilities: prisma.ts, actions.ts, utils.ts (empty)
  types/            # Shared TypeScript types (empty)
prisma/             # Prisma schema + SQLite DB (Issue #2)
public/             # Static assets (logo.svg, etc.)
docs/               # Design documents
```

### Next.js Config

`next.config.ts` is configured with `output: 'standalone'` for Docker deployment.

### Server Actions

All CRUD operations should use Next.js Server Actions in `src/lib/actions.ts` with Prisma Client. This is the planned pattern but not yet implemented.

### Important Files

- `docs/superpowers/specs/2026-04-30-love-diary-design.md` — Main design spec
- `docs/superpowers/specs/2026-05-01-m1-project-init-design.md` — M1 initialization spec
