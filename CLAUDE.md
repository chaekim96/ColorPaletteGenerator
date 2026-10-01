# CLAUDE.md

Palette + font picker for **startup founders and generalists with no design background** who need a usable palette and font pairing fast. Every feature should answer: "does this get a non-designer to a shippable palette quicker?" If not, push back.

## Stack
- Vite 6 + React 18 + TypeScript (strict), Tailwind v4 via `@tailwindcss/vite`
- shadcn/ui (Radix) primitives in `src/app/components/ui/`, icons from `lucide-react`, toasts via `sonner`
- Origin: exported from Figma Make. No backend, no database — all state lives in the URL.
- `culori` for OKLCH color math, `vitest` for logic tests. Planned: Vercel (hosting, OG image function, Web Analytics)

## Layout
- `src/app/App.tsx` — palette state (initialized from the URL, synced back with replaceState), keyboard shortcuts
- `src/app/components/` — `ColorSwatch`, `PaletteControls` (top toolbar), `FontBar` (docked pairing sample), `LandingPreview` (sample page painted with roles), `ContrastPanel` (AA/AAA badges + fixes), `ExportDialog` (code export tabs + PNG), `ColorWheel` (base color), `HelpOverlay` (`?` key)
- `src/app/utils/` — pure logic: `palette` (vibes + OKLCH generator, lock merging), `describe` (text → vibe/base keyword parser), `fonts` (25 curated Google Fonts pairs), `roles` (auto-assign background/text/primary/accent + readable text shades; slot-stable for generated palettes; brand colors are never altered), `contrast` (WCAG checks + minimal OKLCH fixes), `export` (CSS vars / Tailwind v4 / v3 / Google Fonts, shadcn token names), `shareUrl` (state <-> query string, legacy links), `colorUtils` (Color type/conversions), `clipboard`, `imageExport` (PNG)
- New pure logic goes in `src/app/utils/` with a sibling `*.test.ts`. Keep components thin.

## Commands
- `npm i` · `npm run dev` · `npm run build` (typecheck + build) · `npm test` (vitest)

## Conventions
- Keep the existing visual style: full-height swatch columns, floating white/90 blurred toolbar, shadcn `Button` variants, gray-50 background, sonner toasts.
- Import packages by bare name (`'sonner'`, not `'sonner@2.0.3'` — that's a Figma Make artifact).
- Color math in OKLCH via culori; store/emit hex. Contrast uses WCAG 2.x relative luminance, not YIQ brightness.
- Everything must work by keyboard and on touch — no hover-only controls.
- Shortcuts ignore events from inputs and events with Cmd/Ctrl/Alt modifiers.
- URL is the source of truth for shareable state; keep params short and backward compatible with `?colors=aaaaaa-bbbbbb`.

## Workflow
- One feature per commit; stop after each so the user can test.
- Be concise. Don't rewrite working code; refactor only what a feature touches.
