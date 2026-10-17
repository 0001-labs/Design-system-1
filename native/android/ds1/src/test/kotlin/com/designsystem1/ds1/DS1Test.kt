package com.designsystem1.ds1

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.ZoneOffset
import java.time.ZonedDateTime

class DS1Test {
    @Test fun paletteFollowsItsSource() {
        // palette.ts derives Apple green's dark version as the Figma file does.
        assertEquals(0x99ff73, DS1Colors.appleGreen.light)
        assertEquals(0x529d36, DS1Colors.appleGreen.dark)
        assertEquals(0xccccff, DS1Colors.zenithBlue.light)
        assertEquals(DS1Color(0x99ff73), DS1Colors.accent)
        assertEquals(DS1Color(light = 0xf4f4f4, dark = 0x2c2c2c), DS1Colors.paper)
        assertEquals(28, DS1Colors.palette.size)
    }

    @Test fun measuresFollowTheirSource() {
        assertEquals(20f, DS1Metrics.square)
        assertEquals(16f, DS1Metrics.control)
        assertEquals(13f, DS1Metrics.typeHeading)
        assertEquals(16f, DS1Metrics.leading)
        assertEquals(-0.3f, DS1Metrics.tracking)
        assertEquals(4f, DS1Metrics.radius)
    }

    @Test fun scaleMatchesScalingTs() {
        assertEquals(1f, DS1Scale.factor(280f))
        assertEquals(1.404f, DS1Scale.factor(393f))
        assertEquals(1.436f, DS1Scale.factor(402f))
        assertEquals(0.75f, DS1Scale.factor(200f))
        assertEquals(2f, DS1Scale.factor(1024f))
        val scale = DS1Scale.device(393f)
        assertEquals(20 * 1.404f, scale.unit.value, 0.0001f)
        assertEquals(1f, scale.line.value)
        assertEquals(11 * scale.unit.value, scale.wholeSquares(scale.unit * 0 + androidx.compose.ui.unit.Dp(393f - 2 * scale.unit.value)).value, 0.001f)
    }

    @Test fun arrowsAreInterAndFiguresAreOlivetti() {
        val pieces = pieces("Pay → 10 kr.", -0.3f, figures = true, cells = true, drawsFigure = { true }, advance = { if (it == "1") 6f else 8f })
        assertEquals(PieceKind.Arrow, pieces[4].kind)
        assertEquals(PieceKind.Digit, pieces[6].kind)
        assertEquals(PieceKind.Text, pieces[0].kind)
        // The 1 is narrower than the 0: half its spare width goes before it, half after.
        assertEquals(-0.3f + 1f, pieces[5].after, 0.0001f)
        assertEquals(1f, pieces[6].after, 0.0001f)
        assertEquals(0f, pieces[7].after, 0.0001f)
        val plain = pieces("10", -0.3f, figures = false, cells = true, drawsFigure = { true }, advance = { 8f })
        assertTrue(plain.all { it.kind == PieceKind.Text })
    }

    @Test fun figureSignsAreDigitsCurrencyAndNumberSigns() {
        for (c in "0123456789$€¥£₩−-+.,%") assertTrue("$c", DS1Font.isFigureSign(c.code))
        for (c in "aZ ()") assertFalse("$c", DS1Font.isFigureSign(c.code))
        assertTrue(DS1Font.isArrow('→'.code))
        assertFalse(DS1Font.isArrow('a'.code))
    }

    @Test fun wordsFallBackAsTheWebDoes() {
        assertEquals("Gem", DS1Words.text("Save", language = DS1Language.Da))
        // nn has no table of its own and reads nb's.
        assertEquals(DS1Words.text("Save", language = DS1Language.Nb), DS1Words.text("Save", language = DS1Language.Nn))
        assertEquals("Not a shared word", DS1Words.text("Not a shared word", language = DS1Language.Da))
        assertEquals("Hello Ada", DS1Words.fill("Hello {name}", mapOf("name" to "Ada")))
        assertEquals("Hello Ada", DS1Words.fill("Hello {{name}}", mapOf("name" to "Ada")))
        DS1Words.register(mapOf("da" to mapOf("Save" to "Gem nu")))
        assertEquals("Gem nu", DS1Words.text("Save", language = DS1Language.Da))
    }

    @Test fun languagesNormalizeAsTheWebDoes() {
        assertEquals(DS1Language.Da, DS1Words.normalize("da-DK"))
        assertEquals(DS1Language.Nb, DS1Words.normalize("nb_NO"))
        assertEquals(DS1Language.PtBR, DS1Words.normalize("pt-br"))
        assertEquals(DS1Language.Nb, DS1Words.normalize("no", listOf(DS1Language.En, DS1Language.Nb)))
        assertEquals(DS1Language.PtBR, DS1Words.normalize("pt", listOf(DS1Language.PtBR)))
        assertNull(DS1Words.normalize("nl"))
    }

    @Test fun relativeTimeTakesTheWebsSteps() {
        val now = ZonedDateTime.of(2026, 10, 17, 12, 0, 0, 0, ZoneOffset.UTC)
        fun step(seconds: Long) = DS1Format.relativeStep(seconds, now.plusSeconds(seconds), now)
        assertNull(step(-30).second)
        assertEquals(-5L to DS1Format.Unit.MINUTE, step(-300))
        assertEquals(-3L to DS1Format.Unit.HOUR, step(-3 * 3600))
        assertEquals(-1L to DS1Format.Unit.DAY, step(-30 * 3600))
        assertEquals(-2L to DS1Format.Unit.WEEK, step(-14 * 86400))
        assertEquals(-3L to DS1Format.Unit.MONTH, step(-91 * 86400))
        assertEquals(-2L to DS1Format.Unit.YEAR, step(-730 * 86400))
    }

    @Test fun currencyFollowsCountryThenLanguage() {
        assertEquals("DKK", DS1Pricing.currency(DS1Language.Da))
        assertEquals("EUR", DS1Pricing.currency(DS1Language.De))
        assertEquals("GBP", DS1Pricing.currency(DS1Language.En, "GB"))
        assertEquals("USD", DS1Pricing.currency(DS1Language.En))
        assertEquals("kr.", DS1Pricing.label("DKK"))
    }

    @Test fun themeCyclesLightDarkSystem() {
        assertEquals(DS1ThemeMode.Dark, DS1ThemeMode.Light.next())
        assertEquals(DS1ThemeMode.System, DS1ThemeMode.Dark.next())
        assertEquals(DS1ThemeMode.Light, DS1ThemeMode.System.next())
        assertTrue(DS1ThemeMode.System.isDark(true))
        assertFalse(DS1ThemeMode.Light.isDark(true))
    }

    @Test fun everyIconHasItsDrawable() {
        assertTrue(DS1IconName.entries.size > 300)
        assertEquals(DS1IconName.check, DS1IconName.of("check"))
        assertEquals(DS1IconName.`open`, DS1IconName.of("open"))
    }
}
