# COMPONENTS KNOWLEDGE BASE

**Scope:** `src/components/` — React UI components for the diary app.

## STRUCTURE

Components are flat (no subdirs except `__tests__/`). Each component is a single `.tsx` file.

```
AdminAuthTrigger.tsx     # Admin auth button that triggers password modal
AdminPasswordModal.tsx   # Admin password input modal
AnimatedDays.tsx         # Floating day-counter animation
BackButton.tsx           # Navigation back button
CalendarGrid.tsx         # Monthly calendar grid with diary day markers
CoverActions.tsx         # Cover page action buttons (login, enter)
CoverLogo.tsx            # Animated SVG logo for the cover page
DayEntriesModal.tsx      # Modal showing diary entries for a selected day
DeleteConfirmModal.tsx   # Confirmation modal for destructive actions
DeleteDiarySection.tsx   # Delete diary entry section with confirmation
DiaryDetail.tsx          # Read-only diary entry display
DiaryForm.tsx            # Create/edit diary entry form
DiaryNavigation.tsx      # Prev/next diary entry navigation
DiaryTimeline.tsx        # Timeline view of diary entries grouped by month
EmptyMemories.tsx        # Empty state for photo wall
FloatingButton.tsx       # Action FAB
ImageUrlInput.tsx        # Image URL input with preview
MasonryGrid.tsx          # Masonry layout for photo wall
MemoryCard.tsx           # Individual photo card in masonry grid
MoodSelector.tsx         # Mood picker with spring animations
PageFlipWrapper.tsx      # Page flip gesture wrapper for diary detail
PasswordModal.tsx        # Generic password input modal
SettingsForm.tsx         # First-time couple profile form
SecretWriteEntry.tsx     # Easter-egg hidden entry trigger
ViewPasswordModal.tsx    # Viewer password input modal
```

## CONVENTIONS

- **Import UI primitives from `animal-island-ui`** when available (`Button`, `Input`, `Modal`, etc.).
- **Icons**: Use `animal-island-ui` Icon component or custom SVG. Never use emoji.
- **Animations**: Use `framer-motion` for entrance/exit animations. Spring animations should use `repeat: Infinity, repeatType: "reverse"` (not 3+ keyframes) to avoid dev warnings.
- **Form validation**: Zod schemas are in `src/lib/schemas.ts`.
- **Auth modals**: Password modals (`AdminPasswordModal`, `ViewPasswordModal`, `PasswordModal`) use `src/lib/auth.ts` for JWT token management.

## ANTI-PATTERNS

- **No sharp corners** (`rounded` minimum on interactive elements).
- **No cold focus rings** — focused inputs use `#ffcc00` (enforced globally in `globals.css`).
- **No `font-weight < 400`**.
- **No emoji** in any UI text — use icons.
- **Test files** go in `__tests__/` alongside components, not co-located as `.test.tsx`.
