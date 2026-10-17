package com.designsystem1.ds1

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * `ds-accordion`: a [summary] row one square high with a chevron that turns over in 140 ms;
 * open, the [details] follow half a square below. Twelve squares wide unless told otherwise.
 */
@Composable
fun DS1Accordion(
    summary: String,
    open: Boolean,
    onToggle: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    details: @Composable ColumnScope.() -> Unit,
) {
    val scale = LocalDS1Scale.current
    val turn by animateFloatAsState(if (open) 180f else 0f, tween(140), label = "chevron")
    Column(modifier.width(scale.squares(12f))) {
        Row(
            Modifier.fillMaxWidth().height(scale.unit)
                .clickable(role = Role.Button) { onToggle(!open) }
                .semantics { stateDescription = if (open) "expanded" else "collapsed"; if (open) collapse { onToggle(false); true } else expand { onToggle(true); true } },
            horizontalArrangement = Arrangement.spacedBy(scale(4f)),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.weight(1f)) { DS1LineText(summary) }
            DS1Icon(DS1IconName.down, Modifier.rotate(turn))
        }
        AnimatedVisibility(open, enter = fadeIn(tween(140)), exit = fadeOut(tween(140))) {
            Column(Modifier.padding(top = scale.half), content = details)
        }
    }
}

/** `ds-list`: rows edge to edge with no gap. */
@Composable
fun DS1List(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) = Column(modifier, content = content)

/** `ds-panel`: a column on the paper with a pinned [header] and [footer] around a body that takes the rest. */
@Composable
fun DS1Panel(modifier: Modifier = Modifier, header: (@Composable () -> Unit)? = null, footer: (@Composable () -> Unit)? = null, body: @Composable ColumnScope.() -> Unit) {
    Column(modifier.background(DS1Colors.paper.current)) {
        header?.invoke()
        Column(Modifier.weight(1f).fillMaxWidth(), content = body)
        footer?.invoke()
    }
}

/** A navigation entry of [DS1Sidebar]. Collapsed children are left out of the list. */
data class DS1SidebarItem(
    val id: String,
    val label: String,
    val icon: DS1IconName? = null,
    val depth: Int = 0,
    /** Whether it has children: true open, false closed, null none. */
    val expanded: Boolean? = null,
    val current: Boolean = false,
    val enabled: Boolean = true,
    val meta: String? = null,
)

/**
 * `ds-sidebar`: navigation 12 squares wide, rows one square high, each depth half a square
 * further in, a disclosure square for a section, the fill under a finger and the current row
 * filled in the medium face. [onToggle] opens and closes a section.
 */
@Composable
fun DS1Sidebar(
    items: List<DS1SidebarItem>,
    onActivate: (String) -> Unit,
    onToggle: (String, Boolean) -> Unit,
    modifier: Modifier = Modifier,
    empty: String = "No items",
    header: (@Composable ColumnScope.() -> Unit)? = null,
    footer: (@Composable ColumnScope.() -> Unit)? = null,
) {
    val scale = LocalDS1Scale.current
    Column(modifier.width(scale.squares(12f)).padding(vertical = scale.half)) {
        header?.invoke(this)
        if (items.isEmpty()) DS1LineText(empty, Modifier.padding(scale.half), tone = DS1Tone.Muted)
        for (item in items) {
            Row(
                Modifier.fillMaxWidth().height(scale.unit)
                    .background(if (item.current) DS1Colors.fillHover.current else Color.Transparent)
                    .clickable(enabled = item.enabled, role = Role.Button) { onActivate(item.id) }
                    .semantics { selected = item.current }
                    .alpha(if (item.enabled) 1f else 0.5f)
                    .padding(start = scale(4f) + scale.half * item.depth, end = scale(4f)),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    Modifier.size(scale.unit).then(if (item.expanded != null) Modifier.clickable(role = Role.Button) { onToggle(item.id, !item.expanded) }
                        .semantics { contentDescription = "${if (item.expanded) "Collapse" else "Expand"} ${item.label}" } else Modifier),
                    contentAlignment = Alignment.Center,
                ) { if (item.expanded != null) DS1Icon(DS1IconName.right, Modifier.rotate(if (item.expanded) 90f else 0f), tint = DS1Colors.textMuted.current) }
                if (item.icon != null) { DS1Icon(item.icon); Box(Modifier.width(scale(4f))) }
                Box(Modifier.weight(1f)) { DS1LineText(item.label, strong = item.current) }
                if (item.meta != null) DS1LineText(item.meta, Modifier.padding(start = scale(4f)), style = DS1TextStyle.Small, tone = DS1Tone.Muted, figures = true)
            }
        }
        footer?.invoke(this)
    }
}

/** A column of [DS1Table]: its heading, how to read a row, and whether it holds numbers (set to the end). */
data class DS1Column<R>(val label: String, val numeric: Boolean = false, val width: Dp? = null, val value: (R) -> String)

/**
 * `ds-table`: rows one square high, 19 dp of words on a 1 dp rule across the table, no box and
 * no column lines, each column as wide as its widest cell, half a square between columns,
 * numbers to the end in tabular figures. The headings are in the title colour. It scrolls
 * sideways when it is wider than its room.
 */
@Composable
fun <R> DS1Table(rows: List<R>, columns: List<DS1Column<R>>, modifier: Modifier = Modifier, label: String? = null, selected: ((R) -> Boolean)? = null) {
    val scale = LocalDS1Scale.current
    val border = DS1Colors.border.current
    val accent = DS1Colors.accent.current
    val chosen = rows.map { selected?.invoke(it) == true }
    androidx.compose.ui.layout.Layout(
        content = {
            columns.forEach { c -> DS1Cell(c.label, c.numeric, DS1Colors.title, header = true) }
            rows.forEachIndexed { r, row -> columns.forEach { c -> DS1Cell(c.value(row), c.numeric, if (chosen[r]) DS1Colors.onAccent else DS1Colors.text, header = false) } }
        },
        modifier = modifier
            .horizontalScroll(rememberScrollState())
            .semantics { if (label != null) contentDescription = label }
            .drawBehind {
                val line = DS1Metrics.line.dp.toPx()
                val pitch = scale.unit.toPx()
                for (r in 0..rows.size) {
                    if (r > 0 && chosen[r - 1]) drawRect(accent, Offset(0f, r * pitch), androidx.compose.ui.geometry.Size(size.width, pitch - line))
                    val y = (r + 1) * pitch - line / 2
                    drawLine(border, Offset(0f, y), Offset(size.width, y), line)
                }
            },
    ) { measurables, _ ->
        val n = columns.size
        val pitch = scale.unit.roundToPx()
        val gap = scale.half.roundToPx()
        val loose = androidx.compose.ui.unit.Constraints()
        val placeables = measurables.mapIndexed { i, m ->
            val fixed = columns[i % n].width?.roundToPx()
            m.measure(if (fixed != null) androidx.compose.ui.unit.Constraints.fixedWidth(fixed) else loose)
        }
        val widths = IntArray(n) { c -> placeables.filterIndexed { i, _ -> i % n == c }.maxOf { it.width } }
        val starts = IntArray(n).also { for (c in 1 until n) it[c] = it[c - 1] + widths[c - 1] + gap }
        val total = if (n == 0) 0 else starts[n - 1] + widths[n - 1]
        layout(total, pitch * (rows.size + 1)) {
            placeables.forEachIndexed { i, p ->
                val c = i % n
                val r = i / n
                val x = if (columns[c].numeric) starts[c] + widths[c] - p.width else starts[c]
                p.place(x, r * pitch + (pitch - DS1Metrics.line.dp.roundToPx() - p.height))
            }
        }
    }
}

@Composable
private fun DS1Cell(text: String, numeric: Boolean, ink: DS1Color, header: Boolean) {
    val scale = LocalDS1Scale.current
    BasicText(
        ds1Annotated(text, scale.type, scale.tracking),
        if (header) Modifier.semantics { heading() } else Modifier,
        style = ds1TextStyle().copy(color = ink.current, lineHeight = androidx.compose.ui.unit.TextUnit.Unspecified, fontFeatureSettings = if (numeric) "tnum, ss05" else "ss05"),
        maxLines = 1,
        softWrap = false,
        overflow = TextOverflow.Clip,
    )
}
