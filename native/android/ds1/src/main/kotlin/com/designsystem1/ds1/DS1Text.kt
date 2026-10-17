package com.designsystem1.ds1

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * The text styles of `ds-text` and text.css: 14 text, 10 small, 13 heading and a 20 display
 * title on two squares, each on lines one square tall.
 */
enum class DS1TextStyle {
    Text, Small, Heading, Display;

    fun size(scale: DS1Scale): Float = when (this) {
        Text -> scale.type
        Small -> scale.small
        Heading -> scale.heading
        Display -> scale.display
    }
    fun tracking(scale: DS1Scale): Float = if (this == Display) scale.displayTracking else scale.tracking
    /** The line the text stands on: one square, two for a display title. */
    fun line(scale: DS1Scale): Dp = if (this == Display) scale.squares(2f) else scale.unit
}

/** The colours of `ds-text`'s `tone`. */
enum class DS1Tone(val colour: DS1Color) {
    Text(DS1Colors.text), Muted(DS1Colors.textMuted), Title(DS1Colors.title), Danger(DS1Colors.danger)
}

/** A length in dp as text units that keep their size whatever the system font scale. */
internal fun Density.gridSp(dp: Float): TextUnit = (dp / fontScale).sp

/** How each character of a string is set. */
internal enum class PieceKind { Text, Arrow, Figure, Digit }

/** One character, how it is set and the space after it in dp. */
internal data class Piece(val text: String, val kind: PieceKind, val after: Float)

/**
 * The pieces of [string]: arrows in Inter; with [figures], digits and the signs of numbers the
 * figure face draws ([drawsFigure]) in Olivetti Dot, each digit centred in a cell of the width
 * of its 0 ([cells]); everything else in the text face. [advance] measures a character in the
 * figure face, in dp.
 */
internal fun pieces(
    string: String,
    tracking: Float,
    figures: Boolean,
    cells: Boolean,
    drawsFigure: (Int) -> Boolean,
    advance: (String) -> Float,
): List<Piece> {
    val list = ArrayList<Piece>()
    var i = 0
    while (i < string.length) {
        val cp = string.codePointAt(i)
        val text = String(Character.toChars(cp))
        val kind = when {
            DS1Font.isArrow(cp) -> PieceKind.Arrow
            figures && DS1Font.isFigureSign(cp) && drawsFigure(cp) -> if (cells && cp in '0'.code..'9'.code) PieceKind.Digit else PieceKind.Figure
            else -> PieceKind.Text
        }
        list += Piece(text, kind, tracking)
        i += Character.charCount(cp)
    }
    if (list.any { it.kind == PieceKind.Digit }) {
        val cell = advance("0")
        for (k in list.indices) {
            if (list[k].kind != PieceKind.Digit) continue
            val spare = maxOf(0f, cell - advance(list[k].text)) / 2
            list[k] = list[k].copy(after = spare)
            if (k > 0) list[k - 1] = list[k - 1].copy(after = list[k - 1].after + spare)
        }
    }
    return list
}

/**
 * Text drawn as Design system 1 draws it: in [face] at [size] dp with [tracking], arrows in
 * Inter, and with [figures], digits and the signs of numbers in Olivetti Dot, each digit centred
 * in a cell of the same width (the face's 1 is narrower than its 0). `cells = false` sets the
 * figures at their own widths, as a date reads.
 */
@Composable
fun ds1Annotated(string: String, size: Float, tracking: Float, face: DS1Font.Face = DS1Font.Face.Regular, figures: Boolean = false, cells: Boolean = true): AnnotatedString {
    val context = LocalContext.current
    val density = LocalDensity.current
    return remember(string, size, tracking, face, figures, cells, density) {
        val figureFace = DS1Font.typeface(context, DS1Font.Face.Figures)
        val sizePx = with(density) { size.dp.toPx() }
        val list = pieces(
            string, tracking, figures, cells,
            drawsFigure = { DS1Font.draws(figureFace, it) },
            advance = { text -> if (figureFace == null) 0f else with(density) { DS1Font.advance(figureFace, sizePx, text).toDp().value } },
        )
        val text = DS1Font.family(context, face)
        val arrows = DS1Font.family(context, DS1Font.Face.Arrows)
        val figure = DS1Font.family(context, DS1Font.Face.Figures)
        // Words in the text face with the style's own tracking need no span: the style sets
        // them. Only arrows, figures and the space around a digit's cell get one, a run at a
        // time, since a span a character throws off how wide a line measures.
        if (list.all { it.kind == PieceKind.Text }) return@remember AnnotatedString(string)
        buildAnnotatedString {
            var i = 0
            while (i < list.size) {
                val kind = list[i].kind
                val after = list[i].after
                val run = StringBuilder()
                while (i < list.size && list[i].kind == kind && list[i].after == after) run.append(list[i++].text)
                if (kind == PieceKind.Text && after == tracking) { append(run.toString()); continue }
                val family = when (kind) {
                    PieceKind.Text -> text
                    PieceKind.Arrow -> arrows
                    PieceKind.Figure, PieceKind.Digit -> figure
                }
                withStyle(SpanStyle(fontFamily = family, letterSpacing = density.gridSp(after))) { append(run.toString()) }
            }
        }
    }
}

/** The text style of a [DS1TextStyle] at the composition's scale: its size, line and face. */
@Composable
fun ds1TextStyle(style: DS1TextStyle = DS1TextStyle.Text, tone: DS1Tone = DS1Tone.Text, face: DS1Font.Face = DS1Font.Face.Regular): TextStyle {
    val scale = LocalDS1Scale.current
    val density = LocalDensity.current
    return TextStyle(
        color = tone.colour.current,
        fontFamily = DS1Font.family(face),
        fontSize = density.gridSp(style.size(scale)),
        letterSpacing = density.gridSp(style.tracking(scale)),
        lineHeight = density.gridSp(style.line(scale).value),
        lineHeightStyle = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.None),
        fontFeatureSettings = face.features,
    )
}

/**
 * Text standing on its square (`ds-text`): one line, cut short at its end, or with [wrap] as
 * many lines as it needs, each one square tall.
 */
@Composable
fun DS1LineText(
    string: String,
    modifier: Modifier = Modifier,
    style: DS1TextStyle = DS1TextStyle.Text,
    tone: DS1Tone = DS1Tone.Text,
    strong: Boolean = false,
    figures: Boolean = false,
    cells: Boolean = true,
    wrap: Boolean = false,
) {
    val scale = LocalDS1Scale.current
    val face = if (strong || style == DS1TextStyle.Heading) DS1Font.Face.Medium else DS1Font.Face.Regular
    val line = style.line(scale)
    val text = ds1Annotated(string, style.size(scale), style.tracking(scale), face, figures, cells)
    BasicText(
        text = text,
        modifier = if (wrap) modifier.fillMaxWidth().heightIn(min = line) else modifier.height(line),
        style = ds1TextStyle(style, tone, face),
        maxLines = if (wrap) Int.MAX_VALUE else 1,
        overflow = if (wrap) TextOverflow.Clip else TextOverflow.Ellipsis,
        softWrap = wrap,
    )
}

/**
 * A figure (an amount, a count, a date) in Olivetti Dot on its line. A figure is never cut
 * short: in a row, give the words beside it `Modifier.weight(1f)` so they give way.
 */
@Composable
fun DS1Figures(string: String, modifier: Modifier = Modifier, style: DS1TextStyle = DS1TextStyle.Text, tone: DS1Tone = DS1Tone.Text) {
    DS1LineText(string, modifier.wrapContentWidth(unbounded = true), style = style, tone = tone, figures = true)
}
