/**
 * The workbench: draw a face's outlines as cubic Béziers, glyph by glyph, with
 * the face it is measured against and any face opened from this computer drawn
 * behind as references. References are shown, never copied into the drawing.
 * The drawing is saved privately; a build written from it shows in Specimen and
 * Glyphs.
 */
import { html, nothing, svg } from 'lit';
import { live } from 'lit/directives/live.js';
import '../../../../DS1/2-core/ds-button';
import '../../../../DS1/3-unit/ds-tabs';
import { onShortcut } from '../../../../DS1/0-face/keys';
import { DEFAULT_METRICS, SOURCE_CHARACTERS, emptySource, validateSource, type FontSource, type SourceContour, type SourceGlyph } from '../../../../shared/font-source';
import { AppElement, defineElement } from '../../lib/element';
import { button } from '../../lib/ui';
import { compileSource } from './compile';
import { deletePoints, glyphPath, movePoints, nearestSegment, oval, pointKey, readKey, rectangle, reverseContour, splitSegment, toggleSmooth, type Point, type PointKey } from './geometry';
import { readReference, type Reference } from './references';
import './workbench.css';

type Request = (path: string, init?: RequestInit) => Promise<Response>;
export type WorkbenchFace = { id: string; name: string };

type Drag =
  | { kind: 'points'; base: FontSource; from: Point; keys: PointKey[]; moved: boolean }
  | { kind: 'advance'; base: FontSource; from: Point; advance: number; moved: boolean }
  | { kind: 'marquee'; from: Point; add: boolean }
  | { kind: 'pen'; placed: FontSource; contour: number; index: number; from: Point; moved: boolean };

const HISTORY = 200;
const defaultAdvance = (unicode: number) => unicode === 0x20 ? 245 : 600;
const characterName = (unicode: number) => unicode === 0x20 ? 'Space' : String.fromCodePoint(unicode);
const codeName = (unicode: number) => `U+${unicode.toString(16).toUpperCase().padStart(4, '0')}`;

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

/**
 * `<ds1-font-workbench>`: `face` and `request` (the workspace's authorised
 * fetch) in; `hidden` keeps the drawing as it is and rests its shortcuts. It
 * tells the workspace `workbench-message`, `workbench-error`, `build-saved`
 * (the build's file name) and `dirty-change`.
 */
export class FontWorkbench extends AppElement {
  static properties = {
    face: { attribute: false },
    request: { attribute: false },
    hidden: { type: Boolean },
    source: { state: true },
    unicode: { state: true },
    selection: { state: true },
    tool: { state: true },
    dirty: { state: true },
    busy: { state: true },
    layers: { state: true },
    reference: { state: true },
    fileReference: { state: true },
    previewFamily: { state: true },
    previewText: { state: true },
    marquee: { state: true },
    pixels: { state: true },
  };
  declare face: WorkbenchFace;
  declare request: Request | undefined;
  declare hidden: boolean;
  declare source: FontSource | null;
  declare unicode: number;
  declare selection: ReadonlySet<PointKey>;
  declare tool: 'select' | 'pen';
  declare dirty: boolean;
  declare busy: boolean;
  declare layers: { reference: boolean; file: boolean };
  declare reference: Reference | null;
  declare fileReference: Reference | null;
  declare previewFamily: string | null;
  declare previewText: string;
  declare marquee: { from: Point; to: Point } | null;
  declare pixels: number;

  #past: FontSource[] = [];
  #future: FontSource[] = [];
  #drag: Drag | null = null;
  #pen: { contour: number; out: Point | null; firstIn: Point | null } | null = null;
  #clipboard: SourceContour[] | null = null;
  #previewFace: FontFace | null = null;
  #previewTimer: ReturnType<typeof setTimeout> | null = null;
  #generation = 0;
  #loadedFace: string | null = null;
  #loading = 0;
  #referenceAsked = false;
  #observer: ResizeObserver | null = null;
  #observed: Element | null = null;
  #shortcuts: AbortController | null = null;

  constructor() {
    super();
    this.hidden = false;
    this.source = null;
    this.unicode = 0x48;
    this.selection = new Set();
    this.tool = 'select';
    this.dirty = false;
    this.busy = false;
    this.layers = { reference: true, file: true };
    this.reference = null;
    this.fileReference = null;
    this.previewFamily = null;
    this.previewText = 'Hamburgefonstiv HOHOHO nonono';
    this.marquee = null;
    this.pixels = 0.4;
  }

  #canvas() {
    return this.querySelector<SVGSVGElement>('.workbench-canvas');
  }

  #metrics() {
    return this.source?.metrics ?? DEFAULT_METRICS;
  }

  #glyph() {
    return this.source ? glyphOf(this.source, this.unicode) : null;
  }

  #advance() {
    return this.#glyph()?.advance ?? defaultAdvance(this.unicode);
  }

  /** The view holds the line box and a little room round the widest glyph, in font units, y up. */
  #view() {
    const metrics = this.#metrics();
    const left = -200, right = Math.max(1000, this.#advance() + 200), top = metrics.lineAscent + 100, bottom = metrics.lineDescent - 100;
    return { x: left, y: -top, w: right - left, h: top - bottom };
  }

  /** Put a new source in place; recorded, the one before it can be had back with Undo. */
  #apply(next: FontSource, record: boolean, before?: FontSource) {
    const current = this.source;
    if (!current || next === current) return;
    if (record) {
      this.#past.push(before ?? current);
      if (this.#past.length > HISTORY) this.#past.shift();
      this.#future = [];
    }
    this.source = next;
    this.dirty = true;
  }

  #change(edit: (glyph: SourceGlyph) => SourceGlyph) {
    if (this.source) this.#apply(withGlyph(this.source, this.unicode, edit), true);
  }

  #undo() {
    const previous = this.#past.pop();
    if (!previous || !this.source) return;
    this.#future.push(this.source);
    this.source = previous; this.selection = new Set(); this.dirty = true;
  }

  #redo() {
    const next = this.#future.pop();
    if (!next || !this.source) return;
    this.#past.push(this.source);
    this.source = next; this.selection = new Set(); this.dirty = true;
  }

  /** The drawing, or an empty one when nothing has been drawn yet. */
  #load() {
    const face = this.face;
    const loading = ++this.#loading;
    this.source = null; this.#past = []; this.#future = [];
    this.request!(`/api/fonts/${face.id}/source`)
      .then(response => response.json()).then(validateSource)
      .catch((problem: Error & { status?: number }) => { if (problem.status === 404) return emptySource(face.name); throw problem; })
      .then(loaded => { if (loading === this.#loading) { this.source = loaded; this.dirty = false; } })
      .catch((problem: unknown) => { if (loading === this.#loading) this.emit('workbench-error', problem instanceof Error ? problem.message : 'The drawing could not be opened.'); });
  }

  override willUpdate() {
    if (this.face && this.request && this.face.id !== this.#loadedFace) {
      this.#loadedFace = this.face.id;
      this.#load();
    }
    // The face it is measured against, drawn behind each glyph.
    if (this.request && !this.#referenceAsked) {
      this.#referenceAsked = true;
      this.request('/api/fonts/file/america').then(response => response.arrayBuffer())
        .then(bytes => { if (this.isConnected) this.reference = readReference(new Uint8Array(bytes), DEFAULT_METRICS.unitsPerEm); })
        .catch(() => { this.reference = null; });
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('beforeunload', this.#stay);
    if (this.hasUpdated) this.requestUpdate();
  }

  override disconnectedCallback() {
    window.removeEventListener('beforeunload', this.#stay);
    this.#shortcuts?.abort();
    this.#shortcuts = null;
    this.#observer?.disconnect();
    this.#observer = this.#observed = null;
    if (this.#previewTimer) clearTimeout(this.#previewTimer);
    if (this.#previewFace) document.fonts.delete(this.#previewFace);
    this.#previewFace = null;
    super.disconnectedCallback();
  }

  #stay = (event: BeforeUnloadEvent) => { if (this.dirty) event.preventDefault(); };

  override updated(changed: Map<string, unknown>) {
    if (changed.has('dirty')) this.emit('dirty-change', this.dirty);
    if (changed.has('source')) this.#schedulePreview();
    this.#observe();
    // Shortcuts work while the workbench is shown and nothing is being typed.
    if (this.hidden && this.#shortcuts) { this.#shortcuts.abort(); this.#shortcuts = null; }
    if (!this.hidden && !this.#shortcuts) this.#bindShortcuts();
  }

  /** Write the drawing as a font a moment after it changes, to try it as text below. */
  #schedulePreview() {
    if (this.#previewTimer) clearTimeout(this.#previewTimer);
    this.#previewTimer = null;
    const source = this.source;
    if (!source?.glyphs.some(item => item.contours.length)) { this.previewFamily = null; return; }
    this.#previewTimer = setTimeout(async () => {
      try {
        const bytes = await compileSource(source);
        const name = `WorkbenchDraft${++this.#generation}`;
        const loaded = await new FontFace(name, bytes).load();
        if (source !== this.source || !this.isConnected) return;
        if (this.#previewFace) document.fonts.delete(this.#previewFace);
        document.fonts.add(loaded); this.#previewFace = loaded; this.previewFamily = name;
      } catch { /* A drawing part way through a change keeps the last preview. */ }
    }, 300);
  }

  /** How many screen pixels a font unit is, so points and labels keep their size. */
  #observe() {
    const element = this.#canvas();
    if (element === this.#observed) { if (element) this.#measure(); return; }
    this.#observer?.disconnect();
    this.#observer = null;
    this.#observed = element;
    if (!element || typeof ResizeObserver === 'undefined') return;
    this.#observer = new ResizeObserver(() => this.#measure());
    this.#observer.observe(element);
    this.#measure();
  }

  #measure() {
    const element = this.#canvas();
    if (!element) return;
    const view = this.#view();
    const box = element.getBoundingClientRect();
    if (box.width && box.height) {
      const pixels = Math.min(box.width / view.w, box.height / view.h);
      if (pixels !== this.pixels) this.pixels = pixels;
    }
  }

  #bindShortcuts() {
    const controller = this.#shortcuts = new AbortController();
    const bind = (keys: string | string[], run: () => void, typing = false) => onShortcut(keys, run, { signal: controller.signal, typing });
    bind('mod+z', () => this.#undo());
    bind(['mod+shift+z', 'mod+y'], () => this.#redo());
    bind('mod+s', () => void this.#saveDrawing(), true);
    bind('mod+a', () => this.#selectAll());
    bind('mod+c', () => this.#copy());
    bind('mod+v', () => this.#paste());
    bind(['backspace', 'delete'], () => this.#removeSelection());
    bind('escape', () => { this.#finishPen(); this.selection = new Set(); });
    bind('v', () => { this.#finishPen(); this.tool = 'select'; });
    bind('p', () => { this.tool = 'pen'; });
    for (const [key, dx, dy] of [['arrowleft', -1, 0], ['arrowright', 1, 0], ['arrowup', 0, 1], ['arrowdown', 0, -1]] as const) {
      bind(key, () => this.#nudge(dx, dy));
      bind(`shift+${key}`, () => this.#nudge(dx * 10, dy * 10));
    }
  }

  #toUnits(event: { clientX: number; clientY: number }): Point {
    const view = this.#view();
    const box = this.#canvas()!.getBoundingClientRect();
    const scale = Math.min(box.width / view.w, box.height / view.h) || this.pixels;
    const left = box.left + (box.width - view.w * scale) / 2, top = box.top + (box.height - view.h * scale) / 2;
    return { x: view.x + (event.clientX - left) / scale, y: -(view.y + (event.clientY - top) / scale) };
  }

  #finishPen() {
    const active = this.#pen;
    this.#pen = null;
    const current = this.source;
    const unicode = this.unicode;
    if (!active || !current) return;
    // A contour of one or two points left by the pen draws nothing: it goes.
    if ((glyphOf(current, unicode).contours[active.contour]?.length ?? 0) < 3) {
      this.#apply(withGlyph(current, unicode, item => ({ ...item, contours: item.contours.filter((_, index) => index !== active.contour) })), false);
      this.selection = new Set();
      return;
    }
    // Close the last segment as it was drawn: a curve when the first or last point was dragged out.
    if (!active.out && !active.firstIn) return;
    this.#apply(withGlyph(current, unicode, item => ({
      ...item,
      contours: item.contours.map((contour, index) => {
        if (index !== active.contour || contour.length < 2) return contour;
        const first = contour[0]!, last = contour[contour.length - 1]!;
        const out = active.out ?? last, into = active.firstIn ?? first;
        return [{ ...first, type: 'curve' as const }, ...contour.slice(1), { x: out.x, y: out.y, type: 'offcurve' as const }, { x: into.x, y: into.y, type: 'offcurve' as const }];
      }),
    })), true);
  }

  #chooseCharacter(next: number) {
    this.#finishPen();
    this.unicode = next; this.selection = new Set(); this.marquee = null;
  }

  #onPointerDown = (event: PointerEvent) => {
    const current = this.source;
    const unicode = this.unicode;
    if (event.button !== 0 || !current) return;
    const at = this.#toUnits(event);
    const target = (event.target as Element).closest('[data-point], [data-advance]');
    const canvas = this.#canvas();
    canvas?.setPointerCapture?.(event.pointerId);
    canvas?.focus({ preventScroll: true });
    if (this.tool === 'pen') {
      const x = Math.round(at.x), y = Math.round(at.y);
      const active = this.#pen;
      if (active && target?.getAttribute('data-point') === pointKey(active.contour, 0)) { this.#finishPen(); return; }
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
      if (!active) this.#pen = { contour: contourIndex, out: null, firstIn: null };
      else active.out = null;
      this.#apply(placed, true);
      this.selection = new Set([pointKey(contourIndex, index)]);
      this.#drag = { kind: 'pen', placed, contour: contourIndex, index, from: at, moved: false };
      return;
    }
    if (target?.hasAttribute('data-advance')) { this.#drag = { kind: 'advance', base: current, from: at, advance: this.#advance(), moved: false }; return; }
    const key = target?.getAttribute('data-point') as PointKey | null;
    if (key) {
      const next = new Set(this.selection);
      if (event.shiftKey) { if (!next.delete(key)) next.add(key); }
      else if (!this.selection.has(key)) { next.clear(); next.add(key); }
      this.selection = next;
      this.#drag = { kind: 'points', base: current, from: at, keys: [...next], moved: false };
      return;
    }
    this.#drag = { kind: 'marquee', from: at, add: event.shiftKey };
    this.marquee = { from: at, to: at };
  };

  #onPointerMove = (event: PointerEvent) => {
    const active = this.#drag;
    if (!active) return;
    const unicode = this.unicode;
    const at = this.#toUnits(event);
    if (active.kind === 'marquee') { this.marquee = { from: active.from, to: at }; return; }
    let dx = Math.round(at.x - active.from.x), dy = Math.round(at.y - active.from.y);
    if (!active.moved && Math.hypot(dx, dy) * this.pixels < 3) return;
    const first = !active.moved;
    active.moved = true;
    if (active.kind === 'points') {
      if (event.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      this.#apply(moveSelection(active.base, unicode, active.keys, dx, dy), first, active.base);
    } else if (active.kind === 'advance') {
      this.#apply(withGlyph(active.base, unicode, item => ({ ...item, advance: Math.max(0, active.advance + dx) })), first, active.base);
    } else if (active.kind === 'pen') {
      // Dragging out from a point just placed gives it smooth handles: the drag is the way on, its mirror the way in.
      // Each move starts again from the source as it was when the point was placed.
      const state = this.#pen;
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
      this.#apply(withGlyph(active.placed, unicode, item => ({ ...item, contours: item.contours.map((contour, at2) => at2 === active.contour ? next : contour) })), false);
      if (first) this.selection = new Set([pointKey(active.contour, index)]);
    }
  };

  #onPointerUp = (event: PointerEvent) => {
    const active = this.#drag;
    this.#drag = null;
    this.#canvas()?.releasePointerCapture?.(event.pointerId);
    if (active?.kind !== 'marquee') return;
    const to = this.#toUnits(event);
    this.marquee = null;
    if (Math.hypot(to.x - active.from.x, to.y - active.from.y) * this.pixels < 3) { if (!active.add) this.selection = new Set(); return; }
    const [x0, x1] = [Math.min(active.from.x, to.x), Math.max(active.from.x, to.x)], [y0, y1] = [Math.min(active.from.y, to.y), Math.max(active.from.y, to.y)];
    const inside = new Set(active.add ? this.selection : []);
    this.#glyph()?.contours.forEach((contour, c) => contour.forEach((point, index) => { if (point.x >= x0 && point.x <= x1 && point.y >= y0 && point.y <= y1) inside.add(pointKey(c, index)); }));
    this.selection = inside;
  };

  #onDoubleClick = (event: MouseEvent) => {
    const glyph = this.#glyph();
    if (this.tool !== 'select' || !glyph) return;
    const key = (event.target as Element).closest('[data-point]')?.getAttribute('data-point') as PointKey | null;
    if (key) {
      // A double-click on a point chooses its whole contour.
      const [contour] = readKey(key);
      this.selection = new Set(glyph.contours[contour]!.map((_, index) => pointKey(contour, index)));
      return;
    }
    // A double-click on the outline adds a point there.
    const at = this.#toUnits(event);
    let near: { contour: number; found: NonNullable<ReturnType<typeof nearestSegment>> } | null = null;
    for (const [index, contour] of glyph.contours.entries()) {
      const found = nearestSegment(contour, at);
      if (found && (!near || found.distance < near.found.distance)) near = { contour: index, found };
    }
    if (!near || near.found.distance * this.pixels > 8) return;
    const target = near;
    let added = -1;
    this.#change(item => ({ ...item, contours: item.contours.map((contour, index) => { if (index !== target.contour) return contour; const split = splitSegment(contour, target.found.segment, target.found.t); added = split.index; return split.contour; }) }));
    if (added >= 0) this.selection = new Set([pointKey(target.contour, added)]);
  };

  #chosen() {
    return byContour(this.selection);
  }

  #removeSelection() {
    if (!this.selection.size) return;
    const chosen = this.#chosen();
    this.#change(item => ({ ...item, contours: item.contours.flatMap((contour, index) => { const points = chosen.get(index); if (!points) return [contour]; const kept = deletePoints(contour, points); return kept ? [kept] : []; }) }));
    this.selection = new Set();
  }

  #smoothSelection() {
    const chosen = this.#chosen();
    this.#change(item => ({ ...item, contours: item.contours.map((contour, index) => [...(chosen.get(index) ?? [])].reduce((next, at) => toggleSmooth(next, at), contour)) }));
  }

  #reverseSelection() {
    const chosen = this.#chosen();
    const targets = chosen.size ? chosen : new Map(this.#glyph()?.contours.map((_, index) => [index, new Set<number>()]) ?? []);
    this.#change(item => ({ ...item, contours: item.contours.map((contour, index) => targets.has(index) ? reverseContour(contour) : contour) }));
    this.selection = new Set();
  }

  #addContour(contour: SourceContour) {
    const index = this.#glyph()?.contours.length ?? 0;
    this.#change(item => ({ ...item, contours: [...item.contours, contour] }));
    this.selection = new Set(contour.map((_, at) => pointKey(index, at)));
  }

  // A stem as tall as the capitals, and a round as tall as the lower case with its overshoot.
  #addRectangle() { const middle = Math.round(this.#advance() / 2); this.#addContour(rectangle(middle - 45, 0, middle + 45, this.#metrics().capHeight)); }
  #addOval() { this.#addContour(oval(60, -10, Math.max(160, this.#advance() - 60), this.#metrics().xHeight + 10)); }
  #nudge(dx: number, dy: number) { if (this.selection.size && this.source) this.#apply(moveSelection(this.source, this.unicode, this.selection, dx, dy), true); }

  #selectAll() {
    this.selection = new Set(this.#glyph()?.contours.flatMap((contour, c) => contour.map((_, index) => pointKey(c, index))) ?? []);
  }

  #copy() {
    const glyph = this.#glyph();
    if (!glyph) return;
    const chosen = this.#chosen();
    const picked = glyph.contours.filter((_, index) => !chosen.size || chosen.has(index));
    if (picked.length) { this.#clipboard = picked; this.emit('workbench-message', `${picked.length === 1 ? 'One contour' : `${picked.length} contours`} copied.`); }
  }

  #paste() {
    const contours = this.#clipboard, glyph = this.#glyph();
    if (!contours || !glyph) return;
    const start = glyph.contours.length;
    this.#change(item => ({ ...item, contours: [...item.contours, ...contours] }));
    this.selection = new Set(contours.flatMap((contour, c) => contour.map((_, index) => pointKey(start + c, index))));
  }

  async #saveDrawing(): Promise<boolean> {
    const current = this.source;
    if (!current) return false;
    this.busy = true;
    try {
      await this.request!(`/api/fonts/${this.face.id}/source`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(current) });
      if (this.source === current) this.dirty = false;
      this.emit('workbench-message', 'Drawing saved privately. Earlier drawings are kept.');
      return true;
    } catch (problem) { this.emit('workbench-error', problem instanceof Error ? problem.message : 'The drawing could not be saved.'); return false; }
    finally { this.busy = false; }
  }

  async #saveBuild() {
    if (this.dirty && !(await this.#saveDrawing())) return;
    const current = this.source;
    if (!current) return;
    this.busy = true;
    try {
      const bytes = await compileSource(current);
      const fileName = `${current.family.replace(/\s+/g, '-')}-${current.style}.otf`;
      await this.request!(`/api/fonts/${this.face.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream', 'X-Font-Name': fileName }, body: bytes });
      this.emit('build-saved', fileName);
      this.emit('workbench-message', 'Build saved privately. Specimen and Glyphs show it.');
    } catch (problem) { this.emit('workbench-error', problem instanceof Error ? problem.message : 'The build could not be saved.'); }
    finally { this.busy = false; }
  }

  async #openReference(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;
    try {
      this.fileReference = readReference(new Uint8Array(await file.arrayBuffer()), this.#metrics().unitsPerEm);
      this.layers = { ...this.layers, file: true };
      this.emit('workbench-message', `${file.name} is drawn behind each glyph. It stays on this computer.`);
    } catch { this.emit('workbench-error', 'This file could not be opened as a font. Choose a TTF, OTF, TTC, WOFF or WOFF2 file.'); }
    finally { input.value = ''; }
  }

  #pick() {
    this.querySelector<HTMLInputElement>('.workbench-file')?.click();
  }

  override render() {
    const source = this.source, glyph = this.#glyph();
    if (!source || !glyph) return html`<div class="workbench" ?hidden=${this.hidden} aria-busy="true"><p class="workbench-loading">Opening the drawing…</p></div>`;
    const { unicode, tool, selection, layers, reference, fileReference, pixels, marquee, busy, dirty } = this;
    const metrics = this.#metrics(), advance = this.#advance(), view = this.#view();
    const drawn = new Map(source.glyphs.map(item => [item.unicode, item]));
    const guides = [
      { name: 'Ascender', y: metrics.ascender }, { name: 'Cap height', y: metrics.capHeight }, { name: 'x-height', y: metrics.xHeight },
      { name: 'Baseline', y: 0 }, { name: 'Descender', y: metrics.descender },
    ];
    const size = (screen: number) => screen / pixels;
    const referencePath = layers.reference ? reference?.glyph(unicode) : null;
    const filePath = layers.file ? fileReference?.glyph(unicode) : null;
    const canSmooth = [...selection].some(key => { const [c, i] = readKey(key); return glyph.contours[c]?.[i]?.type !== 'offcurve'; });
    const thumbnail = (item: SourceGlyph | undefined, code: number) => `-50 ${-metrics.lineAscent} ${Math.max(item?.advance ?? defaultAdvance(code), 500) + 100} ${metrics.lineAscent - metrics.lineDescent}`;
    const fontFamily = this.previewFamily ? `"${this.previewFamily}", var(--typeface-mono)` : 'var(--typeface-mono)';
    const control = (label: unknown, onClick: () => void, disabled = false, pressed?: boolean) => button(label, onClick, { disabled, pressed });
    const selected = (key: PointKey) => selection.has(key) ? '' : undefined;

    return html`<div class="workbench" ?hidden=${this.hidden}>
      <div class="workbench-tools">
        <ds-tabs role="group" aria-label="Tool">
          ${button('Select', () => { this.#finishPen(); this.tool = 'select'; }, { secondary: false, active: tool === 'select', pressed: tool === 'select' })}
          ${button('Pen', () => { this.tool = 'pen'; }, { secondary: false, active: tool === 'pen', pressed: tool === 'pen' })}
        </ds-tabs>
        ${control('Rectangle', () => this.#addRectangle())}
        ${control('Oval', () => this.#addOval())}
        ${control('Smooth', () => this.#smoothSelection(), !canSmooth)}
        ${control('Reverse', () => this.#reverseSelection(), !glyph.contours.length)}
        ${control('Delete', () => this.#removeSelection(), !selection.size)}
        ${control('Undo', () => this.#undo(), !this.#past.length)}
        ${control('Redo', () => this.#redo(), !this.#future.length)}
        ${control('GT America', () => { this.layers = { ...layers, reference: !layers.reference }; }, !reference, Boolean(reference && layers.reference))}
        <input class="workbench-file" type="file" accept=".ttf,.otf,.ttc,.woff,.woff2" @change=${(event: Event) => void this.#openReference(event.target as HTMLInputElement)} />
        ${fileReference
          ? html`${control(fileReference.name, () => { this.layers = { ...layers, file: !layers.file }; }, false, layers.file)}${control('Other reference', () => this.#pick())}`
          : control('Open reference', () => this.#pick())}
        ${control('Save drawing', () => void this.#saveDrawing(), busy || !dirty)}
        ${control('Save as build', () => void this.#saveBuild(), busy || !source.glyphs.some(item => item.contours.length))}
      </div>
      <div class="workbench-glyphs" role="group" aria-label="Characters">
        ${SOURCE_CHARACTERS.map(code => {
          const item = drawn.get(code);
          return html`<button type="button" class="workbench-glyph" aria-pressed=${String(code === unicode)} aria-label=${`${characterName(code)}, ${codeName(code)}${item?.contours.length ? '' : ', not drawn'}`} @click=${() => this.#chooseCharacter(code)}>
            <svg viewBox=${thumbnail(item, code)} aria-hidden="true"><g transform="scale(1 -1)"><path d=${glyphPath(item)} /></g></svg>
            <span>${characterName(code)}</span>
          </button>`;
        })}
      </div>
      <div class="workbench-main">
        <div class="workbench-glyph-info">
          <span class="workbench-glyph-name">${characterName(unicode)}</span>
          <span>${codeName(unicode)}</span>
          <label>Width <input class="ds-input workbench-width" type="number" min="0" max="4000" .value=${live(String(advance))} @input=${(event: Event) => { const value = Number((event.target as HTMLInputElement).value); if (Number.isInteger(value) && value >= 0 && value <= 4000) this.#change(item => ({ ...item, advance: value })); }} /></label>
          ${referencePath ? html`<span class="workbench-reference-width">GT America ${referencePath.advance}</span>` : nothing}
        </div>
        <svg class="workbench-canvas" data-tool=${tool} viewBox=${`${view.x} ${view.y} ${view.w} ${view.h}`} role="application" aria-label=${`Drawing of ${characterName(unicode)}`} tabindex="0"
          @pointerdown=${this.#onPointerDown} @pointermove=${this.#onPointerMove} @pointerup=${this.#onPointerUp}
          @pointercancel=${() => { this.#drag = null; this.marquee = null; }} @dblclick=${this.#onDoubleClick}>
          <g transform="scale(1 -1)">
            ${guides.map(guide => svg`<g>
              <line class="workbench-guide" x1=${view.x} x2=${view.x + view.w} y1=${guide.y} y2=${guide.y} />
              <text class="workbench-guide-label" transform="scale(1 -1)" x=${view.x + size(8)} y=${-guide.y - size(4)} font-size=${size(10)}>${guide.name} ${guide.y}</text>
            </g>`)}
            <line class="workbench-side" x1="0" x2="0" y1=${metrics.lineDescent - 100} y2=${metrics.lineAscent + 100} />
            <line class="workbench-side" x1=${advance} x2=${advance} y1=${metrics.lineDescent - 100} y2=${metrics.lineAscent + 100} />
            ${tool === 'select' ? svg`<line class="workbench-advance" data-advance="" x1=${advance} x2=${advance} y1=${metrics.lineDescent - 100} y2=${metrics.lineAscent + 100} stroke-width=${size(10)} />` : nothing}
            ${referencePath ? svg`<path class="workbench-reference" d=${referencePath.d} />` : nothing}
            ${filePath ? svg`<path class="workbench-reference workbench-reference-file" d=${filePath.d} />` : nothing}
            <path class="workbench-outline" d=${glyphPath(glyph)} />
            ${glyph.contours.map(contour => contour.map((point, index) => {
              if (point.type === 'offcurve') return nothing;
              return [contour[(index - 1 + contour.length) % contour.length]!, contour[(index + 1) % contour.length]!]
                .filter(neighbour => neighbour.type === 'offcurve')
                .map(handle => svg`<line class="workbench-handle" x1=${point.x} y1=${point.y} x2=${handle.x} y2=${handle.y} />`);
            }))}
            ${glyph.contours.map((contour, c) => contour.map((point, index) => {
              const key = pointKey(c, index);
              const first = index === 0 ? '' : undefined;
              if (point.type === 'offcurve') return svg`<circle class="workbench-point workbench-control" data-point=${key} data-selected=${selected(key) ?? nothing} cx=${point.x} cy=${point.y} r=${size(3)} />`;
              if (point.smooth) return svg`<circle class="workbench-point" data-point=${key} data-first=${first ?? nothing} data-selected=${selected(key) ?? nothing} cx=${point.x} cy=${point.y} r=${size(4)} />`;
              return svg`<rect class="workbench-point" data-point=${key} data-first=${first ?? nothing} data-selected=${selected(key) ?? nothing} x=${point.x - size(3.5)} y=${point.y - size(3.5)} width=${size(7)} height=${size(7)} />`;
            }))}
            ${marquee ? svg`<rect class="workbench-marquee" x=${Math.min(marquee.from.x, marquee.to.x)} y=${Math.min(marquee.from.y, marquee.to.y)} width=${Math.abs(marquee.to.x - marquee.from.x)} height=${Math.abs(marquee.to.y - marquee.from.y)} />` : nothing}
          </g>
        </svg>
      </div>
      <div class="workbench-preview">
        <input class="workbench-preview-line" aria-label="Preview text" spellcheck="false" .value=${live(this.previewText)} @input=${(event: Event) => { this.previewText = (event.target as HTMLInputElement).value; }} style=${`font-family: ${fontFamily}`} />
        <div class="workbench-preview-large" aria-hidden="true" style=${`font-family: ${fontFamily}`}>${this.previewText}</div>
      </div>
    </div>`;
  }
}
defineElement('ds1-font-workbench', FontWorkbench);
