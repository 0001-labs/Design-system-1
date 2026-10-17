package com.designsystem1.ds1

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/** Whether Design system 1 draws in dark mode. [DS1Theme] provides it from the system. */
val LocalDS1Dark = staticCompositionLocalOf { false }

/**
 * A colour with its light and dark values, as a `light-dark()` token on the web. Read it with
 * [current] inside a composition, or [color] for either mode.
 */
data class DS1Color(val light: Int, val dark: Int, val lightAlpha: Float = 1f, val darkAlpha: Float = 1f) {
    /** One colour in both modes. */
    constructor(value: Int, alpha: Float = 1f) : this(value, value, alpha, alpha)

    /** The colour in light or dark mode. */
    fun color(dark: Boolean): Color {
        val rgb = if (dark) this.dark else light
        val alpha = if (dark) darkAlpha else lightAlpha
        return Color(red = (rgb shr 16 and 0xff) / 255f, green = (rgb shr 8 and 0xff) / 255f, blue = (rgb and 0xff) / 255f, alpha = alpha)
    }

    /** The colour in the mode the composition is in. */
    val current: Color
        @Composable @ReadOnlyComposable get() = color(LocalDS1Dark.current)

    /** The same colour at an opacity, in both modes. */
    fun withAlpha(alpha: Float) = copy(lightAlpha = alpha, darkAlpha = alpha)
}

/** One entry of the palette: a colour, its pastel, and whether it is an ink (a grey). */
data class DS1PaletteEntry(val name: String, val colour: DS1Color, val pastelName: String, val pastel: DS1Color, val ink: Boolean)
