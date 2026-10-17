package com.designsystem1.ds1

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * `ds-page`'s layouts, in whole squares: navigation 12 beside the main column ([Sidebar]), a
 * list 16 beside its detail ([Split]), navigation, main and a 12-square inspector
 * ([Inspector]), one column of [measure] squares, 32 by default ([Column]), one of 16
 * centred both ways ([Centered]), and the whole width for [DS1Tiles] ([Tiles]).
 */
enum class DS1PageLayout { Sidebar, Split, Inspector, Column, Centered, Tiles }

/**
 * A page in one of the standard layouts: a square of padding, two squares between columns
 * (with a 1 dp line in the middle when [divided]), and every layout one column below 30
 * squares of width. Each area is optional. With [fill], every column scrolls on its own.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun DS1PageLayout(
    layout: DS1PageLayout,
    modifier: Modifier = Modifier,
    measure: Float? = null,
    divided: Boolean = false,
    fill: Boolean = false,
    nav: (@Composable ColumnScope.() -> Unit)? = null,
    header: (@Composable ColumnScope.() -> Unit)? = null,
    aside: (@Composable ColumnScope.() -> Unit)? = null,
    footer: (@Composable ColumnScope.() -> Unit)? = null,
    main: @Composable ColumnScope.() -> Unit,
) {
    val scale = LocalDS1Scale.current
    val border = DS1Colors.border.current
    BoxWithConstraints(modifier.fillMaxSize().background(LocalDS1Paper.current.current).padding(scale.unit)) {
        val narrow = maxWidth < scale.squares(30f)
        val gap = scale.squares(2f)
        val line: Modifier = if (divided) Modifier.drawBehind {
            val x = size.width + gap.toPx() / 2
            drawLine(border, Offset(x, 0f), Offset(x, size.height), DS1Metrics.line.dp.toPx())
        } else Modifier
        val scroll = @Composable { m: Modifier -> if (fill) m.verticalScroll(rememberScrollState()) else m }
        val mainColumn: @Composable (Modifier) -> Unit = { m ->
            Column(m) {
                if (header != null) { header(); Box(Modifier.padding(bottom = scale.unit)) }
                main()
                if (footer != null) { Box(Modifier.padding(top = scale.unit)); footer() }
            }
        }
        if (narrow || layout == DS1PageLayout.Column || layout == DS1PageLayout.Centered || layout == DS1PageLayout.Tiles) {
            val width: Dp = when {
                narrow -> maxWidth
                layout == DS1PageLayout.Centered -> minOf(scale.squares(measure ?: 16f), scale.wholeSquares(maxWidth))
                layout == DS1PageLayout.Column -> minOf(scale.squares(measure ?: 32f), scale.wholeSquares(maxWidth))
                else -> maxWidth
            }
            Column(
                Modifier.fillMaxSize().verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = if (layout == DS1PageLayout.Centered && !narrow) Arrangement.Center else Arrangement.Top,
            ) {
                Column(Modifier.width(width)) {
                    if (nav != null) { nav(); Box(Modifier.padding(bottom = scale.unit)) }
                    mainColumn(Modifier.fillMaxWidth())
                    if (aside != null) { Box(Modifier.padding(top = scale.unit)); aside() }
                }
            }
        } else {
            val navWidth = if (layout == DS1PageLayout.Split) scale.squares(16f) else scale.squares(12f)
            Row(Modifier.fillMaxSize(), horizontalArrangement = Arrangement.spacedBy(gap)) {
                if (nav != null) Column(scroll(Modifier.width(navWidth).fillMaxHeight().then(line)), content = nav)
                mainColumn(scroll(Modifier.weight(1f).fillMaxHeight()).then(if (layout == DS1PageLayout.Inspector && aside != null) line else Modifier))
                if (layout == DS1PageLayout.Inspector && aside != null) Column(scroll(Modifier.width(scale.squares(12f)).fillMaxHeight()), content = aside)
            }
        }
    }
}

/** How much of a row a tile takes: one tile of 12 squares, two, or the whole row. */
enum class DS1TileSpan { One, Wide, Full }

/** `ds-page tiles`' grid: tiles 12 squares wide a square apart, as many as fit a row. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun DS1Tiles(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val scale = LocalDS1Scale.current
    FlowRow(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(scale.unit), verticalArrangement = Arrangement.spacedBy(scale.unit)) { content() }
}

/** One tile of [DS1Tiles]. */
@Composable
fun DS1Tile(modifier: Modifier = Modifier, span: DS1TileSpan = DS1TileSpan.One, content: @Composable ColumnScope.() -> Unit) {
    val scale = LocalDS1Scale.current
    val width = when (span) {
        DS1TileSpan.One -> Modifier.width(scale.squares(12f))
        DS1TileSpan.Wide -> Modifier.width(scale.squares(25f))
        DS1TileSpan.Full -> Modifier.fillMaxWidth()
    }
    Column(modifier.then(width), content = content)
}
