/** A table in React: the rows go to ds-table as properties, a moved row comes
 * back as `onMove`. With `onMove` the rows are the page's: the table asks and
 * the page reorders its own state (`moveRow` from ds-table does it) and passes
 * the rows back; the moved row stays where it was dropped until they arrive.
 * Without it, a reorderable table keeps the order in its own data.
 * Browser-only registration of ds-table stays in the product's runtime entry;
 * on the server the element renders empty and fills on load. */
import { createElement as h, forwardRef, useEffect, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import type { DsTable as TableElement, TableColumn, TableMoveDetail, TableRow } from "../3-unit/ds-table";

export type { TableColumn, TableMoveDetail, TableRow };

export type TableProps = HTMLAttributes<TableElement> & {
  /** The body rows: objects read by column key, or arrays read by position. */
  data: TableRow[];
  /** Headers as labels (`"Users"` reads `users`) or columns; unset, the first row's keys. */
  columns?: (string | TableColumn)[];
  /** A totals row under the body. */
  footer?: TableRow;
  /** Keeps the first column in place while the table scrolls sideways. */
  sticky?: boolean;
  /** A spreadsheet: cells four squares by one, columns lettered, rows numbered. */
  sheet?: boolean;
  /** A sheet's rows move by the grip on their number. */
  reorderable?: boolean;
  /** The table's accessible name. */
  label?: string;
  /** A row was moved: reorder the rows (`moveRow(rows, from, to)` from ds-table) and pass them back. */
  onMove?: (move: TableMoveDetail) => void;
};

const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const Table = forwardRef<TableElement, TableProps>(function Table(
  { data, columns, footer, sticky, sheet, reorderable, label, onMove, ...props }, ref,
) {
  const host = useRef<TableElement>(null);
  useCommitEffect(() => {
    const element = host.current; if (!element) return;
    element.data = data;
    element.columns = columns ?? [];
    element.footer = footer;
  }, [data, columns, footer]);
  useCommitEffect(() => {
    const element = host.current; if (!element || !onMove) return;
    const move = (event: Event) => { event.preventDefault(); onMove((event as CustomEvent<TableMoveDetail>).detail); };
    element.addEventListener("table-move", move);
    return () => element.removeEventListener("table-move", move);
  });
  return h("ds-table", { ...props, label, sticky: sticky || undefined, sheet: sheet || undefined, reorderable: reorderable || undefined,
    ref: (element: TableElement | null) => { host.current = element; if (typeof ref === "function") ref(element); else if (ref) ref.current = element; },
  });
});
