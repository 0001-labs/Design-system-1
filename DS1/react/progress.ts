/** Progress in React. A value against its range puts its role and values in
 * the markup from the first render, on the server too, written in the
 * language. Steps arrive as a property, with what belongs under each step in
 * a vertical sequence slotted from the light DOM. Dots are a group whose
 * picks come back as `onSelect`. Register ds-progress in the browser before
 * hydration. */
import { createElement as h, forwardRef, useEffect, useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import type { Progress as ProgressElement, ProgressSelectDetail, Step } from "../2-core/ds-progress";
import { meterAria, type FigureFormat } from "../2-core/figures";

export type { Step, StepState } from "../2-core/ds-progress";
export type ProgressProps = Omit<HTMLAttributes<ProgressElement>, "title" | "children" | "onSelect"> & {
  /** The value. Past `max`, it is over. */
  value?: number;
  /** The start of the range, 0 by default. */
  min?: number;
  /** The end of the range, 1 by default. */
  max?: number;
  /** Draw the range in this many squares instead of a bar. */
  squares?: number;
  /** Show it as over whatever its value. */
  over?: boolean;
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
  /** A sequence: the steps in order, names or `{ label, state, href }`. */
  steps?: Step[];
  /** The number of the current step, counted from 1. */
  current?: number;
  /** One step to a row, with `bodies` under them. */
  vertical?: boolean;
  /** In a vertical sequence, what belongs under each step, by its place in `steps`. */
  bodies?: ReactNode[];
  /** A dot for each of this many pages. */
  dots?: number;
  /** The current dot, from 0. */
  active?: number;
  /** Draw the last dot as an end marker. */
  end?: boolean;
  /** Each dot's name, with `{index}` for its number from 1. */
  dotLabel?: string;
  /** A person picked a dot. */
  onSelect?: (index: number, previous: number) => void;
  /** The element's name for assistive technology. */
  label?: string;
  /** Show the words as written, never looked up. On by default: React writes its own words. */
  literal?: boolean;
};

const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const Progress = forwardRef<ProgressElement, ProgressProps>(function Progress(
  { value, min = 0, max = 1, squares, over, valuetext, format, currency, minor, whole, digits, language,
    steps, current, vertical, bodies, dots, active, end, dotLabel, onSelect, label, literal = true, ...props }, ref,
) {
  const host = useRef<ProgressElement | null>(null);
  useCommitEffect(() => {
    const element = host.current;
    if (!element || !onSelect) return;
    const select = (event: Event) => {
      if (event.target !== element) return;
      const { index, previous } = (event as CustomEvent<ProgressSelectDetail>).detail;
      onSelect(index, previous);
    };
    element.addEventListener("select", select);
    return () => element.removeEventListener("select", select);
  });
  const attach = (element: ProgressElement | null) => {
    host.current = element;
    if (typeof ref === "function") ref(element); else if (ref) ref.current = element;
  };
  if (steps) {
    return h("ds-progress", { ...props, steps, current, vertical: vertical || undefined, label, literal: literal || undefined, ref: attach },
      vertical ? bodies?.map((body, index) => body == null || body === false
        ? null
        : h("div", { key: index, slot: `step-${index + 1}`, style: { display: "contents" } }, body)) : null);
  }
  if (dots !== undefined) {
    return h("ds-progress", { role: "group", "aria-label": label, ...props, dots, active, end: end || undefined, "dot-label": dotLabel, label, literal: literal || undefined, ref: attach });
  }
  const aria = meterAria(value ?? 0, min, max, { over, format, currency, minor, whole, digits, language });
  return h("ds-progress", {
    role: "meter", "aria-valuenow": aria.now, "aria-valuemin": aria.min, "aria-valuemax": aria.max,
    "aria-valuetext": valuetext || aria.text, "aria-label": label,
    ...props, value: value ?? 0, min, max, squares, over: over || undefined, label, valuetext, format, currency,
    minor: minor || undefined, whole: whole || undefined, digits, literal: literal || undefined, ref: attach,
  });
});
