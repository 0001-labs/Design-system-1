// Design system 1's measures in one place, as palette.ts holds its colours. The stylesheets keep
// their own values (grid.css, one.css, text.css, component-tokens.css, component-metrics.css) and
// tests/measures.test.ts fails when one of them and this file disagree. The native packages are
// written from this file by scripts/write-native-tokens.ts: change a measure here and in the CSS,
// then run that script.
//
// Every length is in CSS pixels at a scale of 1: points on Apple platforms, dp on Android. On a
// phone or tablet each is multiplied by the device scale.

export const measures = {
  /** One square, `--1` and `--ds-1`. */
  square: 20,
  /** Half a square, `--half`: the smallest gap. */
  half: 10,
  /** A control: a switch's height, a toast's line, a small avatar. `--ds-08`. */
  control: 16,
  /** A row, an item, a header, a menu entry: one square. */
  row: 20,
  /** An item is drawn one point short of its pitch, so its outline lands on the grid line. */
  item: { width: 79, height: 19, correction: 1 },
  type: {
    /** Text, `--type-size-default` and `--ds-type-size-default`. */
    default: 14,
    small: 10,
    heading: 13,
    /** A display title, set on two squares. */
    display: 20,
  },
  /** A line of text's own box, `--type-lineheight-default`; the line it stands on is one square. */
  leading: 16,
  /** Letter spacing of text, `--type-letterspacing-default`. */
  tracking: -0.3,
  /** Letter spacing of a display title. */
  displayTracking: -0.4,
  weight: { default: 400, bold: 500 },
  /** Lines and outlines. */
  line: 1,
  /** Corners of pictures, buttons and fields; rows and items stay square. */
  radius: 4,
  /**
   * The device scale (`--sf`, DS1/0-face/scaling.ts): the width over `base`, between `min` and
   * `max`, rounded to `decimals`. A computer stays at 1.
   */
  scale: { base: 280, min: 0.75, max: 2, decimals: 3 },
} as const;

export type Measures = typeof measures;

/** The device scale for a screen `width` wide, as scaling.ts computes it without snapping. */
export function deviceScale(width: number): number {
  const { base, min, max, decimals } = measures.scale;
  return Number(Math.max(min, Math.min(max, width / base)).toFixed(decimals));
}
