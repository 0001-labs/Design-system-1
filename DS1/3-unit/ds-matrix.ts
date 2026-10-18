// ds-matrix.ts
// Items on a board of columns: each item one square high and four wide,
// standing edge to edge in its column with nothing between, so a board is a
// grid of squares. Every item is a hairline box centred on the grid lines,
// and boxes that touch share one line. A free square is paper until the
// pointer rests on it, when a plus appears. Items are moved a square at a
// time, by dragging or with the keys, and land on whole squares.

import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { define } from "../0-face/define";
import { getText } from "../0-face/i18n";
import { isModKey } from "../0-face/keys";
import "../2-core/ds-icon";
import metrics from "../1-root/component-metrics.css?inline";
import styles from "./styles/ds-matrix.css?inline";

/** An item on the board: where it stands, from 0, and how it is drawn. */
export interface MatrixItem {
  id: string;
  title: string;
  column: number;
  row: number;
  /** A header: filled with the accent (or `color`), heading what is below it. */
  header?: boolean;
  /** Marked with a star on its first square. */
  starred?: boolean;
  /** Done: struck through and faded. */
  completed?: boolean;
  /** A colour token or value filling a header. */
  color?: string;
}

/** A square on the board. */
export interface MatrixPlace {
  column: number;
  row: number;
}

/** One item's move, from its square to another. */
export interface MatrixMove {
  id: string;
  from: MatrixPlace;
  to: MatrixPlace;
}

/** Detail of `move`: every item that moves, the swapped one included. Cancel it to keep them. */
export interface MatrixMoveDetail {
  moves: MatrixMove[];
}

/** Detail of `item-press`. */
export interface MatrixItemDetail {
  item: MatrixItem;
}

/** Detail of `cell-press`: a free square was pressed. */
export type MatrixCellDetail = MatrixPlace;

/** Detail of `select`: the items now selected. */
export interface MatrixSelectDetail {
  ids: string[];
}

/** A column's letter, as a spreadsheet names it: A … Z, AA … */
export function columnName(column: number): string {
  let name = "";
  for (let rest = column + 1; rest > 0; rest = Math.floor((rest - 1) / 26)) name = String.fromCharCode(65 + ((rest - 1) % 26)) + name;
  return name;
}

const placeKey = (column: number, row: number) => `${column}:${row}`;
const whole = (value: unknown, least: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(least, Math.floor(value)) : fallback;

/**
 * The moves that put `ids` `by` squares further, swapping a lone item with
 * the one where it lands. `null` when a move would leave the board or land
 * several items on others.
 */
export function planMove(items: readonly MatrixItem[], ids: readonly string[], by: MatrixPlace, columns: number): MatrixMove[] | null {
  const moving = items.filter(item => ids.includes(item.id));
  if (!moving.length || (by.column === 0 && by.row === 0)) return null;
  const moves: MatrixMove[] = moving.map(item => ({
    id: item.id,
    from: { column: item.column, row: item.row },
    to: { column: item.column + by.column, row: item.row + by.row },
  }));
  if (moves.some(move => move.to.column < 0 || move.to.column >= columns || move.to.row < 0)) return null;
  const staying = new Map(items.filter(item => !ids.includes(item.id)).map(item => [placeKey(item.column, item.row), item]));
  const landed = moves.map(move => staying.get(placeKey(move.to.column, move.to.row))).filter((item): item is MatrixItem => Boolean(item));
  if (!landed.length) return moves;
  // One item swaps places with the one it lands on; a group only moves onto free squares.
  if (moves.length > 1) return null;
  const [other] = landed;
  return [...moves, { id: other.id, from: { column: other.column, row: other.row }, to: { ...moves[0].from } }];
}

/**
 * @element ds-matrix
 * @prop {MatrixItem[]} items - The items and where they stand (property only).
 * @prop {number} columns - Columns on the board: 3 by default.
 * @prop {number} rows - Rows drawn at least: 8 by default; one spare row
 *   always follows the last item.
 * @prop {number} columnWidth - Squares per column (`column-width`): 4.
 * @prop {string[]} selected - The ids of the selected items (property only).
 * @prop {string} label - The board's name: a translation key, or literal words.
 * @prop {boolean} readonly - Nothing can be moved, selected or added.
 * @prop {boolean} rounded - Rounds the corners a box does not share (4px).
 *
 * @fires item-press - An item was pressed, or Enter pressed on it; `{ item }`.
 * @fires cell-press - A free square was pressed, or Enter pressed on it; `{ column, row }`.
 * @fires select - The selection changed; `{ ids }`.
 * @fires move - Items are about to move; `{ moves }`. Cancelable: cancelled,
 *   they stay. Otherwise `items` already holds the new places when it is read
 *   after the event.
 *
 * @example
 * <ds-matrix columns="3" label="Groceries" literal></ds-matrix>
 */
export class Matrix extends LitElement {
  static properties = {
    items: { attribute: false },
    columns: { type: Number },
    rows: { type: Number },
    columnWidth: { type: Number, attribute: "column-width" },
    selected: { attribute: false },
    label: { type: String },
    literal: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    rounded: { type: Boolean, reflect: true },
    focusPlace: { state: true },
    drag: { state: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(styles)];

  declare items: MatrixItem[];
  declare columns: number | undefined;
  declare rows: number | undefined;
  declare columnWidth: number | undefined;
  declare selected: string[];
  declare label: string | undefined;
  declare literal: boolean;
  declare readonly: boolean;
  declare rounded: boolean;
  declare focusPlace: MatrixPlace;
  /** The drag in progress: the items carried, how far in pixels, and the squares they would move. */
  declare drag: { ids: string[]; x: number; y: number; by: MatrixPlace } | undefined;

  private pointer: { id: number; item: MatrixItem; x: number; y: number; started: boolean; timer?: ReturnType<typeof setTimeout> } | undefined;
  private suppressClick = false;

  constructor() {
    super();
    this.items = [];
    this.selected = [];
    this.literal = false;
    this.readonly = false;
    this.rounded = false;
    this.focusPlace = { column: 0, row: 0 };
  }

  private get columnCount() { return whole(this.columns, 1, 3); }

  /** Rows drawn: at least `rows`, and one spare below the last item. */
  private get rowCount() {
    const last = Math.max(-1, ...(this.items ?? []).map(item => item.row));
    return Math.max(whole(this.rows, 1, 8), last + 2);
  }

  private get byPlace() {
    return new Map((this.items ?? []).filter(item => item.column < this.columnCount && item.row >= 0).map(item => [placeKey(item.column, item.row), item]));
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.style.setProperty("--ds-matrix-columns", String(this.columnCount));
    this.style.setProperty("--ds-matrix-rows", String(this.rowCount));
    this.style.setProperty("--ds-matrix-column-squares", String(whole(this.columnWidth, 1, 4)));
  }

  disconnectedCallback() {
    this.endDrag();
    super.disconnectedCallback();
  }

  private setSelected(ids: string[]) {
    const next = [...new Set(ids)];
    if (next.length === this.selected.length && next.every(id => this.selected.includes(id))) return;
    this.selected = next;
    this.dispatchEvent(new CustomEvent<MatrixSelectDetail>("select", { bubbles: true, composed: true, detail: { ids: next } }));
  }

  /** Moves items as `planMove` plans it, unless `move` is cancelled. Returns whether they moved. */
  moveItems(ids: readonly string[], by: MatrixPlace): boolean {
    if (this.readonly) return false;
    const moves = planMove(this.items, ids, by, this.columnCount);
    if (!moves) return false;
    const event = new CustomEvent<MatrixMoveDetail>("move", { bubbles: true, composed: true, cancelable: true, detail: { moves } });
    if (!this.dispatchEvent(event)) return false;
    const to = new Map(moves.map(move => [move.id, move.to]));
    this.items = this.items.map(item => (to.has(item.id) ? { ...item, ...to.get(item.id)! } : item));
    return true;
  }

  private placeOf(element: Element | undefined): MatrixPlace | undefined {
    const cell = element?.closest<HTMLElement>("[data-column]");
    return cell ? { column: Number(cell.dataset.column), row: Number(cell.dataset.row) } : undefined;
  }

  private async focusAt(place: MatrixPlace) {
    this.focusPlace = place;
    await this.updateComplete;
    this.renderRoot.querySelector<HTMLElement>(`[data-column="${place.column}"][data-row="${place.row}"]`)?.focus({ preventScroll: false });
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const place = this.placeOf(event.composedPath()[0] as Element);
    if (!place) return;
    const item = this.byPlace.get(placeKey(place.column, place.row));
    const rtl = getComputedStyle(this).direction === "rtl";
    const step: Record<string, MatrixPlace> = {
      ArrowUp: { column: 0, row: -1 },
      ArrowDown: { column: 0, row: 1 },
      ArrowLeft: { column: rtl ? 1 : -1, row: 0 },
      ArrowRight: { column: rtl ? -1 : 1, row: 0 },
    };
    if (step[event.key]) {
      event.preventDefault();
      const by = step[event.key];
      if (event.altKey && item && !this.readonly) {
        // Alt with an arrow moves the selection (or the item in focus) a square, and the focus with it.
        const ids = this.selected.includes(item.id) ? this.selected : [item.id];
        if (this.moveItems(ids, by)) void this.focusAt({ column: place.column + by.column, row: place.row + by.row });
        return;
      }
      const next = { column: place.column + by.column, row: place.row + by.row };
      if (next.column >= 0 && next.column < this.columnCount && next.row >= 0 && next.row < this.rowCount) void this.focusAt(next);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const end = event.key === "End";
      void this.focusAt(isModKey(event) ? { column: end ? this.columnCount - 1 : 0, row: end ? this.rowCount - 1 : 0 } : { column: place.column, row: end ? this.rowCount - 1 : 0 });
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (event.key === " " && item && !this.readonly && (event.shiftKey || isModKey(event))) this.toggle(item.id);
      else this.pressAt(place);
      return;
    }
    if (event.key === "Escape" && this.selected.length) {
      event.preventDefault();
      this.setSelected([]);
      return;
    }
    if (isModKey(event) && event.key.toLowerCase() === "a" && !this.readonly) {
      event.preventDefault();
      this.setSelected(this.items.map(entry => entry.id));
    }
  };

  private toggle(id: string) {
    this.setSelected(this.selected.includes(id) ? this.selected.filter(entry => entry !== id) : [...this.selected, id]);
  }

  private pressAt(place: MatrixPlace) {
    const item = this.byPlace.get(placeKey(place.column, place.row));
    if (item) this.dispatchEvent(new CustomEvent<MatrixItemDetail>("item-press", { bubbles: true, composed: true, detail: { item } }));
    else if (!this.readonly) this.dispatchEvent(new CustomEvent<MatrixCellDetail>("cell-press", { bubbles: true, composed: true, detail: place }));
  }

  private onClick = (event: MouseEvent) => {
    if (this.suppressClick) { this.suppressClick = false; return; }
    const place = this.placeOf(event.composedPath()[0] as Element);
    if (!place) return;
    this.focusPlace = place;
    const item = this.byPlace.get(placeKey(place.column, place.row));
    if (item && !this.readonly && (event.shiftKey || isModKey(event))) {
      this.toggle(item.id);
      return;
    }
    if (this.selected.length && !item) this.setSelected([]);
    this.pressAt(place);
  };

  // Dragging: a mouse or pen after 4px, a finger after holding still for 400ms.
  private onPointerDown = (event: PointerEvent) => {
    if (this.readonly || event.button !== 0) return;
    const place = this.placeOf(event.composedPath()[0] as Element);
    const item = place && this.byPlace.get(placeKey(place.column, place.row));
    if (!item) return;
    this.pointer = { id: event.pointerId, item, x: event.clientX, y: event.clientY, started: false };
    if (event.pointerType === "touch") this.pointer.timer = setTimeout(() => this.startDrag(), 400);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.endDrag);
  };

  private startDrag() {
    const pointer = this.pointer;
    if (!pointer || pointer.started) return;
    pointer.started = true;
    const ids = this.selected.includes(pointer.item.id) ? this.selected : [pointer.item.id];
    this.drag = { ids, x: 0, y: 0, by: { column: 0, row: 0 } };
  }

  private onPointerMove = (event: PointerEvent) => {
    const pointer = this.pointer;
    if (!pointer || event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    if (!pointer.started) {
      if (event.pointerType === "touch") {
        if (Math.hypot(dx, dy) > 10) this.endDrag();
        return;
      }
      if (Math.hypot(dx, dy) < 4) return;
      this.startDrag();
    }
    event.preventDefault();
    const cell = this.renderRoot.querySelector<HTMLElement>(".cell")?.getBoundingClientRect();
    if (!cell || !this.drag) return;
    const rtl = getComputedStyle(this).direction === "rtl";
    // The squares the pointer has crossed, rounded to the nearest, so items land on whole squares.
    const by = { column: Math.round(((rtl ? -1 : 1) * dx) / cell.width), row: Math.round(dy / cell.height) };
    this.drag = { ...this.drag, x: dx, y: dy, by };
  };

  private onPointerUp = (event: PointerEvent) => {
    const pointer = this.pointer;
    if (!pointer || event.pointerId !== pointer.id) return;
    const drag = this.drag;
    this.endDrag();
    if (!pointer.started || !drag) return;
    this.suppressClick = true;
    setTimeout(() => { this.suppressClick = false; });
    if (this.moveItems(drag.ids, drag.by)) {
      const moved = this.items.find(item => item.id === pointer.item.id);
      if (moved) this.focusPlace = { column: moved.column, row: moved.row };
    }
  };

  private endDrag = () => {
    if (this.pointer?.timer) clearTimeout(this.pointer.timer);
    this.pointer = undefined;
    this.drag = undefined;
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.endDrag);
  };

  private name(): string {
    if (!this.label) return "";
    return this.literal ? this.label : getText(this.label) || this.label;
  }

  render() {
    const columns = this.columnCount, rows = this.rowCount;
    const places = this.byPlace;
    const drag = this.drag;
    const carried = new Set(drag?.ids ?? []);
    const plan = drag ? planMove(this.items, drag.ids, drag.by, columns) : null;
    const landing = new Set((plan ?? []).filter(move => carried.has(move.id)).map(move => placeKey(move.to.column, move.to.row)));
    const focus = this.focusPlace;
    const tab = focus.column < columns && focus.row < rows ? focus : { column: 0, row: 0 };
    const occupied = (column: number, row: number) => places.has(placeKey(column, row)) && !carried.has(places.get(placeKey(column, row))!.id);
    return html`<div
      class="board"
      part="board"
      role="grid"
      aria-label=${this.name() || nothing}
      aria-multiselectable=${this.readonly ? nothing : "true"}
      aria-rowcount=${rows}
      aria-colcount=${columns}
      ?data-dragging=${Boolean(drag)}
      @keydown=${this.onKeyDown}
      @click=${this.onClick}
      @pointerdown=${this.onPointerDown}
    >
      ${Array.from({ length: rows }, (_, row) => html`<div role="row" class="row">
        ${Array.from({ length: columns }, (_, column) => {
          const item = places.get(placeKey(column, row));
          const position = `grid-column: ${column + 1}; grid-row: ${row + 1};`;
          const tabindex = tab.column === column && tab.row === row ? 0 : -1;
          const landHere = landing.has(placeKey(column, row));
          if (!item) {
            return html`<div
              role="gridcell"
              class="cell free"
              part="free"
              data-column=${column}
              data-row=${row}
              tabindex=${tabindex}
              aria-label=${`${columnName(column)}${row + 1}`}
              ?data-landing=${landHere}
              style=${position}
            ></div>`;
          }
          const isCarried = carried.has(item.id);
          const shift = isCarried && drag ? `transform: translate(${drag.x}px, ${drag.y}px);` : "";
          const fill = item.header && item.color ? `--ds-matrix-header-fill: ${item.color};` : "";
          return html`<div
            role="gridcell"
            class="cell item"
            part=${["item", item.header ? "header" : "", item.starred ? "starred" : "", item.completed ? "completed" : ""].filter(Boolean).join(" ")}
            data-column=${column}
            data-row=${row}
            data-id=${item.id}
            tabindex=${tabindex}
            aria-selected=${this.readonly ? nothing : String(this.selected.includes(item.id))}
            ?data-header=${item.header}
            ?data-starred=${item.starred}
            ?data-completed=${item.completed}
            ?data-carried=${isCarried}
            ?data-landing=${landHere}
            ?data-shared-top=${!isCarried && occupied(column, row - 1)}
            ?data-shared-bottom=${!isCarried && occupied(column, row + 1)}
            ?data-shared-start=${!isCarried && occupied(column - 1, row)}
            ?data-shared-end=${!isCarried && occupied(column + 1, row)}
            style=${position + shift + fill}
          >${item.starred ? html`<span class="star" aria-hidden="true"><ds-icon type="star" size="large"></ds-icon></span>` : nothing}<span class="title">${item.title}</span></div>`;
        })}
      </div>`)}
    </div>`;
  }
}

define("ds-matrix", Matrix);

declare global {
  interface HTMLElementTagNameMap {
    "ds-matrix": Matrix;
  }
}
