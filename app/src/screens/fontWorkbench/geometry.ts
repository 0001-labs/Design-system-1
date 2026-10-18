/**
 * Editing a drawn face's outlines: cubic Bézier contours as the source holds
 * them (see shared/font-source.ts). Every function returns new contours and
 * leaves the ones it was given alone, so a change can be undone by keeping the
 * old value.
 */
import type { SourceContour, SourceGlyph, SourcePoint } from '../../../../shared/font-source';

export type Point = { x: number; y: number };
/** One point of a glyph: its contour and its place in it. */
export type PointKey = `${number}:${number}`;
export const pointKey = (contour: number, index: number): PointKey => `${contour}:${index}`;
export const readKey = (key: PointKey): [number, number] => key.split(':').map(Number) as [number, number];

const wrap = (index: number, length: number) => ((index % length) + length) % length;
const isOn = (point: SourcePoint) => point.type !== 'offcurve';

/** A stretch of outline from one on-curve point to the next, with the control points between. */
export type Segment = { start: number; controls: number[]; end: number };

export function segments(contour: readonly SourcePoint[]): Segment[] {
  const on = contour.flatMap((point, index) => isOn(point) ? [index] : []);
  return on.map((end, k) => {
    const start = on[wrap(k - 1, on.length)]!;
    const controls: number[] = [];
    for (let index = wrap(start + 1, contour.length); index !== end; index = wrap(index + 1, contour.length)) controls.push(index);
    return { start, controls, end };
  });
}

/** SVG path data for a contour, in font units with y up. */
export function contourPath(contour: readonly SourcePoint[]): string {
  const parts = segments(contour);
  if (!parts.length) return '';
  const first = contour[parts[0]!.end]!;
  let d = `M${first.x} ${first.y}`;
  for (const part of [...parts.slice(1), parts[0]!]) {
    const end = contour[part.end]!;
    if (part.controls.length === 2) {
      const [a, b] = part.controls.map(index => contour[index]!) as [SourcePoint, SourcePoint];
      d += `C${a.x} ${a.y} ${b.x} ${b.y} ${end.x} ${end.y}`;
    } else if (part !== parts[0]) d += `L${end.x} ${end.y}`;
  }
  return d + 'Z';
}

export const glyphPath = (glyph: SourceGlyph | undefined) => glyph ? glyph.contours.map(contourPath).join('') : '';

/** The point on a segment at `t`, from 0 at its start to 1 at its end. */
export function pointOn(contour: readonly SourcePoint[], segment: Segment, t: number): Point {
  const p0 = contour[segment.start]!, p3 = contour[segment.end]!;
  if (segment.controls.length !== 2) return { x: p0.x + (p3.x - p0.x) * t, y: p0.y + (p3.y - p0.y) * t };
  const p1 = contour[segment.controls[0]!]!, p2 = contour[segment.controls[1]!]!;
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

/** The segment of a contour nearest to a point, and where on it. */
export function nearestSegment(contour: readonly SourcePoint[], target: Point): { segment: Segment; t: number; distance: number } | null {
  let best: { segment: Segment; t: number; distance: number } | null = null;
  for (const segment of segments(contour)) {
    for (let step = 1; step < 64; step += 1) {
      const t = step / 64;
      const at = pointOn(contour, segment, t);
      const distance = Math.hypot(at.x - target.x, at.y - target.y);
      if (!best || distance < best.distance) best = { segment, t, distance };
    }
  }
  return best;
}

/**
 * Move points by whole units. An on-curve point carries its control points
 * with it. One control point moved alone on a smooth point turns the opposite
 * one with it, keeping that one's length, so the curve stays smooth.
 */
export function movePoints(contour: SourceContour, selected: ReadonlySet<number>, dx: number, dy: number): SourceContour {
  const length = contour.length;
  const moving = new Set(selected);
  for (const index of selected) {
    if (!isOn(contour[index]!)) continue;
    for (const neighbour of [wrap(index - 1, length), wrap(index + 1, length)]) if (!isOn(contour[neighbour]!)) moving.add(neighbour);
  }
  const next = contour.map((point, index) => moving.has(index) ? { ...point, x: point.x + dx, y: point.y + dy } : point);
  if (selected.size !== 1) return next;
  const [handle] = selected as Set<number>;
  if (handle === undefined || isOn(contour[handle]!)) return next;
  const before = wrap(handle - 1, length), after = wrap(handle + 1, length);
  const anchor = isOn(contour[after]!) ? after : isOn(contour[before]!) ? before : -1;
  if (anchor < 0 || !contour[anchor]!.smooth) return next;
  const opposite = anchor === after ? wrap(anchor + 1, length) : wrap(anchor - 1, length);
  if (opposite === handle || isOn(contour[opposite]!)) return next;
  const centre = contour[anchor]!, moved = next[handle]!, other = contour[opposite]!;
  const keep = Math.hypot(other.x - centre.x, other.y - centre.y);
  const away = Math.hypot(centre.x - moved.x, centre.y - moved.y);
  if (keep > 0 && away > 0) next[opposite] = { ...other, x: Math.round(centre.x + (centre.x - moved.x) / away * keep), y: Math.round(centre.y + (centre.y - moved.y) / away * keep) };
  return next;
}

/** Split a segment at `t` with a new on-curve point, keeping its shape. Returns the new point's index. */
export function splitSegment(contour: SourceContour, segment: Segment, t: number): { contour: SourceContour; index: number } {
  const round = (point: Point, type: SourcePoint['type'], smooth = false): SourcePoint => smooth ? { x: Math.round(point.x), y: Math.round(point.y), type, smooth } : { x: Math.round(point.x), y: Math.round(point.y), type };
  const result: SourcePoint[] = [];
  let index = -1;
  if (segment.controls.length === 2) {
    const [c1, c2] = segment.controls as [number, number];
    const p0 = contour[segment.start]!, p1 = contour[c1]!, p2 = contour[c2]!, p3 = contour[segment.end]!;
    const lerp = (a: Point, b: Point): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    const a = lerp(p0, p1), b = lerp(p1, p2), c = lerp(p2, p3), d = lerp(a, b), e = lerp(b, c), middle = lerp(d, e);
    contour.forEach((point, at) => {
      if (at === c1) { result.push(round(a, 'offcurve'), round(d, 'offcurve')); index = result.length; result.push(round(middle, 'curve', true), round(e, 'offcurve'), round(c, 'offcurve')); }
      else if (at !== c2) result.push(point);
    });
    // The second control point came first in the list (the segment wraps round): the new points sit at the end.
    return { contour: result, index };
  }
  const middle = pointOn(contour, segment, t);
  contour.forEach((point, at) => {
    if (at === segment.end) { index = result.length; result.push(round(middle, 'line')); }
    result.push(point);
  });
  return { contour: result, index };
}

/**
 * Tidy a contour after points left it: a lone control point goes, a longer run
 * keeps its first and last, and each on-curve point is a line or a curve by
 * the control points before it. A contour with fewer than two points goes.
 */
export function normalise(contour: readonly SourcePoint[]): SourceContour | null {
  const start = contour.findIndex(isOn);
  if (start < 0) return null;
  const result: SourcePoint[] = [];
  let run: SourcePoint[] = [];
  for (let step = 1; step <= contour.length; step += 1) {
    const point = contour[(start + step) % contour.length]!;
    if (!isOn(point)) { run.push(point); continue; }
    const controls = run.length >= 2 ? [run[0]!, run[run.length - 1]!] : [];
    result.push(...controls, { ...point, type: controls.length ? 'curve' : 'line' });
    run = [];
  }
  if (result.length < 2) return null;
  // The walk ended on the first on-curve point; put it back first.
  return [result[result.length - 1]!, ...result.slice(0, -1)];
}

/**
 * Delete points. An on-curve point goes with its own control points, and the
 * curves on each side join into one; a control point turns its segment into a line.
 */
export function deletePoints(contour: SourceContour, selected: ReadonlySet<number>): SourceContour | null {
  const length = contour.length;
  const remove = new Set<number>();
  for (const index of selected) {
    if (isOn(contour[index]!)) {
      remove.add(index);
      for (const neighbour of [wrap(index - 1, length), wrap(index + 1, length)]) if (!isOn(contour[neighbour]!)) remove.add(neighbour);
      continue;
    }
    let end = index;
    while (!isOn(contour[end]!)) end = wrap(end + 1, length);
    for (let control = wrap(end - 1, length); !isOn(contour[control]!); control = wrap(control - 1, length)) remove.add(control);
  }
  return normalise(contour.filter((_, index) => !remove.has(index)));
}

/** Make an on-curve point smooth or a corner. Made smooth, its outgoing control point turns to continue the incoming one. */
export function toggleSmooth(contour: SourceContour, index: number): SourceContour {
  const point = contour[index];
  if (!point || !isOn(point)) return contour;
  const next = contour.map(p => p);
  if (point.smooth) { const corner = { ...point }; delete corner.smooth; next[index] = corner; return next; }
  next[index] = { ...point, smooth: true };
  const before = contour[wrap(index - 1, contour.length)]!, afterIndex = wrap(index + 1, contour.length), after = contour[afterIndex]!;
  if (isOn(before) || isOn(after)) return next;
  const incoming = Math.hypot(point.x - before.x, point.y - before.y), keep = Math.hypot(after.x - point.x, after.y - point.y);
  if (incoming > 0 && keep > 0) next[afterIndex] = { ...after, x: Math.round(point.x + (point.x - before.x) / incoming * keep), y: Math.round(point.y + (point.y - before.y) / incoming * keep) };
  return next;
}

/** Run a contour the other way round, keeping its first point. A counter runs against the outline round it. */
export function reverseContour(contour: SourceContour): SourceContour {
  const parts = segments(contour);
  const count = parts.length;
  if (count === 0) return contour;
  const result: SourcePoint[] = [];
  for (const k of [0, ...Array.from({ length: count - 1 }, (_, i) => count - 1 - i)]) {
    const part = parts[k]!, following = parts[(k + 1) % count]!;
    result.push({ ...contour[part.end]!, type: following.controls.length === 2 ? 'curve' : 'line' });
    result.push(...[...part.controls].reverse().map(index => contour[index]!));
  }
  return result;
}

/** Twice the area a contour's points enclose, positive when they run counter-clockwise (an outline), negative clockwise (a counter). */
export function winding(contour: readonly SourcePoint[]): number {
  let sum = 0;
  contour.forEach((point, index) => { const next = contour[(index + 1) % contour.length]!; sum += point.x * next.y - next.x * point.y; });
  return sum;
}

/** A rectangle, counter-clockwise from its bottom left corner. */
export function rectangle(x0: number, y0: number, x1: number, y1: number): SourceContour {
  return [{ x: x0, y: y0, type: 'line' }, { x: x1, y: y0, type: 'line' }, { x: x1, y: y1, type: 'line' }, { x: x0, y: y1, type: 'line' }];
}

/** An oval in four smooth curves, counter-clockwise from its foot. */
export function oval(x0: number, y0: number, x1: number, y1: number): SourceContour {
  const k = 0.5523, cx = Math.round((x0 + x1) / 2), cy = Math.round((y0 + y1) / 2);
  const rx = (x1 - x0) / 2, ry = (y1 - y0) / 2, hx = Math.round(rx * k), hy = Math.round(ry * k);
  const on = (x: number, y: number): SourcePoint => ({ x, y, type: 'curve', smooth: true });
  const off = (x: number, y: number): SourcePoint => ({ x, y, type: 'offcurve' });
  return [
    on(cx, y0), off(cx + hx, y0), off(x1, cy - hy), on(x1, cy), off(x1, cy + hy), off(cx + hx, y1),
    on(cx, y1), off(cx - hx, y1), off(x0, cy + hy), on(x0, cy), off(x0, cy - hy), off(cx - hx, y0),
  ];
}
