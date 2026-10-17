package com.designsystem1.ds1

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.abs

/** What a toast reports. */
enum class DS1ToastKind { Message, Success, Info, Warning, Error, Loading }

/** A toast's action or cancel: its words and what a press does. A press also closes the toast. */
data class DS1ToastAction(val label: String, val onClick: () -> Unit)

/** One toast in the stack. Reusing an [id] updates it in place and restarts its time. */
class DS1ToastItem internal constructor(
    val id: Long,
    title: String,
    description: String?,
    kind: DS1ToastKind,
    duration: Long,
    action: DS1ToastAction?,
    cancel: DS1ToastAction?,
    val dismissible: Boolean,
    val important: Boolean,
    val onDismiss: (() -> Unit)?,
    val onAutoClose: (() -> Unit)?,
) {
    var title by mutableStateOf(title); internal set
    var description by mutableStateOf(description); internal set
    var kind by mutableStateOf(kind); internal set
    var duration by mutableStateOf(duration); internal set
    var action by mutableStateOf(action); internal set
    var cancel by mutableStateOf(cancel); internal set
    internal var version by mutableIntStateOf(0)
    internal var leaving by mutableStateOf(false)
}

/**
 * Toasts, as `toast()` on the web: `DS1Toast.success("Saved")` from anywhere; [DS1Theme] puts
 * the stack on screen. Each stays 4 seconds (a loading toast until it is updated), paused
 * while a finger is on the stack; three show at once; a swipe toward the edge dismisses one.
 */
object DS1Toast {
    /** A toast that stays until it is dismissed. */
    const val FOREVER = Long.MAX_VALUE
    const val DURATION = 4000L
    internal const val VISIBLE = 3
    private var counter = 0L
    internal val items = mutableStateListOf<DS1ToastItem>()

    fun show(
        title: String,
        description: String? = null,
        kind: DS1ToastKind = DS1ToastKind.Message,
        duration: Long = if (kind == DS1ToastKind.Loading) FOREVER else DURATION,
        id: Long? = null,
        action: DS1ToastAction? = null,
        cancel: DS1ToastAction? = null,
        dismissible: Boolean = true,
        important: Boolean = kind == DS1ToastKind.Error,
        onDismiss: (() -> Unit)? = null,
        onAutoClose: (() -> Unit)? = null,
    ): Long {
        val existing = id?.let { want -> items.firstOrNull { it.id == want && !it.leaving } }
        if (existing != null) {
            existing.title = title; existing.description = description; existing.kind = kind
            existing.duration = duration; existing.action = action; existing.cancel = cancel
            existing.version++
            return existing.id
        }
        val item = DS1ToastItem(id ?: ++counter, title, description, kind, duration, action, cancel, dismissible, important, onDismiss, onAutoClose)
        items.add(0, item)
        return item.id
    }

    fun message(title: String, description: String? = null) = show(title, description)
    fun success(title: String, description: String? = null) = show(title, description, DS1ToastKind.Success)
    fun info(title: String, description: String? = null) = show(title, description, DS1ToastKind.Info)
    fun warning(title: String, description: String? = null) = show(title, description, DS1ToastKind.Warning)
    fun error(title: String, description: String? = null) = show(title, description, DS1ToastKind.Error)
    fun loading(title: String, description: String? = null) = show(title, description, DS1ToastKind.Loading)

    /** A loading toast while [work] runs, then its success or its error in the same place. */
    suspend fun <T> promise(loading: String, success: (T) -> String, error: (Throwable) -> String, work: suspend () -> T): T {
        val id = loading(loading)
        return try {
            work().also { show(success(it), kind = DS1ToastKind.Success, id = id) }
        } catch (e: Throwable) {
            show(error(e), kind = DS1ToastKind.Error, id = id)
            throw e
        }
    }

    /** Dismisses one toast, or every toast. */
    fun dismiss(id: Long? = null) {
        for (item in items.toList()) if (id == null || item.id == id) close(item, auto = false)
    }

    internal fun close(item: DS1ToastItem, auto: Boolean) {
        if (item.leaving) return
        item.leaving = true
        if (auto) item.onAutoClose?.invoke() else item.onDismiss?.invoke()
    }

    internal fun remove(item: DS1ToastItem) { items.remove(item) }
}

/** Where the stack stands on screen. */
enum class DS1ToastPosition(internal val alignment: Alignment, internal val top: Boolean) {
    TopStart(Alignment.TopStart, true), TopCenter(Alignment.TopCenter, true), TopEnd(Alignment.TopEnd, true),
    BottomStart(Alignment.BottomStart, false), BottomCenter(Alignment.BottomCenter, false), BottomEnd(Alignment.BottomEnd, false),
}

/**
 * The stack of toasts (`<ds-toast>`): at most 20 squares wide or the width less a square on
 * each side, a square from the edge and the system bars. [DS1Theme] places one; place it
 * yourself only with `DS1Theme(toasts = false)`. [richColours] puts success, info, warning and
 * error on their colours; [closeButton] adds a close button to each.
 */
@Composable
fun DS1ToastHost(
    modifier: Modifier = Modifier,
    position: DS1ToastPosition = DS1ToastPosition.BottomEnd,
    expand: Boolean = false,
    richColours: Boolean = false,
    closeButton: Boolean = false,
    closeLabel: String = DS1Words.text("Close"),
) {
    val scale = LocalDS1Scale.current
    var pressed by remember { mutableStateOf(false) }
    val shown = DS1Toast.items.take(DS1Toast.VISIBLE + 1)
    var frontHeight by remember { mutableIntStateOf(0) }
    BoxWithConstraints(modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing).padding(scale.unit), contentAlignment = position.alignment) {
        val width = minOf(scale.squares(16f), maxWidth)
        Box(
            Modifier.width(width).pointerInput(Unit) {
                awaitPointerEventScope {
                    while (true) {
                        val event = awaitPointerEvent()
                        pressed = event.changes.any { it.pressed }
                    }
                }
            },
            contentAlignment = if (position.top) Alignment.TopEnd else Alignment.BottomEnd,
        ) {
            shown.asReversed().forEach { item ->
                key(item.id) {
                    val index = shown.indexOf(item)
                    DS1ToastChip(
                        item, index, expand || pressed, pressed, position.top, richColours, closeButton, closeLabel,
                        frontHeight, onFrontHeight = { if (index == 0) frontHeight = it },
                    )
                }
            }
        }
    }
}

@Composable
private fun DS1ToastChip(
    item: DS1ToastItem,
    index: Int,
    expanded: Boolean,
    paused: Boolean,
    top: Boolean,
    richColours: Boolean,
    closeButton: Boolean,
    closeLabel: String,
    frontHeight: Int,
    onFrontHeight: (Int) -> Unit,
) {
    val scale = LocalDS1Scale.current
    val density = LocalDensity.current
    val scope = rememberCoroutineScope()
    val enter = remember { Animatable(0f) }
    val drag = remember { Animatable(0f) }
    var height by remember { mutableIntStateOf(0) }
    val step = with(density) { scale(4f).toPx() }
    val direction = if (top) -1f else 1f

    LaunchedEffect(Unit) { enter.animateTo(1f, tween(400)) }
    LaunchedEffect(item.leaving) {
        if (item.leaving) {
            enter.animateTo(0f, tween(200))
            DS1Toast.remove(item)
        }
    }
    // Time runs only while the toast is visible and nothing holds the stack.
    var remaining by remember(item.version) { mutableStateOf(item.duration) }
    LaunchedEffect(item.version, paused, index < DS1Toast.VISIBLE) {
        if (paused || index >= DS1Toast.VISIBLE || item.duration == DS1Toast.FOREVER) return@LaunchedEffect
        val start = System.currentTimeMillis()
        try { delay(remaining); DS1Toast.close(item, auto = true) } finally { remaining -= System.currentTimeMillis() - start }
    }

    val (ground, ink) = when {
        richColours && item.kind == DS1ToastKind.Success -> DS1Colors.appleGreen.copy(dark = 0x99ff73) to DS1Colors.black.copy(dark = 0x2a2a2a)
        richColours && item.kind == DS1ToastKind.Info -> DS1Colors.zenithBlue.copy(dark = 0xccccff) to DS1Colors.black.copy(dark = 0x2a2a2a)
        richColours && item.kind == DS1ToastKind.Warning -> DS1Colors.orange.copy(dark = 0xfec20d) to DS1Colors.black.copy(dark = 0x2a2a2a)
        richColours && item.kind == DS1ToastKind.Error -> DS1Colors.tunedRed.copy(dark = 0xff5f5f) to DS1Colors.black.copy(dark = 0x2a2a2a)
        else -> TOOLTIP_GROUND to TOOLTIP_INK
    }
    val front = index == 0
    // Collapsed, each toast behind peeks 4 above the one in front; expanded, each stands a
    // whole toast and 4 above it.
    val lift = -direction * index * (if (expanded) frontHeight + step else step)
    val behind = !expanded && !front
    val shrink = if (expanded) 1f else 1f - 0.05f * index
    val iconFor = when (item.kind) {
        DS1ToastKind.Success -> DS1IconName.check
        DS1ToastKind.Info -> DS1IconName.notifications
        DS1ToastKind.Warning, DS1ToastKind.Error -> DS1IconName.warning
        else -> null
    }
    Box(
        Modifier
            .onSizeChanged { height = it.height; onFrontHeight(it.height) }
            .graphicsLayer {
                translationY = (1f - enter.value) * direction * height + drag.value + lift
                alpha = enter.value * if (index >= DS1Toast.VISIBLE) 0f else 1f
                scaleX = shrink; scaleY = shrink
                transformOrigin = androidx.compose.ui.graphics.TransformOrigin(0.5f, if (top) 1f else 0f)
            }
            .then(if (behind && frontHeight > 0) Modifier.heightIn(max = with(density) { frontHeight.toDp() }) else Modifier)
            .background(ground.current, RoundedCornerShape(scale.radius))
            .then(if (item.dismissible) Modifier.draggable(
                rememberDraggableState { delta -> scope.launch { drag.snapTo(drag.value + delta) } },
                Orientation.Vertical,
                onDragStopped = { velocity ->
                    val far = abs(drag.value) >= with(density) { 45.dp.toPx() } && drag.value * direction > 0
                    val fast = abs(velocity) > 110f && velocity * direction > 0
                    if (far || fast) DS1Toast.close(item, auto = false) else drag.animateTo(0f, tween(200))
                },
            ) else Modifier)
            .semantics(mergeDescendants = true) { liveRegion = if (item.kind == DS1ToastKind.Error && item.important) LiveRegionMode.Assertive else LiveRegionMode.Polite }
            .padding(horizontal = scale(4f))
            .heightIn(min = scale.control),
    ) {
        Row(Modifier.alpha(if (behind) 0f else 1f), horizontalArrangement = Arrangement.spacedBy(scale(4f)), verticalAlignment = Alignment.Top) {
            if (item.kind == DS1ToastKind.Loading) Box(Modifier.size(scale.control), contentAlignment = Alignment.Center) { DS1Loading(Modifier.size(scale(10f)), DS1LoadingVariant.Spinner, item.title, ink.current) }
            else if (iconFor != null) Box(Modifier.size(scale.control), contentAlignment = Alignment.Center) { DS1Icon(iconFor, tint = ink.current) }
            Column(Modifier.weight(1f, fill = false)) {
                DS1ToastLine(item.title, ink, 1f)
                item.description?.let { DS1ToastLine(it, ink, 0.7f) }
            }
            item.action?.let { a -> DS1ToastLine(a.label, ink, 1f, underline = true, onClick = { a.onClick(); DS1Toast.close(item, auto = false) }) }
            item.cancel?.let { c -> DS1ToastLine(c.label, ink, 0.7f, underline = true, onClick = { c.onClick(); DS1Toast.close(item, auto = false) }) }
            if (closeButton && item.dismissible) Box(Modifier.size(scale.control).clickable(role = Role.Button, onClickLabel = closeLabel) { DS1Toast.close(item, auto = false) }, contentAlignment = Alignment.Center) {
                DS1Icon(DS1IconName.close, tint = ink.current, contentDescription = closeLabel)
            }
        }
    }
}

@Composable
private fun DS1ToastLine(text: String, ink: DS1Color, alpha: Float, underline: Boolean = false, onClick: (() -> Unit)? = null) {
    val scale = LocalDS1Scale.current
    BasicText(
        ds1Annotated(text, scale.type, scale.tracking),
        Modifier.alpha(alpha).then(if (onClick != null) Modifier.clickable(role = Role.Button, onClick = onClick) else Modifier),
        style = ds1TextStyle().copy(color = ink.current, lineHeight = LocalDensity.current.gridSp(scale.control.value), textDecoration = if (underline) TextDecoration.Underline else null),
    )
}
