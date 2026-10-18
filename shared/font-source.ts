/**
 * A drawn face's source: the outlines drawn in the private font workspace,
 * held as UFO's glyphs hold them, so they can be written out as a UFO later.
 *
 * Every contour is closed. An on-curve point is `line` or `curve`, naming the
 * segment that ends at it; a `curve` point follows exactly two `offcurve`
 * control points (a cubic Bézier), a `line` point none. The first segment of a
 * contour runs from its last on-curve point to its first, so the control points
 * of that segment sit at the end of the list. Coordinates are whole font units
 * with y up, the baseline at 0.
 *
 * The workspace's app and Worker both read this module; it uses no browser or
 * Worker types.
 */

export type SourcePointType = 'line' | 'curve' | 'offcurve';
export type SourcePoint = { x: number; y: number; type: SourcePointType; smooth?: boolean };
export type SourceContour = SourcePoint[];
export type SourceGlyph = { unicode: number; advance: number; contours: SourceContour[] };
/** The face's vertical measures: the design guides, and the line the face stands on. */
export type SourceMetrics = {
  unitsPerEm: number;
  /** The guides drawn to: ascenders, descenders, capitals, lower case. */
  ascender: number;
  descender: number;
  capHeight: number;
  xHeight: number;
  /** The line box a browser builds from the face (hhea and win metrics). */
  lineAscent: number;
  lineDescent: number;
};
export type FontSource = {
  format: 'font-source';
  version: 1;
  family: string;
  style: string;
  weight: number;
  metrics: SourceMetrics;
  glyphs: SourceGlyph[];
};

export const SOURCE_LIMITS = { bytes: 4 * 1024 * 1024, glyphs: 1200, contours: 64, points: 2000, coordinate: 4000 } as const;

/**
 * The vertical measures of the text face a drawn sans replaces: 14px text on
 * a 16px line box then stands where it stands today, capitals 7px below the
 * square's top line and the baseline 3px above its foot.
 */
export const DEFAULT_METRICS: SourceMetrics = {
  unitsPerEm: 1000,
  ascender: 785,
  descender: -215,
  capHeight: 710,
  xHeight: 500,
  lineAscent: 1000,
  lineDescent: -258,
};

/** The characters a drawn face starts with: Basic Latin, the Danish letters, quotes, dashes and a few signs. */
export const SOURCE_CHARACTERS: readonly number[] = [
  ...Array.from({ length: 0x7e - 0x20 + 1 }, (_, index) => 0x20 + index),
  0xc6, 0xd8, 0xc5, 0xe6, 0xf8, 0xe5, // Æ Ø Å æ ø å
  0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, // – — ‘ ’ “ ” …
  0x20ac, 0xa3, 0x2212, 0xd7, // € £ − ×
];

export function emptySource(family: string, style = 'Regular', weight = 400): FontSource {
  return { format: 'font-source', version: 1, family, style, weight, metrics: { ...DEFAULT_METRICS }, glyphs: [] };
}

/** A glyph's name in a built font. */
export const glyphName = (unicode: number) => unicode === 0x20 ? 'space' : `uni${unicode.toString(16).toUpperCase().padStart(4, '0')}`;

const fail = (message: string): never => { throw new Error(message); };
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const wholeNumber = (value: unknown, limit: number = SOURCE_LIMITS.coordinate): value is number => Number.isInteger(value) && Math.abs(value as number) <= limit;
const words = (value: unknown, length: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= length && /^[\x20-\x7e]+$/.test(value);

/** Whether a contour's control points are where its on-curve points say they are. */
export function contourProblem(contour: readonly SourcePoint[]): string | null {
  const onCurve = contour.findIndex(point => point.type !== 'offcurve');
  if (onCurve < 0) return 'A contour needs a point on its outline.';
  // Walk once around from the first on-curve point, counting the control points before each on-curve one.
  let run = 0;
  for (let step = 1; step <= contour.length; step += 1) {
    const point = contour[(onCurve + step) % contour.length]!;
    if (point.type === 'offcurve') { run += 1; continue; }
    if (point.type === 'line' && run !== 0) return 'A line point cannot follow control points.';
    if (point.type === 'curve' && run !== 2) return 'A curve point follows exactly two control points.';
    run = 0;
  }
  return null;
}

/**
 * Read a source sent to the Worker or loaded from storage. Throws with words a
 * person can act on; returns a copy holding only the known fields.
 */
export function validateSource(value: unknown): FontSource {
  if (!isRecord(value) || value.format !== 'font-source' || value.version !== 1) fail('This is not a drawing the workspace can read.');
  const source = value as Record<string, unknown>;
  if (!words(source.family, 64) || !words(source.style, 32)) fail('The drawing needs a family and a style name.');
  if (!Number.isInteger(source.weight) || (source.weight as number) < 1 || (source.weight as number) > 1000) fail('The weight is a whole number from 1 to 1000.');
  const metrics = source.metrics;
  if (!isRecord(metrics)) fail('The drawing has no vertical measures.');
  const measures = metrics as Record<string, unknown>;
  const names = ['unitsPerEm', 'ascender', 'descender', 'capHeight', 'xHeight', 'lineAscent', 'lineDescent'] as const;
  for (const name of names) if (!wholeNumber(measures[name])) fail(`The ${name} measure is not a whole number of units.`);
  const unitsPerEm = measures.unitsPerEm as number;
  if (unitsPerEm < 16 || unitsPerEm > 4000) fail('Units per em is from 16 to 4000.');
  if ((measures.lineAscent as number) <= 0 || (measures.lineDescent as number) > 0) fail('The line rises above the baseline and falls below it.');
  if (!Array.isArray(source.glyphs) || source.glyphs.length > SOURCE_LIMITS.glyphs) fail(`A drawing holds at most ${SOURCE_LIMITS.glyphs} glyphs.`);
  const seen = new Set<number>();
  const glyphs = (source.glyphs as unknown[]).map((glyph): SourceGlyph => {
    if (!isRecord(glyph)) return fail('A glyph is not readable.');
    const { unicode, advance, contours } = glyph;
    if (!Number.isInteger(unicode) || (unicode as number) < 0x20 || (unicode as number) > 0x10ffff || ((unicode as number) >= 0xd800 && (unicode as number) <= 0xdfff)) return fail('A glyph has no character.');
    if (seen.has(unicode as number)) return fail(`Two glyphs draw U+${(unicode as number).toString(16).toUpperCase()}.`);
    seen.add(unicode as number);
    if (!wholeNumber(advance) || (advance as number) < 0) return fail('A glyph’s width is a whole number of units, not below zero.');
    if (!Array.isArray(contours) || contours.length > SOURCE_LIMITS.contours) return fail(`A glyph holds at most ${SOURCE_LIMITS.contours} contours.`);
    let points = 0;
    const read = (contours as unknown[]).map((contour): SourceContour => {
      if (!Array.isArray(contour) || contour.length === 0) return fail('A contour is empty.');
      points += contour.length;
      if (points > SOURCE_LIMITS.points) return fail(`A glyph holds at most ${SOURCE_LIMITS.points} points.`);
      const copy = contour.map((point): SourcePoint => {
        if (!isRecord(point) || !wholeNumber(point.x) || !wholeNumber(point.y)) return fail('A point is not at whole units inside the drawing.');
        if (point.type !== 'line' && point.type !== 'curve' && point.type !== 'offcurve') return fail('A point has no kind.');
        if (point.smooth !== undefined && typeof point.smooth !== 'boolean') return fail('A point is smooth or not.');
        return point.smooth && point.type !== 'offcurve' ? { x: point.x, y: point.y, type: point.type, smooth: true } : { x: point.x, y: point.y, type: point.type };
      });
      const problem = contourProblem(copy);
      if (problem) return fail(problem);
      return copy;
    });
    return { unicode: unicode as number, advance: advance as number, contours: read };
  });
  glyphs.sort((a, b) => a.unicode - b.unicode);
  return {
    format: 'font-source', version: 1,
    family: source.family as string, style: source.style as string, weight: source.weight as number,
    metrics: Object.fromEntries(names.map(name => [name, measures[name] as number])) as SourceMetrics,
    glyphs,
  };
}
