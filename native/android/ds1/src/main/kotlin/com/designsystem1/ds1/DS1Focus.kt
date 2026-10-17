package com.designsystem1.ds1

import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * The focus ring every control shows when the keyboard reaches it: 2 dp in the focus colour,
 * 1 dp outside the control (`outline-offset: 1px`), following its corner.
 */
@Composable
fun Modifier.ds1FocusRing(interaction: InteractionSource, corner: Dp = LocalDS1Scale.current.radius, inset: Boolean = false): Modifier {
    val focused by interaction.collectIsFocusedAsState()
    val ring = DS1Colors.focusRing.current
    return drawWithContent {
        drawContent()
        if (!focused) return@drawWithContent
        val width = if (inset) 1.dp.toPx() else 2.dp.toPx()
        val out = if (inset) -width / 2 else 1.dp.toPx() + width / 2
        val r = corner.toPx() + out
        drawRoundRect(ring, Offset(-out, -out), Size(size.width + 2 * out, size.height + 2 * out), CornerRadius(r.coerceAtLeast(0f)), style = Stroke(width))
    }
}
