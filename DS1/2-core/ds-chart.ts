import { html, LitElement, nothing, unsafeCSS, type PropertyDeclarations, type PropertyValues } from "lit";
import { type DataPoint, drawSparkline, GridChart, type Marker, type Series, type SeriesKind, STEPS } from "./chart/grid-chart";

import { define } from "../0-face/define";
import styles from "./chart/chart.css?inline";
export * from "./chart/grid-chart";

/** Independent chart configuration; no module-wide size or theme state. */
export class ChartElement extends LitElement {
  static properties: PropertyDeclarations = {
    unit: { type: Number },
    grid: {},
  };
  static styles = unsafeCSS(styles);
  declare unit: number;
  declare grid: "full" | "rows" | "none";

  constructor() {
    super();
    this.unit = 20;
    this.grid = "rows";
  }
  private media?: MediaQueryList;
  private themeChanged = () => this.refreshTheme();
  connectedCallback(): void {
    super.connectedCallback();
    this.media = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
    this.media?.addEventListener("change", this.themeChanged);
    void this.updateComplete.then(() => {
      if (!this.isConnected) return;
      this.initialize();
      this.refreshTheme();
    });
  }
  disconnectedCallback(): void {
    this.media?.removeEventListener("change", this.themeChanged);
    super.disconnectedCallback();
  }
  protected initialize(): void {}
  refreshTheme(): void { this.requestUpdate(); }
  protected updated(_changed: PropertyValues): void {
    if (!Number.isFinite(this.unit) || this.unit <= 0) this.unit = 20;
    this.style.setProperty("--ds-chart-unit", `${this.unit}px`);
  }
}

/** Whole-pixel width of an element, kept current. */
function observeWidth(element: HTMLElement, callback: (width: number) => void): ResizeObserver {
  const observer = new ResizeObserver(() => callback(Math.floor(element.getBoundingClientRect().width)));
  observer.observe(element);
  return observer;
}

export class GridLineChart extends ChartElement {
  static properties: PropertyDeclarations = {
    data: { attribute: false },
    kind: {},
    base: { type: Number },
    color: {},
    rows: { type: Number },
    markers: { attribute: false },
    timeRange: { attribute: false },
    extremes: { type: Boolean },
    labels: { type: Boolean },
    live: { type: Boolean },
    format: { attribute: false },
    drawKey: {},
    dot: { state: true },
  };
  connectedCallback(): void { this.dataset.chartKind = "line"; super.connectedCallback(); }
  declare data: DataPoint[];
  declare kind: SeriesKind;
  declare base: number | undefined;
  declare color: string;
  declare rows: number;
  declare markers: Marker[];
  declare timeRange: [number, number] | null;
  declare extremes: boolean;
  declare labels: boolean;
  declare live: boolean;
  declare format: (value: number) => string;
  /** Changing this replays the draw-in. */
  declare drawKey: string;

  private declare dot: { x: number; y: number } | null;

  constructor() {
    super();
    this.data = [];
    this.kind = "area";
    this.color = "--ds-chart-ink";
    this.rows = 8;
    this.markers = [];
    this.timeRange = null;
    this.extremes = false;
    this.labels = false;
    this.live = false;
    this.format = (v) => v.toFixed(2);
    this.drawKey = "";
    this.dot = null;
  }

  private chart?: GridChart;
  private series?: Series;
  private observer?: ResizeObserver;
  private scrubbing = false;
  private dotTimer?: ReturnType<typeof setTimeout>;
  refreshTheme(): void { this.chart?.refreshTheme(); }

  render() {
    return html`<canvas
        @pointerdown=${this.down}
        @pointermove=${this.move}
        @pointerup=${this.up}
        @pointercancel=${this.up}
        @pointerleave=${this.leave}
      ></canvas
      >${this.live && this.dot
        ? html`<span class="live-dot" style="transform: translate(${this.dot.x - 2}px, ${this.dot.y - 2}px)"></span>`
        : nothing}`;
  }

  protected initialize(): void {
    if (this.chart) return;
    const canvas = this.renderRoot.querySelector("canvas") as HTMLCanvasElement;
    this.chart = new GridChart(canvas, {
      extremes: this.extremes,
      scaleLabels: this.labels,
      format: this.format,
      grid: this.grid,
      unit: this.unit,
    });
    this.series = this.chart.addSeries(this.seriesOptions());
    this.chart.subscribeCrosshairMove((event) => {
      this.dispatchEvent(new CustomEvent("scrub", { detail: event.point, bubbles: true, composed: true }));
    });
    this.observer = observeWidth(this, (width) => {
      this.chart?.resize(width, this.rows * this.unit);
      this.placeDot();
    });
    void document.fonts?.ready.then(() => this.chart?.draw());
    this.resizeToUnit();
    this.sync(true);
  }

  resizeToUnit(): void {
    this.chart?.resize(Math.floor(this.getBoundingClientRect().width), this.rows * this.unit);
    this.placeDot();
  }

  updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (!this.chart) return;
    if (changed.has("unit") || changed.has("grid")) this.chart.applyOptions({ unit: this.unit, grid: this.grid });
    if (changed.has("rows") || changed.has("unit")) this.resizeToUnit();
    if (changed.has("extremes") || changed.has("labels") || changed.has("format")) {
      this.chart.applyOptions({ extremes: this.extremes, scaleLabels: this.labels, format: this.format });
    }
    if (changed.has("data") || changed.has("kind") || changed.has("base") || changed.has("color") || changed.has("markers") || changed.has("timeRange")) {
      this.sync(changed.has("drawKey"));
    } else if (changed.has("drawKey")) {
      this.sync(true);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.observer?.disconnect();
    clearTimeout(this.dotTimer);
    this.chart?.destroy();
    this.chart = undefined;
  }

  private seriesOptions() {
    return { kind: this.kind, baseValue: this.base, color: this.color };
  }

  private sync(animate: boolean): void {
    if (!this.chart || !this.series) return;
    this.chart.setTimeRange(this.timeRange);
    this.series.applyOptions(this.seriesOptions());
    this.series.setMarkers(this.markers);
    this.series.setData(this.data);
    if (animate) {
      this.dot = null;
      this.chart.animateIn();
      clearTimeout(this.dotTimer);
      this.dotTimer = setTimeout(() => this.placeDot(), 560);
    } else {
      this.placeDot();
    }
  }

  private placeDot(): void {
    const point = this.chart?.lastPoint() ?? null;
    if (point?.x !== this.dot?.x || point?.y !== this.dot?.y) this.dot = point;
  }

  private x(event: PointerEvent): number {
    return event.clientX - this.getBoundingClientRect().left;
  }

  private down = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.scrubbing = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.chart?.setCrosshair(this.x(event));
  };

  private move = (event: PointerEvent) => {
    if (this.scrubbing || event.pointerType === "mouse") this.chart?.setCrosshair(this.x(event));
  };

  private up = (event: PointerEvent) => {
    this.scrubbing = false;
    if (event.pointerType !== "mouse" || event.type === "pointercancel") this.chart?.setCrosshair(null);
  };

  private leave = (event: PointerEvent) => {
    if (!this.scrubbing && event.pointerType === "mouse") this.chart?.setCrosshair(null);
  };
}

export class GridSpark extends ChartElement {
  static properties: PropertyDeclarations = {
    values: { attribute: false },
    base: { type: Number },
    cols: { type: Number },
  };
  connectedCallback(): void { this.dataset.chartKind = "spark"; super.connectedCallback(); }
  declare values: number[];
  declare base: number | undefined;
  declare cols: number;

  constructor() {
    super();
    this.values = [];
    this.cols = 4;
  }
  refreshTheme(): void { this.draw(); }

  render() {
    const last = this.values[this.values.length - 1] ?? 0;
    const reference = this.base ?? this.values[0] ?? 0;
    return html`<canvas class=${last >= reference ? "up" : "down"}></canvas>`;
  }

  updated(changed: PropertyValues): void {
    super.updated(changed);
    this.draw();
  }

  private draw(): void {
    const canvas = this.renderRoot.querySelector("canvas");
    if (!canvas) return;
    const style = getComputedStyle(canvas);
    drawSparkline(canvas, this.values, {
      width: this.cols * this.unit,
      height: this.unit,
      color: style.color,
      base: this.base,
      faint: style.borderTopColor,
    });
  }
}

export interface BarItem {
  label: string;
  value: number;
  /** Drawn as an outline at its height, e.g. the expected figure. */
  compare?: number;
  tone?: "up" | "down" | "ink";
  caption?: string;
}

/**
 * The round size each square of a bar chart stands for (the line chart's steps: 1, 2, 2.5 and 5 times
 * a power of ten), the smallest with which `max` fits in `squares`.
 */
export function barStep(max: number, squares: number): number {
  return STEPS.find((step) => Math.ceil(max / step) <= Math.max(1, squares)) ?? STEPS[STEPS.length - 1]!;
}

const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });

export class GridBars extends ChartElement {
  static properties: PropertyDeclarations = {
    items: { attribute: false },
    rows: { type: Number },
    span: { type: Number },
    axis: { type: Boolean, reflect: true },
    values: { type: Boolean, reflect: true },
    fill: { type: Boolean, reflect: true },
    format: { attribute: false },
  };
  connectedCallback(): void { this.dataset.chartKind = "bars"; super.connectedCallback(); }
  declare items: BarItem[];
  declare rows: number;
  declare span: number;
  /** A scale at the end, two squares wide: each square of the area one round step, labelled just above its line, the lines across the bars. */
  declare axis: boolean;
  /** Each bar's value written over it, by `format`. */
  declare values: boolean;
  /** The bars share the width left beside the scale, in whole pixels, instead of `span` squares each. */
  declare fill: boolean;
  /** Writes the scale's labels and the values over the bars. */
  declare format: (value: number) => string;

  constructor() {
    super();
    this.items = [];
    this.rows = 4;
    this.span = 2;
    this.axis = false;
    this.values = false;
    this.fill = false;
    this.format = (value) => compact.format(value);
  }

  render() {
    const squares = Math.max(1, this.rows - 1);
    const height = squares * this.unit;
    const max = Math.max(...this.items.flatMap((item) => [item.value, item.compare ?? 0]), 1e-9);
    // With a scale, a square is a step, so the bars stand on its lines; a value over the tallest
    // keeps its square above it.
    const step = this.axis ? barStep(max, squares - (this.values ? 1 : 0)) : 0;
    const room = height - 4 - (this.values ? this.unit : 0);
    const px = (v: number) => Math.max(1, Math.round(this.axis ? (v / step) * this.unit : (v / max) * room));
    const captions = this.items.some((item) => item.caption);
    const lines = this.axis ? Array.from({ length: squares }, (_, i) => i + 1).filter((row) => row * step <= max + step) : [];
    return html`<div class="bars" style="--span: ${this.span}">
      <div class="bar-columns">
        ${this.axis ? html`<span class="bar-guides" style="height: ${height}px" aria-hidden="true"></span>` : nothing}
        ${this.items.map(
          (item) => html`<div class="bar-cell">
            <div class="bar-area" style="height: ${height}px">
              ${item.compare !== undefined
                ? html`<span class="bar-compare" style="height: ${px(item.compare)}px"></span>`
                : nothing}
              ${item.value > 0
                ? html`<span class="bar-fill ${item.tone ?? "ink"}" style="height: ${px(item.value)}px"></span>`
                : nothing}
              ${this.values && item.value > 0
                ? html`<span class="bar-value" style="bottom: ${px(item.value) + 2}px">${this.format(item.value)}</span>`
                : nothing}
            </div>
            ${captions ? html`<span class="bar-caption">${item.caption ?? ""}</span>` : nothing}
            <span class="bar-label">${item.label}</span>
          </div>`,
        )}
      </div>
      ${this.axis
        ? html`<div class="bar-axis" style="height: ${height}px" aria-hidden="true">
            ${lines.map((row) => html`<span class="bar-tick" style="bottom: ${row * this.unit}px">${this.format(row * step)}</span>`)}
          </div>`
        : nothing}
    </div>`;
  }
}

export class GridRatio extends ChartElement {
  static properties: PropertyDeclarations = {
    value: { type: Number },
    width: { state: true },
  };
  connectedCallback(): void { this.dataset.chartKind = "ratio"; super.connectedCallback(); }
  declare value: number;
  private declare width: number;

  constructor() {
    super();
    this.value = 0.5;
    this.width = 0;
  }
  private observer?: ResizeObserver;

  protected initialize(): void {
    this.observer?.disconnect();
    this.observer = observeWidth(this, (width) => {
      this.width = width;
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }

  render() {
    const left = Math.round(Math.max(0, this.width - 1) * Math.max(0, Math.min(1, this.value)));
    return html`<span class="ratio-buy" style="width: ${left}px"></span
      ><span class="ratio-sell" style="width: ${Math.max(0, this.width - left - 1)}px"></span>`;
  }
}

export interface RangeMark {
  value: number;
  label?: string;
  kind: "dot" | "tick";
}

export class GridRange extends ChartElement {
  static properties: PropertyDeclarations = {
    min: { type: Number },
    max: { type: Number },
    from: { type: Number },
    to: { type: Number },
    marks: { attribute: false },
    width: { state: true },
  };
  connectedCallback(): void { this.dataset.chartKind = "range"; super.connectedCallback(); }
  declare min: number;
  declare max: number;
  declare from: number;
  declare to: number;
  declare marks: RangeMark[];
  private declare width: number;

  constructor() {
    super();
    this.min = 0;
    this.max = 1;
    this.from = 0;
    this.to = 1;
    this.marks = [];
    this.width = 0;
  }
  private observer?: ResizeObserver;

  protected initialize(): void {
    this.observer?.disconnect();
    this.observer = observeWidth(this, (width) => {
      this.width = width;
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }

  render() {
    const span = Math.max(1e-9, this.max - this.min);
    const x = (v: number) => Math.round(((v - this.min) / span) * (this.width - 1));
    const left = x(this.from);
    const right = x(this.to);
    return html`<span class="range-track"></span>
      <span class="range-fill" style="transform: translateX(${left}px); width: ${Math.max(1, right - left + 1)}px"></span>
      ${this.marks.map(
        (mark) =>
          html`<span class="range-${mark.kind}" style="transform: translateX(${x(mark.value) - (mark.kind === "dot" ? 2 : 0)}px)"
            >${mark.label ? html`<span class="range-label">${mark.label}</span>` : nothing}</span
          >`,
      )}`;
  }
}

define("ds-chart", GridLineChart);
define("ds-spark", GridSpark);
define("ds-bars", GridBars);
define("ds-ratio", GridRatio);
define("ds-range", GridRange);
