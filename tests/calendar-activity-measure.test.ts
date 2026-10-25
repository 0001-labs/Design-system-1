// @vitest-environment node
import { test, expect } from "vite-plus/test";
import { chromium } from "playwright";
import { createServer } from "vite";
import type { AddressInfo } from "node:net";

test("activity days keep their grid and category colour in both themes and scales", async () => {
  const server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  const browser = await chromium.launch();
  try {
    for (const colorScheme of ["light", "dark"] as const) {
      const page = await browser.newPage({ colorScheme });
      await page.goto(`http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/calendar-activity.html`);
      await page.evaluate(() => customElements.whenDefined("ds-calendar"));
      for (const scale of [1, 1.5]) {
        const measured = await page.evaluate(async scale => {
          const surface = document.querySelector<HTMLElement>("[data-ds-surface]")!;
          surface.style.setProperty("--ds-sf", String(scale));
          const calendar = document.querySelector("ds-calendar")!;
          calendar.events = [{ title: "Purchase", start: "2026-10-08", color: "var(--ds-yellow)" }];
          await calendar.updateComplete;
          const cell = calendar.shadowRoot!.querySelector<HTMLElement>('[data-day="2026-10-08"]')!;
          const empty = calendar.shadowRoot!.querySelector<HTMLElement>('[data-day="2026-10-09"]')!;
          const fill = getComputedStyle(cell, "::before");
          const probe = document.createElement("span"); probe.style.background = "var(--ds-yellow)"; surface.append(probe);
          const expected = getComputedStyle(probe).backgroundColor; probe.remove();
          return { width: cell.getBoundingClientRect().width, height: cell.getBoundingClientRect().height,
            inset: parseFloat(fill.top), fill: fill.backgroundColor, expected,
            empty: getComputedStyle(empty, "::before").backgroundColor };
        }, scale);
        expect(measured.width).toBe(20 * scale);
        expect(measured.height).toBe(20 * scale);
        expect(measured.inset).toBe(2 * scale);
        expect(measured.fill).toBe(measured.expected);
        expect(measured.empty).not.toBe(measured.fill);
      }
      await page.close();
    }
  } finally { await browser.close(); await server.close(); }
}, 60_000);
