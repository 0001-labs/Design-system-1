// Design system 1 for Jetpack Compose on Android. The generated sources in
// ds1/src/main/kotlin/com/designsystem1/ds1/generated come from palette.ts, measures.ts,
// the component tokens and the icon library (scripts/write-native-tokens.ts); the
// resources (fonts, icons as vector drawables) are laid out from DS1/ by the same
// script here, and by Sync 1's `kotlin` export in a product.
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "DS1"
include(":ds1")
