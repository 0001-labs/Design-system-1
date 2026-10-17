package com.designsystem1.ds1

import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToLong

/**
 * The device scale, `--sf` on the web: every measure is multiplied by the screen's width over
 * 280, between 0.75 and 2, rounded to three decimals. Put it on once with [DS1Theme] (or
 * [DS1Scaled]) and read it with `LocalDS1Scale.current`; every length is then `scale.unit`,
 * `scale(16f)` and so on.
 */
data class DS1Scale(val factor: Float, val corner: Float = DS1Metrics.radius) {
    /** A length at this scale. */
    operator fun invoke(length: Float): Dp = (length * factor).dp
    /** A length of [squares] squares. */
    fun squares(squares: Float): Dp = (squares * DS1Metrics.square * factor).dp

    val unit: Dp get() = invoke(DS1Metrics.square)
    val half: Dp get() = invoke(DS1Metrics.half)
    val control: Dp get() = invoke(DS1Metrics.control)
    val row: Dp get() = invoke(DS1Metrics.row)
    val itemWidth: Dp get() = invoke(DS1Metrics.itemWidth)
    val itemHeight: Dp get() = invoke(DS1Metrics.itemHeight)
    /** Type sizes and tracking, in dp at this scale; text turns them into sp that ignore the font scale. */
    val type: Float get() = DS1Metrics.typeDefault * factor
    val small: Float get() = DS1Metrics.typeSmall * factor
    val heading: Float get() = DS1Metrics.typeHeading * factor
    val display: Float get() = DS1Metrics.typeDisplay * factor
    val leading: Float get() = DS1Metrics.leading * factor
    val tracking: Float get() = DS1Metrics.tracking * factor
    val displayTracking: Float get() = DS1Metrics.displayTracking * factor
    /** Lines stay one dp at every scale. */
    val line: Dp get() = DS1Metrics.line.dp
    val radius: Dp get() = (corner * factor).dp

    /** The widest whole number of squares that fits [width]. */
    fun wholeSquares(width: Dp): Dp {
        val step = DS1Metrics.square * factor
        return (max(0f, floor(width.value / step)) * step).dp
    }

    companion object {
        /** The scale for a screen [width] dp wide, as DS1/0-face/scaling.ts computes it. */
        fun device(width: Float): DS1Scale = DS1Scale(factor(width))

        /** The factor alone: the width over 280, clamped, rounded to three decimals. */
        fun factor(width: Float): Float {
            val clamped = min(DS1Metrics.scaleMax, max(DS1Metrics.scaleMin, width / DS1Metrics.scaleBase))
            val step = 10.0.pow(DS1Metrics.scaleDecimals)
            return ((clamped * step).roundToLong() / step).toFloat()
        }

        /** A computer: everything at its own size. */
        val desktop = DS1Scale(1f)
    }
}

/** The scale the composition draws at. */
val LocalDS1Scale = staticCompositionLocalOf { DS1Scale.desktop }

/**
 * Puts the device scale on from the width this composable is given: the screen's, at the
 * root. [corner] is the corner of pictures, buttons and fields at a scale of 1.
 */
@Composable
fun DS1Scaled(modifier: Modifier = Modifier, corner: Float = DS1Metrics.radius, content: @Composable () -> Unit) {
    BoxWithConstraints(modifier) {
        val scale = DS1Scale.device(maxWidth.value).copy(corner = corner)
        CompositionLocalProvider(LocalDS1Scale provides scale) { content() }
    }
}
