import { html, LitElement, nothing, unsafeCSS, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { type DataPoint, drawSparkline, GridChart, type Marker, type Series, type SeriesKind } from "./chart/grid-chart";

import { define } from "../0-face/define";
import styles from "./chart/chart.css?inline";
export * from "./chart/grid-chart";

/** Independent chart configuration; no module-wide size or theme state. */
export class ChartElement extends LitElement {
  static styles = unsafeCSS(styles);
  @property({ type: Number }) unit = 20;
  @property() grid: "full" | "rows" | "none" = "rows";
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
  connectedCallback(): void { this.dataset.chartKind = "line"; super.connectedCallback(); }
  @property({ attribute: false }) data: DataPoint[] = [];
  @property() kind: SeriesKind = "area";
  @property({ type: Number }) base?: number;
  @property() color = "--ds-chart-ink";
  @property({ type: Number }) rows = 8;
  @property({ attribute: false }) markers: Marker[] = [];
  @property({ attribute: false }) timeRange: [number, number] | null = null;
  @property({ type: Boolean }) extremes = false;
  @property({ type: Boolean }) labels = false;
  @property({ type: Boolean }) live = false;
  @property({ attribute: false }) format: (value: number) => string = (v) => v.toFixed(2);
  /** Changing this replays the draw-in. */
  @property() drawKey = "";

  @state() private dot: { x: number; y: number } | null = null;

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
  connectedCallback(): void { this.dataset.chartKind = "spark"; super.connectedCallback(); }
  @property({ attribute: false }) values: number[] = [];
  @property({ type: Number }) base?: number;
  @property({ type: Number }) cols = 4;
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

export class GridBars extends ChartElement {
  connectedCallback(): void { this.dataset.chartKind = "bars"; super.connectedCallback(); }
  @property({ attribute: false }) items: BarItem[] = [];
  @property({ type: Number }) rows = 4;
  @property({ type: Number }) span = 2;

  render() {
    const height = (this.rows - 1) * this.unit;
    const max = Math.max(...this.items.flatMap((item) => [item.value, item.compare ?? 0]), 1e-9);
    const px = (v: number) => Math.max(1, Math.round((v / max) * (height - 4)));
    return html`<div class="bars" style="--span: ${this.span}">
      ${this.items.map(
        (item) => html`<div class="bar-cell">
          <div class="bar-area" style="height: ${height}px">
            ${item.compare !== undefined
              ? html`<span class="bar-compare" style="height: ${px(item.compare)}px"></span>`
              : nothing}
            ${item.value > 0
              ? html`<span class="bar-fill ${item.tone ?? "ink"}" style="height: ${px(item.value)}px"></span>`
              : nothing}
          </div>
          <span class="bar-caption">${item.caption ?? ""}</span>
          <span class="bar-label">${item.label}</span>
        </div>`,
      )}
    </div>`;
  }
}

export class GridRatio extends ChartElement {
  connectedCallback(): void { this.dataset.chartKind = "ratio"; super.connectedCallback(); }
  @property({ type: Number }) value = 0.5;
  @state() private width = 0;
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
  connectedCallback(): void { this.dataset.chartKind = "range"; super.connectedCallback(); }
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 1;
  @property({ type: Number }) from = 0;
  @property({ type: Number }) to = 1;
  @property({ attribute: false }) marks: RangeMark[] = [];
  @state() private width = 0;
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
