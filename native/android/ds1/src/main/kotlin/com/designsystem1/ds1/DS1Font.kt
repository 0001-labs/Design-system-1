package com.designsystem1.ds1

import android.content.Context
import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import java.util.concurrent.ConcurrentHashMap

/**
 * Design system 1's typefaces. The package carries TrueType and OpenType builds of the woff2
 * files the web loads (Android cannot read woff2) as font resources, and a product copies
 * the faces it is licensed for. GT America sets text with circular dots (`ss05`, as
 * `--ds-font-features`); arrows are Inter in every face; code is Iosevka Extended; figures
 * may be Olivetti Dot. Type stays on the grid: it does not follow the system font scale.
 */
object DS1Font {
    enum class Face(val resource: String) {
        Regular("ds1_gt_america_standard_regular"),
        Medium("ds1_gt_america_standard_medium"),
        Compressed("ds1_gt_america_compressed_regular"),
        Mono("ds1_iosevka_regular"),
        /** Inter's arrows alone ("Inter Arrows" on the web). */
        Arrows("ds1_inter_arrows"),
        /** Olivetti Dot, the dot-matrix face for figures. */
        Figures("ds1_olivettidot_regular");

        /** GT America's circular dots. */
        val features: String? get() = if (this == Regular || this == Medium || this == Compressed) "ss05" else null
    }

    private val ids = ConcurrentHashMap<Face, Int>()
    private val typefaces = ConcurrentHashMap<Face, Typeface>()

    /** The face's font resource, or 0 when the product did not copy it: looked up by name, since each product copies only the faces it is licensed for. */
    @android.annotation.SuppressLint("DiscouragedApi")
    fun resourceId(context: Context, face: Face): Int = ids.getOrPut(face) {
        context.resources.getIdentifier(face.resource, "font", context.packageName)
    }

    /** Whether the product carries this face; without it text falls back to the system face. */
    fun isAvailable(context: Context, face: Face): Boolean = resourceId(context, face) != 0

    /** The face as an Android typeface, for measuring; null when it is not carried. */
    fun typeface(context: Context, face: Face): Typeface? {
        typefaces[face]?.let { return it }
        val id = resourceId(context, face)
        if (id == 0) return null
        return context.resources.getFont(id).also { typefaces[face] = it }
    }

    /** The face as a Compose font family, falling back to the system's. */
    fun family(context: Context, face: Face): FontFamily {
        val id = resourceId(context, face)
        if (id == 0) return if (face == Face.Mono) FontFamily.Monospace else FontFamily.Default
        return FontFamily(Font(id))
    }

    @Composable
    fun family(face: Face): FontFamily {
        val context = LocalContext.current
        return remember(face) { family(context, face) }
    }

    /** The arrows Inter Arrows draws: the `unicode-range` of its face in one.css. */
    fun isArrow(codePoint: Int): Boolean =
        codePoint in 0x2190..0x21FF || codePoint in 0x27F0..0x27FF || codePoint in 0x2900..0x297F || codePoint in 0x2B00..0x2BFF

    /** Digits, currency signs and the signs of a number (+ - − . , %): what figures may set in Olivetti Dot. */
    fun isFigureSign(codePoint: Int): Boolean =
        codePoint in '0'.code..'9'.code || codePoint in FIGURE_SIGNS || Character.getType(codePoint) == Character.CURRENCY_SYMBOL.toInt()

    private val FIGURE_SIGNS = setOf('+'.code, '-'.code, 0x2212, '.'.code, ','.code, '%'.code)

    /** Whether a typeface draws a character, for figures the face lacks. */
    fun draws(typeface: Typeface?, codePoint: Int): Boolean {
        if (typeface == null) return false
        return Paint().apply { this.typeface = typeface }.hasGlyph(String(Character.toChars(codePoint)))
    }

    /** The advance of a character in a typeface at [sizePx]. */
    fun advance(typeface: Typeface, sizePx: Float, text: String): Float =
        Paint().apply { this.typeface = typeface; textSize = sizePx }.measureText(text)
}
