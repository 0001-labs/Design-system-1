package com.designsystem1.ds1

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
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

/**
 * `ds-tabs`: tabs one square apart in a row one square high; each tab one control high on
 * no ground, muted, and the chosen one on the fill in the text colour. [fill] gives every tab
 * the same width. With [segmented], tabs are one square high on the fill and the chosen one
 * on the accent (`role="group"` with `aria-pressed`).
 */
@Composable
fun <T> DS1Tabs(
    tabs: List<DS1Segment<T>>,
    selected: T,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    segmented: Boolean = false,
    fill: Boolean = false,
) {
    val scale = LocalDS1Scale.current
    Row(
        modifier.height(scale.unit).selectableGroup(),
        horizontalArrangement = Arrangement.spacedBy(scale(4f)),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        for (tab in tabs) {
            val chosen = tab.value == selected
            val interaction = remember { MutableInteractionSource() }
            val ground = when {
                segmented && chosen -> DS1Colors.accent.current
                segmented -> DS1Colors.fill.current
                chosen -> DS1Colors.fill.current
                else -> Color.Transparent
            }
            val ink = when {
                segmented && chosen -> DS1Colors.onAccent
                segmented || chosen -> DS1Colors.text
                else -> DS1Colors.textMuted
            }
            Row(
                Modifier
                    .then(if (fill) Modifier.weight(1f) else Modifier)
                    .height(if (segmented) scale.unit else scale.control)
                    .background(ground, RoundedCornerShape(scale.radius))
                    .ds1FocusRing(interaction)
                    .selectable(chosen, interaction, null, tab.enabled, Role.Tab) { onSelect(tab.value) }
                    .padding(horizontal = scale(4f)),
                horizontalArrangement = Arrangement.spacedBy(scale(4f), Alignment.CenterHorizontally),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (tab.icon != null) DS1Icon(tab.icon, tint = ink.current)
                if (tab.label.isNotEmpty()) DS1ControlText(tab.label, ink)
            }
        }
    }
}
