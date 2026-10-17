package com.designsystem1.ds1

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role

/** `ds-button`'s kinds: `plain` on the paper, `secondary` on the fill, `primary` on the accent. */
enum class DS1ButtonKind { Plain, Secondary, Primary }

/** `ds-button`'s widths: hug the label (the default), four squares (`fixed`) or eight (`wide`). */
enum class DS1ButtonWidth { Hug, Fixed, Wide }

/** The colour text and icons take inside a control: the text colour, or the ink on the accent. */
val LocalDS1ContentColour = staticCompositionLocalOf<DS1Color?> { null }

/**
 * `ds-button`: one control high, hugging its label, with the 4 dp corner. Pressed and disabled
 * states change only opacity. Put [DS1LineText] or [DS1Icon] inside, or use the overload with
 * a label.
 */
@Composable
fun DS1Button(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    kind: DS1ButtonKind = DS1ButtonKind.Plain,
    width: DS1ButtonWidth = DS1ButtonWidth.Hug,
    enabled: Boolean = true,
    content: @Composable RowScope.() -> Unit,
) {
    val scale = LocalDS1Scale.current
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val shape = RoundedCornerShape(scale.radius)
    val ground = when (kind) {
        DS1ButtonKind.Plain -> Color.Transparent
        DS1ButtonKind.Secondary -> DS1Colors.fill.current
        DS1ButtonKind.Primary -> DS1Colors.accent.current
    }
    val sized = when (width) {
        DS1ButtonWidth.Hug -> Modifier
        DS1ButtonWidth.Fixed -> Modifier.width(scale.squares(4f))
        DS1ButtonWidth.Wide -> Modifier.width(scale.squares(8f))
    }
    CompositionLocalProvider(LocalDS1ContentColour provides if (kind == DS1ButtonKind.Primary) DS1Colors.onAccent else DS1Colors.text) {
        Row(
            modifier = modifier
                .then(sized)
                .height(scale.control)
                .clip(shape)
                .background(ground, shape)
                .clickable(interactionSource = interaction, indication = null, enabled = enabled, role = Role.Button, onClick = onClick)
                .alpha(if (!enabled) 0.5f else if (pressed) 0.7f else 1f)
                .padding(horizontal = if (kind == DS1ButtonKind.Plain) scale(0f) else scale(4f)),
            horizontalArrangement = Arrangement.spacedBy(scale(4f), Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
            content = content,
        )
    }
}

/** A button with a label, and an icon before it if given. */
@Composable
fun DS1Button(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    kind: DS1ButtonKind = DS1ButtonKind.Plain,
    width: DS1ButtonWidth = DS1ButtonWidth.Hug,
    icon: DS1IconName? = null,
    enabled: Boolean = true,
) {
    DS1Button(onClick, modifier, kind, width, enabled) {
        val colour = (LocalDS1ContentColour.current ?: DS1Colors.text)
        if (icon != null) DS1Icon(icon, tint = colour.current)
        DS1ControlText(label, colour)
    }
}

/** An icon alone on a square button (`ds-button icon`), labelled for assistive technology; on the paper the icon is in the muted ink, as the web draws it. */
@Composable
fun DS1IconButton(
    icon: DS1IconName,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    kind: DS1ButtonKind = DS1ButtonKind.Plain,
    enabled: Boolean = true,
) {
    val scale = LocalDS1Scale.current
    DS1Button(onClick, modifier.width(scale.control), kind, DS1ButtonWidth.Hug, enabled) {
        val ink = if (kind == DS1ButtonKind.Plain) DS1Colors.textMuted else LocalDS1ContentColour.current ?: DS1Colors.text
        DS1Icon(icon, tint = ink.current, contentDescription = contentDescription)
    }
}

/** A control's one line of text: 14, its tracking, in a colour, on the control's height. */
@Composable
internal fun DS1ControlText(label: String, colour: DS1Color, modifier: Modifier = Modifier) {
    val scale = LocalDS1Scale.current
    androidx.compose.foundation.text.BasicText(
        text = ds1Annotated(label, scale.type, scale.tracking),
        modifier = modifier,
        style = ds1TextStyle().copy(color = colour.current, lineHeight = androidx.compose.ui.unit.TextUnit.Unspecified),
        maxLines = 1,
        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
    )
}
