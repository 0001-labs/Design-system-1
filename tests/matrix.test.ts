// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { orderColumns } = await import("../DS1/3-unit/ds-matrix");
type Matrix = HTMLElementTagNameMap["ds-matrix"];

afterEach(() => { document.body.replaceChildren(); });

const DATA = {
  groups: [
    { id: "stack", label: "Stack", color: "orange" },
    { id: "parts", label: "Parts", color: "pink" },
  ],
  columns: [
    { id: "sign-in", label: "Sign-in", group: "parts" },
    { id: "loose", label: "Loose" },
    { id: "typescript", label: "TypeScript", group: "stack" },
    { id: "billing", label: "Billing", group: "parts" },
  ],
  rows: [{ id: "atlas", label: "Atlas" }, { id: "harbor", label: "Harbor" }],
  cells: [
    { row: "atlas", column: "typescript", mark: "fill" as const },
    { row: "atlas", column: "sign-in", mark: "triangle" as const, note: "From the shared source" },
    { row: "harbor", column: "sign-in", mark: "outline" as const },
    { row: "harbor", column: "billing", mark: "dash" as const },
  ],
  marks: [
    { mark: "fill" as const, label: "Uses" },
    { mark: "triangle" as const, label: "Shares one copy" },
    { mark: "outline" as const, label: "Copied in" },
  ],
};

async function matrix(attributes = "") {
  document.body.innerHTML = `<ds-matrix ${attributes}></ds-matrix>`;
  const element = document.querySelector("ds-matrix") as Matrix;
  Object.assign(element, DATA);
  await element.updateComplete;
  return element;
}

const cell = (host: Matrix, row: number, column: number) => host.shadowRoot!.querySelector<HTMLElement>(`.cell[data-row="${row}"][data-column="${column}"]`)!;
const key = (target: Element, name: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, composed: true, cancelable: true }));

test("columns stand in their groups' order, ungrouped ones last", () => {
  expect(orderColumns(DATA.columns, DATA.groups).map(entry => entry.column.id)).toEqual(["typescript", "sign-in", "billing", "loose"]);
});

test("each pair meets in a square named by its row, column and mark", async () => {
  const element = await matrix(`label="Products" literal`);
  const root = element.shadowRoot!;
  expect(root.querySelector(".grid")!.getAttribute("aria-label")).toBe("Products");
  expect(root.querySelectorAll(".cell")).toHaveLength(2 * 4);
  expect([...root.querySelectorAll(".column")].map(column => column.textContent)).toEqual(["TypeScript", "Sign-in", "Billing", "Loose"]);
  expect(cell(element, 0, 1).getAttribute("aria-label")).toBe("Atlas, Sign-in: Shares one copy. From the shared source");
  expect(cell(element, 0, 1).querySelector(".mark")!.getAttribute("data-mark")).toBe("triangle");
  expect(cell(element, 1, 0).getAttribute("aria-label")).toBe("Harbor, TypeScript: –");
  expect(cell(element, 0, 0).getAttribute("style")).toContain("--ds-matrix-colour: orange");
  expect(cell(element, 0, 3).getAttribute("style")).not.toContain("--ds-matrix-colour");
});

test("a bar stands over each group, and the legend names the marks", async () => {
  const element = await matrix();
  const bars = [...element.shadowRoot!.querySelectorAll<HTMLElement>(".group")];
  expect(bars.map(bar => bar.textContent)).toEqual(["Stack", "Parts"]);
  expect(bars[1].getAttribute("style")).toContain("grid-column: 3 / span 2");
  expect([...element.shadowRoot!.querySelectorAll(".key")].map(item => item.textContent)).toEqual(["Uses", "Shares one copy", "Copied in"]);
});

test("totals count each column's marks, not its dashes", async () => {
  const element = await matrix(`totals totals-label="Products" literal`);
  const counts = [...element.shadowRoot!.querySelectorAll(".count")].map(count => count.textContent);
  expect(counts).toEqual(["1", "2", "", ""]);
  expect(element.shadowRoot!.querySelector(".name.totals")!.textContent).toBe("Products");
});

test("the arrows move the one Tab stop and light the crosshair; Enter presses", async () => {
  const element = await matrix();
  expect(cell(element, 0, 0).tabIndex).toBe(0);
  key(cell(element, 0, 0), "ArrowRight");
  await element.updateComplete;
  expect(cell(element, 0, 1).tabIndex).toBe(0);
  expect(cell(element, 1, 1).hasAttribute("data-lit")).toBe(true);
  expect(cell(element, 1, 0).hasAttribute("data-lit")).toBe(false);
  key(cell(element, 0, 1), "End");
  await element.updateComplete;
  expect(element.focusAt).toEqual({ row: 0, column: 3 });
  const pressed: string[] = [];
  element.addEventListener("cell-press", event => {
    const { row, column, cell: found } = (event as CustomEvent).detail;
    pressed.push(`${row.id}>${column.id}:${found?.mark ?? ""}`);
  });
  key(cell(element, 0, 3), "Enter");
  cell(element, 1, 1).click();
  expect(pressed).toEqual(["atlas>loose:", "harbor>sign-in:outline"]);
});

test("pressing a row or column name says which", async () => {
  const element = await matrix();
  const pressed: string[] = [];
  element.addEventListener("row-press", event => pressed.push((event as CustomEvent).detail.row.id));
  element.addEventListener("column-press", event => pressed.push((event as CustomEvent).detail.column.id));
  element.shadowRoot!.querySelector<HTMLElement>('.name[data-row="1"]')!.click();
  element.shadowRoot!.querySelector<HTMLElement>('.column[data-column="2"] span')!.click();
  expect(pressed).toEqual(["harbor", "billing"]);
});

test("the matrix names no product", () => {
  for (const file of ["3-unit/ds-matrix.ts", "3-unit/styles/ds-matrix.css"]) {
    expect(readFileSync(join(import.meta.dirname, "../DS1", file), "utf8")).not.toMatch(/\b(Ezo|Link|Consistency|Peer|Ins|tau99|System)\b/);
  }
});
