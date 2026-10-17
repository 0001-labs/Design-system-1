/** A meter in React: its role and values are in the markup from the first
 * render, on the server too, written in the language; ds-meter draws the bar
 * or the squares. Browser-only registration of ds-meter stays in the
 * product's runtime entry. */
import { createElement as h, forwardRef, type HTMLAttributes } from "react";
import type { Meter as MeterElement } from "../2-core/ds-meter";
import { meterAria, type FigureFormat } from "../2-core/figures";

export type MeterProps = Omit<HTMLAttributes<MeterElement>, "title" | "children"> & {
  /** The value. Past `max`, the meter is over. */
  value: number;
  /** The start of the range, 0 by default. */
  min?: number;
  /** The end of the range, 1 by default. */
  max?: number;
  /** Draw the range in this many squares instead of a bar. */
  squares?: number;
  /** Show the meter as over whatever its value. */
  over?: boolean;
  /** The meter's name for assistive technology. */
  label?: string;
  /** What the value says, in place of "7 of 10". */
  valuetext?: string;
  /** How the value and the range are written in the words. */
  format?: FigureFormat;
  /** The ISO 4217 code for money. */
  currency?: string;
  /** The money is counted in the currency's minor unit. */
  minor?: boolean;
  /** Money in whole units only. */
  whole?: boolean;
  /** Decimals in the words. */
  digits?: number;
  /** Write the words in this language rather than the current one. */
  language?: string;
};

export const Meter = forwardRef<MeterElement, MeterProps>(function Meter(
  { value, min = 0, max = 1, squares, over, label, valuetext, format, currency, minor, whole, digits, language, ...props }, ref,
) {
  const aria = meterAria(value, min, max, { over, format, currency, minor, whole, digits, language });
  return h("ds-meter", {
    role: "meter", "aria-valuenow": aria.now, "aria-valuemin": aria.min, "aria-valuemax": aria.max,
    "aria-valuetext": valuetext || aria.text, "aria-label": label,
    ...props, value, min, max, squares, over: over || undefined, label, valuetext, format, currency,
    minor: minor || undefined, whole: whole || undefined, digits, literal: true, ref,
  });
});
