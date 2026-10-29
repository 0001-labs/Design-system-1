// @vitest-environment node
import { test, expect } from "vite-plus/test";
import { chromium } from "playwright";
import { createServer } from "vite";
import type { AddressInfo } from "node:net";

test("month event lanes align with the day grid at each scale", async () => {
  const server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/calendar-activity.html`);
    await page.evaluate(() => customElements.whenDefined("ds-calendar"));
    for (const scale of [1, 1.5]) {
      const bounds = await page.evaluate(async scale => {
        const surface = document.querySelector<HTMLElement>("[data-ds-surface]")!;
        surface.style.setProperty("--ds-sf", String(scale));
        surface.innerHTML = '<ds-calendar no-header month="2026-10" week-start="monday"></ds-calendar>';
        const calendar = surface.querySelector("ds-calendar")!;
        calendar.events = [
          { title: "First", start: "2026-10-14", end: "2026-10-16" },
          { title: "Second", start: "2026-10-14", end: "2026-10-16" },
        ];
        await calendar.updateComplete;
        const root = calendar.shadowRoot!;
        const day = root.querySelector<HTMLElement>('[data-day="2026-10-14"]')!.getBoundingClientRect();
        const end = root.querySelector<HTMLElement>('[data-day="2026-10-16"]')!.getBoundingClientRect();
        const events = Array.from(root.querySelectorAll<HTMLElement>('[data-day="2026-10-14"] .event'), el => {
          const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        });
        return { day: { left: day.left, top: day.top }, end: end.right, events };
      }, scale);
      expect(bounds.events).toHaveLength(2);
      for (const [index, event] of bounds.events.entries()) {
        expect(event.left).toBeCloseTo(bounds.day.left, 2);
        expect(event.right).toBeCloseTo(bounds.end, 2);
        expect(event.top).toBeCloseTo(bounds.day.top + (index + 1) * 20 * scale, 2);
        expect(event.bottom).toBeCloseTo(bounds.day.top + (index + 2) * 20 * scale, 2);
      }
    }
  } finally { await browser.close(); await server.close(); }
}, 60_000);
