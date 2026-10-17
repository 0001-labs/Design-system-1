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
