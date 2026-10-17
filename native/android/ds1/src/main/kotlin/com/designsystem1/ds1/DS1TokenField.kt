package com.designsystem1.ds1

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp

/** Why a token field asks to commit what was typed. */
enum class DS1CommitReason { Enter, Separator, Blur }

/**
 * `ds-token-field`: chosen values as [DS1Token]s and a field to type the next, wrapping a
 * square at a time inside a 1 dp outline on the paper. Enter or a [separators] character asks
 * to commit the text ([onCommit]); Backspace in an empty field asks to remove the last token
 * ([onRemoveLast]); [suggestions] open under the field as a menu.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun DS1TokenField(
    text: String,
    onTextChange: (String) -> Unit,
    onCommit: (String, DS1CommitReason) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    separators: String = ",;",
    onRemoveLast: (() -> Unit)? = null,
    suggestions: List<DS1Option<String>> = emptyList(),
    onSuggestion: (String) -> Unit = {},
    tokens: @Composable () -> Unit,
) {
    val scale = LocalDS1Scale.current
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val shape = RoundedCornerShape(scale.radius)
    Box(modifier) {
        FlowRow(
            Modifier.fillMaxWidth().heightIn(min = scale.unit)
                .background(LocalDS1Paper.current.current, shape)
                .border(DS1Metrics.line.dp, (if (focused) DS1Colors.focusRing else DS1Colors.border).current, shape),
            horizontalArrangement = Arrangement.spacedBy(scale.half),
            verticalArrangement = Arrangement.Center,
        ) {
            tokens()
            BasicTextField(
                value = text,
                onValueChange = { value ->
                    val cut = value.indexOfFirst { it in separators }
                    if (cut >= 0) {
                        val before = value.substring(0, cut).trim()
                        if (before.isNotEmpty()) onCommit(before, DS1CommitReason.Separator)
                        onTextChange(value.substring(cut + 1).trimStart())
                    } else onTextChange(value)
                },
                modifier = Modifier
                    .widthIn(min = scale.squares(4f))
                    .weight(1f)
                    .height(scale.unit)
                    .onPreviewKeyEvent { e ->
                        if (e.type == KeyEventType.KeyDown && e.key == Key.Backspace && text.isEmpty() && onRemoveLast != null) { onRemoveLast(); true } else false
                    },
                textStyle = ds1TextStyle().copy(color = DS1Colors.text.current),
                singleLine = true,
                interactionSource = interaction,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { if (text.isNotBlank()) onCommit(text.trim(), DS1CommitReason.Enter) }),
                cursorBrush = SolidColor(DS1Colors.text.current),
                decorationBox = { inner ->
                    Box(Modifier.padding(horizontal = scale(4f)), contentAlignment = Alignment.CenterStart) {
                        if (text.isEmpty() && placeholder.isNotEmpty()) BasicText(placeholder, style = ds1TextStyle(tone = DS1Tone.Muted))
                        inner()
                    }
                },
            )
        }
        DS1Menu(focused && suggestions.isNotEmpty(), { }) {
            for (s in suggestions) DS1MenuItem(s.label, { onSuggestion(s.value) }, enabled = s.enabled)
        }
    }
}
