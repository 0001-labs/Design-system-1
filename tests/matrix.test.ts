// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { columnName, planMove } = await import("../DS1/3-unit/ds-matrix");
type Matrix = HTMLElementTagNameMap["ds-matrix"];
type Item = Matrix["items"][number];

afterEach(() => { document.body.replaceChildren(); });

const ITEMS: Item[] = [
  { id: "a", title: "Fruit", column: 0, row: 0, header: true },
  { id: "b", title: "Apples", column: 0, row: 1, starred: true },
  { id: "c", title: "Pears", column: 0, row: 2 },
  { id: "d", title: "Bread", column: 1, row: 0 },
];

async function matrix(attributes = "", items = ITEMS) {
  document.body.innerHTML = `<ds-matrix ${attributes}></ds-matrix>`;
  const element = document.querySelector("ds-matrix") as Matrix;
  element.items = items;
  await element.updateComplete;
  return element;
}

const at = (host: Matrix, column: number, row: number) => host.shadowRoot!.querySelector<HTMLElement>(`[data-column="${column}"][data-row="${row}"]`)!;
const key = (target: Element, name: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, composed: true, cancelable: true, ...init }));

test("columns are named as a spreadsheet names them", () => {
  expect([0, 1, 25, 26, 27].map(columnName)).toEqual(["A", "B", "Z", "AA", "AB"]);
});

test("a lone item swaps with the one where it lands; a group only moves onto free squares", () => {
  expect(planMove(ITEMS, ["c"], { column: 1, row: 0 }, 3)).toEqual([{ id: "c", from: { column: 0, row: 2 }, to: { column: 1, row: 2 } }]);
  expect(planMove(ITEMS, ["b"], { column: 1, row: -1 }, 3)).toEqual([
    { id: "b", from: { column: 0, row: 1 }, to: { column: 1, row: 0 } },
    { id: "d", from: { column: 1, row: 0 }, to: { column: 0, row: 1 } },
  ]);
  expect(planMove(ITEMS, ["b", "c"], { column: 1, row: -1 }, 3)).toBeNull();
  expect(planMove(ITEMS, ["b", "c"], { column: 2, row: 0 }, 3)).toHaveLength(2);
  expect(planMove(ITEMS, ["a"], { column: 0, row: -1 }, 3)).toBeNull();
  expect(planMove(ITEMS, ["d"], { column: 2, row: 0 }, 3)).toBeNull();
});

test("the board draws every square, one spare row below the last item, and shares touching lines", async () => {
  const element = await matrix(`rows="2" columns="3"`);
  expect(element.shadowRoot!.querySelectorAll(".cell")).toHaveLength(3 * 4);
  expect(element.style.getPropertyValue("--ds-matrix-rows")).toBe("4");
  const apples = at(element, 0, 1);
  expect(apples.hasAttribute("data-shared-top")).toBe(true);
  expect(apples.hasAttribute("data-shared-bottom")).toBe(true);
  expect(apples.hasAttribute("data-shared-end")).toBe(false);
  expect(at(element, 0, 0).hasAttribute("data-shared-end")).toBe(true);
  expect(apples.querySelector(".star")).not.toBeNull();
  expect(at(element, 1, 2).classList.contains("free")).toBe(true);
  expect(at(element, 1, 2).getAttribute("aria-label")).toBe("B3");
});

test("pressing an item or a free square says which", async () => {
  const element = await matrix();
  const pressed: string[] = [];
  element.addEventListener("item-press", event => pressed.push((event as CustomEvent).detail.item.id));
  element.addEventListener("cell-press", event => pressed.push(`${(event as CustomEvent).detail.column}:${(event as CustomEvent).detail.row}`));
  at(element, 0, 1).click();
  at(element, 2, 3).click();
  key(at(element, 1, 0), "Enter");
  expect(pressed).toEqual(["b", "2:3", "d"]);
});

test("shift-click selects, escape clears, and alt with an arrow moves the selection", async () => {
  const element = await matrix();
  const selections: string[][] = [];
  element.addEventListener("select", event => selections.push((event as CustomEvent).detail.ids));
  at(element, 0, 1).dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, shiftKey: true }));
  at(element, 0, 2).dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, shiftKey: true }));
  await element.updateComplete;
  expect(at(element, 0, 1).getAttribute("aria-selected")).toBe("true");
  const moves: unknown[] = [];
  element.addEventListener("move", event => moves.push((event as CustomEvent).detail.moves));
  key(at(element, 0, 1), "ArrowRight", { altKey: true });
  await element.updateComplete;
  expect(element.items.find(item => item.id === "b")).toMatchObject({ column: 1, row: 1 });
  expect(element.items.find(item => item.id === "c")).toMatchObject({ column: 1, row: 2 });
  expect(moves).toHaveLength(1);
  key(at(element, 1, 1), "Escape");
  expect(selections.at(-1)).toEqual([]);
});

test("a cancelled move keeps the items where they were", async () => {
  const element = await matrix();
  element.addEventListener("move", event => event.preventDefault());
  expect(element.moveItems(["c"], { column: 1, row: 0 })).toBe(false);
  expect(element.items.find(item => item.id === "c")).toMatchObject({ column: 0, row: 2 });
});

test("the arrows move the one Tab stop between squares", async () => {
  const element = await matrix();
  expect(at(element, 0, 0).tabIndex).toBe(0);
  key(at(element, 0, 0), "ArrowDown");
  await element.updateComplete;
  expect(at(element, 0, 1).tabIndex).toBe(0);
  expect(at(element, 0, 0).tabIndex).toBe(-1);
  key(at(element, 0, 1), "End");
  await element.updateComplete;
  expect(element.focusPlace).toEqual({ column: 0, row: 7 });
});

test("a read-only board neither moves nor selects", async () => {
  const element = await matrix("readonly");
  expect(element.moveItems(["c"], { column: 1, row: 0 })).toBe(false);
  at(element, 0, 1).dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, shiftKey: true }));
  expect(element.selected).toEqual([]);
});

test("the matrix names no product", () => {
  for (const file of ["3-unit/ds-matrix.ts", "3-unit/styles/ds-matrix.css"]) {
    expect(readFileSync(join(import.meta.dirname, "../DS1", file), "utf8")).not.toMatch(/\b(Ezo|Link|Consistency|Peer|Ins|tau99)\b/);
  }
});
