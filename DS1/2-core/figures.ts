// figures.ts
// The words of a figure, shared by ds-stat, ds-meter and their React
// adapters: a value written through 0-face/format.ts in the current language,
// the digits cut into cells of one width, and a meter's ARIA values. No
// browser code, so the adapters write the same words on the server.

import { formatCompact, formatMoney, formatNumber, formatPercent } from "../0-face/format";
import { translate } from "../0-face/i18n";

/** How a figure's value is written: a number, a short number (12K), a fraction as a percentage, or money. */
export type FigureFormat = "number" | "compact" | "percent" | "money";
const FORMATS: readonly FigureFormat[] = ["number", "compact", "percent", "money"];

export interface FigureOptions {
  /** `number` by default. `money` needs `currency`; without one it writes a number. */
  format?: FigureFormat;
  /** An ISO 4217 code for `money`: `USD`, `DKK`, `JPY`. */
  currency?: string;
  /** For money: the amount is in the currency's minor unit (cents, øre). */
  minor?: boolean;
  /** For money: whole units only, rounded. */
  whole?: boolean;
  /** Decimals, at least and at most. Unset, the format's own (none for a percentage, the currency's for money). */
  digits?: number;
  /** Write a sign before a value that is not zero: `+12%`, `−3`. */
  signed?: boolean;
  /** Format in this language rather than the current one. */
  language?: string;
}

/** A format name as given, or `number` for one this does not know. */
export function figureFormat(value: string | null | undefined): FigureFormat {
  return FORMATS.includes(value as FigureFormat) ? (value as FigureFormat) : "number";
}

/** A value written as `options` say, in the current language: `1,234`, `12K`, `25%`, `$1,234.50`, `+12%`. */
export function formatFigure(value: number, options: FigureOptions = {}): string {
  if (!Number.isFinite(value)) return "";
  const { currency, minor, whole, digits, signed, language } = options;
  const format = figureFormat(options.format);
  const numeric: Intl.NumberFormatOptions & { language?: string } = { language };
  if (signed) numeric.signDisplay = "exceptZero";
  if (digits !== undefined && Number.isFinite(digits) && digits >= 0) {
    numeric.minimumFractionDigits = Math.min(20, Math.floor(digits));
    numeric.maximumFractionDigits = Math.min(20, Math.floor(digits));
  }
  if (format === "money" && currency) return formatMoney(value, currency, { ...numeric, minor, whole });
  if (format === "percent") return formatPercent(value, numeric);
  if (format === "compact") return formatCompact(value, numeric);
  return formatNumber(value, numeric);
}

/** A run of a figure's text: a digit, which takes a cell of its own, or the signs and letters between. */
export interface FigureCell { text: string; digit: boolean }

/**
 * A figure's text cut into its digits and the runs between them, for a face
 * whose digits are not all one width: each digit is drawn in a cell of one
 * width (`ds-stat__digit`), the rest at its own. The text is read whole.
 */
export function figureCells(text: string): FigureCell[] {
  const cells: FigureCell[] = [];
  for (const character of text) {
    const digit = /\p{Nd}/u.test(character);
    const last = cells[cells.length - 1];
    if (!digit && last && !last.digit) last.text += character;
    else cells.push({ text: character, digit });
  }
  return cells;
}

/** What a meter says to assistive technology. */
export interface MeterAria {
  /** The value, kept inside the range as ARIA requires. */
  now: number;
  min: number;
  max: number;
  /** "7 of 10", or "12 of 10, over by 2", in the current language. */
  text: string;
  /** How much of the range is filled, 0 to 1. */
  fraction: number;
  /** The value is past the end of the range. */
  over: boolean;
}

/**
 * A meter's values: the value kept inside `min` and `max`, how much of the
 * range it fills, whether it is past the end, and the words that say so, the
 * figures written as `options` say. A range that is empty or backwards reads
 * as 0 to 1.
 */
export function meterAria(value: number, min = 0, max = 1, options: FigureOptions & { over?: boolean } = {}): MeterAria {
  const low = Number.isFinite(min) ? min : 0;
  const high = Number.isFinite(max) && max > low ? max : low + 1;
  const raw = Number.isFinite(value) ? value : low;
  const over = Boolean(options.over) || raw > high;
  const now = Math.min(high, Math.max(low, raw));
  const fraction = over ? 1 : (now - low) / (high - low);
  const write = (n: number) => formatFigure(n, { ...options, signed: false });
  const params = { value: write(raw), max: write(high), over: write(Math.max(0, raw - high)) };
  const text = over && raw > high
    ? translate("{value} of {max}, over by {over}", params)
    : translate("{value} of {max}", params);
  return { now, min: low, max: high, text, fraction, over };
}
