package com.designsystem1.ds1

import androidx.compose.foundation.BasicTooltipBox
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberBasicTooltipState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.PopupPositionProvider

/** The tooltip's colours: the ink with white words, white with the ink's words in dark mode. */
internal val TOOLTIP_GROUND = DS1Color(light = 0x2a2a2a, dark = 0xffffff)
internal val TOOLTIP_INK = DS1Color(light = 0xffffff, dark = 0x2a2a2a)

/**
 * `ds-tooltip`: a label shown 2 dp above [content], centred, one control high with 2.5 dp at
 * the sides and the corner, wrapping past 320 dp; below when there is no room above. It shows
 * on a long press or under a pointer. A [colour] gives it that ground, lettered in the ink. Do
 * not put essential information in a tooltip.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun DS1Tooltip(text: String, modifier: Modifier = Modifier, colour: Color? = null, content: @Composable () -> Unit) {
    val scale = LocalDS1Scale.current
    val density = LocalDensity.current
    val gap = with(density) { scale(2f).roundToPx() }
    val margin = with(density) { 4.dp.roundToPx() }
    val provider = remember(gap, margin) { TooltipAbove(gap, margin) }
    BasicTooltipBox(
        positionProvider = provider,
        tooltip = {
            Box(
                Modifier
                    .widthIn(max = scale(320f))
                    .heightIn(min = scale.control)
                    .background(colour ?: TOOLTIP_GROUND.current, RoundedCornerShape(scale(4f)))
                    .padding(horizontal = scale(2.5f)),
            ) {
                BasicText(
                    ds1Annotated(text, scale.type, scale.tracking),
                    style = ds1TextStyle().copy(color = if (colour != null) DS1Colors.slate.color(false) else TOOLTIP_INK.current, lineHeight = LocalDensity.current.gridSp(scale.control.value)),
                )
            }
        },
        state = rememberBasicTooltipState(isPersistent = false),
        modifier = modifier,
        content = content,
    )
}

private class TooltipAbove(private val gap: Int, private val margin: Int) : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize): IntOffset {
        val x = (anchorBounds.left + (anchorBounds.width - popupContentSize.width) / 2).coerceIn(margin, (windowSize.width - popupContentSize.width - margin).coerceAtLeast(margin))
        val above = anchorBounds.top - gap - popupContentSize.height
        val y = if (above >= margin) above else anchorBounds.bottom + gap
        return IntOffset(x, y)
    }
}
