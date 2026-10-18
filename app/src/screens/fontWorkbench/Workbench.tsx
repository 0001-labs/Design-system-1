/**
 * The workbench: draw a face's outlines as cubic Béziers, glyph by glyph, with
 * the face it is measured against and any face opened from this computer drawn
 * behind as references. References are shown, never copied into the drawing.
 * The drawing is saved privately; a build written from it shows in Specimen and
 * Glyphs.
 */
import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import '../../../../DS1/2-core/ds-button';
import '../../../../DS1/3-unit/ds-tabs';
import { onShortcut } from '../../../../DS1/0-face/keys';
import { Button } from '../../../../DS1/react/button';
import { DEFAULT_METRICS, SOURCE_CHARACTERS, emptySource, validateSource, type FontSource, type SourceContour, type SourceGlyph } from '../../../../shared/font-source';
import { compileSource } from './compile';
import { deletePoints, glyphPath, movePoints, nearestSegment, oval, pointKey, readKey, rectangle, reverseContour, splitSegment, toggleSmooth, type Point, type PointKey } from './geometry';
import { readReference, type Reference } from './references';
import './workbench.css';

type Request = (path: string, init?: RequestInit) => Promise<Response>;
export type WorkbenchProps = {
  face: { id: string; name: string };
  request: Request;
  /** Hidden, the drawing stays as it is and its shortcuts rest. */
  hidden?: boolean;
  onMessage(message: string): void;
  onError(message: string): void;
  onBuildSaved(fileName: string): void;
  onDirtyChange?(dirty: boolean): void;
};

type Drag =
  | { kind: 'points'; base: FontSource; from: Point; keys: PointKey[]; moved: boolean }
  | { kind: 'advance'; base: FontSource; from: Point; advance: number; moved: boolean }
  | { kind: 'marquee'; from: Point; add: boolean }
  | { kind: 'pen'; placed: FontSource; contour: number; index: number; from: Point; moved: boolean };

const HISTORY = 200;
const defaultAdvance = (unicode: number) => unicode === 0x20 ? 245 : 600;
const characterName = (unicode: number) => unicode === 0x20 ? 'Space' : String.fromCodePoint(unicode);
const codeName = (unicode: number) => `U+${unicode.toString(16).toUpperCase().padStart(4, '0')}`;

function Control({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return <Button secondary {...props}>{children}</Button>;
}

/** The glyph for a character, or the empty one it starts as. */
const glyphOf = (source: FontSource, unicode: number): SourceGlyph => source.glyphs.find(glyph => glyph.unicode === unicode) ?? { unicode, advance: defaultAdvance(unicode), contours: [] };

/** A copy of the source with one glyph changed. A glyph left with nothing in it and its first width goes. */
function withGlyph(source: FontSource, unicode: number, change: (glyph: SourceGlyph) => SourceGlyph): FontSource {
  const glyph = change(glyphOf(source, unicode));
  const others = source.glyphs.filter(other => other.unicode !== unicode);
  const keep = glyph.contours.length > 0 || glyph.advance !== defaultAdvance(unicode);
  return { ...source, glyphs: keep ? [...others, glyph].sort((a, b) => a.unicode - b.unicode) : others };
}

/** Points by contour, from a selection. */
function byContour(keys: Iterable<PointKey>): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>();
  for (const key of keys) {
    const [contour, index] = readKey(key);
    map.set(contour, (map.get(contour) ?? new Set()).add(index));
  }
  return map;
}

function moveSelection(source: FontSource, unicode: number, keys: Iterable<PointKey>, dx: number, dy: number): FontSource {
  const chosen = byContour(keys);
  return withGlyph(source, unicode, glyph => ({ ...glyph, contours: glyph.contours.map((contour, index) => chosen.has(index) ? movePoints(contour, chosen.get(index)!, dx, dy) : contour) }));
}

export function Workbench({ face, request, hidden = false, onMessage, onError, onBuildSaved, onDirtyChange }: WorkbenchProps) {
  const [source, setSource] = useState<FontSource | null>(null);
  const [unicode, setUnicode] = useState(0x48);
  const [selection, setSelection] = useState<ReadonlySet<PointKey>>(new Set());
  const [tool, setTool] = useState<'select' | 'pen'>('select');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [layers, setLayers] = useState({ reference: true, file: true });
  const [reference, setReference] = useState<Reference | null>(null);
  const [fileReference, setFileReference] = useState<Reference | null>(null);
  const [previewFamily, setPreviewFamily] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState('Hamburgefonstiv HOHOHO nonono');
  const [marquee, setMarquee] = useState<{ from: Point; to: Point } | null>(null);
  const [pixels, setPixels] = useState(0.4);
  const [, setHistoryCount] = useState(0);
  const sourceRef = useRef<FontSource | null>(null);
  const past = useRef<FontSource[]>([]);
  const future = useRef<FontSource[]>([]);
  const drag = useRef<Drag | null>(null);
  const pen = useRef<{ contour: number; out: Point | null; firstIn: Point | null } | null>(null);
  const clipboard = useRef<SourceContour[] | null>(null);
  const canvas = useRef<SVGSVGElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const previewFace = useRef<FontFace | null>(null);
  const generation = useRef(0);

  const metrics = source?.metrics ?? DEFAULT_METRICS;
  const glyph = source ? glyphOf(source, unicode) : null;
  const advance = glyph?.advance ?? defaultAdvance(unicode);
  const drawn = useMemo(() => new Map(source?.glyphs.map(item => [item.unicode, item]) ?? []), [source]);
  // The view holds the line box and a little room round the widest glyph, in font units, y up.
  const view = useMemo(() => {
    const left = -200, right = Math.max(1000, advance + 200), top = metrics.lineAscent + 100, bottom = metrics.lineDescent - 100;
    return { x: left, y: -top, w: right - left, h: top - bottom };
  }, [advance, metrics.lineAscent, metrics.lineDescent]);

  /** Put a new source in place; recorded, the one before it can be had back with Undo. */
  function apply(next: FontSource, record: boolean, before?: FontSource) {
    const current = sourceRef.current;
    if (!current || next === current) return;
    if (record) {
      past.current.push(before ?? current);
      if (past.current.length > HISTORY) past.current.shift();
      future.current = [];
      setHistoryCount(count => count + 1);
    }
    sourceRef.current = next;
    setSource(next);
    setDirty(true);
  }
  const change = (edit: (glyph: SourceGlyph) => SourceGlyph) => { if (sourceRef.current) apply(withGlyph(sourceRef.current, unicode, edit), true); };

  function undo() {
    const previous = past.current.pop();
    if (!previous || !sourceRef.current) return;
    future.current.push(sourceRef.current);
    sourceRef.current = previous; setSource(previous); setSelection(new Set()); setDirty(true); setHistoryCount(count => count + 1);
  }
  function redo() {
    const next = future.current.pop();
    if (!next || !sourceRef.current) return;
    past.current.push(sourceRef.current);
    sourceRef.current = next; setSource(next); setSelection(new Set()); setDirty(true); setHistoryCount(count => count + 1);
  }

  // The drawing, or an empty one when nothing has been drawn yet.
  useEffect(() => {
    let cancelled = false;
    setSource(null); sourceRef.current = null; past.current = []; future.current = [];
    request(`/api/fonts/${face.id}/source`)
      .then(response => response.json()).then(validateSource)
      .catch((problem: Error & { status?: number }) => { if (problem.status === 404) return emptySource(face.name); throw problem; })
      .then(loaded => { if (!cancelled) { sourceRef.current = loaded; setSource(loaded); setDirty(false); } })
      .catch((problem: unknown) => { if (!cancelled) onError(problem instanceof Error ? problem.message : 'The drawing could not be opened.'); });
    return () => { cancelled = true; };
  }, [face.id]);

  // The face it is measured against, drawn behind each glyph.
  useEffect(() => {
    let cancelled = false;
    request('/api/fonts/file/america').then(response => response.arrayBuffer())
      .then(bytes => { if (!cancelled) setReference(readReference(new Uint8Array(bytes), DEFAULT_METRICS.unitsPerEm)); })
      .catch(() => { if (!cancelled) setReference(null); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { onDirtyChange?.(dirty); }, [dirty]);
  useEffect(() => {
    if (!dirty) return;
    const stay = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', stay);
    return () => window.removeEventListener('beforeunload', stay);
  }, [dirty]);

  // Write the drawing as a font a moment after it changes, to try it as text below.
  useEffect(() => {
    if (!source?.glyphs.some(item => item.contours.length)) { setPreviewFamily(null); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const bytes = await compileSource(source);
        const name = `WorkbenchDraft${++generation.current}`;
        const loaded = await new FontFace(name, bytes).load();
        if (cancelled) return;
        if (previewFace.current) document.fonts.delete(previewFace.current);
        document.fonts.add(loaded); previewFace.current = loaded; setPreviewFamily(name);
      } catch { /* A drawing part way through a change keeps the last preview. */ }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [source]);
  useEffect(() => () => { if (previewFace.current) document.fonts.delete(previewFace.current); }, []);

  // How many screen pixels a font unit is, so points and labels keep their size.
  useEffect(() => {
    const element = canvas.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const measure = () => { const box = element.getBoundingClientRect(); if (box.width && box.height) setPixels(Math.min(box.width / view.w, box.height / view.h)); };
    const observer = new ResizeObserver(measure);
    observer.observe(element); measure();
    return () => observer.disconnect();
  }, [view.w, view.h, source === null]);

  function toUnits(event: { clientX: number; clientY: number }): Point {
    const box = canvas.current!.getBoundingClientRect();
    const scale = Math.min(box.width / view.w, box.height / view.h) || pixels;
    const left = box.left + (box.width - view.w * scale) / 2, top = box.top + (box.height - view.h * scale) / 2;
    return { x: view.x + (event.clientX - left) / scale, y: -(view.y + (event.clientY - top) / scale) };
  }

  function finishPen() {
    const active = pen.current;
    pen.current = null;
    const current = sourceRef.current;
    if (!active || !current) return;
    // Close the last segment as it was drawn: a curve when the first or last point was dragged out.
    if (!active.out && !active.firstIn) return;
    apply(withGlyph(current, unicode, item => ({
      ...item,
      contours: item.contours.map((contour, index) => {
        if (index !== active.contour || contour.length < 2) return contour;
        const first = contour[0]!, last = contour[contour.length - 1]!;
        const out = active.out ?? last, into = active.firstIn ?? first;
        return [{ ...first, type: 'curve' as const }, ...contour.slice(1), { x: out.x, y: out.y, type: 'offcurve' as const }, { x: into.x, y: into.y, type: 'offcurve' as const }];
      }),
    })), true);
  }

  function chooseCharacter(next: number) {
    finishPen();
    setUnicode(next); setSelection(new Set()); setMarquee(null);
  }

  function onPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    const current = sourceRef.current;
    if (event.button !== 0 || !current) return;
    const at = toUnits(event);
    const target = (event.target as Element).closest('[data-point], [data-advance]');
    canvas.current?.setPointerCapture?.(event.pointerId);
    canvas.current?.focus({ preventScroll: true });
    if (tool === 'pen') {
      const x = Math.round(at.x), y = Math.round(at.y);
      const active = pen.current;
      if (active && target?.getAttribute('data-point') === pointKey(active.contour, 0)) { finishPen(); return; }
      let index = 0, contourIndex = active?.contour ?? glyphOf(current, unicode).contours.length;
      const placed = withGlyph(current, unicode, item => {
        if (!active) { contourIndex = item.contours.length; return { ...item, contours: [...item.contours, [{ x, y, type: 'line' }]] }; }
        return {
          ...item,
          contours: item.contours.map((contour, at2) => {
            if (at2 !== active.contour) return contour;
            const next: SourceContour = active.out ? [...contour, { x: active.out.x, y: active.out.y, type: 'offcurve' }, { x, y, type: 'offcurve' }, { x, y, type: 'curve' }] : [...contour, { x, y, type: 'line' }];
            index = next.length - 1;
            return next;
          }),
        };
      });
      if (!active) pen.current = { contour: contourIndex, out: null, firstIn: null };
      else active.out = null;
      apply(placed, true);
      setSelection(new Set([pointKey(contourIndex, index)]));
      drag.current = { kind: 'pen', placed, contour: contourIndex, index, from: at, moved: false };
      return;
    }
    if (target?.hasAttribute('data-advance')) { drag.current = { kind: 'advance', base: current, from: at, advance, moved: false }; return; }
    const key = target?.getAttribute('data-point') as PointKey | null;
    if (key) {
      const next = new Set(selection);
      if (event.shiftKey) { if (!next.delete(key)) next.add(key); }
      else if (!selection.has(key)) { next.clear(); next.add(key); }
      setSelection(next);
      drag.current = { kind: 'points', base: current, from: at, keys: [...next], moved: false };
      return;
    }
    drag.current = { kind: 'marquee', from: at, add: event.shiftKey };
    setMarquee({ from: at, to: at });
  }

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active) return;
    const at = toUnits(event);
    if (active.kind === 'marquee') { setMarquee({ from: active.from, to: at }); return; }
    let dx = Math.round(at.x - active.from.x), dy = Math.round(at.y - active.from.y);
    if (!active.moved && Math.hypot(dx, dy) * pixels < 3) return;
    const first = !active.moved;
    active.moved = true;
    if (active.kind === 'points') {
      if (event.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      apply(moveSelection(active.base, unicode, active.keys, dx, dy), first, active.base);
    } else if (active.kind === 'advance') {
      apply(withGlyph(active.base, unicode, item => ({ ...item, advance: Math.max(0, active.advance + dx) })), first, active.base);
    } else if (active.kind === 'pen') {
      // Dragging out from a point just placed gives it smooth handles: the drag is the way on, its mirror the way in.
      // Each move starts again from the source as it was when the point was placed.
      const state = pen.current;
      if (!state) return;
      const handle = { x: Math.round(at.x), y: Math.round(at.y) };
      const placedContour = glyphOf(active.placed, unicode).contours[active.contour];
      const point = placedContour?.[active.index];
      if (!placedContour || !point) return;
      const mirror = { x: 2 * point.x - handle.x, y: 2 * point.y - handle.y };
      const next = placedContour.map(p => p);
      let index = active.index;
      if (active.index === 0) { next[0] = { ...point, smooth: true }; state.firstIn = mirror; }
      else if (point.type === 'curve') { next[index] = { ...point, smooth: true }; next[index - 1] = { ...next[index - 1]!, x: mirror.x, y: mirror.y }; }
      else {
        // A line point turns into a curve: the segment before it gets handles, the first at the point it leaves.
        const before = placedContour[index - 1]!;
        next.splice(index, 1, { x: before.x, y: before.y, type: 'offcurve' }, { x: mirror.x, y: mirror.y, type: 'offcurve' }, { ...point, type: 'curve', smooth: true });
        index += 2;
      }
      state.out = handle;
      apply(withGlyph(active.placed, unicode, item => ({ ...item, contours: item.contours.map((contour, at2) => at2 === active.contour ? next : contour) })), false);
      if (first) setSelection(new Set([pointKey(active.contour, index)]));
    }
  }

  function onPointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    const active = drag.current;
    drag.current = null;
    canvas.current?.releasePointerCapture?.(event.pointerId);
    if (active?.kind !== 'marquee') return;
    const to = toUnits(event);
    setMarquee(null);
    if (Math.hypot(to.x - active.from.x, to.y - active.from.y) * pixels < 3) { if (!active.add) setSelection(new Set()); return; }
    const [x0, x1] = [Math.min(active.from.x, to.x), Math.max(active.from.x, to.x)], [y0, y1] = [Math.min(active.from.y, to.y), Math.max(active.from.y, to.y)];
    const inside = new Set(active.add ? selection : []);
    glyph?.contours.forEach((contour, c) => contour.forEach((point, index) => { if (point.x >= x0 && point.x <= x1 && point.y >= y0 && point.y <= y1) inside.add(pointKey(c, index)); }));
    setSelection(inside);
  }

  function onDoubleClick(event: ReactMouseEvent<SVGSVGElement>) {
    if (tool !== 'select' || !glyph) return;
    const key = (event.target as Element).closest('[data-point]')?.getAttribute('data-point') as PointKey | null;
    if (key) {
      // A double-click on a point chooses its whole contour.
      const [contour] = readKey(key);
      setSelection(new Set(glyph.contours[contour]!.map((_, index) => pointKey(contour, index))));
      return;
    }
    // A double-click on the outline adds a point there.
    const at = toUnits(event);
    let near: { contour: number; found: NonNullable<ReturnType<typeof nearestSegment>> } | null = null;
    for (const [index, contour] of glyph.contours.entries()) {
      const found = nearestSegment(contour, at);
      if (found && (!near || found.distance < near.found.distance)) near = { contour: index, found };
    }
    if (!near || near.found.distance * pixels > 8) return;
    const target = near;
    let added = -1;
    change(item => ({ ...item, contours: item.contours.map((contour, index) => { if (index !== target.contour) return contour; const split = splitSegment(contour, target.found.segment, target.found.t); added = split.index; return split.contour; }) }));
    if (added >= 0) setSelection(new Set([pointKey(target.contour, added)]));
  }

  const chosen = byContour(selection);
  const removeSelection = () => {
    if (!selection.size) return;
    change(item => ({ ...item, contours: item.contours.flatMap((contour, index) => { const points = chosen.get(index); if (!points) return [contour]; const kept = deletePoints(contour, points); return kept ? [kept] : []; }) }));
    setSelection(new Set());
  };
  const smoothSelection = () => change(item => ({ ...item, contours: item.contours.map((contour, index) => [...(chosen.get(index) ?? [])].reduce((next, at) => toggleSmooth(next, at), contour)) }));
  const reverseSelection = () => {
    const targets = chosen.size ? chosen : new Map(glyph?.contours.map((_, index) => [index, new Set<number>()]) ?? []);
    change(item => ({ ...item, contours: item.contours.map((contour, index) => targets.has(index) ? reverseContour(contour) : contour) }));
    setSelection(new Set());
  };
  const addContour = (contour: SourceContour) => {
    const index = glyph?.contours.length ?? 0;
    change(item => ({ ...item, contours: [...item.contours, contour] }));
    setSelection(new Set(contour.map((_, at) => pointKey(index, at))));
  };
  // A stem as tall as the capitals, and a round as tall as the lower case with its overshoot.
  const addRectangle = () => { const middle = Math.round(advance / 2); addContour(rectangle(middle - 45, 0, middle + 45, metrics.capHeight)); };
  const addOval = () => addContour(oval(60, -10, Math.max(160, advance - 60), metrics.xHeight + 10));
  const nudge = (dx: number, dy: number) => { if (selection.size && sourceRef.current) apply(moveSelection(sourceRef.current, unicode, selection, dx, dy), true); };

  async function saveDrawing(): Promise<boolean> {
    const current = sourceRef.current;
    if (!current) return false;
    setBusy(true);
    try {
      await request(`/api/fonts/${face.id}/source`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(current) });
      if (sourceRef.current === current) setDirty(false);
      onMessage('Drawing saved privately. Earlier drawings are kept.');
      return true;
    } catch (problem) { onError(problem instanceof Error ? problem.message : 'The drawing could not be saved.'); return false; }
    finally { setBusy(false); }
  }

  async function saveBuild() {
    if (dirty && !(await saveDrawing())) return;
    const current = sourceRef.current;
    if (!current) return;
    setBusy(true);
    try {
      const bytes = await compileSource(current);
      const fileName = `${current.family.replace(/\s+/g, '-')}-${current.style}.otf`;
      await request(`/api/fonts/${face.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream', 'X-Font-Name': fileName }, body: bytes });
      onBuildSaved(fileName);
      onMessage('Build saved privately. Specimen and Glyphs show it.');
    } catch (problem) { onError(problem instanceof Error ? problem.message : 'The build could not be saved.'); }
    finally { setBusy(false); }
  }

  async function openReference(file: File | undefined) {
    if (!file) return;
    try {
      setFileReference(readReference(new Uint8Array(await file.arrayBuffer()), metrics.unitsPerEm));
      setLayers(value => ({ ...value, file: true }));
      onMessage(`${file.name} is drawn behind each glyph. It stays on this computer.`);
    } catch { onError('This file could not be opened as a font. Choose a TTF, OTF, TTC, WOFF or WOFF2 file.'); }
    finally { if (picker.current) picker.current.value = ''; }
  }

  // Shortcuts work while the workbench is shown and nothing is being typed.
  const actions = useRef({ undo, redo, nudge, removeSelection, saveDrawing, finishPen, setTool, selectAll: () => {}, copy: () => {}, paste: () => {} });
  actions.current = {
    undo, redo, nudge, removeSelection, saveDrawing, finishPen, setTool,
    selectAll: () => setSelection(new Set(glyph?.contours.flatMap((contour, c) => contour.map((_, index) => pointKey(c, index))) ?? [])),
    copy: () => { if (!glyph) return; const picked = glyph.contours.filter((_, index) => !chosen.size || chosen.has(index)); if (picked.length) { clipboard.current = picked; onMessage(`${picked.length === 1 ? 'One contour' : `${picked.length} contours`} copied.`); } },
    paste: () => { const contours = clipboard.current; if (!contours || !glyph) return; const start = glyph.contours.length; change(item => ({ ...item, contours: [...item.contours, ...contours] })); setSelection(new Set(contours.flatMap((contour, c) => contour.map((_, index) => pointKey(start + c, index))))); },
  };
  useEffect(() => {
    if (hidden) return;
    const controller = new AbortController();
    const bind = (keys: string | string[], run: () => void, typing = false) => onShortcut(keys, run, { signal: controller.signal, typing });
    bind('mod+z', () => actions.current.undo());
    bind(['mod+shift+z', 'mod+y'], () => actions.current.redo());
    bind('mod+s', () => void actions.current.saveDrawing(), true);
    bind('mod+a', () => actions.current.selectAll());
    bind('mod+c', () => actions.current.copy());
    bind('mod+v', () => actions.current.paste());
    bind(['backspace', 'delete'], () => actions.current.removeSelection());
    bind('escape', () => { actions.current.finishPen(); setSelection(new Set()); });
    bind('v', () => { actions.current.finishPen(); actions.current.setTool('select'); });
    bind('p', () => actions.current.setTool('pen'));
    for (const [key, dx, dy] of [['arrowleft', -1, 0], ['arrowright', 1, 0], ['arrowup', 0, 1], ['arrowdown', 0, -1]] as const) {
      bind(key, () => actions.current.nudge(dx, dy));
      bind(`shift+${key}`, () => actions.current.nudge(dx * 10, dy * 10));
    }
    return () => controller.abort();
  }, [hidden]);

  if (!source || !glyph) return <div className="workbench" hidden={hidden} aria-busy="true"><p className="workbench-loading">Opening the drawing…</p></div>;

  const guides = [
    { name: 'Ascender', y: metrics.ascender }, { name: 'Cap height', y: metrics.capHeight }, { name: 'x-height', y: metrics.xHeight },
    { name: 'Baseline', y: 0 }, { name: 'Descender', y: metrics.descender },
  ];
  const size = (screen: number) => screen / pixels;
  const referencePath = layers.reference ? reference?.glyph(unicode) : null;
  const filePath = layers.file ? fileReference?.glyph(unicode) : null;
  const canSmooth = [...selection].some(key => { const [c, i] = readKey(key); return glyph.contours[c]?.[i]?.type !== 'offcurve'; });
  const thumbnail = (item: SourceGlyph | undefined, code: number) => `-50 ${-metrics.lineAscent} ${Math.max(item?.advance ?? defaultAdvance(code), 500) + 100} ${metrics.lineAscent - metrics.lineDescent}`;
  const fontFamily = previewFamily ? `"${previewFamily}", var(--typeface-mono)` : 'var(--typeface-mono)';

  return <div className="workbench" hidden={hidden}>
    <div className="workbench-tools">
      <ds-tabs role="group" aria-label="Tool">
        <Button active={tool === 'select'} aria-pressed={tool === 'select'} onClick={() => { finishPen(); setTool('select'); }}>Select</Button>
        <Button active={tool === 'pen'} aria-pressed={tool === 'pen'} onClick={() => setTool('pen')}>Pen</Button>
      </ds-tabs>
      <Control onClick={addRectangle}>Rectangle</Control>
      <Control onClick={addOval}>Oval</Control>
      <Control disabled={!canSmooth} onClick={smoothSelection}>Smooth</Control>
      <Control disabled={!glyph.contours.length} onClick={reverseSelection}>Reverse</Control>
      <Control disabled={!selection.size} onClick={removeSelection}>Delete</Control>
      <Control disabled={!past.current.length} onClick={undo}>Undo</Control>
      <Control disabled={!future.current.length} onClick={redo}>Redo</Control>
      <Control disabled={!reference} aria-pressed={Boolean(reference && layers.reference)} onClick={() => setLayers(value => ({ ...value, reference: !value.reference }))}>GT America</Control>
      <input ref={picker} className="workbench-file" type="file" accept=".ttf,.otf,.ttc,.woff,.woff2" onChange={event => void openReference(event.target.files?.[0])} />
      {fileReference
        ? <><Control aria-pressed={layers.file} onClick={() => setLayers(value => ({ ...value, file: !value.file }))}>{fileReference.name}</Control><Control onClick={() => picker.current?.click()}>Other reference</Control></>
        : <Control onClick={() => picker.current?.click()}>Open reference</Control>}
      <Control disabled={busy || !dirty} onClick={() => void saveDrawing()}>Save drawing</Control>
      <Control disabled={busy || !source.glyphs.some(item => item.contours.length)} onClick={() => void saveBuild()}>Save as build</Control>
    </div>
    <div className="workbench-glyphs" role="group" aria-label="Characters">
      {SOURCE_CHARACTERS.map(code => {
        const item = drawn.get(code);
        return <button key={code} type="button" className="workbench-glyph" aria-pressed={code === unicode} aria-label={`${characterName(code)}, ${codeName(code)}${item?.contours.length ? '' : ', not drawn'}`} onClick={() => chooseCharacter(code)}>
          <svg viewBox={thumbnail(item, code)} aria-hidden="true"><g transform="scale(1 -1)"><path d={glyphPath(item)} /></g></svg>
          <span>{characterName(code)}</span>
        </button>;
      })}
    </div>
    <div className="workbench-main">
      <div className="workbench-glyph-info">
        <span className="workbench-glyph-name">{characterName(unicode)}</span>
        <span>{codeName(unicode)}</span>
        <label>Width <input className="ds-input workbench-width" type="number" min={0} max={4000} value={advance} onChange={event => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 0 && value <= 4000) change(item => ({ ...item, advance: value })); }} /></label>
        {referencePath && <span className="workbench-reference-width">GT America {referencePath.advance}</span>}
      </div>
      <svg
        ref={canvas}
        className="workbench-canvas"
        data-tool={tool}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        role="application"
        aria-label={`Drawing of ${characterName(unicode)}`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current = null; setMarquee(null); }}
        onDoubleClick={onDoubleClick}
      >
        <g transform="scale(1 -1)">
          {guides.map(guide => <g key={guide.name}>
            <line className="workbench-guide" x1={view.x} x2={view.x + view.w} y1={guide.y} y2={guide.y} />
            <text className="workbench-guide-label" transform="scale(1 -1)" x={view.x + size(8)} y={-guide.y - size(4)} fontSize={size(10)}>{guide.name} {guide.y}</text>
          </g>)}
          <line className="workbench-side" x1={0} x2={0} y1={metrics.lineDescent - 100} y2={metrics.lineAscent + 100} />
          <line className="workbench-side" x1={advance} x2={advance} y1={metrics.lineDescent - 100} y2={metrics.lineAscent + 100} />
          {tool === 'select' && <line className="workbench-advance" data-advance="" x1={advance} x2={advance} y1={metrics.lineDescent - 100} y2={metrics.lineAscent + 100} strokeWidth={size(10)} />}
          {referencePath && <path className="workbench-reference" d={referencePath.d} />}
          {filePath && <path className="workbench-reference workbench-reference-file" d={filePath.d} />}
          <path className="workbench-outline" d={glyphPath(glyph)} />
          {glyph.contours.map((contour, c) => contour.map((point, index) => {
            if (point.type === 'offcurve') return null;
            return [contour[(index - 1 + contour.length) % contour.length]!, contour[(index + 1) % contour.length]!]
              .filter(neighbour => neighbour.type === 'offcurve')
              .map((handle, side) => <line key={`${c}:${index}:${side}`} className="workbench-handle" x1={point.x} y1={point.y} x2={handle.x} y2={handle.y} />);
          }))}
          {glyph.contours.map((contour, c) => contour.map((point, index) => {
            const key = pointKey(c, index);
            const selected = selection.has(key) || undefined;
            const first = index === 0 ? '' : undefined;
            if (point.type === 'offcurve') return <circle key={key} className="workbench-point workbench-control" data-point={key} data-selected={selected ? '' : undefined} cx={point.x} cy={point.y} r={size(3)} />;
            if (point.smooth) return <circle key={key} className="workbench-point" data-point={key} data-first={first} data-selected={selected ? '' : undefined} cx={point.x} cy={point.y} r={size(4)} />;
            return <rect key={key} className="workbench-point" data-point={key} data-first={first} data-selected={selected ? '' : undefined} x={point.x - size(3.5)} y={point.y - size(3.5)} width={size(7)} height={size(7)} />;
          }))}
          {marquee && <rect className="workbench-marquee" x={Math.min(marquee.from.x, marquee.to.x)} y={Math.min(marquee.from.y, marquee.to.y)} width={Math.abs(marquee.to.x - marquee.from.x)} height={Math.abs(marquee.to.y - marquee.from.y)} />}
        </g>
      </svg>
    </div>
    <div className="workbench-preview">
      <input className="workbench-preview-line" aria-label="Preview text" spellCheck={false} value={previewText} onChange={event => setPreviewText(event.target.value)} style={{ fontFamily }} />
      <div className="workbench-preview-large" aria-hidden="true" style={{ fontFamily }}>{previewText}</div>
    </div>
  </div>;
}
