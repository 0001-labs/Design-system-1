package com.designsystem1.ds1

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.unit.min

/**
 * A page on the paper (`ds-page` `column`): it scrolls, keeps one square around its content
 * and stands its column on whole squares, at most [measure] squares wide, centred in the room
 * beside it. With [grid], the grid's lines are drawn on the paper.
 */
@Composable
fun DS1Page(
    modifier: Modifier = Modifier,
    measure: Float = 32f,
    grid: Boolean = false,
    content: @Composable ColumnScope.() -> Unit,
) {
    val scale = LocalDS1Scale.current
    BoxWithConstraints(modifier.fillMaxSize().background(LocalDS1Paper.current.current)) {
        if (grid) DS1PaperGrid(Modifier.fillMaxSize())
        val width = min(scale.squares(measure), scale.wholeSquares(maxWidth - scale.unit * 2))
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(vertical = scale.unit),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Column(Modifier.width(width), content = content)
        }
    }
}

/** The grid's lines on the paper, one square apart, centred on the composable. */
@Composable
fun DS1PaperGrid(modifier: Modifier = Modifier, colour: DS1Color = DS1Colors.slate.withAlpha(0.169f)) {
    val scale = LocalDS1Scale.current
    val ink = colour.current
    Canvas(modifier) {
        val step = scale.unit.toPx()
        val stroke = scale.line.toPx()
        var x = (size.width / 2) % step
        while (x <= size.width) {
            drawLine(ink, Offset(x, 0f), Offset(x, size.height), stroke)
            x += step
        }
        var y = 0f
        while (y <= size.height) {
            drawLine(ink, Offset(0f, y), Offset(size.width, y), stroke)
            y += step
        }
    }
}
