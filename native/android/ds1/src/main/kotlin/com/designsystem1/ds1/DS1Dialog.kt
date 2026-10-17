package com.designsystem1.ds1

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.FlowRowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.window.DialogWindowProvider
import kotlinx.coroutines.CompletableDeferred

/**
 * `ds-dialog`: a box 20 squares wide (the screen less a square at each side at most) on the
 * paper, a 1 dp border, square corners and no shadow, a square of padding and a square
 * between its parts, over the page dimmed to 40% of the ink. Its [title] in the medium face,
 * its [description] muted, then [content], then [footer] at the end; [onDismissRequest]
 * comes from the back gesture, a tap outside ([closeOnOutside]) or the close button.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun DS1Dialog(
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    title: String? = null,
    description: String? = null,
    closeOnOutside: Boolean = true,
    closeOnBack: Boolean = true,
    closeLabel: String? = null,
    footer: (@Composable FlowRowScope.() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit = {},
) {
    val scale = LocalDS1Scale.current
    val dark = LocalDS1Dark.current
    Dialog(onDismissRequest, DialogProperties(dismissOnBackPress = closeOnBack, dismissOnClickOutside = closeOnOutside, usePlatformDefaultWidth = false)) {
        val window = (LocalView.current.parent as? DialogWindowProvider)?.window
        SideEffect { window?.setDimAmount(0.4f) }
        androidx.compose.runtime.CompositionLocalProvider(LocalDS1Dark provides dark, LocalDS1Scale provides scale) {
            BoxWithConstraints(Modifier.padding(scale.unit)) {
                Box(
                    modifier
                        .width(minOf(scale.squares(20f), maxWidth))
                        .background(DS1Colors.paper.current)
                        .border(DS1Metrics.line.dp, DS1Colors.border.current)
                        .semantics { if (title != null) paneTitle = title },
                ) {
                    Column(Modifier.verticalScroll(rememberScrollState()).padding(scale.unit), verticalArrangement = Arrangement.spacedBy(scale.unit)) {
                        if (title != null || description != null) Column(Modifier.padding(end = if (closeLabel != null) scale.unit else 0.dp)) {
                            if (title != null) DS1LineText(title, Modifier.semantics { heading() }, strong = true, wrap = true)
                            if (description != null) DS1LineText(description, tone = DS1Tone.Muted, wrap = true)
                        }
                        content()
                        if (footer != null) FlowRow(
                            Modifier.fillMaxWidth().heightIn(min = scale.unit),
                            horizontalArrangement = Arrangement.spacedBy(scale.half, Alignment.End),
                            verticalArrangement = Arrangement.Center,
                            content = footer,
                        )
                    }
                    if (closeLabel != null) Box(Modifier.align(Alignment.TopEnd).padding(scale.unit)) { DS1IconButton(DS1IconName.close, closeLabel, onDismissRequest) }
                }
            }
        }
    }
}

/**
 * The page's own dialogs, as `alert()`, `confirm()` and `prompt()` on the web: one at a time,
 * the later ones waiting. [DS1Theme] shows them. The confirm button is primary; with
 * `danger` it is secondary in the danger colour, Cancel takes the focus and a tap outside
 * does not cancel.
 */
object DS1Dialogs {
    internal sealed class Request {
        abstract val title: String
        abstract val text: String?
        class Alert(override val title: String, override val text: String?, val confirm: String, val done: CompletableDeferred<Unit>) : Request()
        class Confirm(override val title: String, override val text: String?, val confirm: String, val cancel: String, val danger: Boolean, val done: CompletableDeferred<Boolean>) : Request()
        class Prompt(override val title: String, override val text: String?, val label: String?, val value: String, val placeholder: String, val confirm: String, val cancel: String, val done: CompletableDeferred<String?>) : Request()
    }

    internal val queue = mutableStateListOf<Request>()

    suspend fun alert(title: String, text: String? = null, confirm: String = DS1Words.text("OK")) {
        val done = CompletableDeferred<Unit>()
        queue.add(Request.Alert(title, text, confirm, done))
        done.await()
    }

    suspend fun confirm(title: String, text: String? = null, confirm: String = DS1Words.text("OK"), cancel: String = DS1Words.text("Cancel"), danger: Boolean = false): Boolean {
        val done = CompletableDeferred<Boolean>()
        queue.add(Request.Confirm(title, text, confirm, cancel, danger, done))
        return done.await()
    }

    suspend fun prompt(title: String, text: String? = null, label: String? = null, value: String = "", placeholder: String = "", confirm: String = DS1Words.text("OK"), cancel: String = DS1Words.text("Cancel")): String? {
        val done = CompletableDeferred<String?>()
        queue.add(Request.Prompt(title, text, label, value, placeholder, confirm, cancel, done))
        return done.await()
    }
}

/** Shows [DS1Dialogs]' requests one at a time. [DS1Theme] places it. */
@Composable
fun DS1DialogHost() {
    val request = DS1Dialogs.queue.firstOrNull() ?: return
    val finish: () -> Unit = { DS1Dialogs.queue.remove(request) }
    when (request) {
        is DS1Dialogs.Request.Alert -> {
            val ok = remember(request) { FocusRequester() }
            DS1Dialog({ request.done.complete(Unit); finish() }, title = request.title, description = request.text, footer = {
                DS1Button(request.confirm, { request.done.complete(Unit); finish() }, Modifier.focusRequester(ok), kind = DS1ButtonKind.Primary)
            })
            LaunchedEffect(request) { runCatching { ok.requestFocus() } }
        }
        is DS1Dialogs.Request.Confirm -> {
            val focus = remember(request) { FocusRequester() }
            val no = { request.done.complete(false); finish() }
            val yes = { request.done.complete(true); finish() }
            DS1Dialog({ no() }, title = request.title, description = request.text, closeOnOutside = !request.danger, footer = {
                DS1Button(request.cancel, { no() }, if (request.danger) Modifier.focusRequester(focus) else Modifier, kind = DS1ButtonKind.Secondary)
                if (request.danger) DS1DangerButton(request.confirm) { yes() }
                else DS1Button(request.confirm, { yes() }, Modifier.focusRequester(focus), kind = DS1ButtonKind.Primary)
            })
            LaunchedEffect(request) { runCatching { focus.requestFocus() } }
        }
        is DS1Dialogs.Request.Prompt -> {
            var value by remember(request) { mutableStateOf(request.value) }
            val field = remember(request) { FocusRequester() }
            val cancel = { request.done.complete(null); finish() }
            val ok = { request.done.complete(value); finish() }
            DS1Dialog({ cancel() }, title = request.title, description = request.text, footer = {
                DS1Button(request.cancel, { cancel() }, kind = DS1ButtonKind.Secondary)
                DS1Button(request.confirm, { ok() }, kind = DS1ButtonKind.Primary)
            }) {
                DS1Field(
                    value, { value = it }, Modifier.focusRequester(field), placeholder = request.placeholder, label = request.label,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done), keyboardActions = KeyboardActions(onDone = { ok() }),
                )
            }
            LaunchedEffect(request) { runCatching { field.requestFocus() } }
        }
    }
}

/** A secondary button lettered in the danger colour, for an action that loses something. */
@Composable
fun DS1DangerButton(label: String, modifier: Modifier = Modifier, enabled: Boolean = true, onClick: () -> Unit) {
    DS1Button(onClick, modifier, DS1ButtonKind.Secondary, enabled = enabled) { DS1ControlText(label, DS1Colors.danger) }
}
