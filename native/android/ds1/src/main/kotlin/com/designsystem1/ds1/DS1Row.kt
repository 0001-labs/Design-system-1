package com.designsystem1.ds1

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.unit.Dp

/**
 * A row, an item, a header, a menu entry: one square high, square-cornered, its content
 * standing on the square. With [rule], it stands on a 1 dp line at its foot, as a table row
 * does.
 */
@Composable
fun DS1Row(
    modifier: Modifier = Modifier,
    rule: Boolean = false,
    spacing: Dp? = null,
    content: @Composable RowScope.() -> Unit,
) {
    val scale = LocalDS1Scale.current
    val border = DS1Colors.border.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(scale.unit)
            .then(if (rule) Modifier.drawBehind {
                val y = size.height - scale.line.toPx() / 2
                drawLine(border, Offset(0f, y), Offset(size.width, y), scale.line.toPx())
            } else Modifier),
        horizontalArrangement = Arrangement.spacedBy(spacing ?: scale(4f)),
        verticalAlignment = Alignment.CenterVertically,
        content = content,
    )
}

/** A 1 dp line in the border colour, across the width it is given. */
@Composable
fun DS1Rule(modifier: Modifier = Modifier, colour: DS1Color = DS1Colors.border) {
    Box(modifier.fillMaxWidth().height(LocalDS1Scale.current.line).background(colour.current))
}
