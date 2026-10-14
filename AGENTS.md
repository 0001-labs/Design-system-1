# Design system 1

> **Read first:** `/Users/joachim/.agents/harness-instructions.md` (harness instructions), `/Users/joachim/0001/AGENTS.md` (0001). This file wins where they differ.

Component-based design system with Lit Web Components.

## Stack

- Lit 3.0.0 (Web Components)
- TypeScript 5.0.0
- Vite
- Vite+

## Version

0.3.0-alpha.13

## Scripts

- `vp dev` — Development server
- `vp run build` — Full production build
- `vp run docs:dev` — Documentation site
- `vp run build:bundle` — Standard + minified bundles
- `vp lint` / `vp run lint:fix` — Oxlint
- `vp test --passWithNoTests` — Vitest
- `vp run release patch|minor|major|alpha` — publish to npm with semantic versioning (see Distribution)

## Architecture (DS1/)

- `0-face/` — Device detection, i18n, localStorage, themes
- `1-root/` — CSS variables (design tokens), fonts
- `2-core/` — Components: banner, buttons, text, cycle, date, icon, input, tooltip
- `3-unit/` — Composite: list, row, table
- `4-page/` — Page-level layouts
- `x-icon/` — SVG icon library

## Distribution

- npm package `@0001-labs/design-system-1` (it was `ds-one` before; that name keeps its old versions and gets no new ones)
- CDN via jsDelivr: `https://cdn.jsdelivr.net/npm/@0001-labs/design-system-1@alpha/…`

One command publishes a new version (`scripts/release.mjs`, the same file in Aa, Design system 1, IDv1, Drag and Worktrees):

- `vp run release alpha` — the next preview under the `alpha` tag (`-alpha.N` → `-alpha.N+1`)
- `vp run release patch` / `minor` / `major` — a release under `latest`: fixes, something new, something that breaks (from a preview, patch and minor release its own number, major goes to the next major)
- `vp run release current` — publishes the version already in `package.json`, for the first release under the new name
- `--dry-run` after any of them goes through every step without publishing

It refuses with uncommitted changes or when npm is signed out (`vp pm login`), writes the version into every `package.json` and the version references in the docs (`release:sync`, `scripts/versions.mjs`), runs `release:check` (the type check of the package, since `vp check` also covers the Worker, Convex and tests that are not published), `test` and `build`, publishes, then commits `Release @0001-labs/design-system-1 <version>` and tags `v<version>`. A failed step puts everything back.

## Integration

Foundation for Ezo, TAU, and all 0001 products.

## Git commits

- Do not add Co-Authored-By lines to commits.

## GitHub Communication

- Never write comments on GitHub — no PR comments, no issue comments, no code review comments, no replies. All project communication runs in Trello.
- The PR description itself is the only allowed PR text, and it must stay minimal.

## Icon collection

For icon collection additions or SVG refinements, read `docs/icon-library.md`.

## Sign-in

The libraries app (`app/`) signs in through the shared piece from `/Users/joachim/0001/Sign-in`, copied into `convex/signIn` and `app/src/signIn` by `vp run sync-sign-in` (never edit the copies; both sit outside formatting and lint in `vite.config.ts`): the emailed code through `convex/lib/mail` from `MAIL_FROM`, Google and Apple once `SOCIAL_SIGN_IN` and their keys are set, and a password for the addresses in `SIGN_IN_PASSWORD_EMAILS`. The code replaced the magic link, so nothing a mail scanner opens can spend it. A dev deployment with `DEV_LOGIN_LINKS=1` keeps the latest code per address for the end-to-end test (`convex/devLinks.ts`, the `url` column). The dev deployment `aromatic-lapwing-453` carries `SIGN_IN_PASSWORD_EMAILS` and `SIGN_IN_OWNER_EMAIL`; the prod deployment `youthful-curlew-973` has no values yet and does not serve anything. Values never go into files or chat.

## Component adoption report

The owner-only report at `/app/reports/components` reads a source snapshot through the Worker. Before changing its scanner or access, or refreshing and publishing its data, read `docs/component-adoption.md`. Keep generated snapshots in private storage, outside the website assets and Git.

## App parity

The App parity list in Ezo (`29iiBs`, in the 0001 folder) shows where Ezo, Consistency and Link stand, feature by feature, as Ezo diagrams. Before you build something those apps already have (sign-in, billing, languages, dark mode, the DS one port), read its row and follow the app that has it.

## Design rules

The exact measures and rules of the system (the 20px square, items one square high, widths in whole squares, type, lines, corners, motion) are the `design-system-1` skill in `skills/design-system-1/SKILL.md`. It is linked into `~/.agents/skills`, so every agent loads it for interface work in any 0001 project. Change the rules there, in this repository.

Two type rules every product keeps, here and in Aa: **arrows are always Inter**, in every typeface, code included, through the "Inter Arrows" face (`DS1/1-root/fonts/Inter-Arrows.woff2`, Inter's arrows alone, `unicode-range`) that leads every `--typeface-*` token in `one.css` and `component-tokens.css`; a new typeface token or font stack starts with it. And **code is Iosevka** (`--typeface-mono`, `fonts/Iosevka-Regular.woff2`, cut to what code uses), falling back to a system monospace, never a serif.
