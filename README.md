# Color Palette Generator

A palette and font picker for founders and generalists with no design background. Get to a shippable brand look fast.

**Live:** https://color-palette-generator-three-sand.vercel.app

## What it does

- **Generate by vibe.** Seven vibes (including Earthy and Romantic) or a base color. Colors are built in OKLCH and tuned against a benchmark of curated palettes.
- **Describe your project.** Type a sentence and get a suggested palette.
- **Lock and regenerate.** Keep the colors you like, reroll the rest. Works with keyboard and touch.
- **Font pairings.** 25 curated Google Fonts pairs matched to the vibe.
- **Live landing-page preview.** Colors are auto-assigned to background, text, primary and accent roles.
- **Contrast checker.** WCAG AA/AAA badges with one-click fixes.
- **Export.** CSS variables, Tailwind v4 and v3, Google Fonts embed, PNG.
- **Share by URL.** The whole palette lives in the link. No backend, no database.
- **Explore.** Palettes from 120+ curated startup homepages, refreshed weekly by a GitHub Action.

## Stack

Vite 6, React 18, TypeScript (strict), Tailwind v4, shadcn/ui (Radix), `culori` for color math, Vitest. Hosted on Vercel.

## Run it

```bash
npm i
npm run dev        # start the dev server
npm test           # logic tests
npm run build      # typecheck and build to dist/
npm run scan       # refresh Explore data (Playwright)
```

## Notes

Started as a Figma Make export, then rebuilt feature by feature. Project conventions live in [CLAUDE.md](CLAUDE.md).
