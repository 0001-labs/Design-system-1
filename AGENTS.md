# Design system 1

> **Read first:** `/Users/joachim/.agents/harness-instructions.md` (harness instructions), `/Users/joachim/0001/AGENTS.md` (0001). This file wins where they differ.

Component-based design system with Lit Web Components.

## Stack

- Lit 3.0.0 (Web Components)
- TypeScript 5.0.0
- Vite
- Vite+

## Version

0.3.0-alpha.12

## Scripts

- `vp dev` — Development server
- `vp run build` — Full production build
- `vp run docs:dev` — Documentation site
- `vp run build:bundle` — Standard + minified bundles
- `vp lint` / `vp run lint:fix` — Oxlint
- `vp test --passWithNoTests` — Vitest
- `vp run release:patch|minor|major` — Semantic versioning

## Architecture (DS1/)

- `0-face/` — Device detection, i18n, localStorage, themes
- `1-root/` — CSS variables (design tokens), fonts
- `2-core/` — Components: banner, buttons, text, cycle, date, icon, input, tooltip
- `3-unit/` — Composite: list, row, table
- `4-page/` — Page-level layouts
- `x-icon/` — SVG icon library

## Distribution

- npm package (`@alpha` tag)
- CDN via jsDelivr

## Integration

Foundation for Ezo, TAU, and all 0001 products.

## Git commits

- Do not add Co-Authored-By lines to commits.

## GitHub Communication

- Never write comments on GitHub — no PR comments, no issue comments, no code review comments, no replies. All project communication runs in Trello.
- The PR description itself is the only allowed PR text, and it must stay minimal.

## Icon collection

For icon collection additions or SVG refinements, read `docs/icon-library.md`.

## App parity

The App parity list in Ezo (`29iiBs`, in the 0001 folder) shows where Ezo, Consistency and Link stand, feature by feature, as Ezo diagrams. Before you build something those apps already have (sign-in, billing, languages, dark mode, the DS one port), read its row and follow the app that has it.

## Design rules

The exact measures and rules of the system (the 20px square, items one square high, widths in whole squares, type, lines, corners, motion) are the `design-system-1` skill in `skills/design-system-1/SKILL.md`. It is linked into `~/.agents/skills`, so every agent loads it for interface work in any 0001 project. Change the rules there, in this repository.
