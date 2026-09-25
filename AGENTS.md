# Design system 1

Component-based design system with Lit Web Components.

## Stack

- Lit 3.0.0 (Web Components)
- TypeScript 5.0.0
- Vite
- Vite+

## Version

0.3.0-alpha.9

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
