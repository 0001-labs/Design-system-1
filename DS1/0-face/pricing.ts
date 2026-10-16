/**
 * The currency a reader is most likely to think in, from their language or
 * country, and prices written in it. The amounts themselves come from the
 * product's billing (a payment service or its database); this only says how
 * they read. Writing them is `formatMoney` in `./format`.
 */
import { currencySymbol, formatMoney } from "./format";
import type { MoneyOptions } from "./format";
import { currentLanguage } from "./i18n";
import type { LanguageCode } from "./i18n";

type PriceLabelOptions = {
  /** The reader's language. Defaults to the current language. */
  language?: LanguageCode;
  /** The reader's country, when known (`US`, `GB`, `JP`); it wins over the language. */
  country?: string;
};

/** The currency each language's readers most often pay in. */
const LANGUAGE_CURRENCIES: Record<string, string> = {
  da: "DKK",
  de: "EUR",
  en: "USD",
  es: "EUR",
  fi: "EUR",
  fr: "EUR",
  is: "ISK",
  it: "EUR",
  ja: "JPY",
  ko: "KRW",
  nb: "NOK",
  nn: "NOK",
  no: "NOK",
  pt: "EUR",
  "pt-br": "BRL",
  sv: "SEK",
  zh: "CNY",
};

const COUNTRY_CURRENCIES: Record<string, string> = {
  US: "USD",
  USA: "USD",
  GB: "GBP",
  UK: "GBP",
  JP: "JPY",
  JPN: "JPY",
  CN: "CNY",
  CHN: "CNY",
  KR: "KRW",
  KOR: "KRW",
};

/**
 * The short labels `getPriceLabel` has always given. Other currencies read
 * the symbol the language writes them with.
 */
const PRICE_LABELS: Record<string, string> = {
  DKK: "kr.",
  NOK: "kr.",
  SEK: "kr.",
  ISK: "kr.",
  EUR: "€",
  USD: "$",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  KRW: "₩",
  BRL: "R$",
};

/**
 * The currency (ISO 4217 code) for a reader: their country's when it is
 * known, else their language's, else USD. `pt-BR` reads BRL.
 */
export function getPriceCurrency(options: PriceLabelOptions = {}): string {
  const country = options.country?.toUpperCase();
  if (country && COUNTRY_CURRENCIES[country]) {
    return COUNTRY_CURRENCIES[country];
  }

  const language = String(options.language || currentLanguage.value || "en")
    .toLowerCase()
    .replace(/_/g, "-");
  const primary = language.split("-")[0] ?? "";
  return LANGUAGE_CURRENCIES[language] ?? LANGUAGE_CURRENCIES[primary] ?? "USD";
}

/** The currency label for a reader: `kr.`, `€`, `$`, `£`, `¥`, `₩`. */
export function getPriceLabel(options: PriceLabelOptions = {}): string {
  const currency = getPriceCurrency(options);
  return (
    PRICE_LABELS[currency] ??
    currencySymbol(currency, { language: options.language })
  );
}

/**
 * A price for a reader: in `currency`, or the reader's currency
 * (`getPriceCurrency`) when none is given, written in their language.
 * `minor` reads the amount in cents, as payment services send it.
 */
export function formatPrice(
  amount: number,
  options: PriceLabelOptions & MoneyOptions & { currency?: string } = {}
): string {
  const { country, currency, ...money } = options;
  return formatMoney(
    amount,
    currency ?? getPriceCurrency({ language: options.language, country }),
    money
  );
}
