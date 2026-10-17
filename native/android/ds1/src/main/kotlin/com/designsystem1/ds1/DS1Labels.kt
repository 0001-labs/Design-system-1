package com.designsystem1.ds1

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlin.math.ceil

/** Rounds a composable's width up to whole squares, as `ds-badge` does. */
fun Modifier.wholeSquareWidth(scale: DS1Scale): Modifier = layout { measurable, constraints ->
    val step = scale.unit.roundToPx().coerceAtLeast(1)
    val natural = measurable.measure(constraints.copy(minWidth = 0))
    val width = (ceil(natural.width / step.toFloat()).toInt() * step).coerceAtLeast(step).coerceAtMost(constraints.maxWidth)
    val placeable = measurable.measure(constraints.copy(minWidth = width, maxWidth = width))
    layout(placeable.width, placeable.height) { placeable.place(0, 0) }
}

/**
 * `ds-badge`: a status, not a control. One square high on the fill (or [background]), words
 * padded 4 dp, square corners, its width rounded up to whole squares. [iconOnly] keeps the
 * words for assistive technology only.
 */
@Composable
fun DS1Badge(
    label: String,
    modifier: Modifier = Modifier,
    icon: DS1IconName? = null,
    iconOnly: Boolean = false,
    background: DS1Color = DS1Colors.fill,
    ink: DS1Color = DS1Colors.text,
) {
    val scale = LocalDS1Scale.current
    Row(
        modifier
            .height(scale.unit)
            .then(if (iconOnly) Modifier.size(scale.unit) else Modifier.wholeSquareWidth(scale))
            .background(background.current)
            .padding(horizontal = if (iconOnly) 0.dp else scale(4f))
            .semantics(mergeDescendants = true) { contentDescription = label },
        horizontalArrangement = Arrangement.spacedBy(scale(4f), if (iconOnly) Alignment.CenterHorizontally else Alignment.Start),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) DS1Icon(icon, tint = ink.current)
        if (!iconOnly) DS1ControlText(label, ink)
    }
}

/**
 * `ds-token`: a chosen value one square high on the fill with the corner: an optional
 * [leading] mark (an avatar), its label, a 10 dp [detail] in the muted colour, and with
 * [removeLabel] a one-square close button that asks for its removal.
 */
@Composable
fun DS1Token(
    label: String,
    modifier: Modifier = Modifier,
    detail: String? = null,
    removeLabel: String? = null,
    onRemove: (() -> Unit)? = null,
    enabled: Boolean = true,
    leading: (@Composable () -> Unit)? = null,
) {
    val scale = LocalDS1Scale.current
    Row(
        modifier
            .height(scale.unit)
            .alpha(if (enabled) 1f else 0.5f)
            .background(DS1Colors.fill.current, RoundedCornerShape(scale.radius))
            .padding(start = scale(4f)),
        horizontalArrangement = Arrangement.spacedBy(scale(4f)),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        leading?.invoke()
        DS1ControlText(label, DS1Colors.text)
        if (detail != null) DS1LineText(detail, style = DS1TextStyle.Small, tone = DS1Tone.Muted)
        if (removeLabel != null && onRemove != null) {
            Box(
                Modifier.size(scale.unit).clickable(enabled = enabled, role = Role.Button, onClickLabel = removeLabel, onClick = onRemove)
                    .semantics { contentDescription = removeLabel },
                contentAlignment = Alignment.Center,
            ) { DS1Icon(DS1IconName.close) }
        } else Spacer(Modifier.size(scale(0f)))
    }
}

/** `ds-swatch`: a 16 dp square of a colour with a 1 dp border; [selected] draws a 2 dp outline in the text colour. */
@Composable
fun DS1Swatch(colour: Color, modifier: Modifier = Modifier, selected: Boolean = false) {
    val scale = LocalDS1Scale.current
    val text = DS1Colors.text.current
    Box(
        modifier
            .size(scale.control)
            .then(if (selected) Modifier.drawBehind {
                val w = 2.dp.toPx()
                drawRect(text, Offset(-w, -w), androidx.compose.ui.geometry.Size(size.width + 2 * w, size.height + 2 * w), style = androidx.compose.ui.graphics.drawscope.Stroke(w))
            } else Modifier)
            .background(colour)
            .border(DS1Metrics.line.dp, DS1Colors.border.current),
    )
}

/**
 * `.ds-link`: words in their ink on a 1 dp underline 2 dp below, the ink at 40%; pressed, the
 * line takes the full ink.
 */
@Composable
fun DS1Link(label: String, onClick: () -> Unit, modifier: Modifier = Modifier, ink: DS1Color = DS1Colors.text, enabled: Boolean = true) {
    val scale = LocalDS1Scale.current
    val colour = ink.current
    var layout by remember { mutableStateOf<TextLayoutResult?>(null) }
    val interaction = remember { MutableInteractionSource() }
    BasicText(
        text = ds1Annotated(label, scale.type, scale.tracking),
        modifier = modifier
            .ds1FocusRing(interaction)
            .alpha(if (enabled) 1f else 0.5f)
            .clickable(interaction, null, enabled, role = null, onClick = onClick)
            .drawBehind {
                val l = layout ?: return@drawBehind
                val y = l.firstBaseline + scale(2f).toPx()
                drawLine(colour.copy(alpha = colour.alpha * 0.4f), Offset(0f, y), Offset(size.width, y), DS1Metrics.line.dp.toPx())
            },
        style = ds1TextStyle().copy(color = colour),
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        onTextLayout = { layout = it },
    )
}

/** `ds-gap`'s sizes, in squares. */
enum class DS1GapSize(val squares: Float) { Tenth(0.1f), Quarter(0.25f), Half(0.5f), EightTenths(0.8f), Unit(1f), Double(2f), Triple(3f), Quad(4f), Oct(8f), Dozen(12f) }

/** `ds-gap`: empty room the width of its parent, in squares. */
@Composable
fun DS1Gap(modifier: Modifier = Modifier, size: DS1GapSize = DS1GapSize.Unit) {
    Spacer(modifier.fillMaxWidth().height(LocalDS1Scale.current.squares(size.squares)))
}
