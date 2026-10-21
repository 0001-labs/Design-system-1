// @vitest-environment node
// Real layout, in Chromium: the calendar's title hugs its words on every level, never a bar across
// the header, and the twelve months and twelve years are choices that hug their words, one control
// high on the row's sixteen, padded 4px, in the middle of cells whole squares wide; the current and
// the chosen one take the accent.
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
  url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/calendar-picks.html`;
}, 60_000);
afterAll(async () => { await browser?.close(); await server?.close(); });

for (const markup of [
  `<ds-calendar month="2026-10" today="2026-10-21" views></ds-calendar>`,
  `<ds-calendar month="2026-10" today="2026-10-21" selectable value="2026-03-04"></ds-calendar>`,
]) {
  test(`the title and the months and years hug their words (${markup})`, async () => {
    const page = await browser.newPage({ viewport: { width: 900, height: 700 }, reducedMotion: "reduce" });
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
    const seen = await page.evaluate(async markup => {
      const stage = document.getElementById("stage")!;
      stage.innerHTML = markup;
      const calendar = stage.firstElementChild as HTMLElement & { updateComplete: Promise<unknown> };
      await calendar.updateComplete;
      const root = calendar.shadowRoot!;
      const probe = document.createElement("span");
      probe.style.background = "var(--ds-accent-color)";
      probe.style.color = "var(--ds-button-text-color-on-accent)";
      stage.append(probe);
      const accent = { background: getComputedStyle(probe).backgroundColor, color: getComputedStyle(probe).color };
      probe.remove();
      const title = () => {
        const button = root.querySelector<HTMLElement>(".title-button")!;
        const words = button.querySelector<HTMLElement>(".title-text")!;
        const range = document.createRange(); range.selectNodeContents(words);
        return { button: button.getBoundingClientRect().width, words: range.getBoundingClientRect().width, header: root.querySelector(".header")!.getBoundingClientRect().width };
      };
      // The levels travel in with a short animation (left out here, with reduced motion): measure where they rest.
      const settled = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const picks = () => [...root.querySelectorAll<HTMLElement>(".pick")].map(pick => {
        const mark = pick.querySelector<HTMLElement>(".pick-mark")!;
        const range = document.createRange(); range.selectNodeContents(mark);
        const cell = pick.getBoundingClientRect(), box = mark.getBoundingClientRect(), words = range.getBoundingClientRect();
        const style = getComputedStyle(mark);
        return {
          accented: pick.hasAttribute("data-today") || pick.hasAttribute("data-selected"),
          cellWidth: cell.width, cellHeight: cell.height,
          width: box.width, words: words.width, height: box.height,
          foot: cell.bottom - box.bottom, centre: (box.left + box.right) / 2 - (cell.left + cell.right) / 2,
          background: style.backgroundColor, color: style.color,
        };
      });
      const days = title();
      root.querySelector<HTMLElement>(".title-button")!.click();
      await calendar.updateComplete;
      await settled();
      const monthsTitle = title();
      const months = picks();
      root.querySelector<HTMLElement>(".title-button")!.click();
      await calendar.updateComplete;
      await settled();
      const years = picks();
      return { accent, days, monthsTitle, months, years };
    }, markup);
    for (const heading of [seen.days, seen.monthsTitle]) {
      // The words and 4px at each side, nothing more.
      expect(heading.button).toBeCloseTo(heading.words + 8, 0);
      expect(heading.button).toBeLessThan(heading.header / 2);
    }
    for (const level of [seen.months, seen.years]) {
      expect(level).toHaveLength(12);
      expect(level.filter(pick => pick.accented).length).toBeGreaterThan(0);
      for (const pick of level) {
        expect(pick.cellHeight).toBe(20);
        expect(pick.cellWidth % 20).toBe(0);
        expect(pick.height).toBe(16);
        expect(pick.foot).toBe(0);
        expect(pick.width).toBeCloseTo(pick.words + 8, 0);
        expect(pick.width).toBeLessThan(pick.cellWidth);
        expect(Math.abs(pick.centre)).toBeLessThanOrEqual(0.5);
        if (pick.accented) {
          expect(pick.background).toBe(seen.accent.background);
          expect(pick.color).toBe(seen.accent.color);
        } else expect(pick.background).toBe("rgba(0, 0, 0, 0)");
      }
    }
    await page.close();
  }, 60_000);
}
