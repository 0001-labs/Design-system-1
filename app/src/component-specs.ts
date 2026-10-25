import { named, tokenName } from "../../DS1/1-root/palette";

/**
 * The components the base editor edits, and each one's properties: the component's own public
 * token (unset by default, in unscaled px where it is a length), how it is set, and the value it
 * has while unset. The editor writes nothing else, so every value it can write is one of these.
 *
 * - `control`: a height one control high in whole squares, N × 20 − 4 (16, 36, 56): the face on the
 *   lower sixteen of its squares, the spare four above.
 * - `row`: a height a row high in whole squares, N × 20 (20, 40, 60).
 * - `length`: pixels on `step` (Shift: `bigStep`) between `min` and `max`.
 * - `text`: one of the system's text sizes.
 * - `width`: hug (unset), fill (100%) or fixed in whole squares; `modes` says which apply.
 * - `colour`: a palette colour, as its theme-aware token.
 */
export type PropertyKind = "control" | "row" | "length" | "text" | "width" | "colour";
export type WidthMode = "hug" | "fill" | "fixed";

export interface ComponentProperty {
  token: string;
  label: string;
  /** A letter or a short word for the number field's lead, its scrub handle. */
  lead?: string;
  kind: PropertyKind;
  group: "Layout" | "Shape" | "Text" | "Colour";
  step?: number;
  bigStep?: number;
  min?: number;
  max?: number;
  /** The value while the token is unset: px for lengths, squares for a fixed width. */
  default: number | string;
  unit?: string;
  modes?: readonly WidthMode[];
}

export interface ComponentSpec {
  id: string;
  name: string;
  tag: string;
  /** The component's documentation page. */
  href: string;
  properties: ComponentProperty[];
}

export const SQUARE = 20;
/** The system's text sizes a one-line control can hold: small, heading and default. */
export const TEXT_SIZES = [{ label: "Small", value: 10 }, { label: "Heading", value: 13 }, { label: "Default", value: 14 }] as const;
/** The palette, each colour as its theme-aware token. */
export const COLOURS = named.map(([name]) => ({ label: name, value: `var(${tokenName(name)})` }));

const height = (token: string, kind: "control" | "row", max: number): ComponentProperty => {
  const base = kind === "control" ? SQUARE - 4 : SQUARE;
  return { token, label: "Height", lead: "H", kind, group: "Layout", step: SQUARE, bigStep: SQUARE, min: base, max, default: base };
};
const padding = (token: string, max = 2 * SQUARE): ComponentProperty =>
  ({ token, label: "Padding", lead: "P", kind: "length", group: "Layout", step: 4, bigStep: SQUARE, min: 0, max, default: 4 });
const corner = (token: string, max = SQUARE): ComponentProperty =>
  ({ token, label: "Corner", lead: "R", kind: "length", group: "Shape", step: 2, bigStep: 4, min: 0, max, default: 4 });
const text = (token: string): ComponentProperty => ({ token, label: "Text size", kind: "text", group: "Text", default: 14 });
const colour = (token: string, label: string): ComponentProperty => ({ token, label, kind: "colour", group: "Colour", default: "" });

export const COMPONENTS: ComponentSpec[] = [
  {
    id: "button", name: "Button", tag: "ds-button", href: "/2-core/button/",
    properties: [
      { token: "--ds-button-inline-size", label: "Width", lead: "W", kind: "width", group: "Layout", modes: ["hug", "fill", "fixed"], step: 1, bigStep: 4, min: 1, max: 16, default: 4, unit: "sq" },
      height("--ds-button-size", "control", 3 * SQUARE - 4),
      padding("--ds-button-padding-size"),
      corner("--ds-button-corner-size"),
      text("--ds-button-text-size"),
      colour("--ds-button-primary-fill", "Primary fill"),
      colour("--ds-button-primary-text", "Primary text"),
      colour("--ds-button-secondary-fill", "Secondary fill"),
    ],
  },
  {
    id: "input", name: "Input", tag: "ds-input", href: "/2-core/input/",
    properties: [
      { token: "--ds-input-inline-size", label: "Width", lead: "W", kind: "width", group: "Layout", modes: ["fill", "fixed"], step: 1, bigStep: 4, min: 2, max: 32, default: 12, unit: "sq" },
      height("--ds-input-size", "control", 3 * SQUARE - 4),
      padding("--ds-input-padding-size"),
      corner("--ds-input-corner-size"),
      colour("--ds-input-field-background", "Fill"),
    ],
  },
  {
    id: "checkbox", name: "Checkbox", tag: "ds-checkbox", href: "/2-core/checkbox/",
    properties: [
      // The box stands in one square, so it is at most a square across.
      { token: "--ds-checkbox-size", label: "Size", lead: "S", kind: "length", group: "Layout", step: 4, bigStep: 4, min: 12, max: SQUARE, default: SQUARE - 4 },
      corner("--ds-checkbox-corner-size", SQUARE / 2),
      colour("--ds-checkbox-fill", "Ticked fill"),
    ],
  },
  {
    id: "switch", name: "Switch", tag: "ds-switch", href: "/2-core/switch/",
    properties: [
      height("--ds-switch-size", "control", 2 * SQUARE - 4),
      colour("--ds-switch-track-on", "On"),
      colour("--ds-switch-track-off", "Off"),
    ],
  },
  {
    id: "tag", name: "Tag", tag: "ds-tag", href: "/2-core/tag/",
    properties: [
      height("--ds-tag-size", "control", 2 * SQUARE - 4),
      padding("--ds-tag-padding-size", SQUARE),
      corner("--ds-tag-corner-size"),
      text("--ds-tag-text-size"),
      colour("--ds-tag-accent", "Accent"),
    ],
  },
];

/** The component a `component` address names, by its id or its documentation page (as the token view writes it); the first otherwise. */
export const componentSpec = (id: string | null | undefined) => COMPONENTS.find(spec => spec.id === id || spec.href === id) ?? COMPONENTS[0]!;

/** A height on whole squares: the nearest N × 20 (− 4 for a control) within the property's range. */
export function snapHeight(property: ComponentProperty, px: number) {
  const offset = property.kind === "control" ? 4 : 0;
  const squares = Math.round((px + offset) / SQUARE);
  return Math.min(property.max ?? Infinity, Math.max(property.min ?? 0, squares * SQUARE - offset));
}

/** A length on its step within its range. */
export function snapLength(property: ComponentProperty, px: number) {
  const step = property.step ?? 1;
  return Math.min(property.max ?? Infinity, Math.max(property.min ?? 0, Math.round(px / step) * step));
}

/** A fixed width in squares, written so it follows the surface's scale. */
export const fixedWidth = (squares: number) => `calc(${squares} * var(--ds-unit, 20px))`;

/** The width mode and squares a written width value stands for. */
export function readWidth(property: ComponentProperty, value: string | undefined): { mode: WidthMode; squares: number } {
  const squares = Number(/^calc\((\d+) \* var\(--ds-unit, 20px\)\)$/.exec(value ?? "")?.[1]);
  if (Number.isFinite(squares) && squares > 0) return { mode: "fixed", squares };
  if (value === "100%") return { mode: "fill", squares: Number(property.default) };
  return { mode: property.modes?.[0] === "fill" ? "fill" : "hug", squares: Number(property.default) };
}

/**
 * The value to write for a property, or "" to take the token out (back to its default). A width's
 * default mode (hug for a button, fill for a field) and a length equal to the default are unset.
 */
export function tokenValue(property: ComponentProperty, input: number | string | { mode: WidthMode; squares: number }): string {
  if (property.kind === "width") {
    const { mode, squares } = input as { mode: WidthMode; squares: number };
    if (mode === property.modes?.[0]) return "";
    if (mode === "fill") return "100%";
    return fixedWidth(Math.min(property.max ?? 16, Math.max(property.min ?? 1, Math.round(squares))));
  }
  if (property.kind === "colour") return String(input);
  const px = Number(input);
  if (!Number.isFinite(px)) return "";
  const snapped = property.kind === "length" ? snapLength(property, px) : property.kind === "text" ? px : snapHeight(property, px);
  return snapped === property.default ? "" : `${snapped}px`;
}

/** The number a written length stands for, or the default while unset. */
export function readLength(property: ComponentProperty, value: string | undefined) {
  const px = Number(/^(-?\d+(?:\.\d+)?)px$/.exec(value ?? "")?.[1]);
  return Number.isFinite(px) ? px : Number(property.default);
}
