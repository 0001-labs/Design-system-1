import { describe, expect, it } from 'vite-plus/test';
import { contourProblem, type SourceContour } from '../../../../shared/font-source';
import { contourPath, deletePoints, movePoints, nearestSegment, normalise, oval, pointOn, rectangle, reverseContour, segments, splitSegment, toggleSmooth, winding } from './geometry';

const valid = (contour: SourceContour | null) => { expect(contour).not.toBeNull(); expect(contourProblem(contour!)).toBeNull(); return contour!; };

describe('font outlines', () => {
  it('reads segments round a closed contour, the closing one first', () => {
    const square = rectangle(0, 0, 100, 100);
    expect(segments(square).map(part => [part.start, part.end])).toEqual([[3, 0], [0, 1], [1, 2], [2, 3]]);
    expect(contourPath(square)).toBe('M0 0L100 0L100 100L0 100Z');
    const round = oval(0, 0, 200, 100);
    expect(segments(round).every(part => part.controls.length === 2)).toBe(true);
    expect(contourPath(round).match(/C/g)).toHaveLength(4);
  });
  it('draws an oval counter-clockwise and a reversed one as its counter, keeping the first point', () => {
    const outer = oval(0, 0, 200, 100);
    expect(winding(outer)).toBeGreaterThan(0);
    const counter = valid(reverseContour(outer));
    expect(winding(counter)).toBeLessThan(0);
    expect(counter[0]).toEqual(outer[0]);
    expect(reverseContour(counter)).toEqual(outer);
    // A contour of lines and curves keeps each segment's kind when reversed.
    const mixed: SourceContour = [{ x: 0, y: 0, type: 'line' }, { x: 100, y: 0, type: 'line' }, { x: 150, y: 50, type: 'offcurve' }, { x: 150, y: 100, type: 'offcurve' }, { x: 100, y: 150, type: 'curve' }];
    const back = valid(reverseContour(mixed));
    expect(contourPath(back)).toBe('M0 0L100 150C150 100 150 50 100 0Z');
  });
  it('moves an on-curve point with its control points, and keeps a smooth point smooth', () => {
    const round = oval(0, 0, 200, 100);
    const moved = movePoints(round, new Set([3]), 10, -5);
    expect([moved[2], moved[3], moved[4]].map(p => [p!.x, p!.y])).toEqual([[210, 17], [210, 45], [210, 73]]);
    expect(moved[0]).toBe(round[0]);
    // Drag the incoming control of the right point (smooth): the outgoing turns to stay on its line.
    const turned = movePoints(round, new Set([2]), -40, 0);
    const [a, centre, b] = [turned[2]!, turned[3]!, turned[4]!];
    const cross = (a.x - centre.x) * (b.y - centre.y) - (a.y - centre.y) * (b.x - centre.x);
    expect(Math.abs(cross)).toBeLessThan(Math.hypot(b.x - centre.x, b.y - centre.y) * 1.5);
    expect(Math.round(Math.hypot(b.x - centre.x, b.y - centre.y))).toBe(28);
    // A corner's control points move alone.
    const corner = toggleSmooth(round, 3);
    expect(corner[3]!.smooth).toBeUndefined();
    expect(movePoints(corner, new Set([2]), -40, 0)[4]).toEqual(round[4]);
  });
  it('splits lines and curves without changing their shape', () => {
    const square = rectangle(0, 0, 100, 100);
    const line = splitSegment(square, segments(square)[1]!, 0.5);
    expect(valid(line.contour)[line.index]).toEqual({ x: 50, y: 0, type: 'line' });
    const round = oval(0, 0, 200, 100);
    const part = segments(round)[1]!;
    const middle = pointOn(round, part, 0.5);
    const split = splitSegment(round, part, 0.5);
    expect(valid(split.contour)).toHaveLength(round.length + 3);
    expect(split.contour[split.index]).toEqual({ x: Math.round(middle.x), y: Math.round(middle.y), type: 'curve', smooth: true });
    // The closing segment's controls sit at the end of the list; splitting it keeps the contour whole.
    const closing = splitSegment(round, segments(round)[0]!, 0.25);
    expect(valid(closing.contour)).toHaveLength(round.length + 3);
    expect(contourPath(closing.contour).startsWith('M100 0')).toBe(true);
  });
  it('finds the segment nearest a point', () => {
    const square = rectangle(0, 0, 100, 100);
    const found = nearestSegment(square, { x: 100, y: 30 })!;
    expect(found.segment.end).toBe(2);
    expect(found.distance).toBeLessThan(2);
  });
  it('joins the curves round a deleted point, and turns a curve into a line when a control point goes', () => {
    const round = oval(0, 0, 200, 100);
    const three = valid(deletePoints(round, new Set([3])));
    expect(three.filter(point => point.type !== 'offcurve')).toHaveLength(3);
    expect(three[0]).toEqual(round[0]);
    const flat = valid(deletePoints(round, new Set([1])));
    expect(flat.filter(point => point.type === 'offcurve')).toHaveLength(6);
    expect(flat.find(point => point.x === 200 && point.y === 50)!.type).toBe('line');
    expect(deletePoints(rectangle(0, 0, 10, 10), new Set([0, 1, 2]))).toBeNull();
    expect(normalise([{ x: 0, y: 0, type: 'offcurve' }])).toBeNull();
  });
  it('turns a corner smooth by continuing its incoming control point', () => {
    const round = movePoints(toggleSmooth(oval(0, 0, 200, 100), 3), new Set([4]), 30, 0);
    const smooth = toggleSmooth(round, 3);
    expect(smooth[3]!.smooth).toBe(true);
    expect(smooth[4]!.x).toBe(200);
  });
});
