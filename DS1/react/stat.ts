/** A stat in React: the label, the figure and the caption stay in the light
 * DOM, the figure already written in the language, so they render on the
 * server and read in tests; ds-stat draws them and the change. Browser-only
 * registration of ds-stat stays in the product's runtime entry. */
import { createElement as h, forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import type { Stat as StatElement, StatTone } from "../2-core/ds-stat";
import { figureCells, formatFigure, type FigureFormat } from "../2-core/figures";

export type { StatTone } from "../2-core/ds-stat";
export type { FigureFormat } from "../2-core/figures";
export type StatProps = Omit<HTMLAttributes<StatElement>, "title"> & {
  /** What the figure is. */
  label?: ReactNode;
  /** The figure, written as `format` says in the current language (or `language`). */
  value?: number;
  /** Words or markup in place of the value ("Incomplete"). */
  figure?: ReactNode;
  /** How the value is written: number (the default), compact, percent (a fraction) or money. */
  format?: FigureFormat;
  /** The ISO 4217 code for money. */
  currency?: string;
  /** The money is counted in the currency's minor unit. */
  minor?: boolean;
  /** Money in whole units only. */
  whole?: boolean;
  /** Decimals, at least and at most. */
  digits?: number;
  /** A change, written with its sign and an up or down icon at the start of the caption. */
  change?: number;
  /** How the change is written; the value's format by default. */
  changeFormat?: FigureFormat;
  /** The change in that colour, where the page knows which way is bad. */
  changeTone?: StatTone;
  /** A line under the figure. */
  caption?: ReactNode;
  /** An icon from the library on its own square before the label. */
  icon?: string;
  /** The figure in that colour. */
  tone?: StatTone;
  /** Each digit in a cell of one width, for a face whose digits differ in width. */
  cells?: boolean;
  /** Write the figure in this language rather than the current one, as a server answering a request does. */
  language?: string;
};

const hiddenWords: CSSProperties = { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" };
const digitCell: CSSProperties = { display: "inline-block", width: "var(--ds-stat-digit, 1ch)", textAlign: "center" };
const slot = (name: string, content: ReactNode) =>
  content == null || content === false || content === "" ? null : h("span", { slot: name }, content);

/** The figure as text, or its digits in cells of one width with the whole read once. */
function drawn(text: string, cells: boolean | undefined): ReactNode {
  if (!cells) return text;
  return [
    h("span", { key: "words", style: hiddenWords }, text),
    h("span", { key: "cells", "aria-hidden": "true" }, figureCells(text).map((cell, index) =>
      cell.digit ? h("span", { key: index, style: digitCell }, cell.text) : cell.text)),
  ];
}

export const Stat = forwardRef<StatElement, StatProps>(function Stat(
  { label, value, figure, format, currency, minor, whole, digits, change, changeFormat, changeTone, caption, icon, tone, cells, language, children, ...props }, ref,
) {
  const text = figure ?? (typeof value === "number" ? formatFigure(value, { format, currency, minor, whole, digits, language }) : null);
  return h("ds-stat", {
    ...props, format, currency, minor: minor || undefined, whole: whole || undefined, digits, change,
    "change-format": changeFormat, "change-tone": changeTone, icon, tone, cells: cells || undefined, ref,
  },
  slot("label", label),
  slot("figure", typeof text === "string" ? drawn(text, cells) : text),
  children,
  slot("caption", caption));
});
