package com.designsystem1.ds1

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.intl.LocaleList
import androidx.compose.ui.text.style.TextOverflow

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

/**
 * `ds-language`: the language picker. Eight squares by one, less the 1 dp correction (four
 * with [compact]), on the fill, the current language named in itself and in its own face;
 * a press steps to the next of the product's languages and saves it. [chip] hugs the name on
 * a control-high chip.
 */
@Composable
fun DS1LanguagePicker(modifier: Modifier = Modifier, compact: Boolean = false, chip: Boolean = false, primary: Boolean = false) {
    val scale = LocalDS1Scale.current
    val language = DS1Words.language
    val name = language.nativeLabel
    val label = "${DS1Words.text("Language")}: $name"
    if (chip) {
        DS1Button(name, { DS1Preferences.saveLanguage(DS1Words.next()) }, modifier.semantics { contentDescription = label }, kind = if (primary) DS1ButtonKind.Primary else DS1ButtonKind.Secondary)
        return
    }
    val interaction = remember { MutableInteractionSource() }
    val ink = if (primary) DS1Colors.onAccent else DS1Colors.text
    Box(
        modifier
            .width(scale.squares(if (compact) 4f else 8f) - scale.line)
            .height(scale.unit - scale.line)
            .background((if (primary) DS1Colors.accent else DS1Colors.fill).current)
            .ds1FocusRing(interaction, scale(0f), inset = true)
            .clickable(interaction, null, role = Role.Button, onClickLabel = label) { DS1Preferences.saveLanguage(DS1Words.next()) }
            .semantics { contentDescription = label }
            .padding(horizontal = scale(4f)),
        contentAlignment = Alignment.CenterStart,
    ) {
        BasicText(
            name,
            style = ds1TextStyle().copy(color = ink.current, localeList = LocaleList(language.code), lineHeight = androidx.compose.ui.unit.TextUnit.Unspecified),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

/** Disabled controls at half strength, as every Design system 1 control. */
internal fun Modifier.ds1Disabled(enabled: Boolean) = alpha(if (enabled) 1f else 0.5f)
