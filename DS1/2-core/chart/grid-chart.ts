/**
 * Grid chart: a numeric chart drawn one pixel column at a time on the 20px grid.
 *
 * The API follows lightweight-charts (createChart → addSeries → setData,
 * subscribeCrosshairMove), with pixel-aligned rendering:
 * - every row line of the chart is a price level, chosen so the scale lands on the grid;
 * - each pixel column holds the min/max of the points inside it, so a minute series
 *   and a five-year series draw with the same one-pixel stroke and never blur;
 * - fills are one-pixel strokes at two-pixel intervals, for a patterned fill.
 */

export interface DataPoint {
  /** Unix seconds */
  time: number;
  value: number;
}

export type SeriesKind = "area" | "line" | "baseline";

export interface SeriesOptions {
  kind?: SeriesKind;
  /** CSS color or palette name (e.g. "--ds-chart-up"). Area and line series. */
  color?: string;
  /** Baseline series: values above draw in the positive colour, below in the negative colour. */
  baseValue?: number;
  /** Hatch spacing in pixels; 0 turns the fill off. */
  hatch?: number;
  hatchOpacity?: number;
}

export interface Marker {
  time: number;
  text: string;
}

export interface ChartOptions {
  unit?: number;
  /** Price labels on every nth row line, in a two-square gutter on the right. */
  scaleLabels?: boolean;
  labelEvery?: number;
  /** High and low callouts on the visible range. */
  extremes?: boolean;
  grid?: "full" | "rows" | "none";
  format?: (value: number) => string;
}

export interface CrosshairEvent {
  point: DataPoint | null;
  x: number;
  y: number;
}

interface Column {
  min: number;
  max: number;
  first: number;
  last: number;
  index: number;
}

interface Palette {
  ink: string;
  muted: string;
  faint: string;
  up: string;
  down: string;
  surface: string;
  gridMinor: string;
  gridMajor: string;
}

/** The round sizes a square of a chart stands for: 1, 2, 2.5 and 5 times a power of ten. */
export const STEPS: number[] = [];
for (let exp = -4; exp <= 9; exp++) {
  for (const base of [1, 2, 2.5, 5]) STEPS.push(base * 10 ** exp);
}

export class Series {
  data: DataPoint[] = [];
  markers: Marker[] = [];
  constructor(
    private chart: GridChart,
    public options: SeriesOptions,
  ) {}

  setData(data: DataPoint[]): void {
    this.data = data;
    this.chart.draw();
  }

  update(point: DataPoint): void {
    const last = this.data[this.data.length - 1];
    if (last && last.time === point.time) this.data[this.data.length - 1] = point;
    else this.data.push(point);
    this.chart.draw();
  }

  setMarkers(markers: Marker[]): void {
    this.markers = markers;
    this.chart.draw();
  }

  applyOptions(options: SeriesOptions): void {
    this.options = { ...this.options, ...options };
    this.chart.draw();
  }
}

export class GridChart {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private series: Series[] = [];
  private crosshairX: number | null = null;
  private crosshair: CrosshairEvent = { point: null, x: -1, y: -1 };
  private listeners = new Set<(event: CrosshairEvent) => void>();
  private progress = 1;
  private frame = 0;
  private timeRange: [number, number] | null = null;
  private palette: Palette;
  private lastDrawn: { x: number; y: number } | null = null;
  options: Required<ChartOptions>;

  constructor(
    private canvas: HTMLCanvasElement,
    options: ChartOptions = {},
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");
    this.ctx = ctx;
    this.options = {
      unit: 20,
      scaleLabels: false,
      labelEvery: 2,
      extremes: false,
      grid: "full",
      format: (v) => v.toFixed(2),
      ...options,
    };
    this.palette = this.readPalette();
  }

  addSeries(options: SeriesOptions = {}): Series {
    const series = new Series(this, { kind: "area", hatch: 2, hatchOpacity: 0.28, ...options });
    this.series.push(series);
    return series;
  }

  removeSeries(series: Series): void {
    this.series = this.series.filter((s) => s !== series);
    this.draw();
  }

  applyOptions(options: ChartOptions): void {
    this.options = { ...this.options, ...options };
    this.draw();
  }

  /** Fixes the visible time range, e.g. a whole trading day while only the morning has data. */
  setTimeRange(range: [number, number] | null): void {
    this.timeRange = range;
    this.draw();
  }

  resize(width: number, height: number): void {
    this.width = Math.floor(width);
    this.height = Math.floor(height);
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.draw();
  }

  refreshTheme(): void {
    this.palette = this.readPalette();
    this.draw();
  }

  subscribeCrosshairMove(listener: (event: CrosshairEvent) => void): void {
    this.listeners.add(listener);
  }

  unsubscribeCrosshairMove(listener: (event: CrosshairEvent) => void): void {
    this.listeners.delete(listener);
  }

  /** Moves the crosshair to a pixel column (null hides it) and tells subscribers. */
  setCrosshair(x: number | null): void {
    this.crosshairX = x === null ? null : Math.max(0, Math.min(this.plotWidth() - 1, Math.round(x)));
    this.draw();
    for (const listener of this.listeners) listener(this.crosshair);
  }

  /** Draws the series in from the left. */
  animateIn(duration = 520): void {
    cancelAnimationFrame(this.frame);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.progress = 1;
      this.draw();
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      this.progress = 1 - (1 - t) ** 3;
      this.draw();
      if (t < 1) this.frame = requestAnimationFrame(step);
    };
    this.progress = 0;
    this.frame = requestAnimationFrame(step);
  }

  /** Position of the newest drawn value, for a live marker laid over the canvas. */
  lastPoint(): { x: number; y: number } | null {
    return this.progress === 1 ? this.lastDrawn : null;
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
    this.listeners.clear();
  }

  private plotWidth(): number {
    return Math.max(0, Math.floor(this.width - (this.options.scaleLabels ? this.options.unit * 2 : 0)));
  }

  private readPalette(): Palette {
    const probe = document.createElement("span");
    probe.style.display = "none";
    (this.canvas.parentNode ?? document.body).appendChild(probe);
    const read = (name: string) => {
      const fallback: Record<string, string> = { "--ds-chart-ink": "var(--text-color, #1e1e1e)", "--ds-chart-muted": "var(--base-darker-grey, #797979)", "--ds-chart-faint": "var(--slate-light, #e6e6e6)", "--ds-chart-up": "var(--apple-green, #99ff73)", "--ds-chart-down": "var(--tuned-red, #ff5f5f)", "--ds-chart-surface": "var(--background, #fff)", "--ds-chart-grid-minor": "var(--grid-color-light, #1e1e1e2b)", "--ds-chart-grid-major": "var(--grid-color-light, #1e1e1e2b)" };
      probe.style.color = `var(${name}, ${fallback[name]})`;
      return getComputedStyle(probe).color;
    };
    const palette = {
      ink: read("--ds-chart-ink"),
      muted: read("--ds-chart-muted"),
      faint: read("--ds-chart-faint"),
      up: read("--ds-chart-up"),
      down: read("--ds-chart-down"),
      surface: read("--ds-chart-surface"),
      gridMinor: read("--ds-chart-grid-minor"),
      gridMajor: read("--ds-chart-grid-major"),
    };
    probe.remove();
    return palette;
  }

  private resolve(color: string | undefined, fallback: string): string {
    if (!color) return fallback;
    if (!color.startsWith("--")) return color;
    const probe = document.createElement("span");
    probe.style.color = `var(${color}, ${fallback})`;
    probe.style.display = "none";
    (this.canvas.parentNode ?? document.body).appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }

  /** Type at its size on a 20px square, scaled with the square. */
  private font(size: number): string {
    const family = getComputedStyle(this.canvas).getPropertyValue("--ds-chart-font").trim() || getComputedStyle(this.canvas).getPropertyValue("--typeface-regular").trim() || '"Inter Arrows", sans-serif';
    return `${(size * this.options.unit) / 20}px ${family}`;
  }

  private scale(min: number, max: number) {
    const { unit, extremes } = this.options;
    const rows = Math.max(1, Math.floor(this.height / unit));
    const pad = extremes ? 1 : 0;
    const usable = Math.max(1, rows - pad * 2);
    if (max - min < 1e-9) {
      const spread = Math.abs(max) * 0.01 || 1;
      min -= spread;
      max += spread;
    }
    let step = STEPS[STEPS.length - 1];
    for (const candidate of STEPS) {
      if (Math.ceil(max / candidate) - Math.floor(min / candidate) <= usable) {
        step = candidate;
        break;
      }
    }
    const low = Math.floor(min / step);
    const used = Math.ceil(max / step) - low;
    const bottom = low - Math.floor((usable - used) / 2) - pad;
    const h = rows * unit;
    return {
      rows,
      y: (v: number) => h - (v / step - bottom) * unit,
      valueAtRow: (row: number) => (bottom + (rows - row)) * step,
    };
  }

  private columns(data: DataPoint[], t0: number, t1: number, n: number): (Column | null)[] {
    const cols: (Column | null)[] = new Array(n).fill(null);
    const span = Math.max(1, t1 - t0);
    data.forEach((p, index) => {
      const c = Math.round(((p.time - t0) / span) * (n - 1));
      if (c < 0 || c >= n) return;
      const col = cols[c];
      if (!col) cols[c] = { min: p.value, max: p.value, first: p.value, last: p.value, index };
      else {
        col.min = Math.min(col.min, p.value);
        col.max = Math.max(col.max, p.value);
        col.last = p.value;
        col.index = index;
      }
    });
    let prev = -1;
    for (let c = 0; c < n; c++) {
      if (!cols[c]) continue;
      if (prev >= 0 && c - prev > 1) {
        const a = cols[prev] as Column;
        const b = cols[c] as Column;
        for (let k = prev + 1; k < c; k++) {
          const t = (k - prev) / (c - prev);
          const v = a.last + (b.first - a.last) * t;
          cols[k] = { min: v, max: v, first: v, last: v, index: t < 0.5 ? a.index : b.index };
        }
      }
      prev = c;
    }
    return cols;
  }

  draw(): void {
    const { ctx, width, height, dpr, palette } = this;
    if (!width || !height) return;
    const { unit, grid } = this.options;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (grid !== "none") {
      for (let row = 0; row * unit <= height + 0.01; row++) {
        ctx.fillStyle = row % 4 === 0 ? palette.gridMajor : palette.gridMinor;
        ctx.fillRect(0, Math.min(row * unit, height - 1), width, 1);
      }
      if (grid === "full") {
        for (let col = 0; col * unit <= width + 0.01; col++) {
          ctx.fillStyle = col % 4 === 0 ? palette.gridMajor : palette.gridMinor;
          ctx.fillRect(Math.min(col * unit, width - 1), 0, 1, height);
        }
      }
    }

    this.lastDrawn = null;
    this.crosshair = { point: null, x: -1, y: -1 };
    const all = this.series.flatMap((s) => s.data);
    if (!all.length) return;

    const plotW = this.plotWidth();
    if (plotW < 1) return;
    let t0 = Infinity;
    let t1 = -Infinity;
    let min = Infinity;
    let max = -Infinity;
    for (const p of all) {
      t0 = Math.min(t0, p.time);
      t1 = Math.max(t1, p.time);
      min = Math.min(min, p.value);
      max = Math.max(max, p.value);
    }
    if (this.timeRange) [t0, t1] = this.timeRange;
    for (const s of this.series) {
      if (s.options.kind === "baseline" && s.options.baseValue !== undefined) {
        min = Math.min(min, s.options.baseValue);
        max = Math.max(max, s.options.baseValue);
      }
    }
    const scale = this.scale(min, max);
    const Y = (v: number) => Math.round(Math.max(0, Math.min(height - 1, scale.y(v))));
    const drawn = Math.ceil(plotW * this.progress);

    if (this.options.scaleLabels) {
      ctx.font = this.font(10);
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = palette.muted;
      for (let row = 1; row < scale.rows; row++) {
        if (row % this.options.labelEvery !== 0) continue;
        ctx.fillText(this.options.format(scale.valueAtRow(row)), width - 2, row * unit - Math.round(unit / 4));
      }
    }

    for (const series of this.series) {
      const cols = this.columns(series.data, t0, t1, plotW);
      const { kind = "area", hatch = 2, hatchOpacity = 0.28, baseValue } = series.options;
      const lineColor = this.resolve(series.options.color, palette.ink);
      const isBaseline = kind === "baseline" && baseValue !== undefined;
      const baseY = isBaseline ? Y(baseValue) : height - 1;

      if (isBaseline) {
        ctx.fillStyle = palette.muted;
        for (let x = 0; x < plotW; x += 4) ctx.fillRect(x, baseY, 2, 1);
      }

      for (const marker of series.markers) {
        const x = Math.round(((marker.time - t0) / Math.max(1, t1 - t0)) * (plotW - 1));
        if (x < 0 || x >= plotW) continue;
        ctx.fillStyle = palette.faint;
        for (let y = unit; y < height - unit; y += 2) ctx.fillRect(x, y, 1, 1);
        const box = unit - 4;
        const boxX = Math.max(0, Math.min(plotW - box, x - Math.floor(box / 2)));
        const boxY = height - unit + 2;
        ctx.fillStyle = palette.surface;
        ctx.fillRect(boxX, boxY, box, box);
        this.strokeBox(boxX, boxY, box, box, palette.muted);
        ctx.fillStyle = palette.muted;
        ctx.font = this.font(10);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(marker.text, boxX + box / 2, boxY + box / 2 + 0.5);
      }

      let prevY: number | null = null;
      let hi: { x: number; v: number } | null = null;
      let lo: { x: number; v: number } | null = null;
      for (let x = 0; x < drawn; x++) {
        const col = cols[x];
        if (!col) {
          prevY = null;
          continue;
        }
        const yFirst = prevY ?? Y(col.first);
        const top = Math.min(Y(col.max), yFirst);
        const bottom = Math.max(Y(col.min), yFirst);
        const lineY = Y(col.last);
        const color = isBaseline ? (col.last >= (baseValue as number) ? palette.up : palette.down) : lineColor;

        if (hatch > 0 && kind !== "line" && x % hatch === 0) {
          ctx.globalAlpha = hatchOpacity;
          ctx.fillStyle = color;
          if (lineY < baseY - 2) ctx.fillRect(x, lineY + 2, 1, baseY - lineY - 2);
          else if (isBaseline && lineY > baseY + 2) ctx.fillRect(x, baseY + 1, 1, lineY - baseY - 2);
          ctx.globalAlpha = 1;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, top, 1, bottom - top + 1);
        prevY = lineY;
        this.lastDrawn = { x, y: lineY };

        if (!hi || col.max > hi.v) hi = { x, v: col.max };
        if (!lo || col.min < lo.v) lo = { x, v: col.min };

        if (this.crosshairX === x && series === this.series[0]) {
          this.crosshair = { point: series.data[col.index] ?? null, x, y: lineY };
        }
      }

      if (this.options.extremes && hi && lo && this.progress === 1 && this.crosshairX === null) {
        this.callout(hi.x, Y(hi.v), this.options.format(hi.v), "above", plotW);
        this.callout(lo.x, Y(lo.v), this.options.format(lo.v), "below", plotW);
      }
    }

    if (this.crosshair.point) {
      const { x, y } = this.crosshair;
      ctx.fillStyle = palette.ink;
      ctx.fillRect(x, 0, 1, height);
      ctx.fillStyle = palette.surface;
      ctx.fillRect(x - 3, y - 3, 7, 7);
      ctx.fillStyle = palette.ink;
      ctx.fillRect(x - 2, y - 2, 5, 5);
    }
  }

  private strokeBox(x: number, y: number, w: number, h: number, color: string): void {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);
  }

  private callout(x: number, y: number, text: string, side: "above" | "below", plotW: number): void {
    const { ctx, palette, height } = this;
    const { unit } = this.options;
    ctx.font = this.font(10);
    const w = Math.ceil(ctx.measureText(text).width) + 9;
    const h = unit - 4;
    const boxX = Math.max(0, Math.min(plotW - w, Math.round(x - w / 2)));
    let row = side === "above" ? Math.floor(y / unit) - 1 : Math.ceil(y / unit);
    row = Math.max(0, Math.min(Math.floor(height / unit) - 1, row));
    const boxY = row * unit + 2;
    ctx.fillStyle = palette.surface;
    ctx.fillRect(boxX, boxY, w, h);
    this.strokeBox(boxX, boxY, w, h, palette.ink);
    const tickTop = side === "above" ? boxY + h : y + 3;
    const tickBottom = side === "above" ? y - 3 : boxY;
    if (tickBottom > tickTop) {
      ctx.fillStyle = palette.ink;
      ctx.fillRect(x, tickTop, 1, tickBottom - tickTop);
    }
    ctx.fillStyle = palette.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, boxX + w / 2, boxY + h / 2 + 0.5);
  }
}

export function createChart(canvas: HTMLCanvasElement, options?: ChartOptions): GridChart {
  return new GridChart(canvas, options);
}

/** A one-row sparkline: the same column renderer, scaled to its cell. */
export function drawSparkline(
  canvas: HTMLCanvasElement,
  values: number[],
  options: { width: number; height: number; color: string; base?: number; faint?: string },
): void {
  const { width, height, color } = options;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx || values.length < 2) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (options.base !== undefined) {
    min = Math.min(min, options.base);
    max = Math.max(max, options.base);
  }
  const span = max - min || 1;
  const usable = height - 5;
  const Y = (v: number) => Math.round(2 + (1 - (v - min) / span) * usable);
  if (options.base !== undefined && options.faint) {
    ctx.fillStyle = options.faint;
    const by = Y(options.base);
    for (let x = 0; x < width; x += 4) ctx.fillRect(x, by, 2, 1);
  }
  ctx.fillStyle = color;
  let prev: number | null = null;
  for (let x = 0; x < width - 3; x++) {
    const pos = (x / (width - 4)) * (values.length - 1);
    const i = Math.floor(pos);
    const next = values[Math.min(values.length - 1, i + 1)];
    const v = values[i] + (next - values[i]) * (pos - i);
    const y = Y(v);
    const a = prev ?? y;
    ctx.fillRect(x, Math.min(a, y), 1, Math.abs(a - y) + 1);
    prev = y;
  }
  if (prev !== null) ctx.fillRect(width - 3, prev - 1, 3, 3);
}
