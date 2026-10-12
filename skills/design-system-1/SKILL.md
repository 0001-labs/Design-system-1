---
name: design-system-1
description: The exact rules of Design system 1, the 0001 design framework: the 20px square, item and row sizes (one square high), widths in whole squares, type sizes, lines, corners, colours and motion. Use whenever you design, build or review any interface, page, component, diagram or card in a 0001 product (Ezo, Link, Consistency, Peer, Ins, Visual, the 0001 site, System) or a 0001 design for a client, and before choosing any size, spacing, font size or radius.
---

# Design system 1

Design system 1 (`/Users/joachim/0001/Design system 1`, source in `DS1/`) is the framework every 0001 product is drawn on. Products carry a copy or a fork of it (see the 0001 brief), so these rules hold even where the package is not imported. Client sites keep the client's own design unless 0001 is designing for them.

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
| Text | 14px (`--type-size-default`), 10px small; padded 4px from the item's edge | `one.css`, Ezo `--item-text-padding` |
| Lines | 1px, centred on the grid line | Ezo `--outline-stroke` |
| Corners | square for items and rows; 4px (`--radius`) only on pictures, buttons and fields | Peer and Ins follow this |

Items stack edge to edge with no gap, as an Ezo list does; a header item wears the accent colour. Positions snap to the grid: anything a person can move lands on whole squares. Before calling a design done, measure it in the browser (an element's width and height must be whole squares minus the 1px correction) instead of judging by eye.

## The rest of the language

- Colours, typefaces and tokens come from `DS1/1-root/one.css` (or the product's copy, e.g. Ezo's `client/design/1-root/one.css`). Use the tokens, never raw values.
- Words sit straight on the paper, with no cards or shadows around content.
- Sentence case in interface copy, never all caps.
- Motion animates `transform` and `opacity` only.
- On phones and tablets every measure is multiplied by `--sf` (1 on a computer; the screen width over 280 on a phone, between 0.75 and 2). Write lengths as units or `calc(Npx * var(--sf))`, never bare pixels, except hairlines.

## Colours

Shown at https://designsystem1.com/colours (`website/src/pages/colours.astro`) as one palette, named by colour and sorted by hue, and the inks (greys); change the page with this section.

**Dark mode versions.** Each colour has one, derived as the ds1 Figma file derives Apple green (#99ff73 to #529d36): the same hue, the saturation times 0.49, at 41% lightness; a colour already at or below 41% keeps its saturation. An ink turns over: lightness 12% + (1 − L) × 76%. Write a token as `light-dark(light, dark)`; the page lists both hexes for every colour.

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

- **Accent**: a person picks one of eight in Settings, `--apple-green` by default: apple green, every green, zenith blue, sharp blue, pink, tuned red, orange or yellow, or none (`--slate-light`) (`shared/previewCard.ts`). A header item is painted in the accent and lettered in the ink the accent can carry.
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
- A product carries the icons it uses as files (the 0001 site: `client/vendor/design-system-1/icons`, refreshed by `scripts/sync-design-system-1.mjs`) and draws one as a mask in `currentColor`, so it follows the text.
- An icon that does not exist yet is added to the library first, by `docs/icon-library.md`: derived from its neighbours, 16 × 16, then `vp run icons:build` and the icon tests. Never draw a one-off icon inside a product.

## Checking a design

Measure, do not eyeball: in the browser, read each element's rendered width and height and its position. Widths and heights are whole squares (minus the 1px correction for items), and positions fall on the 20px grid. A row that is 32 or 36px tall, or a gap of 12px, is wrong.
