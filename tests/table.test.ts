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
  expect(css).not.toMatch(/border-(left|right|top)|outline:/);
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
