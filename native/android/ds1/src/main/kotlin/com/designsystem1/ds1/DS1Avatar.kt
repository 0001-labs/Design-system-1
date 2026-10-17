package com.designsystem1.ds1

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.invisibleToUser
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.zIndex

/** `ds-avatar`'s sizes: one control (16 dp), compact (the same) or large (two squares). */
enum class DS1AvatarSize(val dp: Float, val initial: Float) { Default(DS1Metrics.control, 10f), Compact(DS1Metrics.control, 10f), Large(40f, 20f) }

/**
 * `ds-avatar`: a person's or a workspace's mark, always round unless [square] or a [logo].
 * A [picture] covers it (or is contained, padded 2 dp, with [contain]); without one it shows
 * [initial] in an ink that reads on [colour]: black on a light fill, white on a dark one.
 * [pending] greys it; [outlined] draws a 1 dp inner line. With [label] it is an image for
 * assistive technology, otherwise decorative.
 */
@Composable
fun DS1Avatar(
    modifier: Modifier = Modifier,
    initial: String = "?",
    label: String? = null,
    picture: Painter? = null,
    icon: DS1IconName? = null,
    colour: Color? = null,
    ink: Color? = null,
    size: DS1AvatarSize = DS1AvatarSize.Default,
    square: Boolean = false,
    logo: Boolean = false,
    contain: Boolean = false,
    outlined: Boolean = false,
    pending: Boolean = false,
    plain: Boolean = false,
) {
    val scale = LocalDS1Scale.current
    val box: Dp = scale(size.dp)
    val shape: Shape = when {
        logo -> RoundedCornerShape(0.dp)
        square -> RoundedCornerShape(scale.radius)
        else -> CircleShape
    }
    val ground = when {
        plain -> Color.Transparent
        pending -> DS1Colors.fill.current
        colour != null -> colour
        else -> DS1Colors.fill.current
    }
    val letters = when {
        pending -> DS1Colors.textMuted.current
        ink != null -> ink
        colour != null -> avatarInk(colour)
        else -> DS1Colors.text.current
    }
    Box(
        modifier
            .size(box)
            .clip(shape)
            .background(ground, shape)
            .then(if (outlined) Modifier.border(1.dp, ink ?: letters, shape) else Modifier)
            .semantics { if (label != null) contentDescription = label else invisibleToUser() },
        contentAlignment = Alignment.Center,
    ) {
        when {
            picture != null -> Image(
                picture, null,
                Modifier.size(box).then(if (contain) Modifier.padding(scale(2f)) else Modifier).alpha(if (pending) 0.5f else 1f),
                contentScale = if (contain) ContentScale.Fit else ContentScale.Crop,
                colorFilter = if (pending) ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(0f) }) else null,
            )
            icon != null -> DS1Icon(icon, size = if (size == DS1AvatarSize.Large) DS1IconSize.Large else DS1IconSize.Small, tint = letters)
            else -> {
                val count = initial.codePointCount(0, initial.length).coerceAtLeast(1)
                val pair = if (size == DS1AvatarSize.Large) 14f else 10f
                val type = if (count > 1) minOf(pair, (size.dp - 2f) / count) else size.initial
                BasicText(
                    initial,
                    style = ds1TextStyle().copy(
                        color = letters,
                        fontSize = LocalDensity.current.gridSp(type * scale.factor),
                        letterSpacing = androidx.compose.ui.unit.TextUnit.Unspecified,
                        lineHeight = LocalDensity.current.gridSp(type * scale.factor),
                        fontWeight = FontWeight.Normal,
                    ),
                    maxLines = 1,
                )
            }
        }
    }
}

/** The letters' ink on a fill: black where the fill is light (luminance above 0.22), white where it is dark. */
fun avatarInk(fill: Color): Color = if (fill.luminance() > 0.22f) DS1Colors.black.color(false) else DS1Colors.white.color(false)

/**
 * `ds-avatar-group`: avatars overlapping 3 dp, the earlier ones on top, with an optional
 * [lead] 4 dp before them; [vertical] stacks them downwards.
 */
@Composable
fun DS1AvatarGroup(
    modifier: Modifier = Modifier,
    vertical: Boolean = false,
    lead: (@Composable () -> Unit)? = null,
    members: List<@Composable () -> Unit>,
) {
    val scale = LocalDS1Scale.current
    Layout(
        content = {
            if (lead != null) Box { lead() }
            members.forEachIndexed { i, member -> Box(Modifier.zIndex((members.size - i).toFloat())) { member() } }
        },
        modifier = modifier,
    ) { measurables, constraints ->
        val loose = constraints.copy(minWidth = 0, minHeight = 0)
        val placeables = measurables.map { it.measure(loose) }
        val overlap = scale(3f).roundToPx()
        val gap = scale(4f).roundToPx()
        val leadCount = if (lead != null) 1 else 0
        var along = 0
        val positions = placeables.mapIndexed { i, p ->
            val at = along
            val size = if (vertical) p.height else p.width
            along += size + when {
                i < leadCount -> gap
                i < placeables.lastIndex -> -overlap
                else -> 0
            }
            at
        }
        val across = placeables.maxOfOrNull { if (vertical) it.width else it.height } ?: 0
        val total = (placeables.lastIndex.takeIf { it >= 0 }?.let { positions[it] + if (vertical) placeables[it].height else placeables[it].width } ?: 0)
        layout(if (vertical) across else total, if (vertical) total else across) {
            placeables.forEachIndexed { i, p ->
                if (vertical) p.place((across - p.width) / 2, positions[i]) else p.place(positions[i], (across - p.height) / 2)
            }
        }
    }
}
