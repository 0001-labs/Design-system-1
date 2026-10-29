// @vitest-environment node
// Real layout: with `fixed`, every view of a full calendar stands in the six-week month's height,
// so nothing under it moves when a person changes the view.
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
  browser = await chromium.launch({ headless: true });
  url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/calendar-picks.html`;
}, 60_000);
afterAll(async () => { await browser?.close(); await server?.close(); });

test("fixed, the month, the week, the day, the swimlane and a page's own view are all the six-week month's height", async () => {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, reducedMotion: "reduce" });
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  const heights = await page.evaluate(async () => {
    const stage = document.getElementById("stage")!;
    // October 2026 needs five weeks; fixed draws six.
    stage.innerHTML = `<ds-calendar month="2026-10" date="2026-10-21" today="2026-10-21" fixed views="month week day swimlane own"><div slot="own" style="height: 40px">Own</div></ds-calendar>`;
    const calendar = stage.firstElementChild as HTMLElement & { updateComplete: Promise<unknown>; view: string; events: unknown[] };
    calendar.events = Array.from({ length: 20 }, (_, index) => ({ title: `Event ${index}`, start: "2026-10-05", end: "2026-10-30" }));
    const seen: Record<string, number> = {};
    for (const view of ["month", "week", "day", "swimlane", "own"]) {
      calendar.view = view;
      await calendar.updateComplete;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      seen[view] = calendar.getBoundingClientRect().height;
    }
    return seen;
  });
  // The header (a square, a square below it) and six weeks four squares high, the weekdays named inside the first: 26 squares.
  expect(heights.month).toBeCloseTo(26 * 20, 0);
  for (const view of ["week", "day", "swimlane", "own"]) expect(heights[view], view).toBeCloseTo(heights.month, 0);
});

test('a hugging all-events swimlane shows every row and grows only with its contents', async () => {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, reducedMotion: 'reduce' });
  try {
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
    const result = await page.evaluate(async () => {
      const stage = document.getElementById('stage')!;
      stage.innerHTML = '<ds-calendar month="2026-10" fixed swimlane-hug swimlane-all view="swimlane" views="month swimlane"></ds-calendar>';
      const calendar = stage.firstElementChild as HTMLElement & { events: object[]; updateComplete: Promise<unknown> };
      const measure = async (count: number) => {
        calendar.events = Array.from({ length: count }, (_, i) => ({ title: `Project ${i}`, start: i % 2 ? '2026-10-01' : '2025-01-01' }));
        await calendar.updateComplete;
        const root = calendar.shadowRoot!, view = root.querySelector<HTMLElement>('.swimlane')!, bars = [...root.querySelectorAll<HTMLElement>('.swimlane-grid .event')];
        return { height: view.getBoundingClientRect().height, count: bars.length, lastBottom: bars.at(-1)!.getBoundingClientRect().bottom, viewBottom: view.getBoundingClientRect().bottom };
      };
      return [await measure(3), await measure(30)];
    });
    expect(result[0].count).toBe(3);
    expect(result[1].count).toBe(30);
    expect(result[1].height - result[0].height).toBeCloseTo(27 * 20, 0);
    expect(result[1].lastBottom).toBeLessThanOrEqual(result[1].viewBottom);
  } finally { await page.close(); }
});
