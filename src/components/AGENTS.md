# COMPONENTS KNOWLEDGE BASE

**Scope:** `src/components/` — React UI components for the diary app.

## STRUCTURE

Components are flat (no subdirs except `__tests__/`). Each component is a single `.tsx` file.

```
CoverLogo.tsx          # Animated SVG logo for the cover page
AnimatedDays.tsx       # Floating day-counter animation
DiaryForm.tsx          # Create/edit diary entry form
DiaryDetail.tsx        # Read-only diary entry display
MoodSelector.tsx       # Mood picker with spring animations
ImageUrlInput.tsx      # Image URL input with preview
SettingsForm.tsx       # First-time couple profile form
FloatingButton.tsx     # Action FAB
SecretWriteEntry.tsx   # Easter-egg hidden entry trigger
```

## CONVENTIONS

- **Import UI primitives from `animal-island-ui`** when available (`Button`, `Input`, `Modal`, etc.).
- **Icons**: Use `animal-island-ui` Icon component or custom SVG. Never use emoji.
- **Animations**: Use `framer-motion` for entrance/exit animations. Spring animations should use `repeat: Infinity, repeatType: "reverse"` (not 3+ keyframes) to avoid dev warnings.
- **Form validation**: Zod schemas are in `src/lib/schemas.ts`.

## ANTI-PATTERNS

- **No sharp corners** (`rounded` minimum on interactive elements).
- **No cold focus rings** — focused inputs use `#ffcc00` (enforced globally in `globals.css`).
- **No `font-weight < 400`**.
- **No emoji** in any UI text — use icons.
- **Test files** go in `__tests__/` alongside components, not co-located as `.test.tsx`.
