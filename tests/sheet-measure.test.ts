// @vitest-environment node
// Real layout, in Chromium: a sheet's cells are four squares by one, its words 4px in on the
// sixteen, and its letters, labels and row numbers stay in place while it scrolls both ways.
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser } from "playwright";
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

test("a sheet: cells 80 by 20, words on the sixteen 4px in, headers held while it scrolls", async () => {
  const tab = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await tab.goto(url);
  await tab.waitForFunction(() => document.documentElement.dataset.ready === "true");
  const box = await tab.evaluate(async () => {
    const table = document.createElement("ds-table") as HTMLElement & { sheet: boolean; columns: unknown[]; data: unknown[]; updateComplete: Promise<unknown> };
    table.sheet = true;
    table.style.setProperty("--ds-table-height", "320px");
    table.columns = Array.from({ length: 30 }, (_, index) => ({ key: `c${index}`, label: `Column ${index}`, numeric: index > 0 }));
    table.data = Array.from({ length: 100 }, (_, row) => Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`c${index}`, index ? row * index * 13 : `A rather long name ${row}`])));
    document.getElementById("stage")!.replaceChildren(table);
    await table.updateComplete;
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    const root = table.shadowRoot!;
    const rect = (element: Element) => element.getBoundingClientRect();
    const words = (element: Element) => { const range = document.createRange(); range.selectNodeContents(element); return range.getBoundingClientRect(); };
    const scroll = root.querySelector<HTMLElement>(".ds-table-scroll")!;
    const name = root.querySelector("tbody tr:nth-child(3) td:nth-child(2)")!;
    const figure = root.querySelector("tbody tr:nth-child(3) td:nth-child(3)")!;
    const number = root.querySelector("tbody tr:nth-child(3) th")!;
    const letter = root.querySelector(".ds-table__letters td:nth-child(2)")!;
    const label = root.querySelector("thead tr + tr th")!;
    const before = { letter: rect(letter).top, label: rect(label).top, number: rect(number).left };
    scroll.scrollTop = 400;
    scroll.scrollLeft = 600;
    await new Promise(requestAnimationFrame);
    return {
      width: rect(root.querySelector("table")!).width,
      cells: [name, figure].map(cell => ({ width: rect(cell).width, height: rect(cell).height })),
      number: { width: rect(number).width, height: rect(number).height },
      line: getComputedStyle(name).lineHeight,
      start: words(name).left - rect(name).left,
      end: rect(figure).right - words(figure).right,
      before,
      after: { letter: rect(letter).top, label: rect(label).top, number: rect(number).left },
    };
  });
  expect(box.width).toBe(40 + 30 * 80);
  for (const cell of box.cells) expect(cell).toEqual({ width: 80, height: 20 });
  expect(box.number).toEqual({ width: 40, height: 20 });
  expect(box.line).toBe("16px");
  expect(box.start).toBeCloseTo(4, 3);
  // 4px in from the cell's end line.
  expect(box.end).toBeCloseTo(5, 3);
  expect(box.after).toEqual(box.before);
  expect(box.after.label - box.after.letter).toBe(20);
  await tab.close();
});
