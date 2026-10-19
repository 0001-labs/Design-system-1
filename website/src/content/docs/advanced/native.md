---
title: Native packages
description: Design system 1 in Swift and Kotlin, generated from the same sources as the CSS.
---

Design system 1 comes as two native packages as well as the stylesheet: a Swift package for iPhone, iPad and Mac, and a Kotlin package for Android. Both carry the same colours, type, square, scale, icons and words as the web, and both offer the same pieces under the same names, so a screen built from Design system 1 matches on every platform.

**Status: first version.** Both packages build and test on their own, and apps copy them with Sync 1. They are not published to a package registry yet. See [iOS](/advanced/ios/) and [Android](/advanced/android/) for each package's setup.

## One source, three outputs

The stylesheet stays the reference, and nothing in the native packages is typed by hand. A script (`vp run native:tokens`) reads Design system 1's sources and writes the Swift and Kotlin files, and a test fails when a generated file and its source disagree.

| Source | Web | Swift | Kotlin |
| --- | --- | --- | --- |
| `DS1/1-root/palette.ts` and the component tokens: every colour, its pastel, dark and dim versions, and the surfaces | `light-dark()` tokens | `DS1Color`, a `ShapeStyle` that follows light and dark | `DS1Colors`, read with `.current` |
| `DS1/1-root/measures.ts`: the square, control and row heights, type, tracking, lines, corners, the scale | `grid.css`, `one.css`, `component-metrics.css` | `DS1Metrics` in points | `DS1Metrics` in dp |
| Typefaces in `DS1/1-root/fonts` | `@font-face` | The woff2 files, which Core Text reads | TrueType and OpenType builds of them (`vp run native:fonts`) |
| Icons in `DS1/x-icon` | SVG | Vector images in an asset catalogue | Vector drawables |
| `DS1/0-face/languages.ts` and the shared words in `DS1/0-face/translations` | `configureI18n`, `translate()` | `DS1Language`, `DS1Words` | `DS1Language`, `DS1Words` |

## What carries over

- **The square.** One square is 20 points on Apple platforms and 20 dp on Android, the same as 20 CSS pixels. Rows, items and headers are one square high; widths and gaps are whole squares or half a square.
- **The scale.** On a computer every measure is multiplied by 1. On a phone or tablet it is multiplied by the screen width over 280, between 0.75 and 2, rounded to three decimals, exactly as `--sf` does on the web.
- **Type.** 14 text on 16 lines, 10 small and 13 headings, with −0.3 letter spacing. Arrows are always Inter; figures can be Olivetti Dot, each digit in a cell of one width. Type stays on the grid rather than following the system text size.
- **Lines and corners.** 1-point lines on the grid. Rows and items stay square; pictures, buttons and fields round their corners by 4, and an app may change that corner for its whole interface.
- **The paper.** Pages, page layouts, panels, dialogs, menus and fields stand on one paper, `--ds-paper` on the web. An app that wants another paper sets it once at its root: `.ds1Paper(DS1Color.white)` in SwiftUI, `CompositionLocalProvider(LocalDS1Paper provides DS1Colors.white)` in Compose. Everything inside follows it, as everything on a web page follows `--ds-paper`.
- **Light and dark.** Colours switch with the appearance, inks turn over, and pastels become their dim versions. The theme a person chooses (light, dark or system) is saved on the device.
- **Words.** The shared words in every language, looked up as the web does: the language, its primary subtag, its relatives, then English. A product registers its own words on top.
- **Motion.** Only position, scale and opacity animate, and every animation stands still when the system asks for reduced motion.

## The pieces

Every public piece of the web library has a native counterpart with the same name on both platforms, except where noted.

| Web | Swift | Kotlin |
| --- | --- | --- |
| Theme, scale, preferences | `.ds1Theme()`, `.ds1Scaled()`, `DS1Preferences` | `DS1Theme`, `DS1Scaled`, `DS1Preferences` |
| `ds-text` | `DS1LineText`, `DS1Figures` | `DS1LineText`, `DS1Figures` |
| `ds-icon` | `DS1Icon` | `DS1Icon` |
| `ds-button`, icon button, danger | `DS1ButtonStyle` (`.buttonStyle(.ds1(.primary))`), `DS1IconButton`, `DS1DangerButton` | `DS1Button`, `DS1IconButton`, `DS1DangerButton` |
| `ds-button split` | `DS1SplitButton` | `DS1SplitButton` |
| `ds-input`, `multiline` | `DS1Field` (`rows:`), `DS1FieldStyle` | `DS1Field(rows)` |
| `ds-checkbox`, `ds-radio`, choice tiles | `DS1CheckboxStyle`, `DS1Checkbox`, `DS1Radio`, `DS1Choice` | `DS1Checkbox`, `DS1Radio`, `DS1Choice` |
| `ds-switch`, `rounded` | `DS1SwitchStyle` (`.ds1Switch`, `.ds1Switch(rounded:)`) | `DS1Switch(rounded)` |
| `ds-select`, a field | `DS1Select` (the system's menu) | `DS1Select` |
| `ds-tabs` | `DS1Tabs` | `DS1Tabs` |
| `ds-badge`, `ds-token`, `ds-swatch`, link, `ds-gap` | `DS1Badge`, `DS1Token`, `DS1Swatch`, `DS1Link`, `DS1Gap` | `DS1Badge`, `DS1Token`, `DS1Swatch`, `DS1Link`, `DS1Gap` |
| `ds-avatar`, `ds-avatar-group` | `DS1Avatar`, `DS1AvatarGroup` | `DS1Avatar`, `DS1AvatarGroup` |
| `ds-notice` (`banner`), `ds-empty`, `ds-loading` | `DS1Notice` (`banner:`), `DS1Empty`, `DS1Loading` | `DS1Notice(banner)`, `DS1Empty`, `DS1Loading` |
| `ds-tooltip` | `.ds1Tooltip(_:)` | `DS1Tooltip` |
| `ds-cycle`, its language picker | `DS1Cycle`, `DS1ThemeCycle`, `DS1LanguageCycle` | `DS1Cycle`, `DS1ThemeCycle`, `DS1LanguageCycle` |
| `toast()` and its stack | `DS1Toast`, `DS1ToastHost` | `DS1Toast`, `DS1ToastHost` |
| `ds-overlay`, `alert`, `confirm`, `prompt` | `DS1OverlayBox`, `.ds1Overlay`, `DS1Overlays` | `DS1Overlay`, `DS1Overlays` |
| `ds-select`, a menu from a button | `DS1Menu`, `DS1MenuItem` (floating menus are the system's) | `DS1Menu`, `DS1MenuItem` |
| `ds-context` | the system's context menu (`.contextMenu`) | the system's long-press menu |
| `ds-accordion`, `ds-list`, `ds-panel` | `DS1Accordion`, `DS1List`, `DS1Panel` | `DS1Accordion`, `DS1List`, `DS1Panel` |
| `ds-sidebar`, `ds-table`, `ds-token-field` | `DS1Sidebar`, `DS1Table`, `DS1TokenField` | `DS1Sidebar`, `DS1Table`, `DS1TokenField` |
| `ds-page` and its layouts, tiles | `DS1Page`, `DS1PageLayout`, `DS1Tiles` | `DS1Page`, `DS1PageLayout`, `DS1Tiles` |
| `ds-row`, `ds-grid` | `DS1Row`, `DS1Rule`, `DS1PaperGrid` | `DS1Row`, `DS1Rule`, `DS1PaperGrid` |
| `format.ts`, `pricing.ts`, `copyText` | `DS1Format`, `DS1Pricing`, `DS1Clipboard` | `DS1Format`, `DS1Pricing`, `DS1Clipboard` |

Left out on purpose: the 2-core card (off the system: no boxes around content), `ds-form` (the platform's own forms), and page dots. Charts, the composer, and `ds-stat`, `ds-meter` and `ds-steps` follow later; until then a native figure is `DS1Figures` on its lines.

## What stays native

The packages give native controls Design system 1's measures and colours rather than redrawing the platform. Navigation, sheets, text selection, keyboards, pickers for files and colours, and accessibility come from SwiftUI and Jetpack Compose. On Apple platforms, floating menus and a select's options are the system's own menus.

## Checks

- `vp run native:test`: writes the generated files, then builds and tests the Swift package.
- `vp run native:test:android`: writes the generated files, then tests, lints and builds the Kotlin package.
- `vp test`: holds the generated files to their sources and the Sync 1 exports to the package folders.
