import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

type Format = typeof import("../DS1/0-face/format");
type I18n = typeof import("../DS1/0-face/i18n");
type Pricing = typeof import("../DS1/0-face/pricing");

/** A fresh copy of the modules, so settings and the language start over. */
async function load(): Promise<{ format: Format; i18n: I18n; pricing: Pricing }> {
  vi.resetModules();
  const i18n = await import("../DS1/0-face/i18n");
  const format = await import("../DS1/0-face/format");
  const pricing = await import("../DS1/0-face/pricing");
  i18n.setLanguage("en");
  return { format, i18n, pricing };
}

/** Intl separates some parts with no-break spaces; compare them as plain ones. */
const plain = (text: string) => text.replace(/[  ]/g, " ");

const MOMENT = Date.UTC(2026, 9, 17, 14, 30, 5); // Saturday 17 October 2026, 14:30:05 UTC
const UTC = { timeZone: "UTC" } as const;

let format: Format;
let i18n: I18n;
let pricing: Pricing;

beforeEach(async () => {
  ({ format, i18n, pricing } = await load());
});

describe("locale tags", () => {
  test("give each language of the list its region", () => {
    expect(format.localeTag("da")).toBe("da-DK");
    expect(format.localeTag("ja")).toBe("ja-JP");
    expect(format.localeTag("en")).toBe("en-US");
    expect(format.localeTag("nb")).toBe("nb-NO");
    expect(format.localeTag("no")).toBe("no-NO");
    expect(format.localeTag("zh")).toBe("zh-CN");
  });

  test("tell Portugal's Portuguese from Brazil's", () => {
    expect(format.localeTag("pt")).toBe("pt-PT");
    expect(format.localeTag("pt-BR")).toBe("pt-BR");
    expect(format.localeTag("pt-br")).toBe("pt-BR");
    expect(format.formatDate(MOMENT, { language: "pt", ...UTC })).not.toBe(
      format.formatDate(MOMENT, { language: "pt-BR", ...UTC })
    );
  });

  test("keep a region or script given, and pass other languages through", () => {
    expect(format.localeTag("en-GB")).toBe("en-GB");
    expect(format.localeTag("da_DK")).toBe("da-DK");
    expect(format.localeTag("zh-hant")).toBe("zh-Hant");
    expect(format.localeTag("nl")).toBe("nl");
    expect(format.localeTag("not a language")).toBe("en-US");
  });

  test("follow the current language when none is given", () => {
    i18n.setLanguage("ja");
    expect(format.localeTag()).toBe("ja-JP");
    i18n.setLanguage("pt-BR");
    expect(format.localeTag()).toBe("pt-BR");
  });

  test("take a product's own region for a language", () => {
    format.configureFormat({ locales: { en: "en-GB" } });
    expect(format.localeTag("en")).toBe("en-GB");
    expect(format.localeTag("en-US")).toBe("en-US");
    expect(format.formatDate(MOMENT, { language: "en", ...UTC })).toBe("17 Oct 2026");
  });
});

describe("dates and times", () => {
  test("come in three lengths, in each language's order", () => {
    const en = { language: "en", ...UTC };
    expect(format.formatDate(MOMENT, { ...en, length: "short" })).toBe("10/17/26");
    expect(format.formatDate(MOMENT, en)).toBe("Oct 17, 2026");
    expect(format.formatDate(MOMENT, { ...en, length: "long" })).toBe("October 17, 2026");

    expect(format.formatDate(MOMENT, { language: "da", ...UTC })).toBe("17. okt. 2026");
    expect(format.formatDate(MOMENT, { language: "da", length: "long", ...UTC })).toBe("17. oktober 2026");
    expect(format.formatDate(MOMENT, { language: "ja", ...UTC })).toBe("2026/10/17");
    expect(format.formatDate(MOMENT, { language: "ja", length: "long", ...UTC })).toBe("2026年10月17日");
  });

  test("write times to the minute by default", () => {
    expect(plain(format.formatTime(MOMENT, { language: "en", ...UTC }))).toBe("2:30 PM");
    expect(plain(format.formatTime(MOMENT, { language: "en", length: "medium", ...UTC }))).toBe("2:30:05 PM");
    expect(format.formatTime(MOMENT, { language: "da", ...UTC })).toBe("14.30");
    expect(format.formatTime(MOMENT, { language: "ja", ...UTC })).toBe("14:30");
  });

  test("put a date and a time together", () => {
    expect(plain(format.formatDateTime(MOMENT, { language: "en", ...UTC }))).toBe("Oct 17, 2026, 2:30 PM");
    expect(format.formatDateTime(MOMENT, { language: "ja", length: "long", ...UTC })).toBe("2026年10月17日 14:30");
  });

  test("write a month of a year, and a day of a month", () => {
    expect(format.formatMonthYear(MOMENT, { language: "en", ...UTC })).toBe("October 2026");
    expect(format.formatMonthYear(MOMENT, { language: "da", ...UTC })).toBe("oktober 2026");
    expect(format.formatMonthYear(MOMENT, { language: "ja", ...UTC })).toBe("2026年10月");
    expect(format.formatMonthYear(MOMENT, { language: "en", length: "medium", ...UTC })).toBe("Oct 2026");
    expect(format.formatMonthDay(MOMENT, { language: "en", ...UTC })).toBe("Oct 17");
    expect(format.formatMonthDay(MOMENT, { language: "da", ...UTC })).toBe("17. okt.");
    expect(format.formatMonthDay(MOMENT, { language: "ja", ...UTC })).toBe("10月17日");
  });

  test("take a length alone as the second argument", () => {
    i18n.setLanguage("en");
    format.configureFormat({ timeZone: "UTC" });
    expect(format.formatDate(MOMENT, "long")).toBe("October 17, 2026");
  });

  test("keep a date without a time on its own day in every zone", () => {
    for (const timeZone of ["America/Los_Angeles", "Pacific/Kiritimati", "Asia/Tokyo"]) {
      expect(format.formatDate("2026-10-17", { language: "en", timeZone })).toBe("Oct 17, 2026");
    }
  });

  test("show the configured time zone, unless a call names one", () => {
    format.configureFormat({ timeZone: "Asia/Tokyo" });
    expect(plain(format.formatTime(MOMENT, { language: "en" }))).toBe("11:30 PM");
    expect(plain(format.formatTime(MOMENT, { language: "en", timeZone: "UTC" }))).toBe("2:30 PM");
  });

  test("write nothing for a moment that is not one", () => {
    expect(format.formatDate("not a date", { language: "en" })).toBe("");
    expect(format.formatDate(Number.NaN, { language: "en" })).toBe("");
  });
});

describe("relative time", () => {
  const NOW = Date.UTC(2026, 9, 17, 10, 0, 0);
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const ago = (ms: number, options: Parameters<Format["formatRelativeTime"]>[1] = {}) =>
    format.formatRelativeTime(NOW - ms, { now: NOW, language: "en", ...UTC, ...options });

  test("reads now under 45 seconds, then minutes", () => {
    expect(ago(0)).toBe("now");
    expect(ago(44 * SECOND)).toBe("now");
    expect(ago(45 * SECOND)).toBe("1 minute ago");
    expect(ago(3 * MINUTE)).toBe("3 minutes ago");
    expect(ago(44 * MINUTE)).toBe("44 minutes ago");
  });

  test("counts hours from 45 minutes, and calendar days from 22 hours", () => {
    expect(ago(45 * MINUTE)).toBe("1 hour ago");
    expect(ago(21 * HOUR + 59 * MINUTE)).toBe("22 hours ago");
    expect(ago(22 * HOUR)).toBe("yesterday");
    expect(ago(2 * DAY)).toBe("2 days ago");
  });

  test("keeps hours within the same day, and days by the calendar", () => {
    const late = Date.UTC(2026, 9, 17, 23, 30);
    expect(format.formatRelativeTime(late - 23 * HOUR, { now: late, language: "en", ...UTC })).toBe("23 hours ago");
    // 22.5 hours before 23:00 in Tokyo is the same day there, and yesterday in UTC
    const at = Date.UTC(2026, 9, 16, 15, 30);
    const now = Date.UTC(2026, 9, 17, 14, 0);
    expect(format.formatRelativeTime(at, { now, language: "en", timeZone: "UTC" })).toBe("yesterday");
    expect(format.formatRelativeTime(at, { now, language: "en", timeZone: "Asia/Tokyo" })).toBe("23 hours ago");
  });

  test("moves to weeks, months and years at their boundaries", () => {
    expect(ago(6 * DAY)).toBe("6 days ago");
    expect(ago(7 * DAY)).toBe("last week");
    expect(ago(25 * DAY)).toBe("4 weeks ago");
    expect(ago(26 * DAY)).toBe("last month");
    expect(ago(334 * DAY)).toBe("11 months ago");
    expect(ago(335 * DAY)).toBe("last year");
    expect(ago(800 * DAY)).toBe("2 years ago");
  });

  test("reads ahead as well as behind", () => {
    expect(ago(-DAY)).toBe("tomorrow");
    expect(ago(-2 * DAY)).toBe("in 2 days");
    expect(ago(-5 * MINUTE)).toBe("in 5 minutes");
  });

  test("writes counts throughout with numeric always", () => {
    expect(ago(DAY, { numeric: "always" })).toBe("1 day ago");
    expect(ago(10 * SECOND, { numeric: "always" })).toBe("0 seconds ago");
  });

  test("counts in a unit given", () => {
    expect(ago(2 * DAY, { unit: "day" })).toBe("2 days ago");
    expect(ago(90 * MINUTE, { unit: "minute" })).toBe("90 minutes ago");
  });

  test("counts a date without a time in days from today", () => {
    const now = Date.UTC(2026, 9, 17, 1, 0);
    expect(format.formatRelativeTime("2026-10-17", { now, language: "en", ...UTC })).toBe("today");
    expect(format.formatRelativeTime("2026-10-16", { now, language: "en", ...UTC })).toBe("yesterday");
    expect(format.formatRelativeTime("2026-10-20", { now, language: "en", ...UTC })).toBe("in 3 days");
  });

  test("is written in each language", () => {
    expect(plain(ago(3 * MINUTE, { language: "ja" }))).toBe("3 分前");
    expect(ago(3 * MINUTE, { language: "da" })).toBe("for 3 minutter siden");
    expect(ago(DAY, { language: "da" })).toBe("i går");
    expect(plain(ago(3 * MINUTE, { style: "short" }))).toBe("3 min. ago");
  });
});

describe("numbers", () => {
  test("use each language's separators", () => {
    expect(format.formatNumber(1234.5, { language: "en" })).toBe("1,234.5");
    expect(format.formatNumber(1234.5, { language: "da" })).toBe("1.234,5");
    expect(format.formatNumber(1234.5, { language: "ja" })).toBe("1,234.5");
    expect(format.formatNumber(2, { language: "en", minimumFractionDigits: 2 })).toBe("2.00");
  });

  test("write large numbers in short", () => {
    expect(format.formatCompact(12345, { language: "en" })).toBe("12.3K");
    expect(format.formatCompact(1234567, { language: "en" })).toBe("1.2M");
    expect(format.formatCompact(12345, { language: "ja" })).toBe("1.2万");
  });

  test("write fractions as percentages", () => {
    expect(format.formatPercent(0.256, { language: "en" })).toBe("26%");
    expect(plain(format.formatPercent(0.256, { language: "da" }))).toBe("26 %");
    expect(format.formatPercent(0.256, { language: "en", maximumFractionDigits: 1 })).toBe("25.6%");
  });
});

describe("money", () => {
  test("writes each currency with its own decimals", () => {
    expect(format.formatMoney(1234.5, "USD", { language: "en" })).toBe("$1,234.50");
    expect(plain(format.formatMoney(1234.5, "DKK", { language: "da" }))).toBe("1.234,50 kr.");
    expect(format.formatMoney(1234, "JPY", { language: "en" })).toBe("¥1,234");
    expect(format.formatMoney(1234, "JPY", { language: "ja" })).toBe("￥1,234");
    expect(format.formatMoney(1234.6, "JPY", { language: "en" })).toBe("¥1,235");
  });

  test("knows each currency's minor unit", () => {
    expect(format.currencyDigits("USD")).toBe(2);
    expect(format.currencyDigits("dkk")).toBe(2);
    expect(format.currencyDigits("JPY")).toBe(0);
    expect(format.currencyDigits("KRW")).toBe(0);
    expect(format.currencyDigits("BHD")).toBe(3);
    expect(format.fromMinorUnits(1999, "USD")).toBe(19.99);
    expect(format.fromMinorUnits(1999, "JPY")).toBe(1999);
    expect(format.toMinorUnits(19.99, "USD")).toBe(1999);
    expect(format.toMinorUnits(1999, "JPY")).toBe(1999);
  });

  test("reads amounts in minor units when asked", () => {
    expect(format.formatMoney(1999, "USD", { minor: true, language: "en" })).toBe("$19.99");
    expect(format.formatMoney(1999, "usd", { minor: true, language: "en" })).toBe("$19.99");
    expect(format.formatMoney(1999, "JPY", { minor: true, language: "en" })).toBe("¥1,999");
    expect(plain(format.formatMoney(1234, "BHD", { minor: true, language: "en" }))).toBe("BHD 1.234");
  });

  test("writes the currency as a code, a symbol or in whole units", () => {
    expect(plain(format.formatMoney(12, "USD", { display: "code", language: "en" }))).toBe("USD 12.00");
    expect(plain(format.formatMoney(1000.5, "DKK", { display: "code", language: "da" }))).toBe("1.000,50 DKK");
    expect(format.formatMoney(12, "USD", { language: "en-GB" })).toBe("US$12.00");
    expect(format.formatMoney(12, "USD", { display: "narrowSymbol", language: "en-GB" })).toBe("$12.00");
    expect(format.formatMoney(19.99, "USD", { whole: true, language: "en" })).toBe("$20");
  });

  test("writes a code the runtime does not read after the number", () => {
    expect(format.formatMoney(12, "US", { language: "en" })).toBe("12.00 US");
  });

  test("gives its parts, for drawing the digits apart", () => {
    const parts = format.formatMoneyToParts(1234.5, "USD", { language: "en" });
    expect(parts.map((part) => part.type)).toEqual(["currency", "integer", "group", "integer", "decimal", "fraction"]);
    expect(parts.map((part) => part.value).join("")).toBe("$1,234.50");
  });

  test("names a currency's symbol in each language", () => {
    expect(format.currencySymbol("USD", { language: "en" })).toBe("$");
    expect(format.currencySymbol("USD", { language: "en-GB" })).toBe("US$");
    expect(format.currencySymbol("DKK", { language: "da" })).toBe("kr.");
    expect(format.currencySymbol("EUR", { language: "de" })).toBe("€");
  });
});

describe("lists", () => {
  test("join items each language's way", () => {
    const items = ["A", "B", "C"];
    expect(format.formatList(items, { language: "en" })).toBe("A, B, and C");
    expect(format.formatList(items, { language: "en-GB" })).toBe("A, B and C");
    expect(format.formatList(items, { language: "da" })).toBe("A, B og C");
    expect(format.formatList(items, { language: "ja" })).toBe("A、B、C");
    expect(format.formatList(items, { language: "en", type: "disjunction" })).toBe("A, B, or C");
    expect(format.formatList(new Set(["one", "two"]), { language: "en" })).toBe("one and two");
  });
});

describe("the current language", () => {
  test("is read again on every call, so a change shows at once", () => {
    i18n.setLanguage("da");
    expect(format.formatNumber(1234.5)).toBe("1.234,5");
    expect(format.formatDate(MOMENT, UTC)).toBe("17. okt. 2026");
    expect(format.formatList(["A", "B"])).toBe("A og B");

    i18n.setLanguage("ja");
    expect(format.formatDate(MOMENT, UTC)).toBe("2026/10/17");
    expect(format.formatMoney(1200, "JPY")).toBe("￥1,200");

    i18n.setLanguage("en");
    expect(format.formatNumber(1234.5)).toBe("1,234.5");
  });

  test("keeps one formatter per locale and options", () => {
    expect(format.dateFormatter({ month: "short", day: "numeric", language: "da" })).toBe(
      format.dateFormatter({ day: "numeric", month: "short", language: "da" })
    );
    expect(format.numberFormatter({ language: "da" })).not.toBe(format.numberFormatter({ language: "ja" }));
    i18n.setLanguage("da");
    expect(format.numberFormatter()).toBe(format.numberFormatter({ language: "da" }));
  });
});

describe("prices", () => {
  test("keep the labels getPriceLabel has always given", () => {
    const labels = { da: "kr.", nb: "kr.", sv: "kr.", de: "€", en: "$", pt: "€", es: "€", zh: "¥", ja: "¥", ko: "₩", xx: "$" };
    for (const [language, label] of Object.entries(labels)) {
      expect(pricing.getPriceLabel({ language })).toBe(label);
    }
    const countries = { US: "$", USA: "$", GB: "£", uk: "£", JP: "¥", CN: "¥", KR: "₩" };
    for (const [country, label] of Object.entries(countries)) {
      expect(pricing.getPriceLabel({ language: "da", country })).toBe(label);
    }
    expect(pricing.getPriceLabel({ language: "da", country: "SE" })).toBe("kr.");
  });

  test("give the languages the old table lacked their own currency", () => {
    expect(pricing.getPriceCurrency({ language: "pt-BR" })).toBe("BRL");
    expect(pricing.getPriceLabel({ language: "pt-BR" })).toBe("R$");
    expect(pricing.getPriceLabel({ language: "fr" })).toBe("€");
    expect(pricing.getPriceLabel({ language: "nn" })).toBe("kr.");
    expect(pricing.getPriceCurrency({ language: "ja-JP" })).toBe("JPY");
  });

  test("follow the current language, and write prices through formatMoney", () => {
    i18n.setLanguage("ja");
    expect(pricing.getPriceCurrency()).toBe("JPY");
    expect(pricing.formatPrice(1200)).toBe("￥1,200");
    expect(pricing.formatPrice(1999, { language: "en", minor: true })).toBe("$19.99");
    expect(plain(pricing.formatPrice(5, { currency: "EUR", language: "de" }))).toBe("5,00 €");
  });
});
