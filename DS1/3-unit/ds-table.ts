// ds-table.ts
// A data table: rows one square high on hairlines, drawn from data with the
// same rules as a native `<table class="ds-table">` (1-root/table.css). With
// `sheet` it is a spreadsheet: every cell four squares by one, lettered
// columns and numbered rows held in place while it scrolls both ways, and with
// `reorderable` its rows move by the grip on their number: dragged with a
// mouse, after a long press on a touch screen, or with Alt+↑/↓. A sheet's
// words that do not fit fade out over their last square, never an ellipsis.

import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { getText } from "../0-face/i18n";
import { matchesShortcut } from "../0-face/keys";
import "../2-core/ds-icon";
import metrics from "../1-root/component-metrics.css?inline";
import table from "../1-root/table.css?inline";
import styles from "./styles/ds-table.css?inline";

/** A column: the key it reads from each row, its header, and whether it holds numbers. */
export interface TableColumn {
  key: string;
  label: string;
  /** Sets the column to its end in tabular figures. Unset, a column of numbers is numeric. */
  numeric?: boolean;
}

/** A row: values by column key, or by column position. */
export type TableRow = Record<string, unknown> | readonly unknown[];

/** `table-move`: a row someone moved, from its index to its new one, both from 0. */
export interface TableMoveDetail {
  from: number;
  to: number;
}

/**
 * The feel of a move, a sortable list's: a mouse moves 5px before the row
 * lifts, a finger holds 250ms (moving 5px first scrolls instead), the rows
 * between step aside in 200ms, the row settles in 330 to 550ms by its
 * distance, and the sheet scrolls near its edges up to 24px a frame.
 */
const DRAG_DISTANCE = 5;
const TOUCH_HOLD = 250;
const STEP_ASIDE = 200;
const DROP = { min: 330, max: 550, far: 1500 };
const EDGE = 60;
const SCROLL_SPEED = 24;

interface Drag {
  pointer: number;
  touch: boolean;
  from: number;
  to: number;
  startY: number;
  y: number;
  startScroll: number;
  pitch: number;
  row: HTMLTableRowElement;
  lifted: boolean;
  hold?: ReturnType<typeof setTimeout>;
  frame?: number;
}

/** The rows in their new order: the row at `from` taken out and put back at `to`. */
export function moveRow<T>(rows: readonly T[], from: number, to: number): T[] {
  const next = [...rows];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row!);
  return next;
}

const capitalised = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);
const blank = (value: unknown) => value === undefined || value === null || value === "";

export class DsTable extends LitElement {
  static properties = {
    data: { type: Array },
    columns: { type: Array },
    footer: { type: Object },
    sticky: { type: Boolean, reflect: true },
    sheet: { type: Boolean, reflect: true },
    reorderable: { type: Boolean, reflect: true },
    label: { type: String },
  };

  /** The body rows. */
  declare data: TableRow[];
  /** Headers as labels (`"Users"` reads `users`) or columns; unset, the first row's keys. */
  declare columns: (string | TableColumn)[];
  /** A totals row under the body. */
  declare footer: TableRow | undefined;
  /** Keeps the first column in place while the table scrolls sideways. */
  declare sticky: boolean;
  /** A spreadsheet: cells 80 by 20, columns lettered A, B, C…, rows numbered, both held in place. */
  declare sheet: boolean;
  /** A sheet's rows move by the grip on their number; each move fires `table-move`. */
  declare reorderable: boolean;
  /** The table's accessible name. */
  declare label: string | undefined;

  private drag: Drag | undefined;
  /** The row whose grip the keyboard reaches with Tab; arrows move between grips. */
  private grip = 0;
  /** A move waiting for the page's data, and the time it settles back without it. */
  private settle: { from: number; to: number; timer: ReturnType<typeof setTimeout> } | undefined;
  private status = "";
  /** Measures the cells again when the sheet's size changes, as its scale does. */
  private resize: ResizeObserver | undefined;
  private watched: Element | undefined;

  constructor() {
    super();
    this.data = [];
    this.columns = [];
    this.sticky = false;
    this.sheet = false;
    this.reorderable = false;
  }

  static styles = [unsafeCSS(metrics), unsafeCSS(table), unsafeCSS(styles)];

  connectedCallback() {
    super.connectedCallback();
    // The faces may arrive after the first measure and change every width.
    void document.fonts?.ready.then(() => { if (this.isConnected && this.sheet) this.fit(); });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resize?.disconnect();
    this.watched = undefined;
    this.release();
    if (this.settle) clearTimeout(this.settle.timer);
    this.settle = undefined;
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // New data puts every row where it belongs: the steps aside end in the same frame.
    if (changed.has("data") && this.settle) this.place(false);
    if (this.grip >= this.data.length) this.grip = Math.max(0, this.data.length - 1);
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.sheet) return;
    // Before the first paint, so words that fit never show a fade.
    if (["data", "columns", "footer", "sheet"].some(name => changed.has(name as keyof DsTable))) this.fit();
    const table = this.table;
    if (!table || table === this.watched || typeof ResizeObserver === "undefined") return;
    this.resize ??= new ResizeObserver(() => this.fit());
    this.resize.disconnect();
    this.resize.observe(table);
    this.watched = table;
  }

  /**
   * Marks the cells whose words are cut, so only they fade where they are
   * cut; a label fades at its end. A number always shows its last digits and loses its first: in a
   * left-to-right sheet it is scrolled to its end and fades at its start;
   * in a right-to-left one its digits already overflow on the left, the
   * cell's end. All the reads come before any write, so it lays out once.
   */
  private fit() {
    const words = [...this.renderRoot.querySelectorAll<HTMLElement>(".ds-table__words")];
    if (!words.length) return;
    const rtl = getComputedStyle(words[0]!).direction === "rtl";
    const over = words.map(element => element.scrollWidth - element.clientWidth);
    const scrolled = words.map((element, index) => !rtl && over[index]! > 0 && Boolean(element.parentElement?.matches("td[data-numeric]")));
    words.forEach((element, index) => {
      const left = scrolled[index] ? over[index]! : 0;
      if (element.scrollLeft !== left) element.scrollLeft = left;
    });
    words.forEach((element, index) => {
      const cut = over[index]! <= 0 ? undefined : scrolled[index] ? "start" : "end";
      if (element.dataset.cut !== cut) { if (cut) element.dataset.cut = cut; else delete element.dataset.cut; }
    });
  }

  private resolvedColumns(): TableColumn[] {
    const named = this.columns.length > 0;
    const given = named
      ? this.columns
      : Object.keys((this.data.find(row => !Array.isArray(row)) as Record<string, unknown> | undefined) ?? {});
    const rows = this.footer ? [...this.data, this.footer] : this.data;
    return given.map((column, index) => {
      const resolved = typeof column !== "string" ? column
        : named ? { key: column.toLowerCase(), label: column }
        : { key: column, label: capitalised(column) };
      const values = rows.map(row => cell(row, resolved.key, index)).filter(value => !blank(value));
      const numeric = resolved.numeric ?? (values.length > 0 && values.every(value => typeof value === "number"));
      return { ...resolved, numeric };
    });
  }

  private row(row: TableRow, columns: TableColumn[]) {
    return html`<tr>${columns.map((column, index) => {
      const value = text(cell(row, column.key, index));
      return index === 0
        ? html`<th scope="row" ?data-numeric=${column.numeric}>${value}</th>`
        : html`<td ?data-numeric=${column.numeric}>${value}</td>`;
    })}</tr>`;
  }

  private sheetRow(row: TableRow, columns: TableColumn[], number: string, index?: number) {
    const grip = this.reorderable && index !== undefined;
    return html`<tr><th scope="row" class="ds-table__number">${grip ? this.gripCell(number, index) : number}</th>${columns.map((column, index) =>
      html`<td ?data-numeric=${column.numeric}><span class="ds-table__words">${text(cell(row, column.key, index))}</span></td>`)}</tr>`;
  }

  private gripCell(number: string, index: number) {
    return html`<span class="ds-table__index">${number}</span><button type="button" class="ds-table__handle" part="handle"
      tabindex=${index === this.grip ? 0 : -1} aria-label=${words("Move row {index}", { index: index + 1 })}
      aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown" @keydown=${this.gripKey}
      @focus=${() => { if (this.grip !== index) { this.grip = index; this.requestUpdate(); } }}
      ><ds-icon type="handle" size="large" aria-hidden="true"></ds-icon></button>`;
  }

  private get scroller() { return this.renderRoot.querySelector<HTMLElement>(".ds-table-scroll"); }
  private get table() { return this.renderRoot.querySelector<HTMLTableElement>("table"); }
  private get bodyRows() { return [...this.renderRoot.querySelectorAll<HTMLTableRowElement>("tbody > tr")]; }
  private handle(index: number) { return this.bodyRows[index]?.querySelector<HTMLButtonElement>(".ds-table__handle") ?? null; }
  private get calm() { return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches; }
  /** True from a lift until every row is in its place again. */
  private get moving() { return Boolean(this.table?.hasAttribute("data-moving")); }

  /** The press that may become a drag: on a row's number, the first button, not while a row settles. */
  private press = (event: PointerEvent) => {
    if (!this.reorderable || !this.sheet || this.drag || event.button !== 0) return;
    const number = (event.target as Element).closest?.("tbody .ds-table__number");
    const row = number?.parentElement as HTMLTableRowElement | null;
    if (!number || !row || this.moving) return;
    const from = this.bodyRows.indexOf(row);
    if (from < 0) return;
    const touch = event.pointerType === "touch";
    this.drag = { pointer: event.pointerId, touch, from, to: from, startY: event.clientY, y: event.clientY, startScroll: this.scroller?.scrollTop ?? 0, pitch: 0, row, lifted: false };
    if (touch) this.drag.hold = setTimeout(() => this.lift(), TOUCH_HOLD);
    // A mouse keeps its press for the drag: no words selected on the way.
    else event.preventDefault();
    addEventListener("pointermove", this.follow, { passive: true });
    addEventListener("pointerup", this.drop);
    addEventListener("pointercancel", this.cancel);
    addEventListener("keydown", this.escape, true);
  };

  private follow = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointer) return;
    drag.y = event.clientY;
    if (!drag.lifted) {
      if (Math.abs(drag.y - drag.startY) < DRAG_DISTANCE) return;
      // A finger that moves before the hold has ended is scrolling.
      if (drag.touch) { this.release(); return; }
      this.lift();
    }
    this.track();
  };

  /** A finger holding a lifted row moves it, not the page. */
  private holdTouch = (event: TouchEvent) => { if (this.drag?.lifted) event.preventDefault(); };
  /** A long press lifts the row rather than opening the context menu. */
  private holdMenu = (event: Event) => { if (this.drag?.touch) event.preventDefault(); };

  private lift() {
    const drag = this.drag;
    if (!drag || drag.lifted) return;
    drag.lifted = true;
    drag.pitch = drag.row.getBoundingClientRect().height;
    drag.row.style.transition = "";
    drag.row.toggleAttribute("data-lifted", true);
    this.table?.toggleAttribute("data-moving", true);
    this.grip = drag.from;
    const scroll = () => {
      if (!this.drag?.lifted) return;
      this.autoscroll();
      this.drag.frame = requestAnimationFrame(scroll);
    };
    drag.frame = requestAnimationFrame(scroll);
    this.track();
  }

  /** How far the row has come, kept within the body. */
  private offset(drag: Drag) {
    const travelled = drag.y - drag.startY + (this.scroller?.scrollTop ?? 0) - drag.startScroll;
    const last = this.data.length - 1;
    return Math.min(Math.max(travelled, -drag.from * drag.pitch), (last - drag.from) * drag.pitch);
  }

  /** The lifted row follows the pointer; the rows it passes step aside by one row, in transform alone. */
  private track() {
    const drag = this.drag;
    if (!drag?.lifted) return;
    const offset = this.offset(drag);
    drag.row.style.transform = `translateY(${offset}px)`;
    const to = Math.min(Math.max(drag.from + Math.round(offset / drag.pitch), 0), this.data.length - 1);
    if (to === drag.to) return;
    const rows = this.bodyRows;
    const low = Math.min(drag.from, drag.to, to), high = Math.max(drag.from, drag.to, to);
    for (let index = low; index <= high; index++) {
      if (index === drag.from) continue;
      const shift = to > drag.from && index > drag.from && index <= to ? -1 : to < drag.from && index < drag.from && index >= to ? 1 : 0;
      rows[index]!.style.transform = shift ? `translateY(${shift * drag.pitch}px)` : "";
    }
    drag.to = to;
  }

  /** Near the sheet's top (under its held header) or foot, it scrolls, faster the closer the pointer. */
  private autoscroll() {
    const drag = this.drag, scroller = this.scroller;
    if (!drag || !scroller) return;
    const box = scroller.getBoundingClientRect();
    const head = this.renderRoot.querySelector("thead")?.getBoundingClientRect().height ?? 0;
    const edge = Math.min(EDGE, (box.height - head) / 4);
    const top = box.top + head + edge - drag.y, bottom = drag.y - (box.bottom - edge);
    const pull = top > 0 ? -Math.min(top / edge, 1) : bottom > 0 ? Math.min(bottom / edge, 1) : 0;
    if (!pull) return;
    const before = scroller.scrollTop;
    scroller.scrollTop += Math.sign(pull) * Math.ceil(pull * pull * SCROLL_SPEED);
    if (scroller.scrollTop !== before) this.track();
  }

  private drop = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointer) return;
    if (!drag.lifted) { this.release(); return; }
    const { from, to, pitch, row } = drag;
    const distance = Math.abs(this.offset(drag) - (to - from) * pitch);
    this.release(true);
    // The row settles into its place, then the move is the page's to keep.
    row.style.transition = this.calm ? "none" : `transform ${Math.round(DROP.min + (DROP.max - DROP.min) * Math.min(distance / DROP.far, 1))}ms cubic-bezier(.2, 1, .1, 1)`;
    row.style.transform = to === from ? "" : `translateY(${(to - from) * pitch}px)`;
    const done = () => { row.removeEventListener("transitionend", done); clearTimeout(timer); this.commit(from, to); };
    const timer = setTimeout(done, this.calm || !distance ? 0 : DROP.max + 50);
    row.addEventListener("transitionend", done);
  };

  private cancel = (event: PointerEvent) => {
    if (event.pointerId !== this.drag?.pointer) return;
    this.release();
    this.place(true);
  };

  private escape = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !this.drag) return;
    event.preventDefault();
    event.stopPropagation();
    this.release();
    this.place(true);
  };

  /** Lets go of the pointer; `keep` leaves the rows where they stand. */
  private release(keep = false) {
    const drag = this.drag;
    if (!drag) return;
    clearTimeout(drag.hold);
    if (drag.frame !== undefined) cancelAnimationFrame(drag.frame);
    this.drag = undefined;
    removeEventListener("pointermove", this.follow);
    removeEventListener("pointerup", this.drop);
    removeEventListener("pointercancel", this.cancel);
    removeEventListener("keydown", this.escape, true);
    drag.row.removeAttribute("data-lifted");
    if (!keep) this.table?.removeAttribute("data-moving");
  }

  /** Puts every row back in its own place, gliding there or at once. */
  private place(glide: boolean) {
    if (this.settle) clearTimeout(this.settle.timer);
    this.settle = undefined;
    const table = this.table;
    table?.removeAttribute("data-moving");
    if (glide && !this.calm) table?.toggleAttribute("data-moving", true);
    for (const row of this.bodyRows) {
      row.style.transition = "";
      row.style.transform = "";
    }
    if (glide && !this.calm) setTimeout(() => { if (!this.drag) table?.removeAttribute("data-moving"); }, STEP_ASIDE);
  }

  /**
   * Asks the page with a cancelable `table-move`. Unless it is prevented the
   * table moves the row in its own `data`; prevented, the page sets `data`
   * itself, and the rows stay where they were dropped until it does, or
   * glide back when it does not.
   */
  private commit(from: number, to: number) {
    if (from === to) { this.place(true); return; }
    this.settle = { from, to, timer: setTimeout(() => this.place(true), STEP_ASIDE * 2) };
    const event = new CustomEvent<TableMoveDetail>("table-move", { detail: { from, to }, bubbles: true, composed: true, cancelable: true });
    const accepted = this.dispatchEvent(event);
    if (accepted && this.settle) this.data = moveRow(this.data, from, to);
    if (this.grip === from) this.grip = to;
    this.status = words("Row {from} moved to {to}", { from: from + 1, to: to + 1 });
    this.requestUpdate();
  }

  /** Alt+↑/↓ (or ⌘⇧↑/↓, as a writing surface moves a block) moves the row; ↑/↓, Home and End move between grips. */
  private gripKey = (event: KeyboardEvent) => {
    const index = this.bodyRows.findIndex(row => row.contains(event.target as Node));
    if (index < 0 || this.drag || this.moving) return;
    const up = ["alt+arrowup", "mod+shift+arrowup"].some(key => matchesShortcut(event, key));
    const down = ["alt+arrowdown", "mod+shift+arrowdown"].some(key => matchesShortcut(event, key));
    if (up || down) {
      event.preventDefault();
      const to = index + (up ? -1 : 1);
      if (to < 0 || to >= this.data.length) return;
      void this.stepMove(index, to);
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const next = { ArrowUp: index - 1, ArrowDown: index + 1, Home: 0, End: this.data.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    void this.focusGrip(Math.min(Math.max(next, 0), this.data.length - 1));
  };

  private async focusGrip(index: number) {
    this.grip = index;
    this.requestUpdate();
    await this.updateComplete;
    const handle = this.handle(index);
    handle?.focus({ preventScroll: true });
    handle?.closest("tr")?.scrollIntoView?.({ block: "nearest" });
  }

  /** A keyboard move: the two rows trade places, each gliding from where it stood. */
  private async stepMove(from: number, to: number) {
    const pitch = this.bodyRows[from]?.getBoundingClientRect().height ?? 0;
    this.commit(from, to);
    await this.updateComplete;
    if (this.settle) return;
    void this.focusGrip(to);
    if (this.calm || !pitch) return;
    const rows = this.bodyRows;
    const glide = (row: HTMLTableRowElement | undefined, from: number) => {
      if (!row) return;
      row.style.transition = "none";
      row.style.transform = `translateY(${from}px)`;
      row.getBoundingClientRect();
      row.style.transition = `transform ${STEP_ASIDE}ms cubic-bezier(0.2, 0, 0, 1)`;
      row.style.transform = "";
    };
    glide(rows[to], (from - to) * pitch);
    glide(rows[from], (to - from) * pitch);
  }

  private renderSheet(columns: TableColumn[]) {
    return html`
      <div class="ds-table-scroll" part="scroll" @pointerdown=${this.press} @touchmove=${{ handleEvent: this.holdTouch, passive: false }} @contextmenu=${this.holdMenu}>
        <table class="ds-table" part="table" data-sheet data-fit ?data-reorderable=${this.reorderable} style=${`--ds-table-columns: ${columns.length}`} aria-label=${this.label ?? nothing}>
          <thead>
            <tr class="ds-table__letters" aria-hidden="true"><td class="ds-table__number"></td>${columns.map((_, index) => html`<td>${columnLetter(index)}</td>`)}</tr>
            <tr><td class="ds-table__number"></td>${columns.map(column => html`<th scope="col" ?data-numeric=${column.numeric}><span class="ds-table__words">${column.label}</span></th>`)}</tr>
          </thead>
          <tbody>${this.data.map((row, index) => this.sheetRow(row, columns, String(index + 1), index))}</tbody>
          ${this.footer ? html`<tfoot>${this.sheetRow(this.footer, columns, "")}</tfoot>` : nothing}
        </table>
      </div>
      ${this.reorderable ? html`<span class="ds-table__status" role="status">${this.status}</span>` : nothing}
    `;
  }

  render() {
    const columns = this.resolvedColumns();
    if (this.sheet) return this.renderSheet(columns);
    return html`
      <div class="ds-table-scroll" part="scroll">
        <table class="ds-table" part="table" ?data-sticky=${this.sticky} aria-label=${this.label ?? nothing}>
          <thead>
            <tr>${columns.map(column => html`<th scope="col" ?data-numeric=${column.numeric}>${column.label}</th>`)}</tr>
          </thead>
          <tbody>${this.data.map(row => this.row(row, columns))}</tbody>
          ${this.footer ? html`<tfoot>${this.row(this.footer, columns)}</tfoot>` : nothing}
        </table>
      </div>
    `;
  }
}

function cell(row: TableRow, key: string, index: number): unknown {
  return Array.isArray(row) ? row[index] : (row as Record<string, unknown>)[key];
}

/** A spreadsheet's column name: A … Z, then AA, AB … */
export function columnLetter(index: number): string {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}

/** A shared word in the page's language, its `{name}`s filled. */
function words(key: string, params: Record<string, number>): string {
  const text = getText(key, params) || key;
  return text.replace(/\{\{?(\w+)\}?\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));
}

function text(value: unknown): string {
  if (blank(value)) return "";
  return typeof value === "number" ? value.toLocaleString() : String(value);
}

customElements.define("ds-table", DsTable);

declare global {
  interface HTMLElementTagNameMap {
    "ds-table": DsTable;
  }
}
