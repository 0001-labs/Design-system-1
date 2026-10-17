// A catalogue of Design system 1's Kotlin pieces, built the way a product takes the library:
// the package's folder included as a build, its library depended on by its coordinates.
// Run it with `sh scripts/gradle.sh -p sample installDebug` from the repository.
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
    versionCatalogs { create("libs") { from(files("../gradle/libs.versions.toml")) } }
}
rootProject.name = "DS1 Sample"
includeBuild("..")
