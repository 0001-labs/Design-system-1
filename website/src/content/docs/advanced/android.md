---
title: Android
description: The planned Kotlin package of Design system 1 for Android apps.
---

A Kotlin library that gives Jetpack Compose apps on Android Design system 1's colours, type, square, scale and icons. See [Native packages](/advanced/native/) for how it is generated and what carries over from the web.

**Status: in preparation.** The library is not published yet; the names below are the plan.

## The library

| | |
| --- | --- |
| Location | `native/android/` in the Design system 1 repository, a Gradle project in the Kotlin DSL |
| Library | `ds1`, Kotlin package `com.designsystem1.ds1` |
| Interface | Jetpack Compose foundation and UI, with no Material dependency |
| Platform | Android, API level 26 or later proposed |
| Checks | `./gradlew build` and `./gradlew test` in `native/android/` |

## What it will contain

- **`DS1Colors`**: every palette colour with its pastel, in a light and a dark scheme. Generated from `palette.ts`; never edited by hand.
- **`DS1Metrics`**: the square (`20.dp`), half a square, the control and row heights, type sizes (14 and 10), letter spacing, line heights, the 1 dp line and the 4 dp corner. The corner is also a composition local an app may change.
- **`DS1Scale`**: the device scale, the screen width over 280 between 0.75 and 2, as on a phone or tablet on the web, provided through a composition local so every measure multiplies by it.
- **`DS1Type`**: the typefaces as font resources, with a text helper that sets arrows in Inter and code in Iosevka Extended.
- **`DS1Icons`**: the icon collection as vector drawables, generated from the SVG sources, tinted by the text colour.
- **`DS1Theme`**: one composable that wraps an app, follows the system's dark theme and provides the colours, type, scale and shapes.
- **Foundation composables**: `DS1Page`, `DS1Row`, `DS1LineText`, `DS1PaperGrid` and `DS1Button`, measured in squares and drawn square, with 4 dp corners only on buttons, fields and pictures.

## Using it

Apps will take the library in as a local module. Until the first release, Design system 1's sharing tool copies `native/android/` into the app's repository with a lock file recording the source commit, and the app includes it as a Gradle build.

```kotlin
// settings.gradle.kts
includeBuild("ds1")
```

```kotlin
import com.designsystem1.ds1.DS1Theme
import com.designsystem1.ds1.DS1Row
import com.designsystem1.ds1.DS1LineText

@Composable
fun ItemRow(title: String) {
    DS1Row {
        DS1LineText(title)
    }
}

// Wrap the app once
setContent { DS1Theme { App() } }
```

A published release will be a Maven artifact, `com.designsystem1:ds1`, so apps outside the repository can add it as an ordinary dependency.

## Decisions still open

1. **Fonts.** Inter Arrows and Iosevka may be redistributed under their licences and ship as resources. GT America is licensed per app: either each app supplies its own files, or the library includes them for licensed apps only.
2. **Font format.** Android does not load `woff2`. The library carries the TrueType or OpenType builds, made from the same sources and cut to the same character sets.
3. **Lowest API level.** API level 26 is proposed; the library goes no lower than the oldest app that uses it.
4. **System font scale.** Whether text follows the system font size; see [Settle before generating](/advanced/native/#settle-before-generating).
5. **Where it is published.** Maven Central under `com.designsystem1`, which needs the domain verified and releases signed, or a package registry until then.

## Release

Versions follow the npm package: a release of `@0001-labs/design-system-1` tags the same version for the Kotlin library, and the release checks build and test it.
