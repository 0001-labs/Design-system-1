// @vitest-environment node
import { afterAll, beforeAll, expect, test } from 'vite-plus/test';
import { chromium, webkit } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import type { AddressInfo } from 'node:net';
let server: ViteDevServer, origin: string;
beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
  await server.listen(); origin = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}`;
}, 60_000);
afterAll(async () => { await server?.close(); });
for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]] as const) test(`${name}: event silhouettes round exposed caps, never shared seams`, async () => {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.goto(`${origin}/tests/fixtures/calendar-picks.html`);
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
    const result = await page.evaluate(async () => {
      const calendar = document.createElement('ds-calendar') as any;
      calendar.month = '2026-10'; calendar.weekStart = 'monday'; calendar.fixed = true;
      calendar.dayWidth = 2; calendar.lines = 2; calendar.style.setProperty('--ds-radius', '4px');
      calendar.events = [{ title: 'A', start: '2026-10-05', end: '2026-10-07' }, { title: 'B', start: '2026-10-05', end: '2026-10-07' }];
      document.getElementById('stage')!.append(calendar); await calendar.updateComplete;
      const bars = [...calendar.shadowRoot.querySelectorAll('[data-day="2026-10-05"] .event')] as HTMLElement[];
      const corners = (node: HTMLElement) => { const s = getComputedStyle(node); return [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomLeftRadius, s.borderBottomRightRadius].map(parseFloat); };
      const stacked = bars.map(corners);
      const frame = parseFloat(getComputedStyle(calendar.shadowRoot.querySelector('.weekdays + .week .day:first-child')).borderTopLeftRadius);
      calendar.style.setProperty('--ds-radius', '0px');
      const square = bars.map(corners);
      return { stacked, square, frame };
    });
    expect(result.stacked).toEqual([[4, 4, 0, 0], [0, 0, 4, 4]]);
    expect(result.square).toEqual([[0, 0, 0, 0], [0, 0, 0, 0]]);
    expect(result.frame).toBeGreaterThan(0);
    await page.close();
  } finally { await browser.close(); }
}, 30_000);
