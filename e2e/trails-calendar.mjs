import { createServer } from 'vite';
import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';

// The real authored example and shared components, with no production records.
const server = await createServer({ configFile: false, plugins: [{ name: 'trails-fixture', configureServer(server) {
  server.middlewares.use((request, response, next) => {
    if (request.url !== '/__trails') return next();
    response.setHeader('Content-Type', 'text/html');
    response.end(`<!doctype html><html><head><link rel="stylesheet" href="/DS1/1-root/one.css"><link rel="stylesheet" href="/website/public/examples/libraries/grove.css"><style>body{margin:0}</style></head><body><script type="module">
      import '/DS1/index.ts';
      import { LIBRARY_EXAMPLES } from '/website/src/lib/library-examples.ts';
      const example = LIBRARY_EXAMPLES.trails;
      document.body.innerHTML = example.html;
      new Function(example.script)();
      window.trailsReady = true;
    </script></body></html>`);
  });
} }], server: { host: '127.0.0.1', port: 0 } });
await server.listen();
try {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch({ headless: true });
    try {
      for (const width of [1280, 1024, 768, 375, 320]) for (const theme of ['light', 'dark']) {
        const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme: theme });
        await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__trails`);
        await page.waitForFunction(() => window.trailsReady);
        await page.evaluate(() => document.fonts.ready);
        const result = await page.locator('#heat').evaluate(async calendar => {
          await calendar.updateComplete;
          const sf = Number(getComputedStyle(calendar).getPropertyValue('--ds-sf')) || 1;
          const weeks = [...calendar.shadowRoot.querySelectorAll('.week')];
          const gaps = weeks.flatMap(week => {
            const dates = [...week.querySelectorAll('.date')].map(date => date.getBoundingClientRect());
            return dates.slice(1).map((date, index) => date.left - dates[index].right);
          });
          const box = calendar.getBoundingClientRect(), parent = calendar.parentElement.getBoundingClientRect();
          return { gap: Math.min(...gaps), sf, right: box.right, parentRight: parent.right, width: document.documentElement.scrollWidth, viewport: innerWidth };
        });
        assert.ok(result.gap >= 4 * result.sf - 0.5, `${engine.name()} ${width} ${theme}: Trails heat marks need visible separation: ${JSON.stringify(result)}`);
        assert.ok(result.right <= result.parentRight + 1, `Calendar exceeds its column: ${JSON.stringify(result)}`);
        assert.ok(result.width <= result.viewport + 1, `Page overflows: ${JSON.stringify(result)}`);
        await page.close();
      }
    } finally { await browser.close(); }
  }
  console.log('Trails heat dates stay separated within their column at 320–1280px in both themes and browser engines.');
} finally { await server.close(); }
