package com.designsystem1.ds1

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.pow
import kotlin.math.roundToInt

/** A bar's tone, as the web's `BarItem.tone`: the accent green, tuned red, or the faint fill. */
enum class DS1BarTone { Up, Down, Ink }

/** A bar of [DS1Bars], as the web's `BarItem` (DS1/2-core/ds-chart.ts). */
data class DS1BarItem(
    val label: String,
    val value: Double,
    val compare: Double? = null,
    val tone: DS1BarTone = DS1BarTone.Ink,
    val caption: String? = null,
)

/** The round size each square of a bar chart stands for, as the web's `barStep`: 1, 2, 2.5 or 5 times a power of ten, the smallest with which [max] fits in [squares]. */
fun ds1BarStep(max: Double, squares: Int): Double {
    for (exponent in -4..9) for (base in listOf(1.0, 2.0, 2.5, 5.0)) {
        val step = base * 10.0.pow(exponent)
        if (ceil(max / step) <= max(1, squares)) return step
    }
    return 5e9
}

/** Short figures, as the web's compact numbers: 950, 1.4K, 2.5M. */
fun ds1Compact(value: Double): String {
    val (scaled, suffix) = when {
        value >= 1e9 -> value / 1e9 to "B"
        value >= 1e6 -> value / 1e6 to "M"
        value >= 1e3 -> value / 1e3 to "K"
        else -> value to ""
    }
    val rounded = (scaled * 10).roundToInt() / 10.0
    return (if (rounded % 1.0 == 0.0) rounded.toLong().toString() else rounded.toString()) + suffix
}

/**
 * `ds-bars`: nonnegative values side by side, each bar [span] squares wide (or, with [fill], the
 * width beside the scale shared) and drawn a pixel narrower, rising from a hairline in an area
 * `rows - 1` squares high, then its caption (where any bar has one) and its muted label, a square
 * each in the small type; a `compare` outline in the ink. [axis] puts the scale at the end, two
 * squares wide: each square a round step, its label just above its line, the lines across the bars.
 * [values] writes each bar's value just over it; [format] writes both. Read as one element.
 */
@Composable
fun DS1Bars(
    items: List<DS1BarItem>,
    modifier: Modifier = Modifier,
    rows: Int = 4,
    span: Int = 2,
    axis: Boolean = false,
    values: Boolean = false,
    fill: Boolean = false,
    format: (Double) -> String = ::ds1Compact,
) {
    val scale = LocalDS1Scale.current
    val squares = max(2, rows) - 1
    val height = scale.unit * squares.toFloat()
    val top = max(items.flatMap { listOf(it.value, it.compare ?: 0.0) }.maxOrNull() ?: 0.0, 1e-9)
    val step = if (axis) ds1BarStep(top, squares - if (values) 1 else 0) else 0.0
    val faint = DS1Colors.slateLight.current
    val ink = DS1Colors.text.current
    val green = DS1Colors.appleGreen.current
    val red = DS1Colors.tunedRed.current
    val small = ds1TextStyle(DS1TextStyle.Small, DS1Tone.Text, DS1Font.Face.Regular)
    val muted = ds1TextStyle(DS1TextStyle.Small, DS1Tone.Muted, DS1Font.Face.Regular)
    val captions = items.any { !it.caption.isNullOrEmpty() }
    val ticks = if (axis) (1..squares).filter { it * step <= top + step } else emptyList()
    val read = items.joinToString(", ") { listOfNotNull(it.label, it.caption?.takeIf(String::isNotEmpty)).joinToString(": ") }
    val px: Density.(Double, Float) -> Float = { value, area ->
        val room = area - scale(4f).toPx() - if (values) scale.unit.toPx() else 0f
        max(1f, (if (axis) (value / step).toFloat() * scale.unit.toPx() else (value / top).toFloat() * room).roundToInt().toFloat())
    }
    Row(modifier.clearAndSetSemantics { contentDescription = read }) {
        Row(
            (if (fill) Modifier.weight(1f) else Modifier).drawBehind {
                if (!axis) return@drawBehind
                val unit = scale.unit.toPx()
                var y = height.toPx() - unit
                while (y > 0f) {
                    drawRect(faint, Offset(0f, y - 0.5f), Size(size.width, 1f))
                    y -= unit
                }
            },
        ) {
            items.forEach { item ->
                Column(if (fill) Modifier.weight(1f) else Modifier.width(scale.unit * max(1, span).toFloat())) {
                    Box(
                        Modifier.fillMaxWidth().height(height).drawBehind {
                            val line = 1f
                            drawRect(faint, Offset(0f, size.height - line), Size(size.width, line))
                            if (item.value > 0) {
                                val h = px(item.value, size.height)
                                val colour = when (item.tone) { DS1BarTone.Up -> green; DS1BarTone.Down -> red; DS1BarTone.Ink -> faint }
                                drawRect(colour, Offset(0f, size.height - h), Size(size.width - line, h))
                            }
                            item.compare?.let { compare ->
                                val h = px(compare, size.height)
                                drawRect(ink, Offset(line / 2, size.height - h + line / 2), Size(size.width - line * 2, h - line), style = Stroke(line))
                            }
                        },
                        contentAlignment = Alignment.BottomCenter,
                    ) {
                        if (values && item.value > 0) {
                            val density = LocalDensity.current
                            val lift = with(density) { (px(item.value, height.toPx()) + scale(2f).toPx()).toDp() }
                            BasicText(format(item.value), Modifier.wrapContentWidth(unbounded = true).offset(y = -lift), style = small, maxLines = 1, softWrap = false)
                        }
                    }
                    if (captions) Box(Modifier.fillMaxWidth().height(scale.unit).clipToBounds()) { DS1LineText(item.caption ?: "", style = DS1TextStyle.Small) }
                    Box(Modifier.fillMaxWidth().height(scale.unit).clipToBounds()) { DS1LineText(item.label, style = DS1TextStyle.Small, tone = DS1Tone.Muted) }
                }
            }
        }
        if (axis) {
            Box(Modifier.width(scale.squares(2f)).height(height), contentAlignment = Alignment.BottomEnd) {
                ticks.forEach { row ->
                    BasicText(format(row * step), Modifier.offset(y = -(scale.unit * row.toFloat() + scale(2f))), style = muted, maxLines = 1, softWrap = false)
                }
            }
        }
    }
}
