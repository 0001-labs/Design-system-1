---
name: design-system-1
description: The exact rules of Design system 1, the 0001 design framework: the 20px square, item and row sizes (one square high), widths in whole squares, type sizes, lines, corners, colours and motion. Use whenever you design, build or review any interface, page, component, diagram or card in a 0001 product (Ezo, Link, Consistency, Peer, Ins, Visual, the 0001 site, System) or a 0001 design for a client, before choosing any size, spacing, font size or radius, and when a product adds languages, translations or a language picker.
---

# Design system 1

Design system 1 (`/Users/joachim/0001/Design system 1`, source in `DS1/`) is the framework every 0001 product is drawn on. Products carry a copy or a fork of it (see the 0001 brief), so these rules hold even where the package is not imported. Client sites keep the client's own design unless 0001 is designing for them.

## Propagating shared design

1. Identify the canonical component, token or interaction in `DS1/`. Move a reusable improvement discovered in a consumer into that source first, including its documented measure or behavior.
2. Inventory applicable consumers from the System implementation guide, Sync 1 manifests and lockfiles, and targeted source searches, including copied or forked implementations and native ports. Record the scope in the work item's note.
3. Commit the shared source, then copy it through each consumer's approved Sync 1 exports. Preserve product-owned code and reconcile legacy forks deliberately; remove superseded local design overrides. Keep content, domain behavior, intentional platform conventions and client branding in the consumer.
4. Run source and consumer checks, follow each project's release procedure and deployment policy, and verify released assets over HTTP. Browser verification follows the project's brief and the user's request.
5. Finish with an explicit account of consumers migrated and released, consumers with no applicable usage, intentional exceptions and blocked consumers. Source checks and copied files alone do not establish live adoption. Keep unfinished propagation visible in the work item.

## Measures (get these exactly right)

Everything is counted in **squares**: one square is 20px (`--unit`, `--1`), multiplied by `--sf` on phones and tablets. Never invent a size: take it from this table, or from the code it names.

| Thing | Size | Where it comes from |
|---|---|---|
| Square | 20 × 20px | `--1` in `DS1/1-root/grid.css` |
| A row, an item, a header, a menu entry | **one square high: 20px**, never 32 or 36 | Ezo `--item-height` is 19px plus the 1px `--margin-correction`, a 20px pitch |
| An Ezo item | 4 squares wide (80px pitch, 79px drawn) | Ezo `--item-width` |
| A wider item ("double the length") | 8 squares: 160px pitch, 159px drawn | twice the item width |
| A list column | 4 squares (`--quad`) | Ezo `--column-width` |
| Gaps and margins | whole squares, or half a square (`--half`) at most | `grid.css` |
| Text | 14px (`--type-size-default`) on a one-square line; 10px small, 13px heading, a 20px display title on two squares; padded 4px from the item's edge | `one.css`, `text.css`, Ezo `--item-text-padding` |
| Lines | 1px, centred on the grid line | Ezo `--outline-stroke` |
| Corners | square for items and rows; 4px (`--radius`) only on pictures, buttons and fields | Peer and Ins follow this |
| An avatar (a person, a workspace) | **round**, 16px (one control high) with small type, 40px (two squares) large; overlapping 3px in a group. `shape="square"` (`.ds-avatar--square`) gives a mark the product chooses a picture's 4px corners. Coloured by a fill (`color`) or an ink (`ink`). A logo has no corners | `ds-avatar`, `.ds-avatar` |
| A menu | **On whole squares**: half a square inside its 1px line on each side, no shadow, entries one square high with nothing between them, a separator one square with its line, so n entries are n + 1 squares high. A floating menu stands half a square from its anchor and rounds its width up to whole squares. Every entry is one square whatever button styles surround it, a library's own `<button>` included | `ds-menu`, `.ds-menu` |
| A busy spinner | **One control high (16px) inside a button or field**, the size of the icon it stands in for; one square alone. Unlabelled, it reads the shared word "Loading" | `ds-loading`, React `LoadingIndicator` (`variant="spinner"`) |
| A stat | **A label on one square, the figure on two (20px medium, tabular numerals), a caption on one**; a group in columns eight squares wide with one square between | `ds-stat`, `.ds-stat`, `.ds-stats` |
| A meter | **One square high**: a bar half a square high across its middle, or the range in squares (one square each, drawn one pixel short); over in the danger colour | `ds-meter`, `.ds-meter` |
| Steps | **One square high**: a numbered mark one control high in its square, the name after it, each step rounded up to whole squares and joined by a line; vertical, one step per square | `ds-steps`, `.ds-steps` |
| Switch | **32 × 16px** at base scale: two control heights wide, 12px thumb, 2px inset and 16px travel; all multiplied by the shared scale | `ds-switch`, `--ds-control-height` |
| Button width | **Hug the label by default**, including React and slotted native controls. `fixed` opts into four squares, `wide` eight; `fit` is the explicit hug alias. Icons stay square and menu items fill their row. | `ds-button` |
| A table | **Rows one square high**, each on a 1px rule at its foot (19px of words, 1px of line), no box and no column lines; headers in the text's weight in the title grey; cells padded half a square at the end only; numbers at the column's end in tabular figures | `.ds-table` on a native `<table>` (`DS1/1-root/table.css`), `ds-table` from data |
| A row a person presses (a link, a button, a tile, a card) | **One square high, the whole row one press target**: the pointer fills it (`--ds-row-fill-hover`), a press darker (`--ds-row-fill-press`), keyboard focus rings it 2px inside; words 4px from its edges; a tile is `stacked`, each line one square, its width in whole squares. A control of its own goes in the `end` slot (native: any control beside one `ds-row__target`) and presses only itself | `ds-row href` or `interactive`, `a.ds-row`, `button.ds-row`, `.ds-row` with `.ds-row__target` |
| A navigation row, current page | **The sidebar's current row**: `aria-current="page"`, filled with `--ds-row-fill-current`, in the medium weight, 2px corners; never the accent | `ds-row href nav current`, `a.ds-row.ds-row--nav[aria-current="page"]` |
| A tree | **One square per row, one whole square further in per level**, the disclosure arrow and an icon each on a square before the label (a leaf keeps the arrow's square empty); the selected row drawn as the current one; one Tab stop and the tree pattern's keys | `ds-tree`, `.ds-tree` with `connectTree()` from `0-face/tree.ts` |
| Sidebar navigation | **One square per row**, half a square (10px) of indentation per level, disclosure arrows after labels, highlighted rows with 2px corners; all scaled with the surface | `ds-sidebar` |
| Page dots | **One square per dot**, the row one square high; a 4px dot (scaled), the current one half again as large and filled in the ink, past dots filled muted, the next filled in the ink, the rest rings; `end` makes the last a ring in the ink | `ds-pagedots`, `.ds-pagedots` |
| A carousel | **Slides the track's width or whole squares wide** (`slide-width`), a whole number of squares apart (one by default), mandatory snapping one slide to a stop; the controls one square below, one square high, from the start: previous and next in one-square cells, then a dot each | `ds-carousel`, `.ds-carousel` |
| A page's columns | **Whole squares**: navigation 12, a list beside its detail 16, an inspector 12, a reading or settings column 32, a single task 16, overview tiles 12. Two squares between columns, one between areas, one around the page; one column below 30 squares of width. A `column` or `centered` page stands on a whole square (the room beside it rounds down to squares) and `measure="N"` sets its width in squares | `ds-page` layouts `sidebar`, `split`, `inspector`, `column`, `centered`, `tiles` |

Items stack edge to edge with no gap, as an Ezo list does. Lists, table rows, cells and their headers use neutral or transparent backgrounds by default, never automatic accent fills. Colour is opt-in for a meaningful state, not decoration across an entire list or table. Positions snap to the grid: anything a person can move lands on whole squares. Before calling a design done, measure it in the browser (an element's width and height must be whole squares minus the 1px correction) instead of judging by eye.

## Text and prose

- **Interface copy** (labels, messages, titles in an app) is `ds-text`: `tone` (`muted`, `title`, `warning`, `danger`), `size` (`small`, `heading`, `display`), `strong` and `wrap` work for a translation key as for `literal` text (what a person wrote is always `literal`, never a key; `ds-accordion literal` does the same for its summary and details). A heading is `role="heading"` with `aria-level`. A page without scripts uses the classes in `DS1/1-root/text.css` on native text: `ds-text`, `ds-text--small`, `--heading`, `--display`, `--strong`, `--muted`, `--title`, `--warning`, `--danger`. `one.css` and `controls.css` both import it.
- **Long-form and marketing writing** stays native headings, paragraphs, lists and tables inside an element marked `data-ds-prose`, drawn by `DS1/1-root/prose.css`; a part that draws itself inside it carries `data-ds-not-prose`. Never restyle prose elements by hand, and never wrap each paragraph in `ds-text`. Both count as Design system 1's styles.
- Every line of text is one square (`--ds-unit`); a display title (`h1` in prose) takes two. One square stands between two blocks of writing and two before a heading. Code is 13px in the code face on the same lines.
- Failure and loss text is `--ds-danger-color` (Red for blood on light paper, Tuned red on dark), never a raw red. Text that asks for care is `--ds-warning-color` (Orange's dim on light paper, Orange on dark), never raw Orange, which is too light for text on light paper.
- A page made only of plain HTML can take the classless sheet, `DS1/1-root/one.semantic.css`, on the same measures. Sync 1 copies `prose.css` and `one.semantic.css` with `"prose": true` and `"classless": true` on the `root` or `tokens` export.

## The rest of the language

- Colours, typefaces and tokens come from `DS1/1-root/one.css` (or the product's copy, e.g. Ezo's `client/design/1-root/one.css`). Use the tokens, never raw values.
- Words sit straight on the paper, with no cards or shadows around content.
- Sentence case in interface copy, never all caps.
- Arrows (→ ← ↑ ↓ ⇒ ↩ …) are always Inter, in every typeface, code included: "Inter Arrows" (`fonts/Inter-Arrows.woff2`, Inter's arrows alone, limited by `unicode-range`) leads every `--typeface-*` token. A new typeface token or font stack starts with it; never draw an arrow in GT America, Iosevka or a system font.
- Code is Iosevka Extended (`--typeface-mono`), loaded from `fonts/Iosevka-Regular.woff2`, with a monospace fallback, never the browser's serif.
- The faces are loaded once, by `DS1/1-root/fonts.css` (the `@font-face` rules and the `--typeface-*` tokens; `one.css` imports it). A page without `one.css` links `fonts.css` (Sync 1: `root` with `"styles": ["fonts.css"]`, or `fonts` with `"stylesheet": true`); never write a product's own `@font-face` rules for DS1's faces. No stylesheet a page always loads fetches from another host.
- Japanese and Chinese name Noto Sans and then the reader's own faces (Hiragino, PingFang, Yu Gothic, Microsoft YaHei and JhengHei, Noto Sans CJK), so nothing downloads by default. A product that shows them and wants Noto Sans adds the opt-in `cjk.css` (Sync 1 `"cjk": true`; from Google Fonts, sliced by `unicode-range`, with `font-synthesis-weight: none`); a page whose security policy keeps other hosts out leaves it out.
- Motion animates `transform` and `opacity` only.
- A page without Lit draws the components with `DS1/1-root/controls.css` classes on native elements (`ds-button`, `ds-input`, `ds-textarea`, `ds-select`, `ds-checkbox`, `ds-radio`, `ds-switch`, `ds-tabs`, `ds-dialog`, `ds-menu`, `ds-empty`, `ds-notice`, `ds-carousel`, `ds-pagedots`, `ds-stat`, `ds-meter`, `ds-steps`, `ds-row`, `ds-tree`, `ds-header`, `ds-footer`, `ds-document`), copied through Sync 1's `tokens` or `root` export; never restyle native controls by hand. Its toasts, confirmations, prompts and copying come from the feedback module (see Dialogs and copying text). See https://designsystem1.com/1-root/native-controls/.
- A client's look lives in a published design library (the libraries app), written in `--one-*` tokens; the brand stays the client's. Publishing passes those values to the components' own tokens (`DS1/1-root/library-tokens.ts`) and gives links marked `data-library-button` the library's button faces, so never map `--one-*` to `--ds-*` or rewrite a library's selectors in a product. A product pins a version through Sync 1's `library` export (`"id"`, `"version"`), not `latest.css`, and loads it after DS1's stylesheets in the same or a later cascade layer. https://designsystem1.com/libraries/
- The same sheet draws the pieces: `ds-field` (a label above or, with `--beside`, four squares beside a native control, `ds-field__hint` muted and `ds-field__error` in the danger colour, all on one-square rows), `ds-avatar` (`--large`, `--square`, `--pair`, `--outlined`, `--pending`), `ds-badge` (`--icon`), `ds-toggle` on a `.ds-button` with `aria-pressed`, `ds-icon` (`--small`, `--large`, the file in `--ds-icon`) and `ds-drop` (`--compact`) on a `<label>` around `<input type="file">`, which also makes a `label.ds-button` the file picker's button. Never rebuild a field label, avatar, badge, icon mask or drop zone in a product.
- A setting that is on or off is a switch (`role="switch"`); an action that stays on, such as showing a panel or muting a track, is a toggle button (`aria-pressed`, `ds-toggle`); one of several choices is a segmented control (`ds-tabs` with `role="group"`). The `<ds-toggle>` element is the rounded switch, `ds-switch--rounded` without Lit. A `ds-cycle` whose face shows only a value (a size, a count) takes `label`, the setting's name as a key, so it is announced as "Size: 40"; never write the name into each value. A `ds-button` whose face is a value takes `label` as its accessible name.
- A row, tile or card that opens something is one press target, never a `<div>` with a click handler or a row of separate links: `<ds-row href>` (a destination) or `<ds-row interactive>` (an action), or `a.ds-row` / `button.ds-row` without Lit; a row with controls of its own keeps them in the `end` slot, or beside a `.ds-row__target`, never nested in the row's link. `ds-row-press` is cancelable for routing. Navigation marks the page being shown with `current` (`aria-current="page"`), drawn as the sidebar's current row. Nested things a person opens and chooses from (files, groups, a page's parts) are a `ds-tree` (`role="tree"`, rows `role="treeitem"`), not a sidebar: the sidebar is the application's places, each row its own Tab stop. https://designsystem1.com/3-unit/row/ and https://designsystem1.com/3-unit/tree/
- `ds-list` is a list to assistive technology (`role="list"`, each element directly inside it `role="listitem"`); never add those roles by hand. A list used only for layout takes `role="none"`. Every element hides with `hidden`.
- A `ds-composer` highlight is a tint of the words; one that must show its colour (the accent on a change, a colour value) takes `fill: true`, the colour behind the words, never a hand-drawn overlay.
- On phones and tablets every measure is multiplied by `--sf` (1 on a computer; the screen width over 280 on a phone, between 0.75 and 2). Write lengths as units or `calc(Npx * var(--sf))`, never bare pixels, except hairlines. A computer stays at 1 however narrow its window; a phone or tablet is a mobile browser or a touch screen whose shorter side is at most 820px. Put the scale on with `startScaling()` from `DS1/0-face/scaling.ts` before the first render (`snap: "layout"` or `"pixel"` where rows must stay on drawn lines), never a hand-written setter or a width breakpoint. A phone drawn on a page (a prototype's frame) scales to its own width with `startScaling({ surface: element })`, or `surface: true` for every `data-ds-surface` element, on any device and with the same snapping (it sets `--sf` and `--ds-sf` on the surface), never `calculateScalingFactor` wired by hand. https://designsystem1.com/1-root/scaling/
- A destination is a link, an action a button. Every link is a real `<a href>`, never navigation from a click handler: `.ds-link` in running text (the text's ink, a hairline underline, sentence case), and a link drawn as a button is `<ds-button href>`, React `ButtonLink` or `a.ds-button`, identical to the button in every face and state. A disabled link has no `href` and keeps `role="link"` and `aria-disabled="true"`. https://designsystem1.com/2-core/link/
- Offer Light, Dark and System (the default, following the system live), stored as one choice. Inline `DS1/0-face/theme-bootstrap.js` in the head so the first paint is already themed; it marks the root with the `light-theme` or `dark-theme` class (canonical; `data-theme` mirrors it) and `color-scheme`. Change it with `setThemeMode()` or `<ds-cycle type="theme">`, never a page's own pre-paint script. A product that keeps Light for first-time visitors sets `themeDefault: "light"` on `window.DS_ONE_PREFERENCES` before the head script. A page without the components takes `theme.ts` through Sync 1's `root` export, `"modules": ["theme"]`. https://designsystem1.com/1-root/theming/
- Page scripts from `0-face/` travel in Sync 1's `root` export (`"modules"`); `"scriptsTo"`, a path from `"to"`, puts them apart from the stylesheets (scripts compiled from `src/`, stylesheets published from `public/`), never a product's own copy or shim. https://designsystem1.com/1-root/native-controls/#page-scripts-apart-from-the-stylesheets

## Carousels

Slides that move sideways are `<ds-carousel label>` (React `Carousel`, `DS1/react/carousel.ts`; without Lit `.ds-carousel` from `DS1/1-root/carousel.css` and `startCarousels()` from `DS1/0-face/carousel.ts`, Sync 1's root `"modules": ["carousel"]`), with `buttons` for previous and next (the `left` and `right` icons) and the dots below. It is a region described as a carousel and named by `label`, each slide a group labelled "2 of 5", the slide in view announced politely, and it jumps at once under reduced motion. It fires `change` when a person moves. Page dots alone are `<ds-pagedots count active>`: buttons in a group, `select` when one is picked (cancelable), arrows, Home and End. Never autoplay a carousel, and never build a product's own scroll-snap strip, dots or slide counter. https://designsystem1.com/3-unit/carousel/

## Toasts

A toast is `<ds-toast>` and `toast()` from `DS1/2-core/ds-toast.ts`, based on Sonner: Sonner's calls, options and stacking behaviour, drawn as the system's label: an ink chip one control high per line in the tooltip's colours, padded 4px, no line or shadow, actions as underlined words, as wide as its words up to sixteen squares, the pile advancing one square per toast and standing one square from the edge. An error is announced assertively. Never build a product's own toast or notification stack. On a page without Lit, import the same `toast()` from `DS1/0-face/feedback.ts`: its page toaster draws the same stack with `ds-toast`'s stylesheet, and a `<ds-toast>` in the page takes every toast, so a page never shows two stacks.

## Dialogs and copying text

Never call the browser's `alert()`, `confirm()` or `prompt()`, and never write a product's own copy-to-clipboard helper. Import `confirm`, `prompt`, `alert` and `copyText` from `DS1/0-face/feedback.ts` (Sync 1's `feedback` export): no Lit and no framework, one import, plain TypeScript with no `?inline` or `?raw` import and no language runtime. Its default words read English, and the shared words in the page's language where the page loads the language module (copy `feedback` to the same folder as `languages`, or set `"languages": true` on it); `setFeedbackWords()` gives a product's own. Never add a plugin, a type declaration or a tsconfig exclusion to make the copy build.

- `confirm({ title, text, confirm, cancel, danger })` resolves to a boolean, `prompt({ title, label, value, placeholder, confirm, cancel })` to the text or `null`, `alert({ title, text })` once dismissed. They are drawn on the native `dialog.ds-dialog` frame from `controls.css`, with `.ds-button--secondary` Cancel and `.ds-button--primary` answer; their default words are the shared words (OK, Cancel) in the page's language.
- A destructive action names itself and sets `danger` (`confirm: "Delete", danger: true`): its words in the danger colour (`.ds-button--danger`), Cancel focused, no backdrop dismissal.
- `copyText(text, { toast })` copies with the Clipboard API (a hidden field where it is missing) and confirms with the shared word "Copied" in a toast; call it from the click that asks for it. A page that only copies imports it from `DS1/0-face/copy-text.ts`, which loads the page toaster only when it shows a toast.
- With Lit or React, `<ds-dialog>` (React `react/dialog`) is for a dialog with content of its own; a single question or a copy still uses the feedback module, whose toasts go to the page's `<ds-toast>`. https://designsystem1.com/1-root/feedback/

## Empty states and notices

- **An empty place** is `<ds-empty>` (React `Empty`, `DS1/react/empty.ts`; native `.ds-empty` from `DS1/1-root/empty.css`): a title, a line of muted text, an optional icon on its own square and the action that fills it, one square below. Words on the paper, no box, no illustration, at most sixteen squares wide, every line one square. Without a heading its title is the shared words' "Nothing here yet" in the current language. Never build a product's own empty state. https://designsystem1.com/2-core/empty/
- **A message in the flow** (a failure beside the form that failed, a warning above its list) is `<ds-notice tone>` (React `Notice`, `DS1/react/notice.ts`; native `.ds-notice` from `DS1/1-root/notice.css`): `neutral`, `success`, `warning` or `danger`, a 16px square mark filled in the tone's colour with its icon in the ink, a title and/or text on one-square lines, actions on the row below and an optional dismiss (`ds-notice-dismiss`, cancelable). It is `role="status"`, or `role="alert"` for danger. Danger words are `--ds-danger-color`. Never an emoji, a raw red, a coloured box or a ← glyph for a message. https://designsystem1.com/2-core/notice/
- A message across the top of a page is `ds-banner` (`ds-banner-action`, `dismissible`); a short confirmation that leaves on its own is a toast.

## Site chrome

- **A site header** is `<ds-header>` (React `Header`; native `.ds-header` from `DS1/1-root/header.css` with the page script `DS1/0-face/header.ts`): one row of one square with a square around it, the brand in twelve squares so the links stand over the work, the page's own `<a href>` links one square apart with `aria-current="page"` on the hairline of the full ink, actions at the end. Below thirty squares the links and actions fold into a drawer behind a `.ds-button--icon` menu button (the shared word "Menu") in the row's last square.
- **A drawer** is `attachDrawer()` from `DS1/0-face/drawer.ts`, drawn by `drawer.css` on `dialog.ds-dialog.ds-drawer`: modal, over the screen on the page's paper, the close button where the toggle stood, Tab kept inside, closed by Escape, a link or the screen widening, the page's scroll held. The header and `<ds-page drawer>` (its navigation on a narrow page) use it; never a product's own mobile menu, focus trap or scroll lock.
- **A site footer** is `<ds-footer>` (React `Footer`; native `.ds-footer` from `footer.css`): the brand in twelve squares, columns of links eight squares each two squares apart, then two squares below the legal line and the language and theme as `ds-cycle`, every line one square, a hairline along the top.
- **Terms, privacy, a legal notice or help** is `<ds-document>` (React `DocumentPage`; native `.ds-document` from `document.css`): contents built from the headings in twelve squares that stay in view, the writing as `data-ds-prose` in a reading column of thirty-two. A 特定商取引法に基づく表記 or any terms-beside-meanings list is `<dl class="ds-definitions">`: the term eight squares in the muted ink, rows on a hairline with half a square above and below. https://designsystem1.com/4-page/header/

## Figures, meters and steps

- **A figure** with its label is `<ds-stat>` (React `Stat`; native `.ds-stat`, from `DS1/1-root/figures.css`): `value` written by `format.ts` in the current language (`format`: `number`, `compact`, `percent` from a fraction, `money` with `currency`, `minor`, `whole`; `digits`), or `figure` for words in its place; `change` signed with an up or down icon at the start of the `caption` line; `tone` (`danger`, `warning`) for the figure and `change-tone` for the change, chosen by the page since a rise is not always good. A face whose digits differ in width takes `cells` (each digit in a cell of `--ds-stat-digit`, read once whole), never a product's own digit spans. Stats sit in `.ds-stats` columns of eight squares. Never build a stat tile or KPI card, and never a box around one.
- **A value against its range** is `<ds-meter>` (React `Meter`; native `.ds-meter` with `role="meter"`): `role="meter"` with `aria-valuenow` kept inside the range and `aria-valuetext` saying "7 of 10" or "12 of 10, over by 2" in the shared words; `squares="N"` draws the range in squares; past the end it fills in `--ds-danger-color`. A row of bars in a table is a meter per row; several values compared are Chart's `ds-bars`.
- **A sequence** is `<ds-steps>` (React `Steps`; native `ol.ds-steps`): `steps` and `current` (from 1), done steps with `check`, the current one `aria-current="step"`, upcoming muted, `failed` in the danger colour; `href` on a step makes it a link; `vertical` with `step-N` slots for what goes under a step. https://designsystem1.com/2-core/stat/, /2-core/meter/, /2-core/steps/

## Tooltips

A tooltip is the system's label, never the browser's `title`: 16px high on 16px lines, 14px regular, 2.5px at the sides, 4px corners, black with white text (white on black in dark mode), two pixels above the element, shown at once; `data-tooltip-colour` gives it a colour (an accent, a column's colour) lettered in the ink. Wrap one element in `<ds-tooltip>`, or give any number of elements `data-tooltip="…"` and load `DS1/0-face/tooltips.ts`, which shows one shared label for them all, inside open shadow roots too; a text longer than 320px wraps. Give one only where it adds something, such as a cut-short or icon-only label, never to every row. The shared label shows on hover, on keyboard focus only (`:focus-visible`, so a menu focusing its first row raises none), follows `data-tooltip` as it changes, and on touch shows from a long press, or a tap on an element marked `data-tooltip-press`, going at the next touch or after two seconds. Show one from code with `showTooltip(element, { duration })` and `hideTooltip()`, never a product's own pressed label.

## Colours

Shown at https://designsystem1.com/colours (`website/src/pages/colours.astro`) as one palette, named by colour and sorted by hue, and the inks (greys); change the page with this section.

**One source.** The palette lives in `DS1/1-root/palette.ts`. The Colours page draws it, and `scripts/write-palette-css.ts` writes it as tokens into `DS1/1-root/palette.css` (imported by `one.css`, copied by Sync 1's `root` and `tokens` exports) and into the CLASSless stylesheet (`DS1/1-root/one.semantic.css`): `--one-<colour>` and `--one-<colour>-pastel`, each `light-dark(light, dark)`, plus `--one-zenith-blue` and `--one-comfortable-green` for the named pastels. A page uses them without the classless sheet. `tests/palette.test.ts` fails if any of them drift.

**Dark mode versions.** Each colour has one, derived as the ds1 Figma file derives Apple green (#99ff73 to #529d36): the same hue, the saturation times 0.49, at 41.4% lightness; a colour already at or below that keeps its saturation. An ink turns over: lightness 12% + (1 − L) × 76%. Write a token as `light-dark(light, dark)`; the page lists both hexes for every colour.

**Pastels.** Every palette colour has a pastel: its hue and saturation at 90% lightness. Zenith blue (#ccccff) is Sharp blue's pastel and Comfortable green (#f2ffcf) Chartreuse's; the others are named "<colour> pastel". Link's own pastels are replaced by these. In dark mode a pastel's job, a quiet tint behind things, is a dim version: the hue, the saturation times 0.49, at 20% lightness. The page shows the light set (colour and pastel) and the dark set (dark and dim) on two tabs.

Every colour is a token from `DS1/1-root/one.css` (Ezo's fork, `client/design/1-root/one.css`, holds the same values). Use the token, never the hex, and never invent a colour.

### The palette

| Token | Hex | Name |
|---|---|---|
| `--apple-green` | #99ff73 | Apple green, the default accent |
| `--chartreuse-green` | #ccff4d | Chartreuse, the 0001 site's accent |
| `--every-green` | #979441 | Every green, olive |
| `--yellow` | #eaff00 | Yellow |
| `--orange` | #fec20d | Orange |
| `--tuned-red` | #ff5f5f | Tuned red |
| `--pink` | #f5aad1 | Pink |
| `--zenith-blue` | #ccccff | Zenith blue |
| `--sharp-blue` | #594dff | Sharp blue |
| `--slate` / `--base-slate` | #1e1e1e | The ink |
| `--black` | #2a2a2a | Dark paper and text in light mode |
| `--slate-dark` | #3c3c3c | Controls on dark paper |
| `--stealth` | #554455 | |
| `--base-darker-grey` | #797979 | Muted text |
| `--slate-light` | #e6e6e6 | Controls and outlines on light paper |
| `--light-grey` | #e8e8e8 | |
| `--grid-color-light` | #1e1e1e2b | The grid's lines |

Text and surfaces go through `light-dark()` tokens (`--text-color`, `--background`, `--icon-color`), so dark mode needs no second set of values.

### How Ezo uses it

- **Accent**: a person picks one of eight in Settings, `--apple-green` by default: apple green, every green, zenith blue, sharp blue, pink, tuned red, orange or yellow, or none (`--slate-light`) (`shared/previewCard.ts`). The accent is available for explicit actions and meaningful states. Do not automatically paint list or table headers, rows, cells or counts in it.
- **Diagrams** name seven colours, each mapped onto the palette (`shared/diagram.ts`, `ezo-diagram.css`): `light-green` apple green, `light-blue` zenith blue, `pink`, `yellow`, `orange`, `red` tuned red, `white` a warm grey. Filled squares and chart lines mix each with the ink in light mode (about 85% colour), so they read on white, and use the colour plainly on dark paper.
- **The cube and boxes**: apple green, orange, pink and sharp blue (`shared/isoCube.ts`).
- **Store templates** pair a paper with an accent, for example zenith blue paper with sharp blue, apple green with sharp blue, pink with sharp blue (`shared/templateStoreCore.ts`).
- **Lines that must stand out on light paper** (the System map's selected lines) use an accent mixed with the ink, 70% accent, never the bare pale colour.

### tau99's colours (candidates for the library)

The ds1 Figma file (XAnoaRoq9LxVAHUZgtdO0r) holds them as the TAU99 group of its Colors collection. Four are used in tau99's code (`/Users/joachim/0001/tau99`):

| Figma name | Hex | Where it is used |
|---|---|---|
| Comfortable green (TAU99 brand) | #f2ffcf | tau99 `--brand`; the 0001 site's `--tau99-brand`; Link's `--color-tau99` |
| Hysteric blue (also TAU99/18) | #69d8fb | tau99's sign-in and checkout buttons |
| Purple | #e63aaf | tau99's artwork numbers |
| Drip yellow | #fde70c | tau99's artwork numbers |
| Soft blue | #cdd3fe | Figma only |
| Egg (Artwork background) | #f9f6ef | Figma only |
| Winning blue | #0275fa | Figma only |
| Metal green | #026d5b | Figma only |
| Red for blood | #de0331 | Figma only |
| Dark red variant | #c50124 | Figma only |
| 33 | #b69e55 | Figma only |
| 99 | #dbc88f | Figma only |

tau99's artwork numbers take one of every green, purple, comfortable green and drip yellow (`src/components/artwork-number.js`). Comfortable green is the one worth adding to the library: three products already use it under three names. Proposed token: `--tau99: #f2ffcf`, a paper tint for selected rows and quiet panels. Until it is added to `one.css`, keep using the products' own names for it.

### Link's own colours

Link's interface tokens (`Link/client/styles/shared/tokens.css`): `--color-chartreuse` #ccff4d and `--color-zenith` #ccccff are the palette's; `--color-tau99` #f2ffcf is tau99's pale lime; `--color-brand-accent` #ff4438 is its own red, near tuned red #ff5f5f; `--color-base-black` and `--color-base-slate` #2c2c2b are its own ink, near black #2a2a2a; `--color-base-white` #ffffff. Its help pages also set `--every-green` to the red accent, so the token name means a different colour there. Brought onto the system, the red becomes tuned red and the ink slate.

### Link's project colours

A project's colour in Link comes from `Link/shared/projectColors.ts` (`resolvedProjectCalendarColor`), shared by the web and the iPhone app so a project keeps its colour everywhere:

1. A colour stored on the project (`calendarColor`), if set.
2. Otherwise the project's Notion property named Color, Colour or Project color: the select or status colour's name is mapped to blue/purple #ccccff, green #99ff73, chartreuse #ccff4d, yellow #f3ff99, orange #ffd199, red #ffb3a7, pink #ffc7e8, grey #e8e8e8.
3. Otherwise one of twelve, picked by a hash of the project's name: #ccff4d, #8bd3ff, #ffd166, #ff9f9f, #c7b9ff, #7ee0c3, #f7a1d7, #f3ff99, #ffbf80, #a8e6cf, #b8f2ff, #e6c7ff.
4. A project whose subscription has ended is grey, #ececec.

Only three of these are Design system 1 colours (#99ff73, #ccff4d, #ccccff); the rest are Link's own pastels. If Link is brought onto the system, steps 2 and 3 would take their colours from the palette above, as tints, rather than these hex values.

## Icons

- Every icon comes from Design system 1's library, `DS1/x-icon/` (catalogue at https://designsystem1.com/icons): 16 × 16, drawn in the text colour. Never use a Unicode or emoji glyph as an icon: no ↗, →, ✓, ×, ⌕ or ★ in an interface.
- The common ones: `up-right` for a link that goes somewhere (where ↗ would have been), `right`, `left`, `up`, `down` for direction, `open` to expand, `close`, `check`, `plus`, `search`, `more`, `star`.
- The editing ones, for Aa's toolbar and menus: `bold`, `italic`, `underline`, `strike`, `code`, `link`, `equation`, `mention`, `comment`; the block kinds `text`, `h1`, `h2`, `h3`, `bullet`, `numbered`, `todo`, `toggle`, `quote`, `divider`, `code-block`, `callout`, `table`, `image`; and `handle` (the block's grip), `slash` (the `/` menu), `indent`, `outdent`, `undo`, `redo`, `duplicate`, `delete`, `change` (turn into).
- A product carries the icons it uses as files (Sync 1's `icons` export) and, without Lit, draws one with the `.ds-icon` class from `controls.css`: the file named in `--ds-icon` as a mask in `currentColor`, 14px, 12px (`--small`) or 16px (`--large`), so it follows the text. Never write a product's own icon-mask rule.
- An icon that does not exist yet is added to the library first, by `docs/icon-library.md`: derived from its neighbours, 16 × 16, then `vp run icons:build` and the icon tests. Never draw a one-off icon inside a product.

## Native apps (Swift and Kotlin)

iPhone, iPad and Mac apps take Design system 1 from its Swift package, `native/apple` (module `DS1`, iOS 18 and macOS 14); Android apps from its Kotlin package, `native/android` (library `com.designsystem1:ds1`, Jetpack Compose without Material, API 26). Never a port of their own. A product copies one with Sync 1's `swift` or `kotlin` export into a folder the copy owns whole (`"swift": { "to": "ios/DS1", "fonts": [...] }`, `"kotlin": { "to": "android/ds1", "fonts": [...] }`); Xcode adds the folder as a local package, Gradle with `includeBuild("ds1")` and `implementation("com.designsystem1:ds1")`. `sync1 check` guards the copy like any other. Both packages offer the same pieces under the same names; https://designsystem1.com/advanced/native/ lists them against the web.

- **Generated, never typed.** `vp run native:tokens` writes both packages' generated files from `palette.ts`, `measures.ts` (held to the CSS by `tests/measures.test.ts`), the surfaces of `component-tokens.css`, the names in `DS1/x-icon`, `DS1/0-face/languages.ts` and the shared words in `DS1/0-face/translations`, and lays out their resources (icons as an asset catalogue and as vector drawables, the faces). `tests/native-tokens.test.ts` and `tests/native-android.test.ts` fail when a generated file is stale. Android's faces are TrueType and OpenType builds of the web's woff2 files in `native/android/fonts`, written by `vp run native:fonts` (fontTools and brotli). Change the source, run the scripts, commit both.
- **The root.** Swift: `.ds1Theme()` on the root view. Kotlin: `DS1Preferences.load(context)` once, then `setContent { DS1Theme { App() } }`. Either puts on the scale (the width over 280 between 0.75 and 2 on phones and tablets, 1 on a Mac), the saved theme (light, dark or the system's), the reader's language, and the toast stack and the page's dialogs.
- **Colours** are `DS1Color` in Swift (`.paper`, `.text`, `.accent`, every palette colour and pastel, a `ShapeStyle` that follows light and dark) and `DS1Colors` in Kotlin (read with `.current`). No hex values in an app.
- **Lengths** are `scale.unit`, `scale.half`, `scale.control`, `scale.squares(n)` or `scale(n)` from the environment (`@Environment(\.ds1Scale)`, `LocalDS1Scale.current`); lines stay one point.
- **Type**: `DS1LineText(text, style, tone, strong, figures, cells, wrap)` stands text on its square with arrows in Inter; `figures` (or `DS1Figures`, never cut short) sets digits in Olivetti Dot in cells of one width. Type stays on the grid and does not follow the system text size. Never build a label from a span per character.
- **Words**: `DS1Words` holds the language and finds words as `translate()` does (product words registered with `register`, then the shared words, the language's relatives, English, the key). `DS1Preferences` saves the theme and language; `DS1Format` and `DS1Pricing` format dates, relative time, numbers and money as format.ts and pricing.ts.
- **Pieces**: buttons (`.buttonStyle(.ds1(.primary))`, `DS1Button`, `DS1IconButton`, `DS1DangerButton`), `DS1SplitButton`, `DS1Tabs`, `DS1Field` (`field`, `row`, `plain`; label, error, password reveal), `DS1TextArea`, `DS1Checkbox`, `DS1Radio`, `DS1Choice`, the switch and toggle, `DS1Select`, `DS1Badge`, `DS1Token`, `DS1TokenField`, `DS1Swatch`, `DS1Link`, `DS1Gap`, `DS1Avatar`, `DS1AvatarGroup`, `DS1Notice`, `DS1Banner`, `DS1Empty`, `DS1Loading`, the tooltip, `DS1Cycle`, `DS1ThemeCycle`, `DS1LanguagePicker`, `DS1Menu`, `DS1Accordion`, `DS1List`, `DS1Panel`, `DS1Sidebar`, `DS1Table`, `DS1Row`, `DS1Rule`, `DS1Page`, `DS1PageLayout`, `DS1Tiles`, `DS1PaperGrid`. Feedback is `DS1Toast.success(…)` and `DS1Dialogs.confirm(…)` (and `alert`, `prompt`), `DS1Clipboard.copy`. On Apple platforms, floating menus and a select's options are the system's own menus.
- **Checks**: `vp run native:test` (the Swift package: palette, scale, faces, icons, words, relative time, pricing, toasts) and `vp run native:test:android` (the Kotlin package: unit tests, lint, build). `native/android/sample` is a catalogue of every Kotlin piece, built as a product takes the library: `sh scripts/gradle.sh -p sample installDebug`.

## Languages

Design system 1 owns languages for every product: the list, choosing and remembering one, the shared words, language-aware addresses, the Convex check and the picker. A product brings only its own words: the common buttons and actions (Save, Cancel, Close, Try again, Undo, Redo, Copy, Copy link, Remove, Rename, Duplicate, Download, Refresh, Open, Send, Clear) and Saved, Saving…, Untitled and Account are shared words, never a product's own; "Try again", not "Retry", and Close for a dismiss. The full guide is the Languages page (`website/src/content/docs/1-root/languages.md`, https://designsystem1.com/1-root/languages/).

1. **Import** from the `ds-one` package, or from the product's vendored copy of `DS1/` (Ezo's `client/design/0-face/i18n.ts`). Change the module in Design system 1 and sync the copy; a vendored copy is edited only by the sync.
2. **Configure at startup**, straight after the import: `configureI18n({ languages: [...], sharedWords: true })`. `languages` is the product's subset of `LANGUAGES` (`DS1/0-face/languages.ts`); the picker, the browser's language and the address prefixes all follow it. Where addresses carry the language (`/ja/…`), `languageFromAddress: true` starts in it without storing it. `langTarget` keeps `lang` on an embedded surface (or `false`, nowhere) instead of the page's root; `setLanguage(code, { remember: false })` changes the language without storing it.
3. **Words** live in the product's translations file, `{ "<language>": { "<key>": "<text>" } }`, keyed by the English sentence or by a dotted id with an `en` table. English is the fallback, then the key itself. Placeholders are `{name}` or `{{name}}`, filled by `translate(key, params)`. One file per language (`languageFile: "/translations/{language}.json"`) or a TypeScript module passed to `loadTranslations` work as well. Check a file with `validateTranslations`.
4. **Shared words** (Save, Cancel, Sign in, Nothing here yet, Today, the language names) come from `DS1/0-face/translations/`; use their keys before writing a product's own, and add a word every product needs there.
5. **The picker** is `<ds-language>`: one square high, eight wide (`compact`: four).
6. **The backend** checks languages with `languageValidator` or `languageValidatorFor(subset)` from `ds-one/DS1/0-face/language-validator.ts`, imported by path in `convex/`.
7. **Dates, numbers and money** are written by `DS1/0-face/format.ts`, in the current language or `{ language }`, never by a product's own `Intl` wrapper or a hard-coded locale. The guide is the Formatting page (`website/src/content/docs/1-root/formatting.md`, https://designsystem1.com/1-root/formatting/).

Every text is sentence case, in every language.

## Formatting

- **Dates:** `formatDate`, `formatTime`, `formatDateTime`, `formatMonthYear`, and `formatMonthDay` and `formatMonthDayTime` without the year, each `short`, `medium` or `long` (`formatDate(at, "long")`). A date without a time (`"2026-10-17"`) stays on its day in every zone.
- **Relative time:** `formatRelativeTime(at, { now })` gives "now", "3 minutes ago", "yesterday" (by the calendar) or "in 2 days".
- **Numbers:** `formatNumber`, `formatCompact` ("12.3K") and `formatPercent` (it takes a fraction: `0.25` is 25%).
- **Money:** `formatMoney(amount, currency, { minor, display, whole })`. The currency decides the decimals (none for JPY), and `minor: true` reads an amount in cents. `formatMoneyToParts` is for digits drawn in equal cells.
- **Lists:** `formatList(items)`.
- **Locale:** `localeTag(language)` gives the locale (`da` is `da-DK`, `pt` is `pt-PT`). `configureFormat({ locales: { en: "en-GB" }, timeZone })` sets a product's region and zone once, at startup.
- **Servers:** pass the request's `language` on every call. `format.ts` and `pricing.ts` travel in the `languages` Sync 1 export.

## Checking a design

Measure, do not eyeball: in the browser, read each element's rendered width and height and its position. Widths and heights are whole squares (minus the 1px correction for items), and positions fall on the 20px grid. A row that is 32 or 36px tall, or a gap of 12px, is wrong.
