/**
 * Dates, times, numbers, money and lists written the way the reader's
 * language writes them, through the platform's `Intl` formatters.
 *
 * Every function formats in the current language (`currentLanguage.value`
 * from `./i18n`), read again on every call, so the text drawn after a
 * language change is in the new language. Pass `language` to format in
 * another one: a server answering a request names the request's language,
 * since its current language is nobody's in particular.
 *
 * Each formatter is made once per locale and options, then kept. No browser
 * code: it runs in a Worker, Node or a test as it does in a page.
 */
import { currentLanguage } from "./i18n";
import { DEFAULT_LANGUAGE, LANGUAGES, normalizeLanguage } from "./languages";
import type { Language } from "./languages";

// ============================================================================
// Locales
// ============================================================================

/**
 * The locale each language of the list formats in: the language with the
 * region it is most read in. `pt` is Portugal's Portuguese and `pt-BR`
 * Brazil's; `Intl` alone reads a bare `pt` as Brazil's.
 */
export const LOCALE_TAGS: Readonly<Record<Language, string>> = {
  da: "da-DK",
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fi: "fi-FI",
  fr: "fr-FR",
  is: "is-IS",
  it: "it-IT",
  ja: "ja-JP",
  ko: "ko-KR",
  nb: "nb-NO",
  nn: "nn-NO",
  no: "no-NO",
  pt: "pt-PT",
  "pt-BR": "pt-BR",
  sv: "sv-SE",
  zh: "zh-CN",
};

export type FormatSettings = {
  /**
   * The locale a language formats in, where a product's readers expect
   * another region than `LOCALE_TAGS` gives: `{ en: "en-GB" }` writes
   * English dates day first.
   */
  locales?: Partial<Record<string, string>>;
  /**
   * The time zone dates and times are shown in, unless a call names one.
   * Without it, the runtime's own zone (a Worker's is UTC).
   */
  timeZone?: string;
};

let settings: FormatSettings = {};

/** Each language or tag asked for, to the locale it formats in. */
const resolvedTags = new Map<string, string>();

/** Set the locales and time zone every call starts from (see `FormatSettings`). */
export function configureFormat(next: FormatSettings): void {
  settings = {
    ...settings,
    ...next,
    locales: { ...settings.locales, ...next.locales },
  };
  resolvedTags.clear();
}

function canonical(tag: string): string | null {
  try {
    return Intl.getCanonicalLocales(tag)[0] ?? null;
  } catch {
    return null;
  }
}

function regional(language: Language): string {
  const own = settings.locales?.[language];
  return (own && canonical(own)) || LOCALE_TAGS[language];
}

/**
 * The locale tag a language formats in: `da` gives `da-DK`, `pt` gives
 * `pt-PT`, `pt-br` gives `pt-BR`. A tag with its own region or script keeps
 * it (`en-GB`, `zh-Hant`), and a language outside the list passes through
 * (`nl`). Without an argument, the current language's.
 */
export function localeTag(language?: string | null): string {
  const tag = String(language || currentLanguage.value || "")
    .trim()
    .replace(/_/g, "-");
  let resolved = resolvedTags.get(tag);
  if (!resolved) {
    resolved = resolveTag(tag);
    // Tags come from a short list; a server reading arbitrary ones starts over
    if (resolvedTags.size >= MAX_FORMATTERS) {
      resolvedTags.clear();
    }
    resolvedTags.set(tag, resolved);
  }
  return resolved;
}

function resolveTag(tag: string): string {
  if (!tag) {
    return regional(DEFAULT_LANGUAGE);
  }

  const lower = tag.toLowerCase();
  const member = LANGUAGES.find((code) => code.toLowerCase() === lower);
  if (member) {
    return regional(member);
  }

  // A tag of its own, when the runtime has its conventions (not the
  // runtime's default standing in for one it lacks)
  const written = canonical(tag);
  if (written && supported(written)) {
    return written;
  }

  // Otherwise the list's language it names, else the default
  const known = normalizeLanguage(tag, null);
  return regional(known ?? DEFAULT_LANGUAGE);
}

function supported(tag: string): boolean {
  try {
    return Intl.NumberFormat.supportedLocalesOf([tag]).length > 0;
  } catch {
    return false;
  }
}

// ============================================================================
// Kept formatters
// ============================================================================

type WithLanguage = {
  /** The language to format in, instead of the current one: a code of the list or any locale tag. */
  language?: string;
};

const MAX_FORMATTERS = 256;
const formatters = new Map<string, unknown>();

function optionsKey(options: object): string {
  const entries = Object.entries(options).filter(
    ([, value]) => value !== undefined
  );
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify(entries);
}

function kept<T>(
  kind: string,
  locale: string,
  options: object,
  make: () => T
): T {
  const key = `${kind}|${locale}|${optionsKey(options)}`;
  if (formatters.has(key)) {
    return formatters.get(key) as T;
  }
  if (formatters.size >= MAX_FORMATTERS) {
    // The oldest goes first
    const oldest = formatters.keys().next();
    if (!oldest.done) {
      formatters.delete(oldest.value);
    }
  }
  const formatter = make();
  formatters.set(key, formatter);
  return formatter;
}

function split<T extends WithLanguage>(
  options: T
): [string, Omit<T, "language">] {
  const { language, ...rest } = options;
  return [localeTag(language), rest];
}

/**
 * The kept `Intl.DateTimeFormat` for any options the named functions do not
 * cover (`{ weekday: "short" }`), in the current language or `language`. The
 * time zone set with `configureFormat` applies unless the options name one.
 */
export function dateFormatter(
  options: Intl.DateTimeFormatOptions & WithLanguage = {}
): Intl.DateTimeFormat {
  const [locale, rest] = split(options);
  const resolved: Intl.DateTimeFormatOptions = {
    ...rest,
    timeZone: rest.timeZone ?? settings.timeZone,
  };
  return kept("date", locale, resolved, () => new Intl.DateTimeFormat(locale, resolved));
}

/** The kept `Intl.NumberFormat` for any options, in the current language or `language`. */
export function numberFormatter(
  options: Intl.NumberFormatOptions & WithLanguage = {}
): Intl.NumberFormat {
  const [locale, rest] = split(options);
  return kept("number", locale, rest, () => new Intl.NumberFormat(locale, rest));
}

/** The kept `Intl.RelativeTimeFormat`, in the current language or `language`. */
export function relativeTimeFormatter(
  options: Intl.RelativeTimeFormatOptions & WithLanguage = {}
): Intl.RelativeTimeFormat {
  const [locale, rest] = split(options);
  return kept(
    "relative",
    locale,
    rest,
    () => new Intl.RelativeTimeFormat(locale, rest)
  );
}

export type ListType = "conjunction" | "disjunction" | "unit";
export type ListStyle = "long" | "short" | "narrow";

/** What `Intl.ListFormat` offers, for runtimes whose types predate it. */
export type ListFormatter = {
  format(items: Iterable<string>): string;
};

type ListFormatConstructor = new (
  locale: string,
  options: { type?: ListType; style?: ListStyle }
) => ListFormatter;

/** The kept `Intl.ListFormat`, in the current language or `language`. */
export function listFormatter(
  options: { type?: ListType; style?: ListStyle } & WithLanguage = {}
): ListFormatter {
  const [locale, rest] = split(options);
  return kept("list", locale, rest, () => {
    const ListFormat = (Intl as unknown as { ListFormat?: ListFormatConstructor })
      .ListFormat;
    // A runtime without it joins with commas, as English would
    return ListFormat
      ? new ListFormat(locale, rest)
      : { format: (items: Iterable<string>) => [...items].join(", ") };
  });
}

// ============================================================================
// Dates and times
// ============================================================================

/**
 * A moment: a `Date`, milliseconds since 1970 or a date string. A date
 * written without a time (`2026-10-17`) is that day wherever it is read.
 */
export type DateInput = Date | number | string;

export type DateLength = "short" | "medium" | "long";

export type DateOptions = WithLanguage & {
  /** How much is written: `short` (10/17/26), `medium` (Oct 17, 2026) or `long` (October 17, 2026). */
  length?: DateLength;
  /** The time zone to show it in (`Asia/Tokyo`, `UTC`). */
  timeZone?: string;
};

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The moment, and whether it is a day without a time. */
function readDate(value: DateInput): { time: number; day: boolean } {
  if (typeof value === "string") {
    const day = DATE_ONLY.exec(value.trim());
    if (day) {
      return {
        time: Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3])),
        day: true,
      };
    }
    return { time: Date.parse(value), day: false };
  }
  return {
    time: value instanceof Date ? value.getTime() : Number(value),
    day: false,
  };
}

function dateArguments(
  options: DateOptions | DateLength | undefined,
  fallback: DateLength
): DateOptions & { length: DateLength } {
  if (typeof options === "string") {
    return { length: options };
  }
  return { ...options, length: options?.length ?? fallback };
}

function formatMoment(
  value: DateInput,
  parts: Intl.DateTimeFormatOptions,
  { language, timeZone }: DateOptions
): string {
  const { time, day } = readDate(value);
  if (!Number.isFinite(time)) {
    return "";
  }
  // A day without a time is kept on its own date in every zone
  const zone = day ? "UTC" : timeZone;
  return dateFormatter({ ...parts, timeZone: zone, language }).format(time);
}

/** A date: `Oct 17, 2026` (medium, the default), `10/17/26` (short), `October 17, 2026` (long). */
export function formatDate(
  value: DateInput,
  options?: DateOptions | DateLength
): string {
  const { length, ...rest } = dateArguments(options, "medium");
  return formatMoment(value, { dateStyle: length }, rest);
}

/** A time of day: `2:30 PM` (short, the default), `2:30:05 PM` (medium), `2:30:05 PM UTC` (long). */
export function formatTime(
  value: DateInput,
  options?: DateOptions | DateLength
): string {
  const { length, ...rest } = dateArguments(options, "short");
  return formatMoment(value, { timeStyle: length }, rest);
}

/** A date at a time: the date at `length` (medium by default), the time to the minute. */
export function formatDateTime(
  value: DateInput,
  options?: DateOptions | DateLength
): string {
  const { length, ...rest } = dateArguments(options, "medium");
  return formatMoment(value, { dateStyle: length, timeStyle: "short" }, rest);
}

const MONTH: Record<DateLength, "numeric" | "short" | "long"> = {
  short: "numeric",
  medium: "short",
  long: "long",
};

/** A month of a year: `October 2026` (long, the default), `Oct 2026` (medium), `10/2026` (short). */
export function formatMonthYear(
  value: DateInput,
  options?: DateOptions | DateLength
): string {
  const { length, ...rest } = dateArguments(options, "long");
  return formatMoment(value, { year: "numeric", month: MONTH[length] }, rest);
}

/** A day of a month, without the year: `Oct 17` (medium, the default), `10/17` (short), `October 17` (long). */
export function formatMonthDay(
  value: DateInput,
  options?: DateOptions | DateLength
): string {
  const { length, ...rest } = dateArguments(options, "medium");
  return formatMoment(value, { month: MONTH[length], day: "numeric" }, rest);
}

// ============================================================================
// Relative time
// ============================================================================

export type RelativeUnit =
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year";

export type RelativeTimeOptions = WithLanguage & {
  /** The moment it is measured from. Defaults to now. */
  now?: DateInput;
  /** Always count in this unit, rather than the one that reads best. */
  unit?: RelativeUnit;
  /** `auto` (the default) writes "yesterday" and "now"; `always` writes "1 day ago". */
  numeric?: "auto" | "always";
  /** `long` (the default), `short` ("3 min. ago") or `narrow`. */
  style?: "long" | "short" | "narrow";
  /** The zone whose calendar decides what "yesterday" is. Defaults as dates do. */
  timeZone?: string;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH_DAYS = 30.436875;
const YEAR_DAYS = 365.2425;

const UNIT_LENGTH: Record<RelativeUnit, number> = {
  second: SECOND,
  minute: MINUTE,
  hour: HOUR,
  day: DAY,
  week: 7 * DAY,
  month: MONTH_DAYS * DAY,
  quarter: 3 * MONTH_DAYS * DAY,
  year: YEAR_DAYS * DAY,
};

/** The calendar day a moment falls on in a zone, counted from 1970. */
function dayNumber(time: number, timeZone: string | undefined): number {
  if (!timeZone) {
    const date = new Date(time);
    return Math.round(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY
    );
  }
  const parts = kept(
    "calendar",
    "en-US",
    { timeZone },
    () =>
      new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
        timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
      })
  ).formatToParts(time);
  const part = (type: string) =>
    Number(parts.find((entry) => entry.type === type)?.value);
  return Math.round(Date.UTC(part("year"), part("month") - 1, part("day")) / DAY);
}

/**
 * The count and unit a moment reads best in, from `now`: under 45 seconds is
 * now, under 45 minutes counts minutes, under 22 hours (or the same day)
 * hours, under a week calendar days (so "yesterday" is the day before
 * today), under 26 days weeks, under 335 days months, then years. A day
 * without a time (`2026-10-17`) counts days from today. Negative counts are
 * in the past.
 */
export function relativeTimeUnit(
  value: DateInput,
  now: DateInput = Date.now(),
  timeZone: string | undefined = settings.timeZone
): [number, RelativeUnit] {
  const { time: at, day } = readDate(value);
  const from = readDate(now).time;
  const elapsed = at - from;
  const size = Math.abs(elapsed);
  const sign = elapsed < 0 ? -1 : 1;

  if (day) {
    // A day without a time is counted in days from today: "today", "yesterday"
    const days = Math.round(at / DAY) - dayNumber(from, timeZone);
    return days === 0 ? [0, "day"] : inDays(days);
  }
  if (size < 45 * SECOND) {
    // -0 keeps the past's wording where a count is written ("0 seconds ago")
    return [elapsed < 0 ? -0 : 0, "second"];
  }
  if (size < 45 * MINUTE) {
    return [sign * Math.max(1, Math.round(size / MINUTE)), "minute"];
  }
  const days = dayNumber(at, timeZone) - dayNumber(from, timeZone);
  if (size < 22 * HOUR || days === 0) {
    return [sign * Math.max(1, Math.round(size / HOUR)), "hour"];
  }
  return inDays(days);
}

/** A count of calendar days (never 0) in the unit it reads best in. */
function inDays(days: number): [number, RelativeUnit] {
  const whole = Math.abs(days);
  const sign = days < 0 ? -1 : 1;
  if (whole < 7) {
    return [days, "day"];
  }
  if (whole < 26) {
    return [sign * Math.round(whole / 7), "week"];
  }
  if (whole < 335) {
    return [sign * Math.max(1, Math.round(whole / MONTH_DAYS)), "month"];
  }
  return [sign * Math.max(1, Math.round(whole / YEAR_DAYS)), "year"];
}

/**
 * How long ago or how far ahead a moment is: "3 minutes ago", "yesterday",
 * "in 2 days", "now", in the unit that reads best (see `relativeTimeUnit`)
 * or the one given.
 */
export function formatRelativeTime(
  value: DateInput,
  options: RelativeTimeOptions = {}
): string {
  const { now = Date.now(), unit, numeric = "auto", style = "long", language } =
    options;
  const timeZone = options.timeZone ?? settings.timeZone;
  const at = readDate(value).time;
  const from = readDate(now).time;
  if (!Number.isFinite(at) || !Number.isFinite(from)) {
    return "";
  }
  const [count, chosen] = unit
    ? [Math.round((at - from) / UNIT_LENGTH[unit]), unit]
    : relativeTimeUnit(value, from, timeZone);
  return relativeTimeFormatter({ numeric, style, language }).format(count, chosen);
}

// ============================================================================
// Numbers
// ============================================================================

export type NumberOptions = WithLanguage & Intl.NumberFormatOptions;

/** A number with the language's separators: `1,234.5`, `1.234,5`. Any `Intl.NumberFormat` option applies. */
export function formatNumber(value: number | bigint, options: NumberOptions = {}): string {
  return numberFormatter(options).format(value);
}

/** A number in short: `12K`, `1.2M`, `1,2 mio.`, `1.2万`, to one decimal unless the options say otherwise. */
export function formatCompact(value: number | bigint, options: NumberOptions = {}): string {
  return numberFormatter({
    notation: "compact",
    maximumFractionDigits: 1,
    ...options,
  }).format(value);
}

/** A fraction as a percentage: `0.25` gives `25%` (`25 %` in Danish). */
export function formatPercent(value: number, options: NumberOptions = {}): string {
  return numberFormatter({ style: "percent", ...options }).format(value);
}

// ============================================================================
// Money
// ============================================================================

export type CurrencyDisplay = "symbol" | "narrowSymbol" | "code" | "name";

export type MoneyOptions = WithLanguage &
  Omit<Intl.NumberFormatOptions, "style" | "currency" | "currencyDisplay"> & {
    /**
     * The amount is counted in the currency's minor unit, as payment
     * services send it: 1999 is $19.99, and 1999 yen are 1999 yen.
     */
    minor?: boolean;
    /** The currency as its symbol (`$`, the default), its narrow symbol, its code (`USD`) or its name. */
    display?: CurrencyDisplay;
    /** Whole units only, rounded: `$20`. */
    whole?: boolean;
  };

function currencyCode(currency: string): string {
  return String(currency ?? "").trim().toUpperCase();
}

/**
 * How many decimals a currency's minor unit has, as ISO 4217 counts them:
 * 2 for USD, EUR and DKK, 0 for JPY and KRW, 3 for BHD. 2 for a code the
 * runtime does not know.
 */
export function currencyDigits(currency: string): number {
  const code = currencyCode(currency);
  try {
    return kept(
      "digits",
      "en",
      { currency: code },
      () => new Intl.NumberFormat("en", { style: "currency", currency: code })
    ).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** An amount in minor units as whole units: 1999 cents are 19.99 dollars; yen stay as they are. */
export function fromMinorUnits(amount: number, currency: string): number {
  return amount / 10 ** currencyDigits(currency);
}

/** An amount in whole units as minor units, rounded: 19.99 dollars are 1999 cents. */
export function toMinorUnits(amount: number, currency: string): number {
  return Math.round(amount * 10 ** currencyDigits(currency));
}

function moneyFormatter(
  currency: string,
  options: MoneyOptions
): { format: Intl.NumberFormat | null; value: (amount: number) => number; code: string; digits: number } {
  const { minor, display = "symbol", whole, language, ...rest } = options;
  const code = currencyCode(currency);
  const digits = currencyDigits(code);
  const value = (amount: number) => (minor ? amount / 10 ** digits : amount);
  try {
    const format = numberFormatter({
      ...rest,
      ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
      style: "currency",
      currency: code,
      currencyDisplay: display,
      language,
    });
    return { format, value, code, digits };
  } catch {
    return { format: null, value, code, digits };
  }
}

/**
 * An amount of money in the language's way: `$1,234.50`, `1.234,50 kr.`,
 * `￥1,235`. The currency decides the decimals (none for yen). With `minor`,
 * the amount is in cents, øre or the like. A currency code that is not one
 * (not three letters) is written after the number (`12.00 US`) rather than
 * throwing.
 */
export function formatMoney(
  amount: number,
  currency: string,
  options: MoneyOptions = {}
): string {
  const { format, value, code, digits } = moneyFormatter(currency, options);
  if (format) {
    return format.format(value(amount));
  }
  const places = options.whole ? 0 : digits;
  return `${formatNumber(value(amount), {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
    language: options.language,
  })} ${code}`;
}

/**
 * The parts of `formatMoney`'s text, as `Intl.NumberFormat.formatToParts`
 * gives them (`currency`, `integer`, `group`, `decimal`, `fraction`, …), for
 * drawing digits apart from the rest, each in a cell of its own width.
 */
export function formatMoneyToParts(
  amount: number,
  currency: string,
  options: MoneyOptions = {}
): Intl.NumberFormatPart[] {
  const { format, value } = moneyFormatter(currency, options);
  if (format) {
    return format.formatToParts(value(amount));
  }
  return [{ type: "literal", value: formatMoney(amount, currency, options) }];
}

/** The symbol the language writes a currency with: `$`, `kr.`, `€`, `US$` in British English. */
export function currencySymbol(
  currency: string,
  options: WithLanguage & { display?: "symbol" | "narrowSymbol" } = {}
): string {
  const parts = formatMoneyToParts(0, currency, options);
  return parts.find((part) => part.type === "currency")?.value ?? currencyCode(currency);
}

// ============================================================================
// Lists
// ============================================================================

export type ListOptions = WithLanguage & {
  /** `conjunction` (the default) joins with "and", `disjunction` with "or", `unit` with neither. */
  type?: ListType;
  /** `long` (the default), `short` or `narrow`. */
  style?: ListStyle;
};

/** Items joined the language's way: `A, B, and C`, `A, B og C`, `A、B、C`. */
export function formatList(items: Iterable<string>, options: ListOptions = {}): string {
  const { type = "conjunction", style = "long", language } = options;
  return listFormatter({ type, style, language }).format(
    Array.from(items, (item) => String(item))
  );
}
