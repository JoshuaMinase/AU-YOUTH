# AU Youth Network — Sections 1–3 (React + TypeScript + GSAP)

Real assets from your Figma file, wired into React components with GSAP-driven scroll animation.

## Install

```bash
npm install gsap
```

## Drop into your project

- Copy `public/assets/*` into your project's `public/assets/` folder.
- Copy `components/*.tsx` and `styles/*.module.css` into your project.
- `app/page.tsx` shows how the three sections compose — adapt the import
  paths to wherever your project keeps components (this assumes Next.js
  App Router; for Pages Router, drop the `'use client'` directives aren't
  needed and this becomes a normal page file).

## What's real vs. what's still a placeholder

- **Visuals**: every pixel — the hero, the four experience cards, the
  photo, the four stack cards — comes straight from your Figma export,
  cropped down to just these sections and minified.
- **Text**: still outlined vector shapes, not live HTML text, because I
  don't have your custom font files (`Chopin-Trial`, `Qurova DEMO`,
  `Chunko Bold Demo`) yet. Visually exact, but not selectable or
  screen-reader friendly. Once you send the font files, the right move
  is to rebuild the headline/labels as real text set in those fonts —
  I can do that pass once you have them.
- **Nav links**: real, clickable, positioned over the vector art by
  percentage (see `Hero.module.css`) — just wire up real `href`s.

## Animation behavior

- **Hero**: elements fade/rise in on load (`gsap.from` with `stagger`).
- **Experience section**: fades up as it scrolls into view.
- **Photo + stacking cards (section 3)**: `PhotoStackSection.tsx` pins to the screen and runs one
  scrubbed GSAP timeline. The photo opens from a rounded inset frame to full-bleed, then the four
  cards (cyan, teal, orange, maroon) rise one after another, each covering the last; earlier cards
  step up so their tops peek out, matching the Figma stack. Then the pin releases.
  All timings, order, colours and the photo's start frame live in `components/stackConfig.ts`.
  Reduced-motion users get the finished composition with no pin (pure CSS).

## Not built yet

Section 4 ("All of our ideas in one place") and Section 5 (footer) —
picking those up next.
