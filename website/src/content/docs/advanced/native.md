---
title: Native packages
description: The plan for Design system 1 in Swift and Kotlin, generated from the same source as the CSS.
---

Design system 1 is being prepared for native apps: a Swift package for iPhone, iPad and Mac, and a Kotlin package for Android. Both carry the same colours, type, square and scale as the stylesheet, so a native screen and a web page built from Design system 1 match to the pixel.

**Status: in preparation.** Nothing is published yet. This page and the [iOS](/advanced/ios/) and [Android](/advanced/android/) pages describe what the packages will contain and how they will be made. Names and APIs may still change before the first release.

## One source, three outputs

The stylesheet stays the reference. Nothing in the native packages is typed by hand: a script reads Design system 1's sources and writes the Swift and Kotlin files, and a test fails when a generated file and its source disagree.

| Source | Web | Swift | Kotlin |
| --- | --- | --- | --- |
| `DS1/1-root/palette.ts`: every colour, its pastel, dark and dim versions | `one.semantic.css` tokens | `Color` values that follow light and dark mode | `Color` values in a light and a dark colour scheme |
| Measures: the square, control height, type sizes, lines, corners | `grid.css`, `one.css` | `CGFloat` constants | `Dp` and `TextUnit` constants |
| Typefaces in `DS1/1-root/fonts` | `@font-face` | Font files registered by the package | Font resources in the package |
| Icons in `DS1/x-icon` | SVG | Vector images in an asset catalogue | Vector drawables |

The generator lives beside the existing palette script in `scripts/`, so changing a colour or a measure means running one command and committing the web and native outputs together.

## What carries over

- **The square.** One square is 20 points on Apple platforms and 20 dp on Android, the same as 20 CSS pixels. Rows, items and headers are one square high; widths and gaps are whole squares or half a square.
- **The scale.** On a computer every measure is multiplied by 1. On a phone or tablet it is multiplied by the screen width over 280, between 0.75 and 2, rounded to three decimals, exactly as `--sf` does on the web. Each package exposes this scale as one value the whole interface reads.
- **Type.** 14 text and 10 small, in the same typefaces, with the same letter spacing and line heights. Arrows are always Inter, in every typeface; code is Iosevka Extended.
- **Lines and corners.** 1-point lines on the grid. Rows and items stay square; pictures, buttons and fields round their corners by 4. The corner is one value an app may change for its whole interface, as a stylesheet can override `--ds-radius`.
- **Light and dark.** Colours switch with the system appearance, inks turn over, and pastels become their dim versions.
- **Motion.** Only position, scale and opacity animate, and every animation respects the system's reduce motion setting.

## What stays native

The packages give native controls Design system 1's measures and colours rather than redrawing the platform. Navigation, sheets, menus, text selection, keyboard handling and accessibility come from SwiftUI and Jetpack Compose. Where the web has a component the platform lacks, the package adds a view of the same name and behaviour.

## Settle before generating

- **One set of values (settled).** The Root tokens in `one.css` and the component tokens in `component-tokens.css` and `component-metrics.css` now agree. Colours follow the palette: black #2a2a2a, light slate #e6e6e6, dark slate #3c3c3c, grey #797979, and Apple green as the accent. Type follows the component tokens: 14 text on 16 lines, 13 headings, −0.3 letter spacing and weight 400. The native packages take the same values.
- **Measures in one file.** The square, control and row heights, type sizes, letter spacing, line heights and corners move into a small TypeScript file in `DS1/1-root`, like `palette.ts`. The CSS keeps its values, and a test fails when the CSS and that file disagree.
- **System text size.** Whether type follows the system's text size setting (Dynamic Type on Apple platforms, font scale on Android) or stays on the grid. Following it keeps text accessible but can push a row past one square, so rows then grow by whole squares.

## Order of work

1. **Tokens.** Generate colours, measures and the scale for both platforms, with tests against their sources.
2. **Fonts and icons.** Ship the typefaces that may be redistributed and the icon collection as vectors.
3. **Foundation views.** Page, row, line text, button and paper grid in each package.
4. **Core components.** Native versions of the Core controls, one at a time, each matched against its web version at the same scale.
5. **Release.** A Swift package and a Kotlin library with version numbers that follow the npm package.

See [iOS](/advanced/ios/) and [Android](/advanced/android/) for each platform's package, its requirements and the decisions still open.
