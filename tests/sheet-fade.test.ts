// @vitest-environment node
// Real layout, in Chromium: a sheet's words that do not fit fade over their last square where
// they are cut, left to right and right to left; words that fit never fade, a number shows its
// last digits and fades its first, and a selected cell's fill does not fade.
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

async function cuts(dir: "ltr" | "rtl") {
  const tab = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await tab.goto(url);
  await tab.waitForFunction(() => document.documentElement.dataset.ready === "true");
  const result = await tab.evaluate(async dir => {
    document.documentElement.dir = dir;
    const table = document.createElement("ds-table") as HTMLElement & { sheet: boolean; columns: unknown[]; data: unknown[]; updateComplete: Promise<unknown> };
    Object.assign(table, { sheet: true, columns: [{ key: "paper", label: "Paper" }, { key: "sold", label: "Sold", numeric: true }],
      data: [{ paper: "Recycled 170g and more", sold: 123456789012 }, { paper: "Cotton", sold: 12 }] });
    document.getElementById("stage")!.replaceChildren(table);
    await table.updateComplete;
    const root = table.shadowRoot!;
    root.querySelector("tbody tr td")!.setAttribute("aria-selected", "true");
    const cells = [...root.querySelectorAll<HTMLElement>("tbody td")];
    return cells.map(cell => {
      const words = cell.querySelector<HTMLElement>(".ds-table__words")!;
      const range = document.createRange(); range.selectNodeContents(words);
      const text = range.getBoundingClientRect(), box = words.getBoundingClientRect();
      return {
        cut: words.dataset.cut ?? null,
        mask: getComputedStyle(words).maskImage,
        cellMask: getComputedStyle(cell).maskImage,
        ellipsis: getComputedStyle(cell).textOverflow,
        // Which of the text's edges stands inside the box.
        left: Math.round(text.left - box.left) + 0, right: Math.round(box.right - text.right) + 0,
      };
    });
  }, dir);
  await tab.close();
  return result;
}

test("left to right: words fade at their end, a number keeps its last digits and fades at its start", async () => {
  const [paper, sold, short, few] = await cuts("ltr");
  expect(paper!.cut).toBe("end");
  expect(paper!.mask).toBe("linear-gradient(to right, rgb(0, 0, 0) calc(100% - 20px), rgba(0, 0, 0, 0))");
  expect(paper!.left).toBe(0);
  expect(sold!.cut).toBe("start");
  expect(sold!.mask).toBe("linear-gradient(to left, rgb(0, 0, 0) calc(100% - 20px), rgba(0, 0, 0, 0))");
  // Scrolled to its end: the last digit stands on the box's end, the first ones are cut.
  expect(sold!.right).toBe(0);
  expect(sold!.left).toBeLessThan(0);
  for (const fits of [short!, few!]) { expect(fits.cut).toBeNull(); expect(fits.mask).toBe("none"); }
  // The selected cell keeps its ring and lines; only the words are masked.
  expect(paper!.cellMask).toBe("none");
  expect(paper!.ellipsis).toBe("clip");
});

test("right to left: words fade at their end, the left, and a number keeps its last digits there too", async () => {
  const [paper, sold, short] = await cuts("rtl");
  expect(paper!.cut).toBe("end");
  expect(paper!.mask).toBe("linear-gradient(to left, rgb(0, 0, 0) calc(100% - 20px), rgba(0, 0, 0, 0))");
  expect(sold!.cut).toBe("end");
  expect(sold!.right).toBe(0);
  expect(sold!.left).toBeLessThan(0);
  expect(short!.cut).toBeNull();
});
