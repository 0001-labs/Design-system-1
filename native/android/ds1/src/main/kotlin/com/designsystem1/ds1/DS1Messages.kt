package com.designsystem1.ds1

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.Spacer

/** `ds-notice`'s tones. */
enum class DS1NoticeTone(internal val icon: DS1IconName) { Neutral(DS1IconName.info), Success(DS1IconName.check), Warning(DS1IconName.warning), Danger(DS1IconName.warning) }

/**
 * `ds-notice`: a message in the flow, beside what it is about. A one-square mark in its tone,
 * then the [heading] in the medium face and the [text], every line one square, and [actions]
 * a square below. [onDismiss] adds a close button. Danger is announced as an alert.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun DS1Notice(
    modifier: Modifier = Modifier,
    tone: DS1NoticeTone = DS1NoticeTone.Neutral,
    heading: String? = null,
    text: String? = null,
    icon: DS1IconName = tone.icon,
    onDismiss: (() -> Unit)? = null,
    closeLabel: String = DS1Words.text("Close"),
    actions: (@Composable RowScope.() -> Unit)? = null,
) {
    val scale = LocalDS1Scale.current
    val (mark, markInk) = when (tone) {
        DS1NoticeTone.Neutral -> DS1Colors.fill to DS1Colors.text
        DS1NoticeTone.Success -> DS1Colors.appleGreen.copy(dark = 0x99ff73) to DS1Colors.black.copy(dark = 0x2a2a2a)
        DS1NoticeTone.Warning -> DS1Colors.orange.copy(dark = 0xfec20d) to DS1Colors.black.copy(dark = 0x2a2a2a)
        DS1NoticeTone.Danger -> DS1Colors.danger to DS1Color(light = 0xffffff, dark = 0x2a2a2a)
    }
    val words = if (tone == DS1NoticeTone.Danger) DS1Tone.Danger else DS1Tone.Text
    Row(modifier.fillMaxWidth().semantics(mergeDescendants = true) { liveRegion = if (tone == DS1NoticeTone.Danger) LiveRegionMode.Assertive else LiveRegionMode.Polite }) {
        Box(Modifier.size(scale.unit), contentAlignment = Alignment.Center) {
            Box(Modifier.size(scale.control).background(mark.current), contentAlignment = Alignment.Center) {
                DS1Icon(icon, size = DS1IconSize.Large, tint = markInk.current)
            }
        }
        Column(Modifier.weight(1f)) {
            if (heading != null) DS1LineText(heading, strong = true, tone = words, wrap = true)
            if (text != null) DS1LineText(text, tone = words, wrap = true)
            if (actions != null) {
                Spacer(Modifier.height(scale.unit))
                Row(Modifier.heightIn(min = scale.unit), horizontalArrangement = Arrangement.spacedBy(scale.half), verticalAlignment = Alignment.CenterVertically, content = actions)
            }
        }
        if (onDismiss != null) Box(Modifier.padding(start = scale(4f)).size(scale.control, scale.unit), contentAlignment = Alignment.Center) {
            DS1IconButton(DS1IconName.close, closeLabel, onDismiss)
        }
    }
}

/** `ds-banner`'s variants. */
enum class DS1BannerVariant { Warning, Info, Success, Error }

/**
 * `ds-banner`: a strip one square high across the top of the screen, its words a square in
 * from each side, an optional [action], and with [onDismiss] a close button.
 */
@Composable
fun DS1Banner(
    text: String,
    modifier: Modifier = Modifier,
    variant: DS1BannerVariant = DS1BannerVariant.Warning,
    action: String? = null,
    onAction: (() -> Unit)? = null,
    onDismiss: (() -> Unit)? = null,
    closeLabel: String = DS1Words.text("Close"),
) {
    val scale = LocalDS1Scale.current
    val (ground, ink, actionInk) = when (variant) {
        DS1BannerVariant.Warning -> Triple(Color(0x80EAFF00), Color(0x80000000), DS1Colors.slate.current)
        DS1BannerVariant.Info -> Triple(Color(0xB3007AFF), Color.White, Color.White)
        DS1BannerVariant.Success -> Triple(Color(0xB334C759), Color.White, Color.White)
        DS1BannerVariant.Error -> Triple(Color(0xB3FF3B30), Color.White, DS1Colors.slate.current)
    }
    Row(
        modifier.fillMaxWidth().height(scale.unit).background(ground).padding(horizontal = scale.unit)
            .semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        androidx.compose.foundation.text.BasicText(text, Modifier.weight(1f), style = ds1TextStyle().copy(color = ink, lineHeight = androidx.compose.ui.unit.TextUnit.Unspecified), maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
        if (action != null && onAction != null) DS1Link(action, onAction, ink = DS1Color(actionInk.toArgbRgb()))
        if (onDismiss != null) Box(Modifier.padding(start = scale(4f))) { DS1IconButton(DS1IconName.close, closeLabel, onDismiss) }
    }
}

private fun Color.toArgbRgb(): Int = (((red * 255).toInt() and 0xff) shl 16) or (((green * 255).toInt() and 0xff) shl 8) or ((blue * 255).toInt() and 0xff)

/**
 * `ds-empty`: an empty place saying what fills it. An optional [icon] on its own square, the
 * [heading] in the medium face, the [text] in the muted colour, every line one square, at
 * most 16 squares wide; [actions] a square below. [centered] centres it.
 */
@Composable
fun DS1Empty(
    modifier: Modifier = Modifier,
    heading: String = DS1Words.text("Nothing here yet"),
    text: String? = null,
    icon: DS1IconName? = null,
    centered: Boolean = false,
    actions: (@Composable RowScope.() -> Unit)? = null,
) {
    val scale = LocalDS1Scale.current
    Column(
        modifier.widthIn(max = scale.squares(16f)),
        horizontalAlignment = if (centered) Alignment.CenterHorizontally else Alignment.Start,
    ) {
        if (icon != null) Box(Modifier.height(scale.unit), contentAlignment = Alignment.Center) { DS1Icon(icon, size = DS1IconSize.Large, tint = DS1Colors.textMuted.current) }
        DS1LineText(heading, Modifier.semantics { heading() }, strong = true, wrap = true)
        if (text != null) DS1LineText(text, tone = DS1Tone.Muted, wrap = true)
        if (actions != null) {
            Spacer(Modifier.height(scale.unit))
            Row(Modifier.heightIn(min = scale.unit), horizontalArrangement = Arrangement.spacedBy(scale.half), verticalAlignment = Alignment.CenterVertically, content = actions)
        }
    }
}

/** `ds-loading`'s two faces. */
enum class DS1LoadingVariant { Bar, Spinner }

/**
 * `ds-loading`: a status that something is on its way. The bar is three squares by 2 dp, its
 * fill sliding across in 1.8 s; the spinner one square, turning in 0.72 s. When the system
 * removes animations they stand still.
 */
@Composable
fun DS1Loading(modifier: Modifier = Modifier, variant: DS1LoadingVariant = DS1LoadingVariant.Bar, label: String = "Loading", ink: Color = DS1Colors.text.current) {
    val scale = LocalDS1Scale.current
    val motion = rememberInfiniteTransition(label = "loading")
    val semantics = Modifier.semantics { contentDescription = label; liveRegion = LiveRegionMode.Polite }
    when (variant) {
        DS1LoadingVariant.Bar -> {
            val t by motion.animateFloat(-1f, 1f, infiniteRepeatable(tween(1800, easing = CubicBezierEasing(0.42f, 0f, 0.58f, 1f)), RepeatMode.Restart), label = "bar")
            Canvas(modifier.then(semantics).size(scale.squares(3f), 2.dp)) {
                val r = androidx.compose.ui.geometry.CornerRadius(1.dp.toPx())
                drawRoundRect(ink.copy(alpha = 0.16f), cornerRadius = r)
                clipRect { drawRoundRect(ink, Offset(t * size.width, 0f), size, r) }
            }
        }
        DS1LoadingVariant.Spinner -> {
            val turn by motion.animateFloat(0f, 360f, infiniteRepeatable(tween(720, easing = LinearEasing)), label = "spinner")
            Canvas(modifier.then(semantics).size(scale.unit)) {
                val w = 2.dp.toPx()
                val box = Size(size.width - w, size.height - w)
                drawArc(ink.copy(alpha = 0.18f), 0f, 360f, false, Offset(w / 2, w / 2), box, style = Stroke(w))
                drawArc(ink, turn - 135f, 90f, false, Offset(w / 2, w / 2), box, style = Stroke(w))
            }
        }
    }
}
