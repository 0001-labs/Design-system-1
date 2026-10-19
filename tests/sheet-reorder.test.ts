// @vitest-environment node
// Real pointers, in Chromium: a reorderable sheet's row lifts by the grip on its number, follows
// the pointer while the rows it passes step aside by whole rows, lands on a row and fires
// table-move; a finger lifts it after a long press, and a quick swipe scrolls instead.
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

let server: ViteDevServer;
let browser: Browser;
let url = "";

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/menu-measure.html`;
}, 60_000);
afterAll(async () => { await browser?.close(); await server?.close(); });

type Moves = { moves: unknown[] };

/** A sheet of 40 rows, 200px high, its moves recorded on window.moves; returns row 3's grip centre. */
async function sheet(tab: Page) {
  await tab.goto(url);
  await tab.waitForFunction(() => document.documentElement.dataset.ready === "true");
  return tab.evaluate(async () => {
    const table = document.createElement("ds-table") as HTMLElement & { sheet: boolean; reorderable: boolean; columns: unknown[]; data: unknown[]; updateComplete: Promise<unknown> };
    Object.assign(table, { sheet: true, reorderable: true, columns: ["Item"], data: Array.from({ length: 40 }, (_, index) => ({ item: `Row ${index + 1}` })) });
    table.style.setProperty("--ds-table-height", "200px");
    (window as unknown as Moves).moves = [];
    table.addEventListener("table-move", event => (window as unknown as Moves).moves.push((event as CustomEvent).detail));
    document.getElementById("stage")!.replaceChildren(table);
    await table.updateComplete;
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    const box = table.shadowRoot!.querySelector("tbody tr:nth-child(3) .ds-table__number")!.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  });
}

const state = (tab: Page) => tab.evaluate(() => {
  const root = document.querySelector("ds-table")!.shadowRoot!;
  const rows = [...root.querySelectorAll<HTMLTableRowElement>("tbody tr")];
  return {
    lifted: rows.findIndex(row => row.hasAttribute("data-lifted")),
    styles: rows.slice(0, 8).map(row => row.style.transform),
    items: rows.slice(0, 6).map(row => row.querySelector("td")!.textContent),
    numbers: rows.slice(0, 6).map(row => row.querySelector(".ds-table__index")!.textContent),
    moves: (window as unknown as Moves).moves,
    handle: getComputedStyle(rows[2]!.querySelector(".ds-table__handle")!).opacity,
  };
});

test("a mouse lifts the row by its grip, the rows it passes step aside a row each, and it lands on a row", async () => {
  const tab = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const grip = await sheet(tab);
  await tab.mouse.move(grip.x, grip.y);
  await tab.waitForTimeout(150);
  expect((await state(tab)).handle).toBe("1");
  await tab.mouse.down();
  await tab.mouse.move(grip.x, grip.y + 3);
  expect((await state(tab)).lifted).toBe(-1);
  // Two rows and a bit down: rows 4 and 5 step up one row each, nothing else moves.
  await tab.mouse.move(grip.x, grip.y + 44, { steps: 6 });
  const moving = await state(tab);
  expect(moving.lifted).toBe(2);
  expect(moving.styles).toEqual(["", "", "translateY(44px)", "translateY(-20px)", "translateY(-20px)", "", "", ""]);
  await tab.mouse.up();
  await tab.waitForFunction(() => (window as unknown as Moves).moves.length > 0);
  await tab.waitForTimeout(50);
  const dropped = await state(tab);
  expect(dropped.moves).toEqual([{ from: 2, to: 4 }]);
  expect(dropped.items).toEqual(["Row 1", "Row 2", "Row 4", "Row 5", "Row 3", "Row 6"]);
  expect(dropped.numbers).toEqual(["1", "2", "3", "4", "5", "6"]);
  expect(dropped.styles).toEqual(["", "", "", "", "", "", "", ""]);
  expect(dropped.lifted).toBe(-1);
  await tab.close();
});

test("Escape puts a lifted row back, and a page that prevents the move keeps the order", async () => {
  const tab = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const grip = await sheet(tab);
  await tab.mouse.move(grip.x, grip.y);
  await tab.mouse.down();
  await tab.mouse.move(grip.x, grip.y + 30, { steps: 4 });
  await tab.keyboard.press("Escape");
  await tab.mouse.up();
  await tab.waitForTimeout(300);
  let now = await state(tab);
  expect(now.moves).toEqual([]);
  expect(now.styles.every(style => style === "")).toBe(true);
  await tab.evaluate(() => document.querySelector("ds-table")!.addEventListener("table-move", event => event.preventDefault()));
  await tab.mouse.move(grip.x, grip.y);
  await tab.mouse.down();
  await tab.mouse.move(grip.x, grip.y - 40, { steps: 4 });
  await tab.mouse.up();
  await tab.waitForTimeout(1000);
  now = await state(tab);
  expect(now.moves).toEqual([{ from: 2, to: 0 }]);
  expect(now.items.slice(0, 3)).toEqual(["Row 1", "Row 2", "Row 3"]);
  expect(now.styles.every(style => style === "")).toBe(true);
  await tab.close();
});

test("a finger lifts the row after a long press; a quick swipe scrolls the sheet instead", async () => {
  const context = await browser.newContext({ viewport: { width: 800, height: 600 }, hasTouch: true });
  const tab = await context.newPage();
  const grip = await sheet(tab);
  const cdp = await context.newCDPSession(tab);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", y: number) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: grip.x, y }] });
  await touch("touchStart", grip.y);
  await tab.waitForTimeout(350);
  for (const y of [grip.y + 10, grip.y + 20, grip.y + 22]) await touch("touchMove", y);
  expect((await state(tab)).lifted).toBe(2);
  await touch("touchEnd", grip.y + 22);
  await tab.waitForFunction(() => (window as unknown as Moves).moves.length > 0);
  expect((await state(tab)).moves).toEqual([{ from: 2, to: 3 }]);
  // No hold: the finger scrolls and no row lifts.
  await touch("touchStart", grip.y);
  for (const y of [grip.y - 10, grip.y - 30, grip.y - 60]) await touch("touchMove", y);
  expect((await state(tab)).lifted).toBe(-1);
  await touch("touchEnd", grip.y - 60);
  await tab.waitForTimeout(400);
  expect((await state(tab)).moves).toHaveLength(1);
  await context.close();
});
