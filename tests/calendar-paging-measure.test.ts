// @vitest-environment node
import { afterAll, beforeAll, expect, test } from 'vite-plus/test';
import { chromium, webkit } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import type { AddressInfo } from 'node:net';

let server: ViteDevServer;
let origin: string;
beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
  await server.listen(); origin = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}`;
}, 60_000);
afterAll(async () => { await server?.close(); });

for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]] as const) {
  for (const width of [390, 900]) test(`${name}: all three views reveal aligned adjacent pages at ${width}px`, async () => {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(`${origin}/tests/fixtures/calendar-mobile-swipe.html`);
      await page.waitForFunction(() => Boolean(document.querySelector('ds-calendar')?.shadowRoot?.querySelector('.month-track')));
      for (const view of ['month', 'swimlane', 'earnings']) {
        await page.evaluate(async (view) => {
          const calendar = document.querySelector('ds-calendar') as any;
          calendar.compact = false; calendar.dayWidth = innerWidth < 500 ? 2 : 4;
          calendar.views = ['month', 'swimlane', 'earnings']; calendar.view = view; calendar.month = '2026-12';
          calendar.innerHTML = '<div slot="earnings">December</div><div slot="earnings-previous">November</div><div slot="earnings-next">January</div>';
          await calendar.updateComplete;
          const track = calendar.shadowRoot.querySelector('.month-track');
          for (const [type, x] of [['pointerdown', 200], ['pointermove', 120]] as const) track.dispatchEvent(new PointerEvent(type, { pointerId: 1, pointerType: innerWidth < 500 ? 'touch' : 'mouse', isPrimary: true, button: 0, clientX: x, clientY: 100, bubbles: true, composed: true, cancelable: true }));
        }, view);
        await page.waitForFunction(() => {
          const track = document.querySelector('ds-calendar')!.shadowRoot!.querySelector<HTMLElement>('.month-track')!;
          return new DOMMatrixReadOnly(getComputedStyle(track).transform).m41 < -70;
        });
        const geometry = await page.evaluate(() => {
          const root = document.querySelector('ds-calendar')!.shadowRoot!;
          const track = root.querySelector<HTMLElement>('.month-track')!;
          const current = track.children[1].getBoundingClientRect();
          const next = track.querySelector('.month-neighbour.next')!.getBoundingClientRect();
          return { gap: Math.abs(next.left - current.right), width: Math.abs(next.width - current.width), transform: new DOMMatrixReadOnly(getComputedStyle(track).transform).m41 };
        });
        expect(geometry.gap).toBeLessThan(1); expect(geometry.width).toBeLessThan(1); expect(geometry.transform).toBeLessThan(-70);
        await page.evaluate(() => document.querySelector('ds-calendar')!.shadowRoot!.querySelector('.month-track')!.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: 120, clientY: 100, bubbles: true, composed: true })));
        await page.waitForFunction(() => (document.querySelector('ds-calendar') as any).month === '2027-01');
        await page.waitForFunction(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('ds-calendar')!.shadowRoot!.querySelector('.month-track')!).transform).m41 === 0);
      }
      await page.close();
    } finally { await browser.close(); }
  }, 45_000);
}
