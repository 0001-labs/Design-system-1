package com.designsystem1.ds1

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties

/**
 * `ds-menu` floating from what opened it: half a square of room from the anchor and inside
 * the screen, below unless there is more room above, at least as wide as the anchor and
 * eight squares; 4 dp of padding, a 1 dp border, the corner, the paper, no shadow, at most 16
 * squares tall and scrolling. Fill it with [DS1MenuItem], [DS1MenuLabel] and [DS1MenuSeparator].
 */
@Composable
fun DS1Menu(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    anchorWidth: androidx.compose.ui.unit.Dp? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    if (!expanded) return
    val scale = LocalDS1Scale.current
    val density = LocalDensity.current
    val gap = with(density) { scale.half.roundToPx() }
    val dark = LocalDS1Dark.current
    Popup(popupPositionProvider = remember(gap) { MenuPosition(gap) }, onDismissRequest = onDismissRequest, properties = PopupProperties(focusable = true)) {
        androidx.compose.runtime.CompositionLocalProvider(LocalDS1Dark provides dark, LocalDS1Scale provides scale) {
            Column(
                modifier
                    .widthIn(min = maxOf(scale.squares(8f), anchorWidth ?: 0.dp))
                    .heightIn(max = scale.squares(16f))
                    .background(LocalDS1Paper.current.current, RoundedCornerShape(scale.radius))
                    .border(DS1Metrics.line.dp, DS1Colors.border.current, RoundedCornerShape(scale.radius))
                    .verticalScroll(rememberScrollState())
                    .padding(scale(4f)),
                content = content,
            )
        }
    }
}

/**
 * A menu entry: one square high, 4 dp in, the corner, the fill under a finger or the
 * keyboard. [selected] marks the chosen option with a check; [danger] letters it in the
 * danger colour.
 */
@Composable
fun DS1MenuItem(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: DS1IconName? = null,
    selected: Boolean? = null,
    danger: Boolean = false,
    enabled: Boolean = true,
    trailing: String? = null,
) {
    val scale = LocalDS1Scale.current
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val focused by interaction.collectIsFocusedAsState()
    val ink = if (danger) DS1Colors.danger else DS1Colors.text
    Row(
        modifier
            .fillMaxWidth()
            .height(scale.unit)
            .background(if (pressed || focused) DS1Colors.fill.current else Color.Transparent, RoundedCornerShape(scale.radius))
            .clickable(interaction, null, enabled, role = if (selected != null) Role.RadioButton else Role.Button, onClick = onClick)
            .semantics { if (selected != null) this.selected = selected }
            .alpha(if (enabled) 1f else 0.5f)
            .padding(horizontal = scale(4f)),
        horizontalArrangement = Arrangement.spacedBy(scale(4f)),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) DS1Icon(icon, tint = ink.current)
        Box(Modifier.weight(1f)) { DS1ControlText(label, ink) }
        if (trailing != null) DS1LineText(trailing, style = DS1TextStyle.Small, tone = DS1Tone.Muted)
        if (selected == true) DS1Icon(DS1IconName.check, tint = ink.current)
    }
}

/** A menu's heading: one square high, 4 dp in, muted. */
@Composable
fun DS1MenuLabel(label: String) {
    val scale = LocalDS1Scale.current
    Box(Modifier.fillMaxWidth().height(scale.unit).padding(horizontal = scale(4f)), contentAlignment = Alignment.CenterStart) {
        DS1ControlText(label, DS1Colors.textMuted)
    }
}

/** A 1 dp line between a menu's groups, half a square above and below. */
@Composable
fun DS1MenuSeparator() {
    val scale = LocalDS1Scale.current
    DS1Rule(Modifier.padding(vertical = scale.half))
}

private class MenuPosition(private val gap: Int) : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize): IntOffset {
        val below = windowSize.height - anchorBounds.bottom - gap
        val above = anchorBounds.top - gap
        val y = if (below < popupContentSize.height && above > below) anchorBounds.top - gap - popupContentSize.height else anchorBounds.bottom + gap
        val start = if (layoutDirection == LayoutDirection.Ltr) anchorBounds.left else anchorBounds.right - popupContentSize.width
        val x = start.coerceIn(gap, (windowSize.width - popupContentSize.width - gap).coerceAtLeast(gap))
        return IntOffset(x, y.coerceIn(gap, (windowSize.height - popupContentSize.height - gap).coerceAtLeast(gap)))
    }
}

/** One option of a select: its value and its words, and an optional colour for a swatch. */
data class DS1Option<T>(val value: T, val label: String, val swatch: Color? = null, val enabled: Boolean = true)

/**
 * `ds-select`: eight squares by one on the field's ground with a 1 dp border and the corner,
 * the chosen option's words 4 dp in and the down arrow 2 dp from the end; a press opens the
 * options in a menu. [chip] is a control-high chip on the fill (on the accent when [primary]);
 * [fit] hugs the words.
 */
@Composable
fun <T> DS1Select(
    options: List<DS1Option<T>>,
    selected: T,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    chip: Boolean = false,
    primary: Boolean = false,
    fit: Boolean = false,
    enabled: Boolean = true,
) {
    val scale = LocalDS1Scale.current
    var open by remember { mutableStateOf(false) }
    val current = options.firstOrNull { it.value == selected }
    val interaction = remember { MutableInteractionSource() }
    val shape = RoundedCornerShape(scale.radius)
    val ground = when {
        chip && primary -> DS1Colors.accent
        chip -> DS1Colors.fill
        else -> DS1Colors.inputBackground
    }
    val ink = when {
        chip && primary -> DS1Colors.onAccent
        chip -> DS1Colors.text
        else -> DS1Colors.inputText
    }
    Box(modifier) {
        Row(
            Modifier
                .then(if (fit || chip) Modifier else Modifier.width(scale.squares(8f)))
                .height(if (chip) scale.control else scale.unit)
                .ds1FocusRing(interaction)
                .alpha(if (enabled) 1f else 0.5f)
                .background(ground.current, shape)
                .then(if (chip) Modifier else Modifier.border(DS1Metrics.line.dp, DS1Colors.border.current, shape))
                .clickable(interaction, null, enabled, onClickLabel = label, role = Role.DropdownList) { open = true }
                .padding(start = scale(4f), end = scale(2f)),
            horizontalArrangement = Arrangement.spacedBy(scale(4f)),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            current?.swatch?.let { DS1Swatch(it) }
            Box(if (fit || chip) Modifier else Modifier.weight(1f)) { DS1ControlText(current?.label ?: "", ink) }
            DS1Icon(DS1IconName.down, size = DS1IconSize.Large, tint = ink.current)
        }
        DS1Menu(open, { open = false }) {
            if (label != null) DS1MenuLabel(label)
            for (option in options) DS1MenuItem(option.label, { open = false; onSelect(option.value) }, selected = option.value == selected, enabled = option.enabled)
        }
    }
}
