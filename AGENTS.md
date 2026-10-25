# Design system 1

> **Read first:** `/Users/joachim/.agents/harness-instructions.md` (harness instructions), `/Users/joachim/0001/AGENTS.md` (0001). This file wins where they differ.

Component-based design system with Lit Web Components.

## Web interface

Lit components are the supported web interface, including in plain HTML: load the stylesheet and module script, then use `ds-*` elements. React adapters wrap those same components. Libraries customize component tokens. CLASSless and the vanilla stylesheet are retired; do not add parallel CSS-only control examples or entry points. Native HTML inside components, semantic prose, shared internal styles/helpers, Swift/Kotlin packages and email rendering retain their roles. Existing saved libraries and published versions keep their compatibility bridge.

The public website uses the shared mobile scale, with `--ds-sf` following `--sf`; desktop stays at 1. Component internals and existing consumers still use some native-control styles and exports. Those remain compatibility dependencies, not a second supported web interface; their removal requires an explicit consumer migration.

## System parts

System node: `ds1` ([map](https://system.0001.dev/system?focus=ds1)). Follow the studio’s Selecting System requirements workflow; inspect current edges for Stack dependencies and their evidence.

- Recorded relationships — shared: `auth`, `id1`, `documentation`; local: `design`, `language`, `themes`, `platform-web`; dependency: `sharing`.
- The private composition workspace reuses the existing Aa build and takes Drag's `sortable` source through Sync 1. Composition selection, commands and history remain in that workspace pending the engine-ownership review.
- Decisions/exceptions: Architecture, Distribution and Design rules below define the foundation source; Sign-in and Private font workspace define the separate application and private-data scope.
- Text colour decision (`themes`): `--ds-danger-color` is Red for blood on light paper and Tuned red on dark. Red for blood's rule-derived dark version (#9c374c) reads at about 2:1 as 14px text on dark paper; Tuned red reads at 4.8:1. `tests/text-classes.test.ts` checks both contrasts.
- Materials (`themes`): web surfaces opt into `DS1/1-root/material.css`; see `website/src/content/docs/1-root/material.mdx` for Solid, Paper, Glass and Wash, performance limits and accessibility fallbacks. Existing component faces and native packages keep their current appearance. After changing materials, run `node scripts/material-paper.mjs --check` and `node scripts/check-material.mjs <docs-preview-url>`.
- Warning colour decision (`themes`): `--ds-warning-color` is Orange on dark paper and Orange's dim (#4c3f1a) on light. Orange (1.5:1) and its rule-derived dark version #9d8336 (3.3:1) are too light for 14px text on light paper; the dim reads at 9.4:1. `tests/text-classes.test.ts` checks both.
- Coverage: relationships select guides, not proof of acceptance. Proposed (`opportunity`) and unknown (`unverified`) relationships stay distinct; verify applicable requirements for the current change.

## No product names

Exception agreed 22 October 2026: the private `packages/consistency` workspace is named **Consistency**. It brings Aa text editing and DS1 composition together, identified by a yellow editing tag. This name belongs to that opt-in editor layer and its owner preview; public general-purpose components keep neutral names.

The Consistency editor now joins the shared CMS workspace at https://c9y.site, owner-only first ([work](https://ezo.gs/YN97NN)). The page editor alone is the owner's lab at https://editor.c9y.site (its root opens the editor; `neweditor.c9y.site`, its first address, leads there). `packages/consistency/preview.ts` mounts the CMS shell copied by Sync 1; the editor exposes a versioned document boundary. The owner-authenticated Worker API calls only the private Consistency platform service binding; composition drafts have their own SQLite object and revision history, separate from client databases. c9y.site opens on the home (`packages/consistency/src/home.ts`, served from `home.html`): the sidebar's first row is the workspace (its outlined avatar, the account's company name from `/api/consistency/profile` with a menu holding only Settings, drawn at once from the name last read) and the notifications bell (empty for now). The sidebar has no other rows: pressing the workspace shows Sites, hovering it opens its menu (DS1's `hover`; the arrow keys open it too), whose one entry is Settings; and the page shows Sites when no setting is open. Each page opens with its title at display size, as Money's do. Sites shows the owner's sites (Flavo, CPH Raft, Søndergården) as cards only, each opening its editor at `/team/` on its c9y.site address (the site beside its sidebar, ready to edit). Settings follows Money's settings: text tabs under the title, each tab its own address. Domains (`#settings/domains`, `packages/consistency/src/domains.ts`) connects the owner's own domains to their sites. `/api/consistency/domains` checks the owner as every c9y.site request does (System's One key, or the dashboard session), plus the origin and the request's shape. It then calls only the platform's `ConsistencyWorkspace`, which talks to Cloudflare for SaaS and alone decides when a domain is connected (`/Users/joachim/0001/Consistency/platform/AGENTS.md`, Customers' own domains). Waiting domains are checked on entry, on return and every 30 seconds while visible; there is no check button. Account (`#settings/account`) shows the workspace's name and Sign out. Run `packages/consistency/tests/home.mjs` and `packages/consistency/tests/domains.mjs` after changing them. `/api/consistency/profile` checks the owner as every c9y.site request does, then reads only `users:profile` with the same session. The page editor stays at `/private-consistency/`. Run `packages/consistency/tests/home.mjs` after changing the home. Signing in to c9y.site is the owner's one Consistency sign-in (`services/src/consistency-owner.ts`): signed out, the home asks System's One key quietly (`/auth/start?silent=1`, the `c9y` client through the `C9Y_IDENTITY` binding to `ConsistencyIdentity`), then out loud once; the delegated token is a host-only `__Host-c9y_owner` cookie, asked of System on every request. The same System session opens every site editor signed in, and Sign out (`DELETE /api/dashboard/session`) revokes it, ending them all. The existing verified owner session is still accepted; editor.c9y.site keeps it alone. Existing client editors open from Sites. Draft composition publishing and public signup are later milestones. Read `/Users/joachim/0001/Consistency/AGENTS.md` for ownership and the future IROCO and consistency.site migrations. Browser workspace and editor acceptance contracts remain required.

The lab lives at `https://editor.c9y.site`, using this site's existing server-checked owner session. Source is `packages/consistency`; its assets are excluded from the public npm package and denied on other hosts. Its drafts are page-local compositions; follow **Direct editing surfaces** in the design-system-1 skill: the interaction design is still being tested before adoption elsewhere.

**A site's words** (25 October 2026): the shell's Sites open a Consistency site in the work (`openSite` in `preview.ts`, `packages/consistency/src/site-editor.ts`, pure parts in `site-editing.ts`). A page picker lists the site's pages by language; the page is shown as its visitors see it and its words are edited where they stand with Aa's plain editor in the frame's document, under DS1's context bar (the field's name, Save, Cancel; Escape cancels, Mod+Enter saves, Enter saves one line). Every save is a Team CMS edit on the live site, rendered with Team CMS's own `markdown.ts` (Sync 1 `workspace` export); a link to one of the site's pages is followed, saving first, and nothing else in the page does anything. Only words: there is no composition publishing for sites yet, so no composition tool is mounted for a site, and the title, description, share image and history stay in the site's own editor. A site whose words live elsewhere (Flavo, the planning site; the platform answers `not-editable`) shows a link to its own editor. The gateway is `services/src/consistency-sites.ts`: `/api/consistency/sites/<id>/pages`, `page?path=`, `edit` (POST, same-origin JSON, at most 64 KB), `document?path=` and `files/<path>`, each after `authorizeOwner`, calling only `CONSISTENCY_WORKSPACE`. **Decision:** the page is served on this origin with `Content-Security-Policy: sandbox allow-same-origin` and no script source, framed with `sandbox="allow-same-origin"`, and its files only as styles, fonts, pictures or video, each sandboxed too. Same origin lets the editor reach into the document and lets the site's fonts and `crossorigin` stylesheets load; the sandbox means no script of a site's ever runs here with the owner's cookies, even when the address is opened alone. What a page draws with its own scripts is therefore not drawn in the editor. Run `packages/consistency/tests/sites.mjs` and `services/test/consistency-sites.test.ts` after changing it; the platform side is in `/Users/joachim/0001/Consistency/platform/AGENTS.md` (Editing a site's words from the editor).

Reordering must settle once into its final grid-aligned position. Resolve final sizing, spacing, wrapping and column membership before measuring the drop target; never animate to an intermediate layout and correct it afterward. Keep a pointer regression that compares the landing endpoint and committed layout.

The Consistency editor must never create a full-page horizontal scrollbar. Header, toolbars and inspector fit and wrap within the viewport. Desktop preview fills the available stage beside the controls; mobile preview fits the stage, centered horizontally and vertically inside a visible frame with surrounding canvas space. The example picker loads editable adaptations of existing DS1 example pages and keeps each page's edits while switching during the session. The default is Consistency editor, an editable introduction with Aa diagrams, cards and a table; Studio remains a separate example. The controls own the page/library pickers and mobile preview; the canvas has no editor header or Undo/Redo/Reset buttons. Do not mask layout failures with root `overflow-x: hidden`. After changing the editor layout, library geometry or popups, run `vp run consistency:test:viewport` before release: the local browser contract covers 300, 390, 768 and 1440px, a wide authored page, Bold controls, the open action toolbar and mobile preview.

The private editor must keep text readable: ordinary text and stats need at least ten squares (200 logical pixels) of available width; cards also reserve their padding. Resizing, padding and gaps must stop or reflow before content becomes narrow strips. Text sections wrap at words, and rows stack when they cannot fit readable children. Website text always stays at least one square (20 logical pixels) inside both viewport edges, including mobile and saved zero-padding layouts; full-width backgrounds and media may still reach the edge. Card text keeps at least one square (20 logical pixels) inside all four card edges across libraries, inserted cards, previews and live resizing; media may bleed to the edge. Resize minimums include that inset and the full text height. Check these bounds in the viewport regression test.

Interactive previews retain the normal DS1 typography and control size for the selected library. Never reduce their text through zoom, transform scaling or smaller font overrides to fit the preview: reduce surrounding space or reflow the specimen instead. Film-kit compositions are the explicit exception to this preview scaling constraint. Measurements use plain numbers directly in soft hover highlights, without coloured label chips. Aa block selection, composition selection and marquee selection use a soft grey fill, never yellow outlines. Selecting a section or text container paints its authored component leaves separately; the container, inter-component gaps and trailing section space stay unfilled. Spacing handles keep their separate blush treatment. Open formatting toolbars and context menus temporarily pause spacing, boundaries and resizing; their inspector switches show disabled with the reason, and closing restores the saved preferences. Clicking outside dismisses a context immediately.

The private editor is the main development surface for Aa plus its Consistency expansion. Its `/private-consistency/guide/` page, linked from Composition controls, documents ownership: vanilla Aa owns text/caret/selection/formatting/Markdown and text history; Consistency owns site composition and design manipulation. Fix text-editing behavior in canonical Aa, test it alone, commit it and take its built export with Sync 1. Do not implement Aa fixes in the Consistency shell. The guide is private under the same owner authorization as the editor and opens separately to preserve the current draft.

The inspector uses DS1’s opt-in `compact monochrome` switches: 24 × 12px visual pills within 40 × 20px targets, with ink/paper on-state. Layer names retain normal text size and short explanations remain below; rows stack without empty spacer rows. This private control-panel trial does not restyle default or native switches elsewhere.

The independent Grouping layer explains actual section, row/column and component containers with neutral outlines and descriptive names. It is read-only, opt-in, clipped to the canvas and pointer-transparent; it never creates groups, changes selection or writes history. Keep it separate from Component names and document it in the Editor guide.

Selection and gestures follow `editing.gesture-ownership` in the design-system-1 skill. Marquee keeps spacing available; passive hover toolbars cannot take over a held pointer. Shift-drag extends selection within section backgrounds, while normal section dragging keeps its reorder behavior. `packages/consistency/tests/interactions.mjs` checks real pointer ownership, spacing after selection, cached hit testing, cancellation and scroll-relative selection. This remains a private editor trial before adoption in other products.

Card spacing follows `editing.linked-preview` in the design-system-1 skill: matching cards update throughout the drag, with one undoable release and full cancellation. `packages/consistency/tests/card-spacing.mjs` exercises static and inserted cards, independent text and Consistency off.

Spacing applies between distinct Aa blocks and inserted units, including blocks within columns and tab panels. Between groups, one editable gap spans the visible component edges; grouping adds no hidden spacer. Moving a block must preserve that single gap, including at zero and when columns stack. The pointer regression is `packages/consistency/tests/group-gaps.mjs`. Unit-only columns hug their components, with draggable horizontal gaps that become vertical when the columns stack; zero gaps remain reachable and pointer drags preserve readable widths; wrapped lines remain one block. Component names is an independent, opt-in inspection layer, outside authored content and history. Images keep their background within their own bounds. The empty carousel atom reuses `ds-carousel`, stores slides in Aa Markdown, and exposes image editing and grid-snapped resizing without a separate content editor.

## Live base

The base system is edited live on designsystem1.com by the owner, and products that link it take each save at once, without a release. The owner opens it from **My libraries → Design system 1**, the last group of the owner navigation after Adoption and Architecture: `/libraries/design-system-1/` holds the component editor at `/app/base` in the documentation shell, and `/app/base` opened directly redirects there (`shared/library-navigation.ts`). `?view=tokens` keeps the token workbench, which edits every token of the component template; each change autosaves as a new version. Saving and restoring go through the Worker's `/api/base` (`services/src/base.ts`). It checks the verified owner, the `base-live-editing` flag (owner audience) and the same origin, then calls `convex/base.ts`, which checks the owner again (`SIGN_IN_OWNER_EMAIL`, verified) and keeps every version in `baseVersions`.

The Worker then writes the version's sheet to R2: `ds1/base/v/{n}.css` first, then `ds1/base/latest.css`, its byte copy. Both are served like a library's, at `/ds1/base/latest.css`. The sheet is only the final override block, as `:root` tokens (`shared/base-sheet.ts`). Values that could carry rules, imports or addresses are refused, and an empty sheet changes nothing. History restores an earlier version as a new one.

Consumers link the sheet as the first element of the body, after every stylesheet their build puts in the head: the docs in `MyHeader.astro`, the example frames, and every product per System's DS1 guide. It overrides tokens declared at `:root`. Tokens set on a more specific selector (a theme attribute) or in a stylesheet loaded later keep their own value. Component code stays a Sync 1 snapshot. Writing the saved values back into `DS1/1-root` for npm and Sync 1 is a separate step, not yet built.

Run `tests/base-sheet.test.ts`, `tests/base-system.test.ts` and `services/test/base.test.ts` when changing it. Convex functions are pushed with `vp exec convex dev --once`: `.env.local` names the live deployment `aromatic-lapwing-453`.

## Documentation examples

The owner controls which examples appear in the docs from `https://dash.designsystem1.com/examples`, on the existing System dashboard and owner session. `shared/doc-examples.ts` is the visibility catalogue. System calls the private DS1 `FeatureFlagsService.listExamples` and `setExample` methods; per-example settings live under `docs/examples/` in the private libraries bucket. The Worker removes disabled cards and their iframes from `/start-here/examples/` before delivery, with no-store caching. Direct example URLs stay available for preview; this is a publishing preference, not private-content access control. Existing examples default on; the financial-services draft defaults off. Run catalogue and Worker visibility tests when changing examples, and System dashboard authorization/CSRF tests when changing the controls.

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
- `vp run consistency:build` — Build the private spacing and bounds editor into the site's gated assets
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

## Black box tests

`vp run e2e:blackbox` (`scripts/e2e-blackbox.mjs`) checks Design system 1 as anyone on the internet meets it, signed out and over HTTP alone: every page in the navigation, the Overview's component directory and the sitemap, the redirects and hosts, every file those pages load, the hosted stylesheet and module from Use with HTML, Play, System CI where `/flags` sends, the owner-only hosts asking to sign in, and the published package: the version npm's `alpha` tag names, with its main entry, `one.css`, `grid.css`, fonts and chunks on jsDelivr. Each step is a contract from the Worker (`services/src/index.ts`, `dashboard.ts`), `website/astro.config.mjs`, `website/public/_headers`, the README and this file's Distribution; when one of those changes, change the step with it. It sends only GETs and HEADs, without credentials, so it is safe against production. It runs against `https://designsystem1.com` by default, `--local` against the docs dev server and `--base http://localhost:8787` against `wrangler dev`; every run is recorded for System → Tests as "Design system 1 black box". Run it after each site deploy and each release.

## Phone check

`vp run constraints:phone <address>` (`scripts/constraints-phone.ts`) runs every constraint in `DS1/0-face/constraints.ts` on every page in a site's sitemap. It opens each page in Playwright's WebKit as an iPhone 320, 375, 393 and 430px wide, and fails while any rule is broken. It sends GETs only, so it is safe against production. Run it before releasing a site built on a library; it needs `vp exec playwright install webkit` once.

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

The libraries app (`app/`) is Lit, no React: light-DOM elements (`ds1-*`, on `AppElement` in `app/src/lib/element.ts`) with `@lit-labs/signals` for shared state, on DS1's own elements; Convex through one `ConvexClient` (`app/src/lib/backend.ts`), which keeps Convex Auth's session under its React provider's storage keys and gives elements live queries. It signs in through the shared piece from `/Users/joachim/0001/Sign-in`, copied into `convex/signIn` and `app/src/signIn` by `vp run sync-sign-in` (never edit the copies; both sit outside formatting and lint in `vite.config.ts`): the emailed code through `convex/lib/mail` from `MAIL_FROM`, Google and Apple once `SOCIAL_SIGN_IN` and their keys are set, and a password for the addresses in `SIGN_IN_PASSWORD_EMAILS`. The code replaced the magic link, so nothing a mail scanner opens can spend it. A dev deployment with `DEV_LOGIN_LINKS=1` keeps the latest code per address for the end-to-end test (`convex/devLinks.ts`, the `url` column). The dev deployment `aromatic-lapwing-453` carries `SIGN_IN_PASSWORD_EMAILS` and `SIGN_IN_OWNER_EMAIL`; the prod deployment `youthful-curlew-973` has no values yet and does not serve anything. Values never go into files or chat.

## Component adoption report

The owner-only adoption dashboard at `https://designsystem1.com/adoption/` reads a source snapshot through the Worker. `dash.designsystem1.com` is no longer this Worker's: it was to be Design system 1's dash portal on 0001's System Worker, and resolves to that dashboard (verified 23 October 2026); the flags are in System CI (see Feature flags). Before changing its scanner or access, or refreshing and publishing its data, read `docs/component-adoption.md`. Keep generated snapshots in private storage, outside the website assets and Git. The Worker must require the pinned owner ID and verified `jaa90@icloud.com` identity for HTML and data; only the sign-in shell is public. The old report routes redirect without data. Adoption is the final navigation section, visible only to the verified owner. Its matrix and glossary render directly in the documentation page, with no embedded application or separate header/sign-out; the separate adoption domain is retired. Use the existing product account and host-only dashboard session, never a shared-domain cookie.

**Architecture** follows Adoption in the owner's navigation, at `https://designsystem1.com/architecture/`, behind the same Worker gate and owner cookie. Because the document names the products that consume Design system 1, it never enters this repository. Its text lives in its work item in the owner's planning list. It is published to the private R2 key `reports/architecture.md` from `.reports/architecture.md` (ignored) with `vp run architecture:upload`. `/api/reports/architecture` serves it to the verified owner alone, and the page draws it read-only with the vendored Aa editor and its diagram atom.

## App parity

The App parity list in Ezo (`29iiBs`, in the 0001 folder) shows where Ezo, Consistency and Link stand, feature by feature, as Ezo diagrams. Before you build something those apps already have (sign-in, billing, languages, dark mode, the DS one port), read its row and follow the app that has it.

## Design rules

The exact measures and rules of the system (the 20px square, items one square high, widths in whole squares, type, lines, corners, motion) are the `design-system-1` skill in `skills/design-system-1/SKILL.md`. It is linked into `~/.agents/skills`, so every agent loads it for interface work in any 0001 project. Change the rules there, in this repository.

Two type rules every product keeps, here and in Aa: **arrows are always Inter**, in every typeface, code included, through the "Inter Arrows" face (`DS1/1-root/fonts/Inter-Arrows.woff2`, Inter's arrows alone, `unicode-range`) that leads every `--typeface-*` token in `fonts.css` (imported by `one.css`) and `component-tokens.css`; a new typeface token or font stack starts with it. `fonts.css` is the one definition of the faces; nothing a page always loads fetches from another host, and Noto Sans for Japanese and Chinese is the opt-in `cjk.css`. And **code is Iosevka Extended** (`--typeface-mono`, `fonts/Iosevka-Regular.woff2`, cut to what code uses), falling back to a system monospace, never a serif.

## Private icon builder

`icon.designsystem1.com` is the badge and favicon builder, for the owner alone. It is the dashboard's gate on another host: the Worker routes it through `services/src/dashboard.ts` (`ICON_HOST`), which revalidates the owner on every HTML request and keeps its own host-only session cookie; only the sign-in shell and app assets are public. The app shows `app/src/screens/iconBuilder/` there. The builder is not on the public site; the public Icon collection is a plain table. Its drawings (`website/src/lib/icons/studio.ts`, `gridIcon.ts`) also generate the site's favicons.

## Private font workspace

`fonts.designsystem1.com` uses the existing app sign-in. Only the configured owner user ID whose verified account resolves to `jaa90@icloud.com` can read `/api/fonts`, fetch font files or save a build of a face in development. The Worker revalidates each request through `users:current`; the existing `REPORTS_AUTH_URL` and `REPORTS_OWNER_ID` secrets identify that account. The public shell contains no private font data. Sign-in offers the shared email code and owner password; social redirects remain on the main app.

Font files live under `fonts/` in the private `ds-one-libraries` R2 bucket. Keep its public URL and custom domains disabled. Reference files are seeded with `vp run fonts:seed`. The faces in development are the `DEVELOPMENT` table in `services/src/fonts.ts`, today Supernatural (`supernatural`) and 0001 Sans (`0001-sans`); a new face is a row there and its empty-state words in `app/src/screens/FontWorkspace.ts`. A build is saved with `PUT /api/fonts/<id>`, capped at 10 MB, stored by content hash under `fonts/<id>/` and selected by `fonts/<id>/current.json`; previous versions remain stored, and saving one face never moves another's pointer. The references cannot be overwritten. Never place private builds in website assets, app bundles or the npm package. The viewer can preview a local font without saving it; Save font is explicit. Until an original build is supplied, each face in development has an honest empty state.

A face marked `drawing` in that table (0001 Sans) is drawn in the workspace's **workbench**, the Draw view (`app/src/screens/fontWorkbench/`): cubic Bézier contours per character, with select, pen, rectangle, oval, smooth, reverse, delete, copy, paste and undo, the advance width, and the drawing tried as text below on the face's own line. Its source format is `shared/font-source.ts` (UFO's point types, whole units, y up), validated by the Worker before it is stored: `PUT /api/fonts/<id>/source` keeps each drawing by content hash under `fonts/<id>/source/` with `fonts/<id>/source/current.json` naming the latest, and earlier drawings remain stored. Save as build writes an OpenType font from the drawing in the browser (opentype.js, on the vertical measures in `DEFAULT_METRICS`) and saves it as the face's build, so Specimen and Glyphs show it. Figures are drawn proportional; the build adds a tabular copy of each, centred in the drawing's `figureWidth` (the widest figure's when unset), behind the `tnum` feature, so `font-variant-numeric: tabular-nums` in tables and stats keeps its columns. References are drawn behind each glyph and never copied into the drawing: the GT America reference from R2, and a face opened from this computer (a Mac's Helvetica collection included), which is read in the browser and never uploaded. The workbench has no import of another face's outlines; a drawing that started from GT America's or Helvetica's outlines would be a derivative of a licensed face.

The fixed specimen viewport scrolls internally, keeping size changes from moving the page. `vp run deploy` publishes the workspace with the existing site. Run the font access, report access, site routing and configuration tests plus app and Worker typechecks before release.

## System parts for charts

System node: `ds1` ([map](https://system.0001.dev/system?focus=ds1)). It holds the design, component and language rules every product follows in its own implementation guide (the former Design & components and Languages parts). Selected parts: `sharing`, `themes`, `dashboard`; its email renderer (`DS1/4-page/email.ts`) is what the `stack-resend` guide sends with; applicable dependencies: `stack-lit` and `stack-cloudflare`. Chart drawing and standalone components live in `DS1/2-core/ds-chart.ts` and `DS1/2-core/chart/`, selected through the existing Sync 1 components export as `chart`. Composed dashboards remain outside this core. Theme storage, data and accessible summaries belong to consumers; charts redraw on `refreshTheme()` and system scheme changes. See the Chart documentation for API and limitations. Acceptance and release evidence is in the work item; source relationships alone do not prove visual or live acceptance.

## Internal component visibility

Visibility is independent of the numbered layers. The private workspace package **App** (`packages/app`, `@0001-labs/app`, `private: true`) owns Keyboard shortcut, Spacing handle and Loading indicator. Their source, React adapters and dedicated styles live in `packages/app/src`; never import them from public `DS1/` or add them to its npm files or bundle. App composes public DS1 foundations in this workspace and is not published. Public Keys and native prose `<kbd>` remain public.

`DS1/0-face/component-visibility.ts` excludes these controls from public docs/search/examples and normal library pickers. Sync 1's component graph supports explicit internal selections from App while preserving the copied layout; ordinary public selections never include App controls. `scripts/clean-public-dist.mjs` clears old compiled modules before public builds. `vp run package:check` inspects the actual packed archive and bundles for App leakage; run it after `build:bundle` and before release.

IndexedDB is a documentation-only ghost component in App, under **1 Root**, at `/libraries/workspace/?internal=indexeddb`. It explains account-scoped query snapshots, hydration, live refresh, incremental persistence and the separate pending-edit queue. It renders no control and exports no runtime; application storage remains product-owned. Its guide is in `packages/app/index.html`, behind the existing owner gate, with no public catalogue, search or npm entry.

Owner-only documentation opens inside the normal header and sidebar at `/libraries/workspace/?internal=<component>`. The authenticated navigation response supplies each internal entry's numbered layer; the sidebar places its muted grey link alphabetically within that layer, aligned with sibling component labels and carrying an App tag. There is no separate App group. Keep these entries out of the public layer overview pages. App's label belongs in the owner document's header chrome.

Both the desktop rail and phone sidebar put the App tag before the component's grey name. Private documents use the same Starlight `TwoColumnContent`, `ContentPanel` and DS1 prose as public component pages, including the title and On this page column. Fetch the authored article only after owner authorization; do not put the document in a separate iframe layout. Examples load their private module and stylesheet only when present.

The documentation navigation reuses a five-minute, tab-local presentation snapshot (`shared/navigation-cache.ts`), bound to a SHA-256 fingerprint of the existing auth token. It contains no token and grants no access. A cache hit does not load the auth iframe; expiry, session changes, sign-out or a denied private request trigger a fresh check. The Worker still revalidates every private document and asset. Private guides never load the hidden libraries app.

The private document and assets use `/private-app/` on `designsystem1.com` (embedded in the shell) and `https://designsystem1.com/adoption/` (legacy access). The existing session bridge sets a host-only HttpOnly cookie after verifying the pinned owner ID and verified account; the Worker revalidates through the same report authority on every document and asset request. Other hosts deny the prefix. Anonymous requests go to sign-in; nonowners are denied. Keep App files out of public search and sitemaps. Selected System parts: `auth`, `sharing`, `design`, `documentation`, `platform-web`, `themes`; this extends the existing owner-only surface without changing shared sign-in or public component visibility.

## Public font specimens

The public Fonts catalogue uses Aa's `createPlainEditor` for plain specimen text, copied through Sync 1 to `website/src/vendor/aa`. It inherits the specimen font and size, has no focus border or formatting controls, and uses Aa's rounded native-selection painter. This single-block specimen is an intentional exception to Markdown document storage/history in the `editing` guide; no specimen text is persisted. The selected parts for this interaction are `editing`, `design`, and `sharing`.

## Read-only example source

Component and layout example code uses the existing Sync 1 Aa snapshot in `website/src/vendor/aa`, through `createEditor` with `readOnly: true` and menus and toolbar disabled. Selected parts: `editing`, `documentation`, `design`, and `themes`. Code is wrapped in a safe Markdown fence for display; copying retains the exact original source. This is a public source viewer, not a replacement for a writable document editor: persistence, undo, attachments, collaboration and an editor migration flag do not apply. The shared example wrapper uses the theme-aware grey fill and remains collapsed initially.

## System parts for Table of contents

Table of contents is the public Unit `ds-table-of-contents` (`DS1/3-unit/`), used by the documentation's right sidebar through `website/src/components/TableOfContents.astro`. Page layout owns its placement and visibility; the full-width Examples page omits it. Selected System parts: `design`, `documentation`, `sharing`, `themes`, `platform-web`. It is a new opt-in Sync 1 component; existing document-layout contents and Starlight's compact mobile contents retain their existing behavior.

## Product code

Canonical short code: `DS1`. Use this three-character code for product-owned libraries and other compact ownership labels. Use this code followed by a colon for commit subjects; keep the full product name in prose.

## Feature flags

Selected System part: `feature-flags`. The release controls are System CI's Flags matrix, `https://system.0001.dev/system/ci`, behind the System login, which reads and saves them through the private `FeatureFlagsService` binding; `/flags`, `/flags/` and `/app/flags` on the site's hosts answer a 308 there (following Joachim's choice for Money: flags stay in System CI; `dash.designsystem1.com` is the System-owned product dashboard, including its Examples controls). The Worker `/api/flags` handler reuses the pinned `REPORTS_OWNER_ID`, validated Convex session and verified owner identity; no browser-provided identity grants access. Release definitions are in `shared/feature-flags.ts`. The private component-routing trial is off by default and requires an explicit owner rule. Rules use the private R2 `feature-flags/` prefix, a share of the accounts (`audience: 'percentage'`) stored with its `percentage` so it reads back and resolves through the shared `resolveFlag` as that share; authenticated writes require same-origin requests. The shared evaluator and management controls are copied through Sync 1 into `shared/feature-flags-runtime`. When declaring a flag, gate its interface and every protected backend operation; published library visibility and existing access permissions remain separate.

## Company and library workspace

The signed-in account's company name is stored in `accountProfiles`, indexed by its authenticated user ID. `/libraries/workspace/` keeps the documentation shell with the fixed Design system 1 header. The signed-in sidebar shows the company avatar/name as noninteractive identity and a sidebar collapse control. Library listing, selection and creation belong on the profile, never in the documentation sidebar. Owner-only exception: the docs sidebar and the rail end with **My libraries**, listing Design system 1 (the base system, `/libraries/design-system-1/`) and then the owner's libraries from the signed-in navigation summary (`website/src/lib/owner-libraries.ts`, `tests/owner-libraries.test.ts`). Everyone else keeps library entries out of the sidebar (`hideSignedInLibraryEntry`), and the rail hides these rows unless `data-ds-owner` is set. Sidebar components open the existing persistent editor. Documentation layer labels open their visual overview pages, with independent leading disclosure buttons. Root uses yellow, Core green, Unit blue and Page orange for these overview showcases. The documentation opens at `/`, the Overview, in the same shell; the front page is no longer a separate landing page. Selected System parts: `auth`, `design`, `themes`, `platform-web`, `documentation`, and `sharing`; this is app-owned navigation using existing DS1 controls, with no shared component change to propagate. Publication history and install URLs come from existing library queries. Installation-location tracking and library font uploads remain unimplemented; the private font workspace is a separate feature. Stack nodes have no standalone guides; the scripts and checks here govern them.

## Issue tracker example

`/examples/layouts/issues/` is a fictional, page-local roadmap and issue tracker drawn with the Slate library (`scripts/example-libraries.mjs`, generated `website/public/examples/libraries/slate.css`). The user explicitly approved a 10px base unit for this example: rows are 30px, controls 26px, body text 14px, and card text has a 10px inset (the compact-card exception explicitly requested for this example). Slate is intentionally dark only; both theme values keep the same paper. These library choices do not change DS1 defaults or consumer geometry. The library is a hosted draft, not an account-owned published library. Its Library view shows tokens and component specimens and offers the stylesheet download. Selected parts: `ds1`, `themes`, `documentation`, `platform-web`; existing component and example infrastructure applies. Issue edits are in memory only, with no backend, account or shared-data writes.

## Private component routing

Before changing AI edits in the private editor, read `shared/consistency-routing.ts` and `services/src/consistency-routing.ts`. Jev selects bounded operations over the existing button/card catalogue and the seven approved additions in `shared/consistency-insertions.ts`: List, Tabs, Table, Carousel, Image, Link and Icon; code validates and applies exact Markdown replacements through Aa, keeping its undo and matching rules. The `consistency-component-routing` flag gates the route after verified owner authorization; `TYPESAFE_API_KEY` stays in the Worker secret store. Unsupported, uncertain or failed decisions use the existing writing provider. Run the focused routing/AI/flags and component tests; `scripts/evaluate-consistency-routing.ts` is an opt-in synthetic provider evaluation, not a deterministic test or a claim about end-to-end editor latency. Selected parts: `ds1`, `editing`, `auth`, `feature-flags`, `sharing`, `platform-web`; this remains the private direct-editing trial, without downstream migration.

The approved additions are page content, never the whole DS1 catalogue. Context and other editor chrome are not insertable page components. Never add Edit buttons or modal editing forms to the private editor: use Aa’s native blocks and direct in-place interactions. Image placeholders become ordinary Aa image Markdown after choosing or dropping a file; icons change through an inline name field.

The private editor’s Booking site mounts the complete authored `LIBRARY_BRANDS.booking` page and the canonical Voyage stylesheet, with demo scripts excluded. Literal text and button labels use Aa plain editors with composition undo/redo and per-example drafts. The original DS1 components and page layout stay intact; responsive breakpoints follow the editor canvas. `packages/consistency/tests/booking.mjs` checks the complete page, library, editing, history and narrow-canvas containment.

## VisualKit

VisualKit replaces the FilmKit name (user decision, 24 October 2026). Public Lit presentation components live in `DS1/5-visual-kit`, with Sync 1 entry points in `2-core`: Windows (`ds-window`), Device Bezels (`ds-device-bezel`) and AppChrome (`ds-app-chrome`). This user-requested name is an exception to neutral generic naming. Native platform typography, metrics, rounded bezels and chrome colours are intentional exceptions inside the presented platform; surrounding documentation and controls remain DS1. Device time defaults to `00:01`; addresses are unset until the scene supplies one. Compact Mac follows the user’s original Link frame: a 30px header multiplied by `--sf` (explicit 24 October 2026 exception), muted controls, configurable header colours and an optional centred `href` link opening in a new tab.

Selected parts: `ds1`, `documentation`, `themes`, `sharing`, `auth`, `platform-web`; native platform rendering here is a web presentation, not a new iOS/macOS application. The real-app kit runtime remains at `0001/system/parts/film-kit` with VisualKit names and compatible FilmKit aliases. Product content and capture timing remain product-owned.

Original community bezel artwork and status artwork live in ignored `packages/visual-kit/private-assets`, verified against `bezel-imports.json`. Keep them out of npm. User-approved exception (24 October 2026): the inline documentation example is public, including `iphone-17-pro-max-deep-blue.png`, `status-wifi.svg` and `status-battery.svg` under `/examples/visual-kit/`. `visual-kit:build` copies the full gallery to the owner-authorized `/private-app/` route and only those three files to the public example. Public components take an asset base from the caller; they do not grant artwork rights. The public docs link the owner gallery at `/private-app/visual-kit.html`. Run `visual-kit:test`, the dashboard/site access tests, type checks and the normal site checks before releasing. Browser toolbar presets use native-style vector controls and separately measured macOS layouts: Safari 27 compact (52px), Chrome 155 (86px), Edge 156 (80px). These presentation-only platform glyphs are an explicit exception to DS1 UI icons. History availability and favicon are scene inputs; custom profiles, extension sets and assistant buttons are outside the standard preset. Browser updates require renewed reference review.

All documentation phone examples use VisualKit's `ds-device-bezel`, including the shared ExampleDevice wrapper and the private composition editor. The editor uses `responsive` so authored text remains at 1×, with shared simplified hardware below 320px to preserve readable content; the status/browser chrome scales independently. `frameless` preserves the slotted document while switching to desktop. Products take components and the approved three-file `device-artwork` export through Sync 1; do not draw independent status bars or bake device chrome into guide screenshots.

Documentation and application destinations retain the shared navigation sidebar, including Account and library workspaces. Direct app links resolve into that shell; embedded content uses the parent navigation. Sign-in is the standalone exception. VisualKit documents each window and AppChrome preset with rendered light/dark examples beside its API.

VisualKit Instagram Reels: `ds-app-chrome kind="instagram"` is a presentation-only preset based on the supplied 24 October 2026 screenshot. Scene inputs own account, avatar, caption, verification, counts and progress; no social integration is implied. `ds-device-bezel edge-to-edge` overlays status chrome and removes the home strip. Native platform geometry and vector glyphs are intentional exceptions. Source: `DS1/5-visual-kit/instagram.ts`; public specimen in the VisualKit guide.
