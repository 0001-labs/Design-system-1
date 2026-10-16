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
| An avatar (a person, a workspace) | **always round**, 16px (one control high) with small type; overlapping 3px in a group. Coloured by a fill (`color`) or an ink (`ink`). Only a logo keeps its corners | `ds-avatar` |
| Switch | **32 × 16px** at base scale: two control heights wide, 12px thumb, 2px inset and 16px travel; all multiplied by the shared scale | `ds-switch`, `--ds-control-height` |
| Button width | **Hug the label by default**, including React and slotted native controls. `fixed` opts into four squares, `wide` eight; `fit` is the explicit hug alias. Icons stay square and menu items fill their row. | `ds-button` |
| A table | **Rows one square high**, each on a 1px rule at its foot (19px of words, 1px of line), no box and no column lines; headers in the text's weight in the title grey; cells padded half a square at the end only; numbers at the column's end in tabular figures | `.ds-table` on a native `<table>` (`DS1/1-root/table.css`), `ds-table` from data |
| A page's columns | **Whole squares**: navigation 12, a list beside its detail 16, an inspector 12, a reading or settings column 32, a single task 16, overview tiles 12. Two squares between columns, one between areas, one around the page; one column below 30 squares of width. A `column` or `centered` page stands on a whole square (the room beside it rounds down to squares) and `measure="N"` sets its width in squares | `ds-page` layouts `sidebar`, `split`, `inspector`, `column`, `centered`, `tiles` |

Items stack edge to edge with no gap, as an Ezo list does. Lists, table rows, cells and their headers use neutral or transparent backgrounds by default, never automatic accent fills. Colour is opt-in for a meaningful state, not decoration across an entire list or table. Positions snap to the grid: anything a person can move lands on whole squares. Before calling a design done, measure it in the browser (an element's width and height must be whole squares minus the 1px correction) instead of judging by eye.

## Text and prose

- **Interface copy** (labels, messages, titles in an app) is `ds-text`: `tone` (`muted`, `title`, `danger`), `size` (`small`, `heading`, `display`), `strong` and `wrap` work for a translation key as for `literal` text. A heading is `role="heading"` with `aria-level`. A page without scripts uses the classes in `DS1/1-root/text.css` on native text: `ds-text`, `ds-text--small`, `--heading`, `--display`, `--strong`, `--muted`, `--title`, `--danger`. `one.css` and `controls.css` both import it.
- **Long-form and marketing writing** stays native headings, paragraphs, lists and tables inside an element marked `data-ds-prose`, drawn by `DS1/1-root/prose.css`; a part that draws itself inside it carries `data-ds-not-prose`. Never restyle prose elements by hand, and never wrap each paragraph in `ds-text`. Both count as Design system 1's styles.
- Every line of text is one square (`--ds-unit`); a display title (`h1` in prose) takes two. One square stands between two blocks of writing and two before a heading. Code is 13px in the code face on the same lines.
- Failure and warning text is `--ds-danger-color` (Red for blood on light paper, Tuned red on dark), never a raw red.
- A page made only of plain HTML can take the classless sheet, `DS1/1-root/one.semantic.css`, on the same measures. Sync 1 copies `prose.css` and `one.semantic.css` with `"prose": true` and `"classless": true` on the `root` or `tokens` export.

## The rest of the language

- Colours, typefaces and tokens come from `DS1/1-root/one.css` (or the product's copy, e.g. Ezo's `client/design/1-root/one.css`). Use the tokens, never raw values.
- Words sit straight on the paper, with no cards or shadows around content.
- Sentence case in interface copy, never all caps.
- Arrows (→ ← ↑ ↓ ⇒ ↩ …) are always Inter, in every typeface, code included: "Inter Arrows" (`fonts/Inter-Arrows.woff2`, Inter's arrows alone, limited by `unicode-range`) leads every `--typeface-*` token. A new typeface token or font stack starts with it; never draw an arrow in GT America, Iosevka or a system font.
- Code is Iosevka Extended (`--typeface-mono`), loaded from `fonts/Iosevka-Regular.woff2`, with a monospace fallback, never the browser's serif.
- Motion animates `transform` and `opacity` only.
- A page without Lit draws the components with `DS1/1-root/controls.css` classes on native elements (`ds-button`, `ds-input`, `ds-textarea`, `ds-select`, `ds-checkbox`, `ds-radio`, `ds-switch`, `ds-tabs`, `ds-dialog`, `ds-menu`), copied through Sync 1's `tokens` or `root` export; never restyle native controls by hand. See https://designsystem1.com/1-root/native-controls/.
- On phones and tablets every measure is multiplied by `--sf` (1 on a computer; the screen width over 280 on a phone, between 0.75 and 2). Write lengths as units or `calc(Npx * var(--sf))`, never bare pixels, except hairlines. A computer stays at 1 however narrow its window; a phone or tablet is a mobile browser or a touch screen whose shorter side is at most 820px. Put the scale on with `startScaling()` from `DS1/0-face/scaling.ts` before the first render (`snap: "layout"` or `"pixel"` where rows must stay on drawn lines), never a hand-written setter or a width breakpoint. https://designsystem1.com/1-root/scaling/
- A destination is a link, an action a button. Every link is a real `<a href>`, never navigation from a click handler: `.ds-link` in running text (the text's ink, a hairline underline, sentence case), and a link drawn as a button is `<ds-button href>`, React `ButtonLink` or `a.ds-button`, identical to the button in every face and state. A disabled link has no `href` and keeps `role="link"` and `aria-disabled="true"`. https://designsystem1.com/2-core/link/
- Offer Light, Dark and System (the default, following the system live), stored as one choice. Inline `DS1/0-face/theme-bootstrap.js` in the head so the first paint is already themed; it marks the root with the `light-theme` or `dark-theme` class (canonical; `data-theme` mirrors it) and `color-scheme`. Change it with `setThemeMode()` or `<ds-cycle type="theme">`, never a page's own pre-paint script. https://designsystem1.com/1-root/theming/

## Toasts

A toast is `<ds-toast>` and `toast()` from `DS1/2-core/ds-toast.ts`, based on Sonner: Sonner's calls, options and stacking behaviour, drawn as the system's label: an ink chip one control high per line in the tooltip's colours, padded 4px, no line or shadow, actions as underlined words, as wide as its words up to sixteen squares, the pile advancing one square per toast and standing one square from the edge. Never build a product's own toast or notification stack.

## Tooltips

A tooltip is Ezo's label, never the browser's `title`: 16px high on 16px lines, 14px regular, 2.5px at the sides, 4px corners, black with white text (white on black in dark mode), two pixels above the element, shown at once; `data-tooltip-colour` gives it a colour (an accent, a column's colour) lettered in the ink. Wrap one element in `<ds-tooltip>`, or give any number of elements `data-tooltip="…"` and load `DS1/0-face/tooltips.ts`, which shows one shared label for them all, inside open shadow roots too; a text longer than 320px wraps. Give one only where it adds something, such as a cut-short or icon-only label, never to every row.

## Colours

Shown at https://designsystem1.com/colours (`website/src/pages/colours.astro`) as one palette, named by colour and sorted by hue, and the inks (greys); change the page with this section.

**One source.** The palette lives in `DS1/1-root/palette.ts`. The Colours page draws it, and `scripts/write-palette-css.ts` writes it into the CLASSless stylesheet (`DS1/1-root/one.semantic.css`) as tokens: `--one-<colour>` and `--one-<colour>-pastel`, each `light-dark(light, dark)`, plus `--one-zenith-blue` and `--one-comfortable-green` for the named pastels. `tests/palette.test.ts` fails if the two drift.

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
- A product carries the icons it uses as files (the 0001 site: `client/vendor/design-system-1/icons`, refreshed by `scripts/sync-design-system-1.mjs`) and draws one as a mask in `currentColor`, so it follows the text.
- An icon that does not exist yet is added to the library first, by `docs/icon-library.md`: derived from its neighbours, 16 × 16, then `vp run icons:build` and the icon tests. Never draw a one-off icon inside a product.

## Languages

Design system 1 owns languages for every product: the list, choosing and remembering one, the shared words, language-aware addresses, the Convex check and the picker. A product brings only its own words. The full guide is the Languages page (`website/src/content/docs/1-root/languages.md`, https://designsystem1.com/1-root/languages/).

1. **Import** from the `ds-one` package, or from the product's vendored copy of `DS1/` (Ezo's `client/design/0-face/i18n.ts`). Change the module in Design system 1 and sync the copy; a vendored copy is edited only by the sync.
2. **Configure at startup**, straight after the import: `configureI18n({ languages: [...], sharedWords: true })`. `languages` is the product's subset of `LANGUAGES` (`DS1/0-face/languages.ts`); the picker, the browser's language and the address prefixes all follow it.
3. **Words** live in the product's translations file, `{ "<language>": { "<key>": "<text>" } }`, keyed by the English sentence or by a dotted id with an `en` table. English is the fallback, then the key itself. Placeholders are `{name}` or `{{name}}`, filled by `translate(key, params)`. One file per language (`languageFile: "/translations/{language}.json"`) or a TypeScript module passed to `loadTranslations` work as well. Check a file with `validateTranslations`.
4. **Shared words** (Save, Cancel, Sign in, Nothing here yet, Today, the language names) come from `DS1/0-face/translations/`; use their keys before writing a product's own, and add a word every product needs there.
5. **The picker** is `<ds-language>`: one square high, eight wide (`compact`: four).
6. **The backend** checks languages with `languageValidator` or `languageValidatorFor(subset)` from `ds-one/DS1/0-face/language-validator.ts`, imported by path in `convex/`.

Every text is sentence case, in every language.

## Checking a design

Measure, do not eyeball: in the browser, read each element's rendered width and height and its position. Widths and heights are whole squares (minus the 1px correction for items), and positions fall on the 20px grid. A row that is 32 or 36px tall, or a gap of 12px, is wrong.
