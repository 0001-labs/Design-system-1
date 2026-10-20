package com.designsystem1.ds1

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

/** One segment of a split button or one tab: its value, its words, an icon, and whether it can be chosen. */
data class DS1Segment<T>(val value: T, val label: String, val icon: DS1IconName? = null, val enabled: Boolean = true)

/**
 * `ds-button split`: segments on the fill one control high, 1 dp apart, only the outer
 * corners rounded; the chosen one on the accent. With [onPress] instead of a selection
 * ([selected] null), it is a row of actions (`actions`). [compact] squares one-letter labels.
 */
@Composable
fun <T> DS1SplitButton(
    segments: List<DS1Segment<T>>,
    selected: T?,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    compact: Boolean = false,
    enabled: Boolean = true,
) {
    val scale = LocalDS1Scale.current
    val r = scale.radius
    Row(
        modifier
            .height(scale.control)
            .alpha(if (enabled) 1f else 0.5f)
            .selectableGroup()
            .then(if (label != null) Modifier.semantics { contentDescription = label } else Modifier),
        horizontalArrangement = Arrangement.spacedBy(1.dp),
    ) {
        segments.forEachIndexed { i, segment ->
            val shape = RoundedCornerShape(
                topStart = if (i == 0) r else 0.dp, bottomStart = if (i == 0) r else 0.dp,
                topEnd = if (i == segments.lastIndex) r else 0.dp, bottomEnd = if (i == segments.lastIndex) r else 0.dp,
            )
            val chosen = selected != null && segment.value == selected
            val interaction = remember { MutableInteractionSource() }
            val ink = if (chosen) DS1Colors.onAccent else DS1Colors.textMuted
            val square = segment.icon != null && segment.label.isEmpty() || (compact && segment.label.length == 1)
            Box(
                Modifier
                    .height(scale.control)
                    .then(if (square) Modifier.width(scale.control) else Modifier)
                    .background((if (chosen) DS1Colors.accent else DS1Colors.fill).current, shape)
                    .ds1FocusRing(interaction, 0.dp, inset = true)
                    .then(
                        if (selected != null) Modifier.selectable(chosen, interaction, null, enabled && segment.enabled, Role.Tab) { if (!chosen) onSelect(segment.value) }
                        else Modifier.clickable(interaction, null, enabled && segment.enabled, role = Role.Button) { onSelect(segment.value) },
                    )
                    .padding(horizontal = if (square) 0.dp else scale(if (compact) 3f else 5f))
                    .alpha(if (segment.enabled) 1f else 0.5f),
                contentAlignment = Alignment.Center,
            ) {
                if (segment.icon != null) DS1Icon(segment.icon, size = DS1IconSize.Large, tint = ink.current, contentDescription = segment.label.ifEmpty { null })
                else DS1ControlText(segment.label, ink)
            }
        }
    }
}

/** `ds-tabs`' faces: buttons (the default), the words alone (`text`), or joined as a split button (`split`). */
enum class DS1TabsFace { Button, Text, Split }

/**
 * `ds-tabs`: tabs 4 dp apart in a row one square high, in one of three [face]s. [DS1TabsFace.Button]:
 * each tab one control high on no ground, muted, the chosen one on the fill in the text colour.
 * [DS1TabsFace.Text]: the words alone, no fill, the chosen one in the ink, the run drawn 4 dp back so
 * the first word starts on the edge. [DS1TabsFace.Split]: joined into one face a control high as the
 * split button, a dp between them, the chosen one on the accent. [fill] gives every tab the same
 * width. With [segmented] (an option group, `role="group"` with `aria-pressed`), button tabs are one
 * square high on the fill and the chosen one on the accent.
 */
@Composable
fun <T> DS1Tabs(
    tabs: List<DS1Segment<T>>,
    selected: T,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    face: DS1TabsFace = DS1TabsFace.Button,
    segmented: Boolean = false,
    fill: Boolean = false,
) {
    val scale = LocalDS1Scale.current
    val split = face == DS1TabsFace.Split
    val text = face == DS1TabsFace.Text
    Row(
        modifier
            .height(scale.unit)
            .then(if (text) Modifier.offset(x = -scale(4f)) else Modifier)
            .selectableGroup(),
        horizontalArrangement = Arrangement.spacedBy(if (split) 1.dp else scale(4f)),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        tabs.forEachIndexed { i, tab ->
            val chosen = tab.value == selected
            val interaction = remember { MutableInteractionSource() }
            val ground = when {
                text -> Color.Transparent
                (split || segmented) && chosen -> DS1Colors.accent.current
                split || segmented -> DS1Colors.fill.current
                chosen -> DS1Colors.fill.current
                else -> Color.Transparent
            }
            val ink = when {
                text -> if (chosen) DS1Colors.text else DS1Colors.textMuted
                (split || segmented) && chosen -> DS1Colors.onAccent
                split -> DS1Colors.textMuted
                segmented || chosen -> DS1Colors.text
                else -> DS1Colors.textMuted
            }
            val r = scale.radius
            val shape = if (split) RoundedCornerShape(
                topStart = if (i == 0) r else 0.dp, bottomStart = if (i == 0) r else 0.dp,
                topEnd = if (i == tabs.lastIndex) r else 0.dp, bottomEnd = if (i == tabs.lastIndex) r else 0.dp,
            ) else RoundedCornerShape(r)
            Row(
                Modifier
                    .then(if (fill) Modifier.weight(1f) else Modifier)
                    .height(if (segmented && !split && !text) scale.unit else scale.control)
                    .background(ground, shape)
                    .ds1FocusRing(interaction)
                    .selectable(chosen, interaction, null, tab.enabled, Role.Tab) { onSelect(tab.value) }
                    .padding(horizontal = scale(if (split) 5f else 4f)),
                horizontalArrangement = Arrangement.spacedBy(scale(4f), Alignment.CenterHorizontally),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (tab.icon != null) DS1Icon(tab.icon, tint = ink.current)
                if (tab.label.isNotEmpty()) DS1ControlText(tab.label, ink)
            }
        }
    }
}
