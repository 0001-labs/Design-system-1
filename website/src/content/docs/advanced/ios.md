---
title: iOS
description: The planned Swift package of Design system 1 for iPhone, iPad and Mac apps.
---

A Swift package that gives SwiftUI apps on iPhone, iPad and Mac Design system 1's colours, type, square, scale and icons. See [Native packages](/advanced/native/) for how it is generated and what carries over from the web.

**Status: in preparation.** The package is not published yet; the names below are the plan.

## The package

| | |
| --- | --- |
| Location | `native/apple/` in the Design system 1 repository, with its own `Package.swift` |
| Library | `DS1`, one module imported as `import DS1` |
| Interface | SwiftUI, with `UIColor` and `NSColor` versions of every colour for UIKit and AppKit code |
| Platforms | iOS 18 and macOS 13 proposed, confirmed with the first release |
| Checks | `swift build` and `swift test` in `native/apple/` |

## What it will contain

- **`DS1Color`**: every palette colour with its pastel, as colours that switch between their light and dark versions with the system appearance. Generated from `palette.ts`; never edited by hand.
- **`DS1Metrics`**: the square (20), half a square, the control and row heights, type sizes (14 and 10), letter spacing, line heights, the 1-point line and the 4-point corner, as `CGFloat` constants. The corner is also an environment value an app may change.
- **`DS1Scale`**: the device scale, the screen width over 280 between 0.75 and 2 on iPhone and iPad and 1 on a Mac, passed down through the SwiftUI environment so every measure multiplies by it.
- **`DS1Font`**: the typefaces, registered when the package loads, with a text helper that sets arrows in Inter and code in Iosevka Extended.
- **`DS1Icon`**: the icon collection as vector images in the package's asset catalogue, with template rendering so icons take the text colour.
- **Foundation views**: `DS1Page`, `DS1Row`, `DS1LineText`, `DS1PaperGrid` and a `DS1ButtonStyle`, measured in squares and drawn square, with 4-point corners only on buttons, fields and pictures.

## Using it

Apps will take the package in as a local Swift package. Until the first release, Design system 1's sharing tool copies `native/apple/` into the app's repository with a lock file recording the source commit, the same way web projects copy the CSS and components. The app then adds that folder in Xcode as a local package.

```swift
import SwiftUI
import DS1

struct ItemRow: View {
    let title: String

    var body: some View {
        DS1Row {
            DS1LineText(title)
        }
        .foregroundStyle(DS1Color.ink)
    }
}
```

A published release will add the package by URL. Swift Package Manager reads `Package.swift` from the root of a repository, so that release needs either a manifest at the root that points to `native/apple/` or a separate repository for the package.

## Decisions still open

1. **Fonts.** Inter Arrows and Iosevka may be redistributed under their licences and ship in the package. GT America is licensed per app: either each app supplies its own files and the package only names the face, or the package includes them for licensed apps only.
2. **Font format.** The web uses `woff2`. The package will carry TrueType or OpenType builds, made from the same sources and cut to the same character sets, under the faces' own PostScript names.
3. **Lowest versions.** iOS 18 and macOS 13 are proposed; the package goes no lower than the oldest app that uses it.
4. **Arrows.** A fallback font cannot override arrows that the main typeface already draws, so arrows are set in Inter by the text helper or removed from the main face's build.
5. **Dynamic Type.** Whether text follows the system text size; see [Settle before generating](/advanced/native/#settle-before-generating).

## Release

Versions follow the npm package: a release of `@0001-labs/design-system-1` tags the same version for the Swift package, and the release checks build and test it.
