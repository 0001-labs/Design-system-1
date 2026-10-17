---
title: Android
description: Design system 1's Kotlin package for Android apps in Jetpack Compose.
---

A Kotlin library that gives Jetpack Compose apps on Android Design system 1's colours, type, square, scale, icons, words and pieces. See [Native packages](/advanced/native/) for how it is generated and the whole list of pieces.

**Status: first version.** The library builds, lints and tests on its own, and apps copy it with Sync 1.

## The library

| | |
| --- | --- |
| Location | `native/android/` in the Design system 1 repository, a Gradle build in the Kotlin DSL |
| Library | `ds1`, Kotlin package `com.designsystem1.ds1` |
| Interface | Jetpack Compose foundation and UI, with no Material dependency |
| Platform | Android 8 (API level 26) and later |
| Checks | `vp run native:test:android`: writes the generated files, then tests, lints and builds |

## What it contains

- **`DS1Colors`**: every palette colour with its pastel, and the surfaces of the component tokens, each a `DS1Color` with a light and a dark value. Read one with `.current` in a composition. Generated; never edited by hand.
- **`LocalDS1Paper`**: the paper everything inside stands on (`--ds-paper`), read by pages, page layouts, panels, dialogs, menus and fields. `DS1Colors.paper` unless a composable above provides another: `CompositionLocalProvider(LocalDS1Paper provides DS1Colors.white) { … }`.
- **`DS1Metrics`** and **`DS1Scale`**: the measures from `measures.ts`, and the device scale (the width over 280 between 0.75 and 2) from `LocalDS1Scale`. Every length is `scale.unit`, `scale.squares(4f)` or `scale(16f)`; lines stay one dp.
- **`DS1Font`**: the typefaces as font resources, built from the web's woff2 files. Text sets arrows in Inter and, with `figures`, digits in Olivetti Dot in cells of one width. Type does not follow the system font scale.
- **`DS1IconName`** and **`DS1Icon`**: the whole icon collection as vector drawables, tinted by the text colour.
- **`DS1Theme`**: one composable around the app. It follows the saved theme (the system's by default), puts the scale on, and shows the toast stack and the page's dialogs.
- **`DS1Words`**, **`DS1Language`** and **`DS1Preferences`**: the shared words in every language, the product's own over them, and the saved theme and language.
- **The pieces**: every control, message, structure and layout in the [list](/advanced/native/#the-pieces).

## Using it

Sync 1 copies the library into the app's repository with a lock file recording the source commit, the same way web projects copy the CSS and components. The copy owns its folder.

```json
{ "sources": { "Design system 1": { "kotlin": { "to": "android/ds1", "fonts": ["GT-America-Standard-Regular.woff2", "OlivettiDot-Regular.woff2"] } } } }
```

Inter Arrows and Iosevka always travel; `fonts` names the other faces the app is licensed to carry. The app includes the copy as a build and depends on it:

```kotlin
// settings.gradle.kts
includeBuild("ds1")

// app/build.gradle.kts
dependencies { implementation("com.designsystem1:ds1") }
```

```kotlin
import com.designsystem1.ds1.*

class Main : ComponentActivity() {
    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        DS1Preferences.load(this)
        setContent { DS1Theme { App() } }
    }
}

@Composable
fun ItemRow(title: String, amount: String) {
    DS1Row(rule = true) {
        DS1Icon(DS1IconName.receipt)
        DS1LineText(title, Modifier.weight(1f))
        DS1Figures(amount)
    }
}

// Anywhere, after the work is done:
DS1Toast.success("Saved")
```

## Decisions still open

1. **System font scale.** Type stays on the grid for now; whether it should follow the system font size is open (see [Native packages](/advanced/native/#what-carries-over)).
2. **Where it is published.** Maven Central under `com.designsystem1`, which needs the domain verified and releases signed, or a package registry until then.

## Release

Versions follow the npm package: a release of `@0001-labs/design-system-1` tags the same version for the Kotlin library.
