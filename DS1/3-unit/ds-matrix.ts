// ds-matrix.ts
// Rows against columns, one 20px square where each pair meets: read across a
// row for what it has, down a column for who has it. Columns stand in
// coloured groups whose colour tints the squares below; their names rise at
// 45° from the middle of their column. A mark in a square says how the row
// and column meet, and the legend below names the marks.

import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { define } from "../0-face/define";
import { getText } from "../0-face/i18n";
import metrics from "../1-root/component-metrics.css?inline";
import styles from "./styles/ds-matrix.css?inline";

/** How a square is drawn. */
export type MatrixMarkKind = "fill" | "outline" | "stripes" | "dot" | "triangle" | "dash";

/** A row or a column. A column may stand in a group. */
export interface MatrixAxis {
  id: string;
  label: string;
  /** The group a column stands in. */
  group?: string;
}

/** A group of columns: a bar in its colour over them, its colour tinting their squares. */
export interface MatrixGroup {
  id: string;
  label: string;
  /** A colour token or value, from the palette. */
  color: string;
}

/** What is in the square where a row meets a column. */
export interface MatrixCell {
  row: string;
  column: string;
  mark: MatrixMarkKind;
  /** More about this square, added to its name. */
  note?: string;
}

/** A mark and what it means, for the legend and the squares' names. */
export interface MatrixMark {
  mark: MatrixMarkKind;
  label: string;
}

/** Detail of `cell-press`: the row, the column and what is there, if anything. */
export interface MatrixPressDetail {
  row: MatrixAxis;
  column: MatrixAxis;
  cell?: MatrixCell;
}

const MARKS: readonly MatrixMarkKind[] = ["fill", "outline", "stripes", "dot", "triangle", "dash"];

const whole = (value: unknown, least: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(least, Math.floor(value)) : fallback;

/** The columns in their groups' order, each with its group. */
export function orderColumns(columns: readonly MatrixAxis[], groups: readonly MatrixGroup[]) {
  const byId = new Map(groups.map(group => [group.id, group]));
  const seen = new Set<string>();
  const ordered: { column: MatrixAxis; group?: MatrixGroup }[] = [];
  for (const id of [...groups.map(group => group.id), ...columns.map(column => column.group ?? "")]) {
    if (seen.has(id)) continue;
    seen.add(id);
    for (const column of columns) if ((column.group ?? "") === id) ordered.push({ column, group: byId.get(id) });
  }
  return ordered;
}

/**
 * @element ds-matrix
 * @prop {MatrixAxis[]} rows - The rows, top to bottom (property only).
 * @prop {MatrixAxis[]} columns - The columns; a column's `group` names its group (property only).
 * @prop {MatrixGroup[]} groups - The column groups, in order, with their colours (property only).
 * @prop {MatrixCell[]} cells - The marks (property only).
 * @prop {MatrixMark[]} marks - What each mark means, drawn as the legend (property only).
 * @prop {boolean} totals - A last row counting the marked squares in each column.
 * @prop {string} totalsLabel - That row's name (`totals-label`); the shared word "Total".
 * @prop {number} names - Squares for the row names: 8 by default.
 * @prop {string} label - The matrix's name: a translation key, or literal words.
 * @prop {boolean} literal - Show `label` and `totals-label` as written.
 *
 * @fires cell-press - A square was pressed, or Enter pressed on it; `{ row, column, cell }`.
 * @fires row-press - A row's name was pressed; `{ row }`.
 * @fires column-press - A column's name was pressed; `{ column }`.
 *
 * @example
 * <ds-matrix label="Products and parts" literal totals></ds-matrix>
 */
export class Matrix extends LitElement {
  static properties = {
    rows: { attribute: false },
    columns: { attribute: false },
    groups: { attribute: false },
    cells: { attribute: false },
    marks: { attribute: false },
    totals: { type: Boolean, reflect: true },
    totalsLabel: { type: String, attribute: "totals-label" },
    names: { type: Number },
    label: { type: String },
    literal: { type: Boolean, reflect: true },
    lit: { state: true },
    focusAt: { state: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(styles)];

  declare rows: MatrixAxis[];
  declare columns: MatrixAxis[];
  declare groups: MatrixGroup[];
  declare cells: MatrixCell[];
  declare marks: MatrixMark[];
  declare totals: boolean;
  declare totalsLabel: string | undefined;
  declare names: number | undefined;
  declare label: string | undefined;
  declare literal: boolean;
  /** The row and column under the pointer or focus, lit as a crosshair; -1 for neither. */
  declare lit: { row: number; column: number } | undefined;
  /** The square holding the one Tab stop. */
  declare focusAt: { row: number; column: number };

  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.rows = [];
    this.columns = [];
    this.groups = [];
    this.cells = [];
    this.marks = [];
    this.totals = false;
    this.literal = false;
    this.focusAt = { row: 0, column: 0 };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
  }

  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
    super.disconnectedCallback();
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.style.setProperty("--ds-matrix-names", String(whole(this.names, 2, 8)));
  }

  private words(value: string | undefined, fallback: string): string {
    if (value && this.literal) return value;
    return getText(value || fallback) || value || fallback;
  }

  private get ordered() {
    return orderColumns(this.columns ?? [], this.groups ?? []);
  }

  private markLabel(mark: MatrixMarkKind) {
    return this.marks.find(entry => entry.mark === mark)?.label ?? mark;
  }

  private async move(row: number, column: number) {
    const rows = this.rows.length, columns = this.columns.length;
    if (!rows || !columns) return;
    this.focusAt = { row: Math.max(0, Math.min(rows - 1, row)), column: Math.max(0, Math.min(columns - 1, column)) };
    this.lit = this.focusAt;
    await this.updateComplete;
    this.renderRoot.querySelector<HTMLElement>(`.cell[data-row="${this.focusAt.row}"][data-column="${this.focusAt.column}"]`)?.focus();
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const cell = (event.composedPath()[0] as HTMLElement).closest?.<HTMLElement>(".cell[data-row]");
    if (!cell) return;
    const row = Number(cell.dataset.row), column = Number(cell.dataset.column);
    const across = getComputedStyle(this).direction === "rtl" ? -1 : 1;
    const mod = event.ctrlKey || event.metaKey;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [row - 1, column],
      ArrowDown: [row + 1, column],
      ArrowLeft: [row, column - across],
      ArrowRight: [row, column + across],
      Home: mod ? [0, 0] : [row, 0],
      End: mod ? [this.rows.length - 1, this.columns.length - 1] : [row, this.columns.length - 1],
    };
    if (moves[event.key]) {
      event.preventDefault();
      void this.move(...moves[event.key]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.pressCell(row, column);
    }
  };

  private pressCell(row: number, column: number) {
    const entry = this.ordered[column];
    const axis = this.rows[row];
    if (!entry || !axis) return;
    const cell = this.cells.find(item => item.row === axis.id && item.column === entry.column.id);
    this.focusAt = { row, column };
    this.dispatchEvent(new CustomEvent<MatrixPressDetail>("cell-press", { bubbles: true, composed: true, detail: { row: axis, column: entry.column, cell } }));
  }

  private onClick = (event: MouseEvent) => {
    const target = (event.composedPath()[0] as HTMLElement).closest?.<HTMLElement>("[data-row], [data-column]");
    if (!target || target.classList.contains("count")) return;
    const { row, column } = target.dataset;
    if (row !== undefined && column !== undefined) this.pressCell(Number(row), Number(column));
    else if (row !== undefined) this.dispatchEvent(new CustomEvent("row-press", { bubbles: true, composed: true, detail: { row: this.rows[Number(row)] } }));
    else if (column !== undefined) this.dispatchEvent(new CustomEvent("column-press", { bubbles: true, composed: true, detail: { column: this.ordered[Number(column)].column } }));
  };

  private onPointerOver = (event: PointerEvent) => {
    const target = (event.composedPath()[0] as HTMLElement).closest?.<HTMLElement>("[data-row], [data-column]");
    const next = target ? { row: Number(target.dataset.row ?? -1), column: Number(target.dataset.column ?? -1) } : undefined;
    if (next?.row !== this.lit?.row || next?.column !== this.lit?.column) this.lit = next;
  };

  private mark(mark: MatrixMarkKind) {
    return MARKS.includes(mark) ? html`<i class="mark" data-mark=${mark} aria-hidden="true"></i>` : nothing;
  }

  render() {
    const ordered = this.ordered;
    const rows = this.rows ?? [];
    const byPair = new Map((this.cells ?? []).map(cell => [`${cell.row}>${cell.column}`, cell]));
    const lit = this.lit;
    const focus = this.focusAt;
    // One bar over each run of columns in the same group.
    const bars: { group?: MatrixGroup; start: number; span: number }[] = [];
    ordered.forEach(({ group }, index) => {
      const last = bars.at(-1);
      if (last && last.group === group) last.span++;
      else bars.push({ group, start: index, span: 1 });
    });
    const tint = (group?: MatrixGroup) => (group ? `--ds-matrix-colour: ${group.color};` : "");
    const counts = ordered.map(({ column }) => (this.cells ?? []).filter(cell => cell.column === column.id && cell.mark !== "dash" && rows.some(row => row.id === cell.row)).length);
    const body = rows.length + (this.totals ? 1 : 0);
    const name = this.label ? this.words(this.label, this.label) : undefined;
    return html`<div class="matrix" part="matrix" @pointerover=${this.onPointerOver} @pointerleave=${() => (this.lit = undefined)}>
      <div
        class="grid"
        part="grid"
        role="grid"
        aria-label=${name ?? nothing}
        style=${`--ds-matrix-columns: ${ordered.length}; --ds-matrix-body: ${body};`}
        @keydown=${this.onKeyDown}
        @click=${this.onClick}
      >
        ${bars.map(bar => bar.group
          ? html`<span class="group" part="group" aria-hidden="true" style=${`grid-column: ${bar.start + 2} / span ${bar.span}; ${tint(bar.group)}`}><span>${bar.group.label}</span></span>`
          : nothing)}
        <div role="row" class="row">
          <span role="columnheader" class="corner"></span>
          ${ordered.map(({ column, group }, index) => html`<span
            role="columnheader"
            class="column"
            part="column"
            data-column=${index}
            ?data-lit=${lit?.column === index}
            style=${`grid-column: ${index + 2}; ${tint(group)}`}
          ><span>${column.label}</span></span>`)}
        </div>
        ${rows.map((row, r) => html`<div role="row" class="row">
          <span role="rowheader" class="name" part="name" data-row=${r} ?data-lit=${lit?.row === r} style=${`grid-row: ${r + 3}`}>${row.label}</span>
          ${ordered.map(({ column, group }, c) => {
            const cell = byPair.get(`${row.id}>${column.id}`);
            const words = `${row.label}, ${column.label}: ${cell ? this.markLabel(cell.mark) : "–"}${cell?.note ? `. ${cell.note}` : ""}`;
            return html`<span
              role="gridcell"
              class="cell"
              part="cell"
              data-row=${r}
              data-column=${c}
              tabindex=${focus.row === r && focus.column === c ? 0 : -1}
              aria-label=${words}
              data-tooltip=${words}
              ?data-lit=${lit !== undefined && (lit.row === r || lit.column === c)}
              style=${`grid-row: ${r + 3}; grid-column: ${c + 2}; ${tint(group)}`}
            >${cell ? this.mark(cell.mark) : nothing}</span>`;
          })}
        </div>`)}
        ${this.totals
          ? html`<div role="row" class="row">
              <span role="rowheader" class="name totals" style=${`grid-row: ${rows.length + 3}`}>${this.words(this.totalsLabel, "Total")}</span>
              ${counts.map((count, c) => html`<span
                role="gridcell"
                class="cell count"
                part="count"
                data-column=${c}
                ?data-lit=${lit?.column === c}
                style=${`grid-row: ${rows.length + 3}; grid-column: ${c + 2}; ${tint(ordered[c].group)}`}
              >${count || ""}</span>`)}
            </div>`
          : nothing}
        ${body && ordered.length ? html`<span class="frame" aria-hidden="true"></span>` : nothing}
      </div>
      ${this.marks.length
        ? html`<div class="legend" part="legend">${this.marks.map(entry => html`<span class="key"><span class="key-mark">${this.mark(entry.mark)}</span>${entry.label}</span>`)}</div>`
        : nothing}
    </div>`;
  }
}

define("ds-matrix", Matrix);

declare global {
  interface HTMLElementTagNameMap {
    "ds-matrix": Matrix;
  }
}
