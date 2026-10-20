// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test } from "vite-plus/test";
await import("../DS1/3-unit/ds-table");
afterEach(() => document.body.replaceChildren());

const css = readFileSync(join(import.meta.dirname, "../DS1/1-root/table.css"), "utf8");
const rule = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("}", start));
};

test("a row is one square on a hairline, with no box and no column lines", () => {
  const cell = rule(".ds-table :is(th, td)");
  expect(rule(".ds-table")).toContain("--ds-table-row: var(--ds-row-height");
  expect(cell).toContain("height: var(--ds-table-row)");
  expect(cell).toContain("border: 0");
  expect(cell).toContain("border-bottom: 1px solid var(--ds-table-rule)");
  // The words' sixteen stands against the rule at the cell's foot.
  expect(cell).toContain("line-height: var(--ds-type-lineheight-default)");
  expect(cell).toContain("vertical-align: bottom");
  expect(cell).toContain("font-weight: inherit");
  // Only a table that asks for its frame (`data-frame`) has one.
  const plain = css.replace(/\.ds-table\[data-frame\][^{]*\{[^}]*\}/g, "");
  expect(plain).not.toMatch(/border-(left|right|top)|outline:/);
});

test("the native controls carry the table", () => {
  const controls = readFileSync(join(import.meta.dirname, "../DS1/1-root/controls.css"), "utf8");
  expect(controls).toContain('@import "./table.css";');
});

test("columns come from the first row's keys, numbers are set to the end", async () => {
  const table = document.createElement("ds-table");
  table.data = [{ product: "Atlas", users: 1200, status: "Active" }, { product: "Harbor", users: 80, status: "" }];
  table.footer = { product: "Total", users: 1280 };
  document.body.append(table); await table.updateComplete;
  const root = table.shadowRoot!;
  expect([...root.querySelectorAll("thead th")].map(th => th.textContent)).toEqual(["Product", "Users", "Status"]);
  expect(root.querySelector("thead th:nth-child(2)")!.hasAttribute("data-numeric")).toBe(true);
  expect(root.querySelector("thead th:nth-child(3)")!.hasAttribute("data-numeric")).toBe(false);
  expect(root.querySelector("tbody th[scope=row]")!.textContent).toBe("Atlas");
  expect(root.querySelector("tbody td[data-numeric]")!.textContent).toBe((1200).toLocaleString());
  expect(root.querySelector("tfoot th")!.textContent).toBe("Total");
});

test("named columns read by key or position, and the first column can stay put", async () => {
  const table = document.createElement("ds-table");
  table.columns = ["Name", { key: "share", label: "Share", numeric: true }];
  table.data = [{ name: "Atlas", share: "92%" }, ["Harbor", "88%"]];
  table.sticky = true;
  document.body.append(table); await table.updateComplete;
  const rows = [...table.shadowRoot!.querySelectorAll("tbody tr")].map(row => [...row.children].map(cell => cell.textContent));
  expect(rows).toEqual([["Atlas", "92%"], ["Harbor", "88%"]]);
  expect(table.shadowRoot!.querySelector("table")!.hasAttribute("data-sticky")).toBe(true);
  expect(table.shadowRoot!.querySelector("thead th:nth-child(2)")!.hasAttribute("data-numeric")).toBe(true);
});

test("a sheet letters its columns, numbers its rows and tells its stylesheet how many columns it has", async () => {
  const { columnLetter } = await import("../DS1/3-unit/ds-table");
  expect([0, 1, 25, 26, 27, 51, 52, 701, 702].map(columnLetter)).toEqual(["A", "B", "Z", "AA", "AB", "AZ", "BA", "ZZ", "AAA"]);
  const table = document.createElement("ds-table");
  table.sheet = true;
  table.columns = ["Item", { key: "sold", label: "Sold", numeric: true }];
  table.data = [{ item: "Atlas", sold: 1200 }, { item: "Comet", sold: 80 }];
  table.footer = { item: "Total", sold: 1280 };
  document.body.append(table);
  await table.updateComplete;
  const root = table.shadowRoot!;
  const sheet = root.querySelector<HTMLTableElement>("table[data-sheet]")!;
  expect(sheet.style.getPropertyValue("--ds-table-columns")).toBe("2");
  expect([...root.querySelectorAll(".ds-table__letters td")].map(cell => cell.textContent)).toEqual(["", "A", "B"]);
  expect(root.querySelector(".ds-table__letters")!.getAttribute("aria-hidden")).toBe("true");
  expect([...root.querySelectorAll("thead tr + tr th")].map(cell => cell.textContent)).toEqual(["Item", "Sold"]);
  expect([...root.querySelectorAll("tbody th[scope=row]")].map(cell => cell.textContent)).toEqual(["1", "2"]);
  expect(root.querySelector("tbody tr td[data-numeric]")!.textContent).toBe((1200).toLocaleString());
  expect(root.querySelector("tfoot th")!.textContent).toBe("");
});

test("a sheet's cells are four squares by one, on lines at their end and foot", () => {
  expect(rule(".ds-table[data-sheet]")).toContain("--ds-table-cell: calc(4 * var(--ds-table-row))");
  expect(rule(".ds-table[data-sheet]")).toContain("table-layout: fixed");
  const cell = rule(".ds-table[data-sheet] :is(th, td)");
  expect(cell).toContain("width: var(--ds-table-cell)");
  expect(cell).toContain("border-inline-end: 1px solid var(--ds-table-rule)");
  expect(cell).toContain("padding: 0 var(--ds-table-text)");
});

test("moveRow takes a row out and puts it back at its new index", async () => {
  const { moveRow } = await import("../DS1/3-unit/ds-table");
  expect(moveRow(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  expect(moveRow(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
});

const reorderable = async (rows = ["Atlas", "Comet", "Harbour"]) => {
  const table = document.createElement("ds-table");
  table.sheet = true;
  table.reorderable = true;
  table.columns = ["Item"];
  table.data = rows.map(item => ({ item }));
  table.footer = { item: "Total" };
  document.body.append(table);
  await table.updateComplete;
  return table;
};
const items = (table: HTMLElementTagNameMap["ds-table"]) => [...table.shadowRoot!.querySelectorAll("tbody td")].map(cell => cell.textContent);
const numbers = (table: HTMLElementTagNameMap["ds-table"]) => [...table.shadowRoot!.querySelectorAll("tbody .ds-table__index")].map(cell => cell.textContent);
const key = (target: Element, key: string, altKey = false) => target.dispatchEvent(new KeyboardEvent("keydown", { key, altKey, bubbles: true, composed: true, cancelable: true }));

test("a reorderable sheet gives each body row a grip on its number, one of them in the tab order", async () => {
  const table = await reorderable();
  const root = table.shadowRoot!;
  expect(table.hasAttribute("reorderable")).toBe(true);
  expect(root.querySelector("table")!.hasAttribute("data-reorderable")).toBe(true);
  const handles = [...root.querySelectorAll<HTMLButtonElement>("tbody .ds-table__handle")];
  expect(handles.map(handle => handle.getAttribute("aria-label"))).toEqual(["Move row 1", "Move row 2", "Move row 3"]);
  expect(handles.map(handle => handle.tabIndex)).toEqual([0, -1, -1]);
  expect(handles[0]!.querySelector("ds-icon")!.getAttribute("type")).toBe("handle");
  expect(handles[0]!.getAttribute("aria-keyshortcuts")).toBe("Alt+ArrowUp Alt+ArrowDown");
  expect(root.querySelector("tfoot .ds-table__handle")).toBeNull();
  expect(numbers(table)).toEqual(["1", "2", "3"]);
  table.reorderable = false;
  await table.updateComplete;
  expect(root.querySelector(".ds-table__handle")).toBeNull();
  expect([...root.querySelectorAll("tbody th")].map(cell => cell.textContent)).toEqual(["1", "2", "3"]);
});

test("Alt+↓ on a grip moves its row, fires table-move and renumbers; the grip keeps the focus", async () => {
  const table = await reorderable();
  const moves: unknown[] = [];
  table.addEventListener("table-move", event => moves.push((event as CustomEvent).detail));
  const handle = table.shadowRoot!.querySelectorAll<HTMLButtonElement>(".ds-table__handle")[0]!;
  handle.focus();
  key(handle, "ArrowDown", true);
  await table.updateComplete; await table.updateComplete;
  expect(moves).toEqual([{ from: 0, to: 1 }]);
  expect(items(table)).toEqual(["Comet", "Atlas", "Harbour"]);
  expect(numbers(table)).toEqual(["1", "2", "3"]);
  expect(table.data.map(row => (row as { item: string }).item)).toEqual(["Comet", "Atlas", "Harbour"]);
  expect(table.shadowRoot!.activeElement).toBe(table.shadowRoot!.querySelectorAll(".ds-table__handle")[1]);
  expect(table.shadowRoot!.querySelector(".ds-table__status")!.textContent).toBe("Row 1 moved to 2");
  // The first row goes no further up.
  key(table.shadowRoot!.querySelectorAll(".ds-table__handle")[0]!, "ArrowUp", true);
  await table.updateComplete;
  expect(moves).toHaveLength(1);
});

test("a prevented table-move leaves the data to the page", async () => {
  const table = await reorderable();
  const rows = table.data;
  table.addEventListener("table-move", event => event.preventDefault());
  key(table.shadowRoot!.querySelectorAll(".ds-table__handle")[2]!, "ArrowUp", true);
  await table.updateComplete;
  expect(table.data).toBe(rows);
  expect(items(table)).toEqual(["Atlas", "Comet", "Harbour"]);
});

test("arrows, Home and End move between grips", async () => {
  const table = await reorderable(["A", "B", "C", "D"]);
  const handles = () => [...table.shadowRoot!.querySelectorAll<HTMLButtonElement>(".ds-table__handle")];
  handles()[0]!.focus();
  for (const [name, index] of [["ArrowDown", 1], ["End", 3], ["ArrowUp", 2], ["Home", 0]] as const) {
    key(table.shadowRoot!.activeElement!, name);
    await table.updateComplete; await table.updateComplete;
    expect(table.shadowRoot!.activeElement, name).toBe(handles()[index]);
    expect(handles().map(handle => handle.tabIndex).indexOf(0), name).toBe(index);
  }
});

test("the grip and the moving rows are drawn in table.css, in transform alone", () => {
  expect(rule(".ds-table__handle")).toContain("opacity: 0");
  expect(rule(".ds-table[data-moving] tbody tr")).toContain("transition: transform 200ms cubic-bezier(0.2, 0, 0, 1)");
  expect(rule(".ds-table[data-sheet] tbody tr[data-lifted] > :is(th, td)")).toContain("background: var(--ds-table-paper)");
  expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\n  \.ds-table\[data-moving\] tbody tr/);
});

test("a sheet's words that do not fit fade over their last square, never an ellipsis", async () => {
  expect(css).not.toContain("text-overflow: ellipsis");
  const words = rule(".ds-table[data-sheet] .ds-table__words");
  for (const part of ["display: block", "overflow: hidden", "white-space: nowrap"]) expect(words).toContain(part);
  expect(css).toContain('.ds-table[data-sheet] .ds-table__words[data-cut="end"] {\n  mask-image: linear-gradient(to var(--ds-table-fade-to), #000 calc(100% - var(--ds-table-row)), transparent);');
  expect(css).toContain('.ds-table[data-sheet] .ds-table__words[data-cut="start"] {\n  mask-image: linear-gradient(to var(--ds-table-fade-from), #000 calc(100% - var(--ds-table-row)), transparent);');
  expect(rule(".ds-table[data-sheet]:dir(rtl) .ds-table__words")).toContain("--ds-table-fade-to: left");
  // The fade is on the words alone, so a cell's fill and lines never fade.
  expect(css).not.toMatch(/:is\(th, td\)[^{]*\{[^}]*mask-image/);
  const table = document.createElement("ds-table");
  table.sheet = true;
  table.columns = ["Paper", { key: "sold", label: "Sold", numeric: true }];
  table.data = [{ paper: "Recycled 170g", sold: 12 }];
  document.body.append(table);
  await table.updateComplete;
  const root = table.shadowRoot!;
  expect(root.querySelector("table")!.hasAttribute("data-fit")).toBe(true);
  expect([...root.querySelectorAll("tbody td > .ds-table__words, thead th > .ds-table__words")].map(words => words.textContent)).toEqual(["Paper", "Sold", "Recycled 170g", "12"]);
});

test("a framed table draws its rounded frame and column lines inside the cells, so rows keep their pitch", () => {
  const css = readFileSync(join(import.meta.dirname, "../DS1/1-root/table.css"), "utf8");
  const frame = css.slice(css.indexOf(".ds-table[data-frame] {"), css.indexOf(".ds-table[data-frame] :is(th, td) {"));
  expect(frame).toMatch(/outline: 1px solid var\(--ds-table-rule\);/);
  expect(frame).toMatch(/outline-offset: -1px;/);
  expect(frame).toMatch(/border-radius: var\(--ds-table-radius\);/);
  expect(frame).not.toMatch(/\bborder:/);
  expect(css).toMatch(/\.ds-table\[data-frame\] :is\(th, td\) \+ :is\(th, td\) \{\s*box-shadow: inset 1px 0 0 var\(--ds-table-rule\);/);
});
