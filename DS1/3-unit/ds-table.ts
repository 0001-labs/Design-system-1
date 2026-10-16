// ds-table.ts
// A data table: rows one square high on hairlines, drawn from data with the
// same rules as a native `<table class="ds-table">` (1-root/table.css).

import { LitElement, html, nothing, unsafeCSS } from "lit";
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

const capitalised = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);
const blank = (value: unknown) => value === undefined || value === null || value === "";

export class DsTable extends LitElement {
  static properties = {
    data: { type: Array },
    columns: { type: Array },
    footer: { type: Object },
    sticky: { type: Boolean, reflect: true },
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
  /** The table's accessible name. */
  declare label: string | undefined;

  constructor() {
    super();
    this.data = [];
    this.columns = [];
    this.sticky = false;
  }

  static styles = [unsafeCSS(metrics), unsafeCSS(table), unsafeCSS(styles)];

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

  render() {
    const columns = this.resolvedColumns();
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
