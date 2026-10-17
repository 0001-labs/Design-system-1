package com.designsystem1.ds1

import android.content.Context
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

/** The appearance a person chooses: light, dark, or the system's (the default). */
enum class DS1ThemeMode(val key: String) {
    Light("light"), Dark("dark"), System("system");

    /** The word a picker shows, in the reader's language. */
    val label: String get() = DS1Words.text(name)

    /** Whether this mode draws dark, given the system's appearance. */
    fun isDark(systemDark: Boolean): Boolean = when (this) {
        Light -> false
        Dark -> true
        System -> systemDark
    }

    /** The mode a theme cycle steps to: light, dark, system, and round again. */
    fun next(): DS1ThemeMode = entries[(ordinal + 1) % entries.size]
}

/**
 * The choices Design system 1 remembers, as `savePreferences` does on the web: the theme and
 * the language, kept on the device. Call [load] once at start; [DS1Theme] reads [theme].
 */
// Only the application's context is kept, which lives as long as the process.
@android.annotation.SuppressLint("StaticFieldLeak")
object DS1Preferences {
    private const val FILE = "ds-one:preferences"
    private var context: Context? = null

    var theme: DS1ThemeMode by mutableStateOf(DS1ThemeMode.System)
        private set

    /** Reads the saved theme and language. */
    fun load(context: Context) {
        val app = context.applicationContext
        this.context = app
        val prefs = app.getSharedPreferences(FILE, Context.MODE_PRIVATE)
        theme = DS1ThemeMode.entries.firstOrNull { it.key == prefs.getString("theme", null) } ?: DS1ThemeMode.System
        prefs.getString("language", null)?.let { tag -> DS1Words.normalize(tag)?.let { DS1Words.language = it } }
    }

    fun saveTheme(mode: DS1ThemeMode) {
        theme = mode
        context?.getSharedPreferences(FILE, Context.MODE_PRIVATE)?.edit()?.putString("theme", mode.key)?.apply()
    }

    fun saveLanguage(language: DS1Language) {
        DS1Words.language = language
        context?.getSharedPreferences(FILE, Context.MODE_PRIVATE)?.edit()?.putString("language", language.code)?.apply()
    }
}

/** Whether the composition should draw dark: the saved mode over the system's appearance. */
@Composable
fun ds1IsDark(): Boolean = DS1Preferences.theme.isDark(isSystemInDarkTheme())
