# Design system 1

> **Read first:** `/Users/joachim/.agents/harness-instructions.md` (harness instructions), `/Users/joachim/0001/AGENTS.md` (0001). This file wins where they differ.

Component-based design system with Lit Web Components.

## System parts

System node: `ds1` ([map](https://system.0001.dev/system?focus=ds1)). Follow the studio’s Selecting System requirements workflow; inspect current edges for Stack dependencies and their evidence.

- Recorded relationships — shared: `auth`, `id1`, `documentation`; local: `design`, `language`, `themes`, `platform-web`; dependency: `sharing`.
- Decisions/exceptions: Architecture, Distribution and Design rules below define the foundation source; Sign-in and Private font workspace define the separate application and private-data scope.
- Text colour decision (`themes`): `--ds-danger-color` is Red for blood on light paper and Tuned red on dark. Red for blood's rule-derived dark version (#9c374c) reads at about 2:1 as 14px text on dark paper; Tuned red reads at 4.8:1. `tests/text-classes.test.ts` checks both contrasts.
- Warning colour decision (`themes`): `--ds-warning-color` is Orange on dark paper and Orange's dim (#4c3f1a) on light. Orange (1.5:1) and its rule-derived dark version #9d8336 (3.3:1) are too light for 14px text on light paper; the dim reads at 9.4:1. `tests/text-classes.test.ts` checks both.
- Coverage: relationships select guides, not proof of acceptance. Proposed (`opportunity`) and unknown (`unverified`) relationships stay distinct; verify applicable requirements for the current change.

## No product names

Design system 1 is a general design system anyone can use. Never name 0001's products (Ezo, Link, Consistency, Peer, Ins, tau99, Visual, the 0001 site, …) anywhere in it: not in components, their comments, CSS, tests, examples, docs, the website or the skill's rules for a component. Describe what a component does and how it looks on its own terms ("filled with a colour", "one control high"), never by the product it came from ("Link's fill", "Ezo's badge size"). The products' own briefs are where they say what they take from it.

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
- `2-core/` — Components: banner, buttons, text, cycle, date, icon, input, toast, tooltip. Toast (`ds-toast.ts`, and the page toaster `0-face/toaster.ts` that shares its queue and stylesheet for pages without Lit) is based on Sonner: keep its API and behaviour Sonner's and say so in its source and docs
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

## Native packages

The Swift package (`native/apple`) and the Kotlin package (`native/android`) are the native Design system 1; read the `design-system-1` skill's Native apps section and https://designsystem1.com/advanced/native/. Their generated files and resources come from DS1's sources (`vp run native:tokens`); never edit them by hand. `vp run native:test` builds and tests the Swift package; `vp run native:test:android` tests, lints and builds the Kotlin one through `scripts/gradle.sh`, which finds Homebrew's OpenJDK 21 and Android command-line tools when `JAVA_HOME` and `ANDROID_HOME` are not set. `native/android/sample` is a catalogue app that takes the library as a product does (`includeBuild`); run it on an emulator to see a change. Android's faces in `native/android/fonts` are written from the woff2 files by `vp run native:fonts`, which needs fontTools and brotli. Both packages copy into products through Sync 1's `swift` and `kotlin` exports.

## Integration

The foundation 0001's products are built on; they copy it with Sync 1.

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

The owner-only adoption dashboard at `dash.designsystem1.com` reads a source snapshot through the Worker. Before changing its scanner or access, or refreshing and publishing its data, read `docs/component-adoption.md`. Keep generated snapshots in private storage, outside the website assets and Git. The Worker must require the pinned owner ID and verified `jaa90@icloud.com` identity for HTML and data; only the sign-in shell is public. The old report routes redirect without data, and Reports is absent from public navigation. Use the existing product account and host-only dashboard session, never a shared-domain cookie.

## App parity

The App parity list in Ezo (`29iiBs`, in the 0001 folder) shows where Ezo, Consistency and Link stand, feature by feature, as Ezo diagrams. Before you build something those apps already have (sign-in, billing, languages, dark mode, the DS one port), read its row and follow the app that has it.

## Design rules

The exact measures and rules of the system (the 20px square, items one square high, widths in whole squares, type, lines, corners, motion) are the `design-system-1` skill in `skills/design-system-1/SKILL.md`. It is linked into `~/.agents/skills`, so every agent loads it for interface work in any 0001 project. Change the rules there, in this repository.

Two type rules every product keeps, here and in Aa: **arrows are always Inter**, in every typeface, code included, through the "Inter Arrows" face (`DS1/1-root/fonts/Inter-Arrows.woff2`, Inter's arrows alone, `unicode-range`) that leads every `--typeface-*` token in `one.css` and `component-tokens.css`; a new typeface token or font stack starts with it. And **code is Iosevka Extended** (`--typeface-mono`, `fonts/Iosevka-Regular.woff2`, cut to what code uses), falling back to a system monospace, never a serif.

## Private icon builder

`icon.designsystem1.com` is the badge and favicon builder, for the owner alone. It is the dashboard's gate on another host: the Worker routes it through `services/src/dashboard.ts` (`ICON_HOST`), which revalidates the owner on every HTML request and keeps its own host-only session cookie; only the sign-in shell and app assets are public. The app shows `app/src/screens/iconBuilder/` there. The builder is not on the public site; the public Icon collection is a plain table. Its drawings (`website/src/lib/icons/studio.ts`, `gridIcon.ts`) also generate the site's favicons.

## Private font workspace

`fonts.designsystem1.com` uses the existing app sign-in. Only the configured owner user ID whose verified account resolves to `jaa90@icloud.com` can read `/api/fonts`, fetch font files or save a Supernatural build. The Worker revalidates each request through `users:current`; the existing `REPORTS_AUTH_URL` and `REPORTS_OWNER_ID` secrets identify that account. The public shell contains no private font data. Sign-in offers the shared email code and owner password; social redirects remain on the main app.

Font files live under `fonts/` in the private `ds-one-libraries` R2 bucket. Keep its public URL and custom domains disabled. Reference files are seeded with `vp run fonts:seed`. Supernatural uploads are capped at 10 MB, stored by content hash and selected by `fonts/supernatural/current.json`; previous versions remain stored. Never place private builds in website assets, app bundles or the npm package. The viewer can preview a local font without saving it; Save font is explicit. Until an original build is supplied, Supernatural has an honest empty state.

The fixed specimen viewport scrolls internally, keeping size changes from moving the page. `vp run deploy` publishes the workspace with the existing site. Run the font access, report access, site routing and configuration tests plus app and Worker typechecks before release.

## System parts for charts

System node: `ds1` ([map](https://system.0001.dev/system?focus=ds1)). Selected parts: `design`, `sharing`, `themes`; applicable dependencies: `stack-lit` and `stack-cloudflare`. Chart drawing and standalone components live in `DS1/2-core/ds-chart.ts` and `DS1/2-core/chart/`, selected through the existing Sync 1 components export as `chart`. Composed dashboards remain outside this core. Theme storage, data and accessible summaries belong to consumers; charts redraw on `refreshTheme()` and system scheme changes. See the Chart documentation for API and limitations. Acceptance and release evidence is in the work item; source relationships alone do not prove visual or live acceptance.

## Internal component visibility

Visibility is independent of the numbered layers. `DS1/0-face/component-visibility.ts` classifies `spacing-handle` and `loading` as internal Core components: built-in editor interactions and automatic pending-state feedback. Their API is documented in source. They remain importable and available through Sync 1, but must not appear in public docs/search/examples or the normal library/workbench picker. `shared/component-directory.ts` exports filtered `LAYERS` for public surfaces and `ALL_LAYERS` for implementation tooling. The docs loader excludes internal names. Do not classify ordinary content components or charts as internal. Visibility is discoverability, not a secrecy or authorization boundary.

## Public font specimens

The public Fonts catalogue uses Aa's `createPlainEditor` for plain specimen text, copied through Sync 1 to `website/src/vendor/aa`. It inherits the specimen font and size, has no focus border or formatting controls, and uses Aa's rounded native-selection painter. This single-block specimen is an intentional exception to Markdown document storage/history in the `editing` guide; no specimen text is persisted. The selected parts for this interaction are `editing`, `design`, and `sharing`.
