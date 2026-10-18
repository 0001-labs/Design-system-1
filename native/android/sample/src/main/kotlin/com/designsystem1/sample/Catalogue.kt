package com.designsystem1.sample

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.designsystem1.ds1.*
import kotlinx.coroutines.launch
import java.time.Instant

class Catalogue : ComponentActivity() {
    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        enableEdgeToEdge()
        DS1Preferences.load(this)
        setContent { DS1Theme { CatalogueScreen() } }
    }
}

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    DS1Gap()
    DS1LineText(title, style = DS1TextStyle.Heading)
    DS1Rule()
    DS1Gap(size = DS1GapSize.Half)
    content()
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CatalogueScreen() {
    val scale = LocalDS1Scale.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var checked by remember { mutableStateOf(true) }
    var on by remember { mutableStateOf(true) }
    var radio by remember { mutableStateOf("a") }
    var tab by remember { mutableStateOf("list") }
    var split by remember { mutableStateOf("week") }
    var name by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("secret") }
    var note by remember { mutableStateOf("") }
    var currency by remember { mutableStateOf("DKK") }
    var open by remember { mutableStateOf(false) }
    var entry by remember { mutableStateOf("") }
    val tokens = remember { mutableStateListOf("Ada", "Grace") }
    var current by remember { mutableStateOf("lists") }

    DS1Page(Modifier.background(DS1Colors.paper.current).statusBarsPadding(), measure = 16f, grid = false) {
        DS1LineText("Design system 1", style = DS1TextStyle.Display)
        DS1LineText("Every piece of the Kotlin package.", tone = DS1Tone.Muted)
        Row(horizontalArrangement = Arrangement.spacedBy(scale(4f)), verticalAlignment = Alignment.CenterVertically) {
            DS1ThemeCycle()
            DS1LanguageCycle(compact = true)
        }

        Section("Buttons") {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(scale(4f)), verticalArrangement = Arrangement.spacedBy(scale(4f))) {
                DS1Button("Primary", { DS1Toast.success(DS1Words.text("Save")) }, kind = DS1ButtonKind.Primary)
                DS1Button("Secondary", { DS1Toast.message("A message", "With a line below it") }, kind = DS1ButtonKind.Secondary)
                DS1Button("Plain", { DS1Toast.error("Something went wrong") })
                DS1IconButton(DS1IconName.close, "Close", { })
                DS1DangerButton("Delete") { scope.launch { if (DS1Dialogs.confirm("Delete the list?", "It cannot be undone.", danger = true)) DS1Toast.success("Deleted") } }
                DS1Button("Prompt", { scope.launch { DS1Dialogs.prompt("Rename", label = "Name", value = "Plan")?.let { DS1Toast.info(it) } } }, kind = DS1ButtonKind.Secondary)
                DS1Button("Copy", { DS1Clipboard.copy(context, "Design system 1") }, kind = DS1ButtonKind.Secondary, icon = DS1IconName.duplicate)
            }
            DS1Gap(size = DS1GapSize.Half)
            DS1SplitButton(listOf(DS1Segment("day", "Day"), DS1Segment("week", "Week"), DS1Segment("month", "Month")), split, { split = it }, label = "Range")
            DS1Gap(size = DS1GapSize.Half)
            DS1Tabs(listOf(DS1Segment("list", "List"), DS1Segment("board", "Board"), DS1Segment("calendar", "Calendar")), tab, { tab = it })
            DS1Tabs(listOf(DS1Segment("list", "List"), DS1Segment("board", "Board")), tab, { tab = it }, segmented = true)
        }

        Section("Choices") {
            Row(horizontalArrangement = Arrangement.spacedBy(scale(4f)), verticalAlignment = Alignment.CenterVertically) {
                DS1Checkbox(checked, { checked = it }); DS1LineText("Checked")
                DS1Checkbox(false, null, indeterminate = true)
                DS1Radio(radio == "a", { radio = "a" }); DS1Radio(radio == "b", { radio = "b" })
            }
            DS1Gap(size = DS1GapSize.Half)
            Row(horizontalArrangement = Arrangement.spacedBy(scale(4f)), verticalAlignment = Alignment.CenterVertically) {
                DS1Switch(on, { on = it }); DS1Switch(on, { on = it }, rounded = true); DS1LineText(if (on) "On" else "Off")
            }
            DS1Gap(size = DS1GapSize.Half)
            Row(horizontalArrangement = Arrangement.spacedBy(scale(4f))) {
                DS1Choice("Light", radio == "a", { radio = "a" }); DS1Choice("Dark", radio == "b", { radio = "b" })
            }
            DS1Gap(size = DS1GapSize.Half)
            DS1Select(listOf(DS1Option("DKK", "Danish krone"), DS1Option("EUR", "Euro"), DS1Option("USD", "US dollar")), currency, { currency = it }, label = "Currency")
        }

        Section("Fields") {
            DS1Field(name, { name = it }, placeholder = "Your name", label = "Name", required = true, error = if (name.length == 1) "Too short" else null)
            DS1Gap(size = DS1GapSize.Half)
            DS1Field(password, { password = it }, label = "Password", secure = true)
            DS1Gap(size = DS1GapSize.Half)
            DS1Field(note, { note = it }, placeholder = "A note", rows = 3, autoGrow = true)
            DS1Gap(size = DS1GapSize.Half)
            DS1TokenField(entry, { entry = it }, { text, _ -> tokens.add(text); entry = "" }, placeholder = "Add a person", onRemoveLast = { tokens.removeLastOrNull() }) {
                for (t in tokens) DS1Token(t, removeLabel = "Remove $t", onRemove = { tokens.remove(t) }, leading = { DS1Avatar(initial = t.take(1), colour = DS1Colors.zenithBlue.current) })
            }
        }

        Section("Labels and people") {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(scale(4f)), verticalArrangement = Arrangement.spacedBy(scale(4f))) {
                DS1Badge("Draft"); DS1Badge("Paid", icon = DS1IconName.check, background = DS1Colors.appleGreen, ink = DS1Colors.black)
                DS1Token("Joachim", detail = "Owner")
                DS1Swatch(DS1Colors.orange.current, selected = true); DS1Swatch(DS1Colors.sharpBlue.current)
                DS1Tooltip("A tooltip, on a long press") { DS1LineText("Hold me") }
                DS1Link("A link", { })
            }
            DS1Gap(size = DS1GapSize.Half)
            Row(horizontalArrangement = Arrangement.spacedBy(scale(4f)), verticalAlignment = Alignment.CenterVertically) {
                DS1Avatar(initial = "J", colour = DS1Colors.appleGreen.current, label = "Joachim")
                DS1Avatar(initial = "Ab", colour = DS1Colors.sharpBlue.current, size = DS1AvatarSize.Large)
                DS1AvatarGroup(members = listOf({ DS1Avatar(initial = "A", colour = DS1Colors.pink.current) }, { DS1Avatar(initial = "B", colour = DS1Colors.orange.current) }, { DS1Avatar(initial = "C") }))
            }
            DS1Row(rule = true) { DS1Icon(DS1IconName.receipt); DS1LineText("Coffee", Modifier.weight(1f)); DS1Figures(DS1Pricing.price(4250, "DKK", minor = true)) }
            DS1Row(rule = true) { DS1Icon(DS1IconName.calendar); DS1LineText("Updated", Modifier.weight(1f)); DS1LineText(DS1Format.relative(Instant.now().minusSeconds(3 * 3600)), tone = DS1Tone.Muted) }
        }

        Section("Messages") {
            DS1Notice(heading = "Saved", text = "Your changes are on every device.", tone = DS1NoticeTone.Success)
            DS1Gap(size = DS1GapSize.Half)
            DS1Notice(heading = "Payment failed", text = "Check the card and try again.", tone = DS1NoticeTone.Danger, onDismiss = {}) {
                DS1Button("Try again", {}, kind = DS1ButtonKind.Secondary)
            }
            DS1Gap(size = DS1GapSize.Half)
            DS1Banner("A new version is ready", variant = DS1BannerVariant.Info, action = "Update", onAction = {})
            DS1Gap(size = DS1GapSize.Half)
            DS1Empty(text = "Lists you make show here.", icon = DS1IconName.notifications) { DS1Button("Make a list", {}, kind = DS1ButtonKind.Primary) }
            DS1Gap(size = DS1GapSize.Half)
            Row(horizontalArrangement = Arrangement.spacedBy(scale.unit), verticalAlignment = Alignment.CenterVertically) { DS1Loading(); DS1Loading(variant = DS1LoadingVariant.Spinner) }
        }

        Section("Structure") {
            DS1Accordion("Details", open, { open = it }) { DS1LineText("Hidden until opened.", wrap = true) }
            DS1Gap(size = DS1GapSize.Half)
            DS1Sidebar(
                listOf(
                    DS1SidebarItem("lists", "Lists", DS1IconName.notifications, expanded = true, current = current == "lists", meta = "12"),
                    DS1SidebarItem("work", "Work", depth = 1, current = current == "work"),
                    DS1SidebarItem("home", "Home", depth = 1, current = current == "home"),
                ),
                onActivate = { current = it }, onToggle = { _, _ -> },
            )
            DS1Gap(size = DS1GapSize.Half)
            DS1Table(
                listOf(Triple("Coffee", "Food", 42.5), Triple("Train", "Travel", 120.0), Triple("Book", "Leisure", 189.0)),
                listOf(DS1Column("Item") { it.first }, DS1Column("Category") { it.second }, DS1Column("Amount", numeric = true) { DS1Format.number(it.third, 2) }),
            )
        }

        Section("Words") {
            DS1LineText(DS1Words.text("Nothing here yet"))
            DS1LineText("${DS1Words.language.nativeLabel} · ${DS1Format.date(Instant.now())} · ${DS1Format.money(1234.5, DS1Pricing.currency())}", tone = DS1Tone.Muted)
            DS1LineText("Arrows → ← and figures 1 234,50", figures = true)
        }
        DS1Gap(size = DS1GapSize.Double)
    }
}
