package com.designsystem1.ds1

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.selection.triStateToggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.unit.dp

/**
 * `ds-checkbox`: one square, a 1 dp border, the corner; checked or mixed on the accent with
 * the check (or a 10 by 2 bar) in the ink on the accent.
 */
@Composable
fun DS1Checkbox(
    checked: Boolean,
    onCheckedChange: ((Boolean) -> Unit)?,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    indeterminate: Boolean = false,
) {
    val scale = LocalDS1Scale.current
    val interaction = remember { MutableInteractionSource() }
    val shape = RoundedCornerShape(scale.radius)
    val on = checked || indeterminate
    val state = if (indeterminate) ToggleableState.Indeterminate else ToggleableState(checked)
    Box(
        modifier
            .size(scale.unit)
            .ds1FocusRing(interaction)
            .alpha(if (enabled) 1f else 0.5f)
            .background((if (on) DS1Colors.accent else DS1Colors.inputBackground).current, shape)
            .border(DS1Metrics.line.dp, DS1Colors.border.current, shape)
            .then(if (onCheckedChange != null) Modifier.triStateToggleable(state, interaction, null, enabled, Role.Checkbox) { onCheckedChange(!checked) } else Modifier),
        contentAlignment = Alignment.Center,
    ) {
        if (indeterminate) Box(Modifier.size(scale(10f), scale(2f)).background(DS1Colors.onAccent.current))
        else if (checked) DS1Icon(DS1IconName.check, size = DS1IconSize.Large, tint = DS1Colors.onAccent.current)
    }
}

/** `ds-radio`: a one-square circle with a 10 dp dot in the text colour when chosen. */
@Composable
fun DS1Radio(selected: Boolean, onClick: (() -> Unit)?, modifier: Modifier = Modifier, enabled: Boolean = true) {
    val scale = LocalDS1Scale.current
    val interaction = remember { MutableInteractionSource() }
    Box(
        modifier
            .size(scale.unit)
            .ds1FocusRing(interaction, corner = scale.unit)
            .alpha(if (enabled) 1f else 0.5f)
            .background(DS1Colors.inputBackground.current, CircleShape)
            .border(DS1Metrics.line.dp, DS1Colors.border.current, CircleShape)
            .then(if (onClick != null) Modifier.selectable(selected, interaction, null, enabled, Role.RadioButton, onClick) else Modifier),
        contentAlignment = Alignment.Center,
    ) {
        if (selected) Box(Modifier.size(scale(10f)).background(DS1Colors.text.current, CircleShape))
    }
}

/**
 * `ds-radio choice`: a labelled tile, four squares by one (one square when [compact]), on the
 * field's ground; the chosen tile's outline turns the text colour. With [preview], the tile
 * is four by three squares: the preview above, the label on its last row.
 */
@Composable
fun DS1Choice(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    compact: Boolean = false,
    enabled: Boolean = true,
    preview: (@Composable () -> Unit)? = null,
) {
    val scale = LocalDS1Scale.current
    val interaction = remember { MutableInteractionSource() }
    val shape = RoundedCornerShape(scale.radius)
    val ground = if (enabled) DS1Colors.inputBackground.current else LocalDS1Paper.current.current.copy(alpha = 0.6f)
    Column(
        modifier
            .width(if (compact) scale.unit else scale.squares(4f))
            .height(if (preview != null) scale.squares(3f) else scale.unit)
            .ds1FocusRing(interaction)
            .alpha(if (enabled) 1f else 0.5f)
            .background(ground, shape)
            .border(DS1Metrics.line.dp, if (selected) DS1Colors.text.current else Color.Transparent, shape)
            .selectable(selected, interaction, null, enabled, Role.RadioButton, onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (preview != null) Box(Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) { preview() }
        Box(Modifier.height(if (preview != null) scale(19f) else scale.unit).padding(horizontal = if (compact) 0.dp else scale(4f)), contentAlignment = Alignment.Center) {
            DS1ControlText(label, DS1Colors.text)
        }
    }
}

/**
 * `ds-switch`: a 32 by 16 pill with a 12 dp white round thumb two dp in; grey when off and
 * dark Apple green when on, sliding one control height in 140 ms.
 */
@Composable
fun DS1Switch(
    checked: Boolean,
    onCheckedChange: ((Boolean) -> Unit)?,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val scale = LocalDS1Scale.current
    val interaction = remember { MutableInteractionSource() }
    val corner = scale.control
    val track = if (checked) SWITCH_TRACK_ON else DS1Colors.fill
    val thumb = DS1Colors.white
    val travel by animateDpAsState(if (checked) scale.control else 0.dp, tween(140), label = "switch")
    Box(
        modifier
            .size(scale(32f), scale.control)
            .ds1FocusRing(interaction, corner)
            .alpha(if (enabled) 1f else 0.5f)
            .background(track.current, RoundedCornerShape(corner))
            .then(if (onCheckedChange != null) Modifier.toggleable(checked, interaction, null, enabled, Role.Switch, onCheckedChange) else Modifier)
            .padding(scale(2f)),
        contentAlignment = Alignment.CenterStart,
    ) {
        Box(Modifier.offset { androidx.compose.ui.unit.IntOffset(travel.roundToPx(), 0) }.size(scale(12f)).background(thumb.current, CircleShape))
    }
}

/** `--ds-switch-track-on`: Apple green's dark version, so a white thumb stays clear in both modes. */
val SWITCH_TRACK_ON = DS1Color(0x529d36)
