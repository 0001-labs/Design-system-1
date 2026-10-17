package com.designsystem1.ds1

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * `ds-input`'s faces: [Field] (the default for a field on its own: the fill, a 1 dp border and
 * the corner), [Row] (an 18 dp field in a 20 dp settings row, on the field's ground, square)
 * and [Plain] (words alone, no ground).
 */
enum class DS1FieldVariant { Field, Row, Plain }

/**
 * `ds-input`: one square high, text inset 4 dp, with an optional [label] above (a required
 * field adds " *" in the danger colour), an [error] below on its own lines, and for a
 * [secure] field a button that shows and hides the password, named [showLabel] and
 * [hideLabel]. [quietFocus] draws no focus.
 */
@Composable
fun DS1Field(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    label: String? = null,
    error: String? = null,
    required: Boolean = false,
    variant: DS1FieldVariant = DS1FieldVariant.Field,
    secure: Boolean = false,
    showLabel: String = DS1Words.text("Show password"),
    hideLabel: String = DS1Words.text("Hide password"),
    enabled: Boolean = true,
    readOnly: Boolean = false,
    quietFocus: Boolean = false,
    keyboardOptions: KeyboardOptions = if (secure) KeyboardOptions(keyboardType = KeyboardType.Password) else KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
) {
    var revealed by rememberSaveable { mutableStateOf(false) }
    DS1FieldColumn(label, required, error, modifier) {
        DS1FieldFrame(
            value, onValueChange, Modifier, placeholder, enabled, readOnly, singleLine = true, variant, quietFocus, error != null,
            keyboardOptions, keyboardActions,
            if (secure && !revealed) PasswordVisualTransformation() else VisualTransformation.None,
            trailing = if (secure) ({ DS1RevealButton(revealed, showLabel, hideLabel) { revealed = !revealed } }) else null,
        )
    }
}

/**
 * `ds-textarea`: the field's look across [rows] lines one square tall; with [autoGrow] it grows
 * a whole square at a time with its text up to [maxRows], then scrolls.
 */
@Composable
fun DS1TextArea(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    label: String? = null,
    error: String? = null,
    required: Boolean = false,
    rows: Int = 3,
    autoGrow: Boolean = false,
    maxRows: Int = 10,
    variant: DS1FieldVariant = DS1FieldVariant.Field,
    enabled: Boolean = true,
    readOnly: Boolean = false,
) {
    val scale = LocalDS1Scale.current
    val min = scale.squares(rows.coerceAtLeast(1).toFloat())
    val max = if (autoGrow) scale.squares(maxOf(rows, maxRows).toFloat()) else min
    DS1FieldColumn(label, required, error, modifier) {
        DS1FieldFrame(
            value, onValueChange, Modifier.heightIn(min = min, max = max), placeholder, enabled, readOnly, singleLine = false, variant, false, error != null,
            KeyboardOptions.Default, KeyboardActions.Default, VisualTransformation.None, trailing = null,
        )
    }
}

@Composable
private fun DS1FieldColumn(label: String?, required: Boolean, error: String?, modifier: Modifier, field: @Composable () -> Unit) {
    val scale = LocalDS1Scale.current
    if (label == null && error == null) {
        Box(modifier) { field() }
        return
    }
    Column(modifier) {
        if (label != null) {
            val danger = DS1Colors.danger.current
            BasicText(
                buildAnnotatedString {
                    append(label)
                    if (required) withStyle(SpanStyle(color = danger)) { append(" *") }
                },
                Modifier.height(scale.unit),
                style = ds1TextStyle().copy(lineHeight = androidx.compose.ui.unit.TextUnit.Unspecified),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        field()
        if (error != null) DS1LineText(error, Modifier.semantics { liveRegion = LiveRegionMode.Polite }, tone = DS1Tone.Danger, wrap = true)
    }
}

@Composable
private fun DS1RevealButton(revealed: Boolean, showLabel: String, hideLabel: String, onToggle: () -> Unit) {
    val scale = LocalDS1Scale.current
    val name = if (revealed) hideLabel else showLabel
    Box(
        Modifier
            .width(scale(24f))
            .height(scale.unit)
            .clickable(role = Role.Button, onClickLabel = name, onClick = onToggle)
            .semantics { contentDescription = name; stateDescription = if (revealed) hideLabel else showLabel },
        contentAlignment = Alignment.Center,
    ) {
        DS1Icon(if (revealed) DS1IconName.passwordUnsee else DS1IconName.passwordSee, size = DS1IconSize.Large, tint = DS1Colors.inputRevealColour.current)
    }
}

/** `--ds-input-reveal-color`: the password button's ink. */
internal val DS1Colors.inputRevealColour: DS1Color get() = DS1Color(light = 0x1e1e1e, dark = 0xf5f5f5)

@Composable
private fun DS1FieldFrame(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier,
    placeholder: String,
    enabled: Boolean,
    readOnly: Boolean,
    singleLine: Boolean,
    variant: DS1FieldVariant,
    quietFocus: Boolean,
    invalid: Boolean,
    keyboardOptions: KeyboardOptions,
    keyboardActions: KeyboardActions,
    visualTransformation: VisualTransformation,
    trailing: (@Composable () -> Unit)?,
) {
    val scale = LocalDS1Scale.current
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val corner: Dp = when (variant) {
        DS1FieldVariant.Field -> scale.radius
        DS1FieldVariant.Row, DS1FieldVariant.Plain -> 0.dp
    }
    val shape = if (corner == 0.dp) RectangleShape else RoundedCornerShape(corner)
    val ground = when (variant) {
        DS1FieldVariant.Field -> DS1Colors.fill.current
        DS1FieldVariant.Row -> DS1Colors.inputBackground.current
        DS1FieldVariant.Plain -> Color.Transparent
    }
    val ink = if (variant == DS1FieldVariant.Row) DS1Colors.inputText else DS1Colors.text
    val hint = if (variant == DS1FieldVariant.Row) DS1Colors.inputPlaceholder else DS1Colors.textMuted
    val line = when {
        variant == DS1FieldVariant.Plain -> Color.Transparent
        focused && !quietFocus && variant == DS1FieldVariant.Row -> DS1Colors.accent.current
        focused && !quietFocus -> DS1Colors.focusRing.current
        invalid -> DS1Colors.danger.current
        variant == DS1FieldVariant.Field -> DS1Colors.border.current
        else -> Color.Transparent
    }
    val height = if (variant == DS1FieldVariant.Row) scale(18f) else scale.unit
    val style = ds1TextStyle().copy(color = ink.current, lineHeight = androidx.compose.ui.unit.TextUnit.Unspecified)
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = (if (singleLine) modifier.height(height) else modifier)
            .then(if (variant == DS1FieldVariant.Row) Modifier.padding(top = scale(2f)) else Modifier)
            .fillMaxWidth()
            .alpha(if (enabled || variant == DS1FieldVariant.Row) 1f else 0.5f)
            .semantics { if (invalid) error("") },
        enabled = enabled,
        readOnly = readOnly,
        textStyle = if (!enabled && variant == DS1FieldVariant.Row) style.copy(color = DS1Color(light = 0x555555, dark = 0xd0d0d0).current) else style,
        singleLine = singleLine,
        keyboardOptions = keyboardOptions,
        keyboardActions = keyboardActions,
        visualTransformation = visualTransformation,
        interactionSource = interaction,
        cursorBrush = SolidColor(ink.current),
        decorationBox = { inner ->
            Row(
                Modifier
                    .background(ground, shape)
                    .border(DS1Metrics.line.dp, line, shape)
                    .padding(start = if (variant == DS1FieldVariant.Plain) 0.dp else scale(4f), end = if (trailing != null || variant == DS1FieldVariant.Plain) 0.dp else scale(4f)),
                verticalAlignment = if (singleLine) Alignment.CenterVertically else Alignment.Top,
            ) {
                Box(Modifier.weight(1f).then(if (singleLine) Modifier else Modifier.padding(vertical = scale(2f))), contentAlignment = if (singleLine) Alignment.CenterStart else Alignment.TopStart) {
                    if (value.isEmpty() && placeholder.isNotEmpty())
                        BasicText(placeholder, style = style.copy(color = hint.current), maxLines = if (singleLine) 1 else Int.MAX_VALUE, overflow = TextOverflow.Ellipsis)
                    inner()
                }
                trailing?.invoke()
            }
        },
    )
}
