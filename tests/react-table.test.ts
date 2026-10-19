// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { act, createElement, createRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Table } from "../DS1/react/table";
import type { DsTable } from "../DS1/3-unit/ds-table";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { moveRow } = await import("../DS1/3-unit/ds-table");
afterEach(() => document.body.replaceChildren());

test("a reorderable sheet asks the page with onMove and draws the rows the page passes back", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount); const ref = createRef<DsTable>(); const moves = vi.fn();
  function Sheet() {
    const [rows, setRows] = useState([{ item: "Atlas" }, { item: "Comet" }, { item: "Harbour" }]);
    return createElement(Table, { ref, data: rows, columns: ["Item"], sheet: true, reorderable: true, label: "Prints",
      onMove: move => { moves(move); setRows(current => moveRow(current, move.from, move.to)); } });
  }
  try {
    await act(async () => root.render(createElement(Sheet)));
    const host = mount.querySelector("ds-table")!; await host.updateComplete;
    expect(ref.current).toBe(host);
    expect(host.sheet && host.reorderable).toBe(true);
    const rows = host.data;
    const handle = host.shadowRoot!.querySelectorAll<HTMLButtonElement>(".ds-table__handle")[0]!;
    await act(async () => { handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true, composed: true, cancelable: true })); });
    await host.updateComplete;
    expect(moves).toHaveBeenCalledWith({ from: 0, to: 1 });
    expect(host.data).not.toBe(rows);
    expect([...host.shadowRoot!.querySelectorAll("tbody td")].map(cell => cell.textContent)).toEqual(["Comet", "Atlas", "Harbour"]);
  } finally { await act(async () => root.unmount()); }
});
