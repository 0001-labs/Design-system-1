---
title: iOS
description: Design system 1's Swift package for iPhone, iPad and Mac apps.
---

A Swift package that gives SwiftUI apps on iPhone, iPad and Mac Design system 1's colours, type, square, scale, icons, words and pieces. See [Native packages](/advanced/native/) for how it is generated and the whole list of pieces.

**Status: first version.** The package builds and tests on its own for iOS and macOS, and apps copy it with Sync 1.

## The package

| | |
| --- | --- |
| Location | `native/apple/` in the Design system 1 repository, with its own `Package.swift` |
| Library | `DS1`, one module imported as `import DS1` |
| Interface | SwiftUI, with `UIColor` and `NSColor` versions of every colour for UIKit and AppKit code |
| Platforms | iOS 18 and macOS 14 |
| Checks | `vp run native:test`: lays out the resources, then `swift test` in `native/apple/` |

## What it contains

- **`DS1Color`**: every palette colour with its pastel, and the surfaces of the component tokens (paper, text, muted text, titles, danger, borders, fills, the accent), as a `ShapeStyle` that switches between its light and dark values with the colour scheme. Generated from `palette.ts` and `component-tokens.css`; never edited by hand.
- **`.ds1Paper(_:)`**: the paper everything inside stands on (`--ds-paper`), read from the environment as `\.ds1Paper` by pages, page layouts, panels, dialogs, menus and fields. `DS1Color.paper` unless a view above sets another, for example `.ds1Paper(DS1Color.white)` on the root view.
- **`DS1Metrics`**: the square, half a square, the control and row heights, item sizes, type sizes, letter spacing, line heights, the line and the corner, as `CGFloat` constants generated from `DS1/1-root/measures.ts`. A test holds that file to the stylesheets.
- **`DS1Scale`**: the device scale, the width over 280 between 0.75 and 2 on iPhone and iPad and 1 on a Mac, put in the environment by `.ds1Scaled()`. Every measure multiplies by it; lines stay one point. The corner is one value an app may change.
- **`DS1Font`**: the typefaces, as the same woff2 files the web loads (Core Text reads them), registered by the package. `DS1LineText` sets arrows in Inter; `figures: true` sets digits and the signs of numbers in Olivetti Dot, each digit in a cell of one width. Type stays on the grid.
- **`DS1Icon`**: the whole icon collection as vector images in the package's asset catalogue, with template rendering so icons take the text colour.
- **`.ds1Theme()`**: one modifier on the root view. It follows the saved theme (the system's by default), puts the scale on, sets the reader's language, and shows the toast stack and the page's dialogs.
- **`DS1Words`**, **`DS1Language`** and **`DS1Preferences`**: the shared words in every language, the product's own over them, and the saved theme and language.
- **The pieces**: every control, message, structure and layout in the [list](/advanced/native/#the-pieces), measured in squares and drawn square, with 4-point corners only on buttons, fields and pictures.

## Using it

Design system 1's sharing tool, Sync 1, copies the package into the app's repository with a lock file recording the source commit, the same way web projects copy the CSS and components. The copy owns its folder; the app adds it as a local package (with XcodeGen: `packages: { DS1: { path: DS1 } }`).

```json
{ "sources": { "Design system 1": { "swift": { "to": "ios/DS1", "fonts": ["GT-America-Standard-Regular.woff2", "OlivettiDot-Regular.woff2"] } } } }
```

Inter Arrows and Iosevka always travel; `fonts` names the other faces the app is licensed to carry.

```swift
import SwiftUI
import DS1

struct ItemRow: View {
    let title: String
    let amount: String

    var body: some View {
        DS1Row(rule: true) {
            DS1Icon(.receipt)
            DS1LineText(title)
            Spacer()
            DS1Figures(amount)
        }
        .foregroundStyle(DS1Color.text)
    }
}

// The root, once:
WindowGroup { ContentView().ds1Theme() }

// Anywhere, after the work is done:
DS1Toast.success("Saved")
```

A published release will add the package by URL. Swift Package Manager reads `Package.swift` from the root of a repository, so that release needs either a manifest at the root that points to `native/apple/` or a separate repository for the package.

## Decisions still open

1. **Dynamic Type.** Type stays on the grid for now; whether it should follow the system text size is open (see [Native packages](/advanced/native/#what-carries-over)).
2. **Arrows in the main face.** `DS1LineText` sets arrows in Inter; text drawn without it keeps the main face's arrows.

## Release

Versions follow the npm package: a release of `@0001-labs/design-system-1` tags the same version for the Swift package, and the release checks build and test it.
