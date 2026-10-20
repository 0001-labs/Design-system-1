package com.designsystem1.ds1

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import kotlin.math.max
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

/**
 * `ds-bars`: nonnegative values side by side, each bar [span] squares wide and drawn a pixel
 * narrower, rising from a hairline in an area `rows - 1` squares high, then its caption and its
 * muted label, a square each in the small type; a `compare` outline in the ink. Read as one
 * element: each label with its caption.
 */
@Composable
fun DS1Bars(items: List<DS1BarItem>, modifier: Modifier = Modifier, rows: Int = 4, span: Int = 2) {
    val scale = LocalDS1Scale.current
    val height = scale.unit * (max(2, rows) - 1).toFloat()
    val width = scale.unit * max(1, span).toFloat()
    val top = max(items.flatMap { listOf(it.value, it.compare ?: 0.0) }.maxOrNull() ?: 0.0, 1e-9)
    val faint = DS1Colors.slateLight.current
    val ink = DS1Colors.text.current
    val green = DS1Colors.appleGreen.current
    val red = DS1Colors.tunedRed.current
    val read = items.joinToString(", ") { listOfNotNull(it.label, it.caption?.takeIf(String::isNotEmpty)).joinToString(": ") }
    Row(modifier.clearAndSetSemantics { contentDescription = read }) {
        items.forEach { item ->
            Column(Modifier.width(width)) {
                Box(
                    Modifier.width(width).height(height).drawBehind {
                        val line = 1f
                        drawRect(faint, Offset(0f, size.height - line), Size(size.width, line))
                        val px = { value: Double -> max(1f, ((value / top).toFloat() * (size.height - scale(4f).toPx())).roundToInt().toFloat()) }
                        if (item.value > 0) {
                            val h = px(item.value)
                            val fill = when (item.tone) { DS1BarTone.Up -> green; DS1BarTone.Down -> red; DS1BarTone.Ink -> faint }
                            drawRect(fill, Offset(0f, size.height - h), Size(size.width - line, h))
                        }
                        item.compare?.let { compare ->
                            val h = px(compare)
                            drawRect(ink, Offset(line / 2, size.height - h + line / 2), Size(size.width - line * 2, h - line), style = Stroke(line))
                        }
                    },
                )
                Box(Modifier.width(width).height(scale.unit).clipToBounds()) { DS1LineText(item.caption ?: "", style = DS1TextStyle.Small) }
                Box(Modifier.width(width).height(scale.unit).clipToBounds()) { DS1LineText(item.label, style = DS1TextStyle.Small, tone = DS1Tone.Muted) }
            }
        }
    }
}
