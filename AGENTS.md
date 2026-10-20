# Design system 1

> **Read first:** `/Users/joachim/.agents/harness-instructions.md` (harness instructions), `/Users/joachim/0001/AGENTS.md` (0001). This file wins where they differ.

Component-based design system with Lit Web Components.

## Web interface

Lit components are the supported web interface, including in plain HTML: load the stylesheet and module script, then use `ds-*` elements. React adapters wrap those same components. Libraries customize component tokens. CLASSless and the vanilla stylesheet are retired; do not add parallel CSS-only control examples or entry points. Native HTML inside components, semantic prose, shared internal styles/helpers, Swift/Kotlin packages and email rendering retain their roles. Existing saved libraries and published versions keep their compatibility bridge.

The public website uses the shared mobile scale, with `--ds-sf` following `--sf`; desktop stays at 1. Component internals and existing consumers still use some native-control styles and exports. Those remain compatibility dependencies, not a second supported web interface; their removal requires an explicit consumer migration.

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

0.3.0-alpha.28

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
- `2-core/` — Components: Message (inline, banner, toast and assistant forms), buttons, text, cycle, date, icon, input, tooltip. Message is the public component; Notice and Toast remain compatibility entries. Toast (`ds-toast.ts`, and the page toaster `0-face/toaster.ts` that shares its queue and stylesheet for pages without Lit) is based on Sonner: keep its API and behaviour Sonner's and say so in its source and docs
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

The owner-only adoption dashboard at `adoption.designsystem1.com` reads a source snapshot through the Worker. `dash.designsystem1.com` is no longer this Worker's: it is Design system 1's dash portal, its Feedback and Flags served by 0001's System Worker behind the System login. Before changing its scanner or access, or refreshing and publishing its data, read `docs/component-adoption.md`. Keep generated snapshots in private storage, outside the website assets and Git. The Worker must require the pinned owner ID and verified `jaa90@icloud.com` identity for HTML and data; only the sign-in shell is public. The old report routes redirect without data, and Reports is absent from public navigation. Use the existing product account and host-only dashboard session, never a shared-domain cookie.

## App parity

The App parity list in Ezo (`29iiBs`, in the 0001 folder) shows where Ezo, Consistency and Link stand, feature by feature, as Ezo diagrams. Before you build something those apps already have (sign-in, billing, languages, dark mode, the DS one port), read its row and follow the app that has it.

## Design rules

The exact measures and rules of the system (the 20px square, items one square high, widths in whole squares, type, lines, corners, motion) are the `design-system-1` skill in `skills/design-system-1/SKILL.md`. It is linked into `~/.agents/skills`, so every agent loads it for interface work in any 0001 project. Change the rules there, in this repository.

Two type rules every product keeps, here and in Aa: **arrows are always Inter**, in every typeface, code included, through the "Inter Arrows" face (`DS1/1-root/fonts/Inter-Arrows.woff2`, Inter's arrows alone, `unicode-range`) that leads every `--typeface-*` token in `fonts.css` (imported by `one.css`) and `component-tokens.css`; a new typeface token or font stack starts with it. `fonts.css` is the one definition of the faces; nothing a page always loads fetches from another host, and Noto Sans for Japanese and Chinese is the opt-in `cjk.css`. And **code is Iosevka Extended** (`--typeface-mono`, `fonts/Iosevka-Regular.woff2`, cut to what code uses), falling back to a system monospace, never a serif.

## Private icon builder

`icon.designsystem1.com` is the badge and favicon builder, for the owner alone. It is the dashboard's gate on another host: the Worker routes it through `services/src/dashboard.ts` (`ICON_HOST`), which revalidates the owner on every HTML request and keeps its own host-only session cookie; only the sign-in shell and app assets are public. The app shows `app/src/screens/iconBuilder/` there. The builder is not on the public site; the public Icon collection is a plain table. Its drawings (`website/src/lib/icons/studio.ts`, `gridIcon.ts`) also generate the site's favicons.

## Private font workspace

`fonts.designsystem1.com` uses the existing app sign-in. Only the configured owner user ID whose verified account resolves to `jaa90@icloud.com` can read `/api/fonts`, fetch font files or save a build of a face in development. The Worker revalidates each request through `users:current`; the existing `REPORTS_AUTH_URL` and `REPORTS_OWNER_ID` secrets identify that account. The public shell contains no private font data. Sign-in offers the shared email code and owner password; social redirects remain on the main app.

Font files live under `fonts/` in the private `ds-one-libraries` R2 bucket. Keep its public URL and custom domains disabled. Reference files are seeded with `vp run fonts:seed`. The faces in development are the `DEVELOPMENT` table in `services/src/fonts.ts`, today Supernatural (`supernatural`) and 0001 Sans (`0001-sans`); a new face is a row there and its empty-state words in `app/src/screens/FontWorkspace.tsx`. A build is saved with `PUT /api/fonts/<id>`, capped at 10 MB, stored by content hash under `fonts/<id>/` and selected by `fonts/<id>/current.json`; previous versions remain stored, and saving one face never moves another's pointer. The references cannot be overwritten. Never place private builds in website assets, app bundles or the npm package. The viewer can preview a local font without saving it; Save font is explicit. Until an original build is supplied, each face in development has an honest empty state.

A face marked `drawing` in that table (0001 Sans) is drawn in the workspace's **workbench**, the Draw view (`app/src/screens/fontWorkbench/`): cubic Bézier contours per character, with select, pen, rectangle, oval, smooth, reverse, delete, copy, paste and undo, the advance width, and the drawing tried as text below on the face's own line. Its source format is `shared/font-source.ts` (UFO's point types, whole units, y up), validated by the Worker before it is stored: `PUT /api/fonts/<id>/source` keeps each drawing by content hash under `fonts/<id>/source/` with `fonts/<id>/source/current.json` naming the latest, and earlier drawings remain stored. Save as build writes an OpenType font from the drawing in the browser (opentype.js, on the vertical measures in `DEFAULT_METRICS`) and saves it as the face's build, so Specimen and Glyphs show it. Figures are drawn proportional; the build adds a tabular copy of each, centred in the drawing's `figureWidth` (the widest figure's when unset), behind the `tnum` feature, so `font-variant-numeric: tabular-nums` in tables and stats keeps its columns. References are drawn behind each glyph and never copied into the drawing: the GT America reference from R2, and a face opened from this computer (a Mac's Helvetica collection included), which is read in the browser and never uploaded. The workbench has no import of another face's outlines; a drawing that started from GT America's or Helvetica's outlines would be a derivative of a licensed face.

The fixed specimen viewport scrolls internally, keeping size changes from moving the page. `vp run deploy` publishes the workspace with the existing site. Run the font access, report access, site routing and configuration tests plus app and Worker typechecks before release.

## System parts for charts

System node: `ds1` ([map](https://system.0001.dev/system?focus=ds1)). Selected parts: `design`, `sharing`, `themes`; applicable dependencies: `stack-lit` and `stack-cloudflare`. Chart drawing and standalone components live in `DS1/2-core/ds-chart.ts` and `DS1/2-core/chart/`, selected through the existing Sync 1 components export as `chart`. Composed dashboards remain outside this core. Theme storage, data and accessible summaries belong to consumers; charts redraw on `refreshTheme()` and system scheme changes. See the Chart documentation for API and limitations. Acceptance and release evidence is in the work item; source relationships alone do not prove visual or live acceptance.

## Internal component visibility

Visibility is independent of the numbered layers. The private workspace package **App** (`packages/app`, `@0001-labs/app`, `private: true`) owns Keyboard shortcut, Spacing handle and Loading indicator. Their source, React adapters and dedicated styles live in `packages/app/src`; never import them from public `DS1/` or add them to its npm files or bundle. App composes public DS1 foundations in this workspace and is not published. Public Keys and native prose `<kbd>` remain public.

`DS1/0-face/component-visibility.ts` excludes these controls from public docs/search/examples and normal library pickers. Sync 1's component graph supports explicit internal selections from App while preserving the copied layout; ordinary public selections never include App controls. `scripts/clean-public-dist.mjs` clears old compiled modules before public builds. `vp run package:check` inspects the actual packed archive and bundles for App leakage; run it after `build:bundle` and before release.

Owner-only documentation opens inside the normal header and sidebar at `/libraries/workspace/?internal=<component>`. The authenticated navigation response supplies each internal entry's numbered layer; the sidebar places its muted grey link alphabetically within that layer, aligned with sibling component labels and carrying an App tag. There is no separate App group. Keep these entries out of the public layer overview pages. App's label belongs in the owner document's header chrome.

The private document and assets use `/private-app/` on `designsystem1.com` (embedded in the shell) and `adoption.designsystem1.com` (legacy access). The existing session bridge sets a host-only HttpOnly cookie after verifying the pinned owner ID and verified account; the Worker revalidates through the same report authority on every document and asset request. Other hosts deny the prefix. Anonymous requests go to sign-in; nonowners are denied. Keep App files out of public search and sitemaps. Selected System parts: `auth`, `sharing`, `design`, `documentation`, `platform-web`, `themes`; this extends the existing owner-only surface without changing shared sign-in or public component visibility.

## Public font specimens

The public Fonts catalogue uses Aa's `createPlainEditor` for plain specimen text, copied through Sync 1 to `website/src/vendor/aa`. It inherits the specimen font and size, has no focus border or formatting controls, and uses Aa's rounded native-selection painter. This single-block specimen is an intentional exception to Markdown document storage/history in the `editing` guide; no specimen text is persisted. The selected parts for this interaction are `editing`, `design`, and `sharing`.

## Read-only example source

Component and layout example code uses the existing Sync 1 Aa snapshot in `website/src/vendor/aa`, through `createEditor` with `readOnly: true` and menus and toolbar disabled. Selected parts: `editing`, `documentation`, `design`, and `themes`. Code is wrapped in a safe Markdown fence for display; copying retains the exact original source. This is a public source viewer, not a replacement for a writable document editor: persistence, undo, attachments, collaboration and an editor migration flag do not apply. The shared example wrapper uses the theme-aware grey fill and remains collapsed initially.

## System parts for Table of contents

Table of contents is the public Unit `ds-table-of-contents` (`DS1/3-unit/`), used by the documentation's right sidebar through `website/src/components/TableOfContents.astro`. Page layout owns its placement and visibility; the full-width Examples page omits it. Selected System parts: `design`, `documentation`, `sharing`, `themes`, `platform-web`. It is a new opt-in Sync 1 component; existing document-layout contents and Starlight's compact mobile contents retain their existing behavior.

## Product code

Canonical short code: `DS1`. Use this three-character code for product-owned libraries and other compact ownership labels. Use this code followed by a colon for commit subjects; keep the full product name in prose.

## Feature flags

Selected System part: `feature-flags`. The release controls are the Flags tab of Design system 1's dash portal, `https://dash.designsystem1.com/flags`, on 0001's System Worker behind the System login, which reads and saves them through the private `FeatureFlagsService` binding; `/flags` and `/app/flags` on the site's hosts redirect there. The Worker `/api/flags` handler reuses the pinned `REPORTS_OWNER_ID`, validated Convex session and verified owner identity; no browser-provided identity grants access. Release definitions are in `shared/feature-flags.ts`, initially empty. There are no declared release switches until a real unfinished feature selects one. Rules use the private R2 `feature-flags/` prefix; authenticated writes require same-origin requests. The shared evaluator and management controls are copied through Sync 1 into `shared/feature-flags-runtime`. When declaring a flag, gate its interface and every protected backend operation; published library visibility and existing access permissions remain separate.

## Company and library workspace

The signed-in account's company name is stored in `accountProfiles`, indexed by its authenticated user ID. `/libraries/workspace/` keeps the documentation shell with the fixed Design system 1 header. The signed-in sidebar shows the company avatar/name as noninteractive identity and a sidebar collapse control. Library listing, selection and creation belong on the profile, never in the documentation sidebar. Sidebar components open the existing persistent editor. Documentation layer labels open their visual overview pages, with independent leading disclosure buttons. Root uses yellow, Core green, Unit blue and Page orange for these overview showcases. Base documentation remains at `/start-here/overview/`. Selected System parts: `auth`, `design`, `themes`, `platform-web`, `documentation`, and `sharing`; this is app-owned navigation using existing DS1 controls, with no shared component change to propagate. Publication history and install URLs come from existing library queries. Installation-location tracking and library font uploads remain unimplemented; the private font workspace is a separate feature. Stack nodes have no standalone guides; the scripts and checks here govern them.
