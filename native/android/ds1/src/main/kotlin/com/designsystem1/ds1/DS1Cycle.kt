package com.designsystem1.ds1

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

/**
 * `ds-cycle`: a button that steps to the next of [values] on each press, wrapping round, its
 * label the current value's. Disabled when there is nothing to step to.
 */
@Composable
fun <T> DS1Cycle(
    values: List<T>,
    value: T,
    onChange: (T) -> Unit,
    label: (T) -> String,
    modifier: Modifier = Modifier,
    kind: DS1ButtonKind = DS1ButtonKind.Primary,
    enabled: Boolean = true,
) {
    val next = values.getOrNull((values.indexOf(value) + 1).mod(values.size.coerceAtLeast(1)))
    DS1Button(label(value), onClick = { if (next != null) onChange(next) }, modifier = modifier, kind = kind, enabled = enabled && values.any { it != value })
}

/** The theme cycle: light, dark, system, saved with [DS1Preferences]. */
@Composable
fun DS1ThemeCycle(modifier: Modifier = Modifier) {
    DS1Cycle(DS1ThemeMode.entries, DS1Preferences.theme, { DS1Preferences.saveTheme(it) }, { it.label }, modifier, DS1ButtonKind.Secondary)
}

/** A normal button that fits the language name. Legacy compact and chip arguments remain compatible. */
@Suppress("UNUSED_PARAMETER")
@Composable
fun DS1LanguageCycle(modifier: Modifier = Modifier, compact: Boolean = false, chip: Boolean = false, primary: Boolean = false) {
    val name = DS1Words.language.nativeLabel
    val label = "${DS1Words.text("Language")}: $name"
    DS1Button(name, { DS1Preferences.saveLanguage(DS1Words.next()) }, modifier.semantics { contentDescription = label }, kind = if (primary) DS1ButtonKind.Primary else DS1ButtonKind.Secondary)
}

/** Disabled controls at half strength, as every Design system 1 control. */
internal fun Modifier.ds1Disabled(enabled: Boolean) = alpha(if (enabled) 1f else 0.5f)
