package com.designsystem1.ds1

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import java.text.NumberFormat
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.time.temporal.ChronoUnit
import java.util.Currency
import java.util.Locale
import kotlin.math.abs
import kotlin.math.roundToLong

/**
 * Dates, numbers and money in the reader's language, as format.ts and pricing.ts on the web:
 * the same locales for each language, a date-only value staying on its day in every zone,
 * and the same steps for relative time.
 */
object DS1Format {
    /** The locale format.ts uses for each language. */
    val LOCALES: Map<DS1Language, Locale> = mapOf(
        DS1Language.Da to "da-DK", DS1Language.De to "de-DE", DS1Language.En to "en-US", DS1Language.Es to "es-ES",
        DS1Language.Fi to "fi-FI", DS1Language.Fr to "fr-FR", DS1Language.Is to "is-IS", DS1Language.It to "it-IT",
        DS1Language.Ja to "ja-JP", DS1Language.Ko to "ko-KR", DS1Language.Nb to "nb-NO", DS1Language.Nn to "nn-NO",
        DS1Language.No to "no-NO", DS1Language.Pt to "pt-PT", DS1Language.PtBR to "pt-BR", DS1Language.Sv to "sv-SE",
        DS1Language.Zh to "zh-CN",
    ).mapValues { Locale.forLanguageTag(it.value) }

    val locale: Locale get() = LOCALES[DS1Words.language] ?: Locale.US
    var zone: ZoneId = ZoneId.systemDefault()

    enum class Length(internal val style: FormatStyle) { Short(FormatStyle.SHORT), Medium(FormatStyle.MEDIUM), Long(FormatStyle.LONG) }

    fun date(date: LocalDate, length: Length = Length.Medium): String = DateTimeFormatter.ofLocalizedDate(length.style).withLocale(locale).format(date)
    fun date(instant: Instant, length: Length = Length.Medium): String = date(instant.atZone(zone).toLocalDate(), length)
    fun time(instant: Instant, length: Length = Length.Short): String = DateTimeFormatter.ofLocalizedTime(length.style).withLocale(locale).format(instant.atZone(zone))
    fun dateTime(instant: Instant, length: Length = Length.Medium): String = DateTimeFormatter.ofLocalizedDateTime(length.style, FormatStyle.SHORT).withLocale(locale).format(instant.atZone(zone))
    fun monthYear(date: LocalDate): String = DateTimeFormatter.ofPattern(android.text.format.DateFormat.getBestDateTimePattern(locale, "MMMMy"), locale).format(date)
    fun monthDay(date: LocalDate): String = DateTimeFormatter.ofPattern(android.text.format.DateFormat.getBestDateTimePattern(locale, "MMMMd"), locale).format(date)

    fun number(value: Number, digits: Int? = null): String = NumberFormat.getNumberInstance(locale).apply { if (digits != null) { minimumFractionDigits = digits; maximumFractionDigits = digits } }.format(value)
    fun percent(fraction: Double, digits: Int = 0): String = NumberFormat.getPercentInstance(locale).apply { maximumFractionDigits = digits }.format(fraction)
    fun compact(value: Long): String = android.icu.text.CompactDecimalFormat.getInstance(locale, android.icu.text.CompactDecimalFormat.CompactStyle.SHORT).format(value)
    fun list(items: List<String>): String = android.icu.text.ListFormatter.getInstance(locale).format(items)

    /**
     * An amount of money: [minor] when it is in the currency's smallest unit (øre, cents),
     * [whole] to leave out a zero fraction.
     */
    fun money(amount: Number, currency: String, minor: Boolean = false, whole: Boolean = false): String {
        val c = Currency.getInstance(currency)
        val digits = c.defaultFractionDigits.coerceAtLeast(0)
        val value = if (minor) amount.toDouble() / Math.pow(10.0, digits.toDouble()) else amount.toDouble()
        val f = NumberFormat.getCurrencyInstance(locale).apply { this.currency = c }
        if (whole && value == value.roundToLong().toDouble()) { f.minimumFractionDigits = 0; f.maximumFractionDigits = 0 }
        return f.format(value)
    }

    /**
     * How long ago or how soon, in the steps relative time takes on the web: now under 45
     * seconds, minutes under 45 minutes, hours under 22 (or the same day), days under a week
     * ("yesterday"), weeks under 26 days, months under 335 days, then years.
     */
    fun relative(instant: Instant, now: Instant = Instant.now()): String {
        val (value, unit) = relativeStep(Duration.between(now, instant).seconds, instant.atZone(zone), now.atZone(zone))
        if (android.os.Build.VERSION.SDK_INT >= 28) {
            val formatter = android.icu.text.RelativeDateTimeFormatter.getInstance(android.icu.util.ULocale.forLocale(locale))
            if (unit == null) return formatter.format(android.icu.text.RelativeDateTimeFormatter.Direction.PLAIN, android.icu.text.RelativeDateTimeFormatter.AbsoluteUnit.NOW)
            return formatter.formatNumeric(value.toDouble(), android.icu.text.RelativeDateTimeFormatter.RelativeDateTimeUnit.valueOf(unit.name))
        }
        if (unit == null) return DS1Words.text("now")
        return android.text.format.DateUtils.getRelativeTimeSpanString(instant.toEpochMilli(), now.toEpochMilli(), unit.millis).toString()
    }

    /** The steps of relative time, and how long each lasts in milliseconds. */
    enum class Unit(internal val millis: Long) { MINUTE(60_000), HOUR(3_600_000), DAY(86_400_000), WEEK(604_800_000), MONTH(2_629_746_000), YEAR(31_556_952_000) }

    /** The step and its signed count, or a null unit for "now". */
    internal fun relativeStep(seconds: Long, then: ZonedDateTime, now: ZonedDateTime): Pair<Long, Unit?> {
        val a = abs(seconds)
        val sign = if (seconds < 0) -1 else 1
        val sameDay = then.toLocalDate() == now.toLocalDate()
        val days = ChronoUnit.DAYS.between(now.toLocalDate(), then.toLocalDate())
        return when {
            a < 45 -> 0L to null
            a < 45 * 60 -> sign * Math.round(a / 60.0) to Unit.MINUTE
            a < 22 * 3600 || sameDay -> sign * Math.round(a / 3600.0) to Unit.HOUR
            abs(days) < 7 -> days to Unit.DAY
            abs(days) < 26 -> sign * Math.round(abs(days) / 7.0) to Unit.WEEK
            abs(days) < 335 -> sign * Math.round(abs(days) / 30.44) to Unit.MONTH
            else -> sign * Math.round(abs(days) / 365.25) to Unit.YEAR
        }
    }
}

/** Prices in the reader's currency, as pricing.ts: the country wins over the language, else US dollars. */
object DS1Pricing {
    private val BY_LANGUAGE = mapOf(
        "da" to "DKK", "de" to "EUR", "es" to "EUR", "fi" to "EUR", "fr" to "EUR", "it" to "EUR", "pt" to "EUR",
        "en" to "USD", "is" to "ISK", "ja" to "JPY", "ko" to "KRW", "nb" to "NOK", "nn" to "NOK", "no" to "NOK",
        "pt-BR" to "BRL", "sv" to "SEK", "zh" to "CNY",
    )
    private val BY_COUNTRY = mapOf("US" to "USD", "GB" to "GBP", "UK" to "GBP", "JP" to "JPY", "CN" to "CNY", "KR" to "KRW")
    private val LABELS = mapOf("DKK" to "kr.", "NOK" to "kr.", "SEK" to "kr.", "ISK" to "kr.", "EUR" to "€", "USD" to "$", "GBP" to "£", "JPY" to "¥", "CNY" to "¥", "KRW" to "₩", "BRL" to "R$")

    fun currency(language: DS1Language = DS1Words.language, country: String? = null): String =
        country?.uppercase()?.let { BY_COUNTRY[it] } ?: BY_LANGUAGE[language.code] ?: "USD"

    fun label(currency: String): String = LABELS[currency] ?: currency

    fun price(amount: Number, currency: String = currency(), minor: Boolean = false): String = DS1Format.money(amount, currency, minor, whole = true)
}

/** Copies text, as `copyText()`: the clipboard, then "Copied" or "Could not copy" as a toast. */
object DS1Clipboard {
    fun copy(context: Context, text: String, toast: Boolean = true): Boolean {
        val ok = runCatching {
            (context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText(null, text))
        }.isSuccess
        if (toast) if (ok) DS1Toast.success(DS1Words.text("Copied")) else DS1Toast.error(DS1Words.text("Could not copy"))
        return ok
    }
}
