// Isolated browser acceptance: real controls, synthetic session and in-memory publishing settings.
import { createServer } from 'vite-plus';
import { chromium, devices } from 'playwright';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = process.cwd();
const report = JSON.parse(await readFile('website/dist/system-data/examples.json', 'utf8').catch(() => JSON.stringify({schema: 1, generatedAt: new Date().toISOString(), revision: 'fixture', widths: [320], themes: ['light'], examples: ['shop', 'planner', 'booking'].map(id => ({id, errors: [], checks: [{code: 'select.hug', width: 320, theme: 'light', measured: 1, status: 'pass', findings: []}]}))})));
let rows = report.examples.map(item => ({ id: item.id, label: item.id === 'shop' ? 'Shop' : item.id, href: `/examples/layouts/${item.id}/`, enabled: true, defaultEnabled: true }));
let refuse = false;
const server = await createServer({ configFile: false, root, cacheDir: '.reports/system-site/vite', publicDir: 'website/public', server: { port: 0 }, plugins: [{ name: 'system-site-fixture', enforce: 'pre',
  transform(code, id) {
    if (!id.endsWith('/app/src/screens/SystemSite.ts')) return;
    return code.replace("import { authState } from '../lib/backend';", 'const authState = { get: () => ({ isAuthenticated: true, isLoading: false }) };')
      .replace("import { OwnerSession } from './AdoptionDashboard';", 'class OwnerSession { ready = true; error = ""; leave = () => {}; constructor(...args: unknown[]) {} }')
      .replace(/import ['"][^'"\n]*website\/src\/lib\/(adoption|architecture)-document['"];?/g, '');
  },
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/fixture') {
        response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/fixture', `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><script type="module">
import '/DS1/1-root/one.css'; import '/app/src/app.css'; import '/DS1/2-core/ds-text';
import { startScaling } from '/DS1/0-face/scaling'; import { measureConstraints } from '/DS1/0-face/constraints';
import '/app/src/screens/SystemSite'; startScaling();
const screen = document.createElement('ds1-system-site'); screen.section = new URLSearchParams(location.search).get('section') || 'Examples'; document.body.append(screen);
window.measure = () => measureConstraints(document).flatMap(r => r.findings.filter(f => !f.review).map(f => ({ code: r.constraint.code, message: f.message })));
</script></body></html>`)); return;
      }
      if (url.pathname === '/api/system/checks') { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(report)); return; }
      if (url.pathname === '/api/system/examples') {
        if (request.method === 'PUT') {
          let body = ''; for await (const part of request) body += part;
          if (refuse) { response.writeHead(500).end(); return; }
          const value = JSON.parse(body); rows = rows.map(row => row.id === value.id ? { ...row, enabled: value.enabled } : row);
        }
        response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(rows)); return;
      }
      if (url.pathname.startsWith('/system-previews/')) { response.setHeader('Content-Type', 'image/png'); response.end(await readFile(root + '/website/dist' + url.pathname)); return; }
      next();
    });
  },
}] });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();
await mkdir('.reports/system-site', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('requestfailed', request => console.log('Request failed', request.url(), request.failure())); const errors = []; page.on('pageerror', error => { errors.push(error.message); console.log('Page error:', error.message); });
  await page.goto(base + 'fixture'); await page.locator('button[role="switch"]').first().waitFor().catch(async error => { console.log(await page.locator('body').innerText()); throw error; });
  const toggle = page.getByRole('switch', { name: 'Publish Shop', exact: true });
  await toggle.click(); await page.waitForFunction(() => document.querySelector('[aria-label="Publish Shop"]').getAttribute('aria-checked') === 'false');
  refuse = true; await toggle.click(); await page.locator('[role="alert"]').waitFor(); assert.equal(await toggle.getAttribute('aria-checked'), 'false'); refuse = false; await toggle.click(); await page.waitForFunction(() => document.querySelector('[aria-label="Publish Shop"]').getAttribute('aria-checked') === 'true');
  await page.screenshot({ path: '.reports/system-site/examples.png', fullPage: false });
  assert.deepEqual(await page.evaluate(() => window.measure()), []);
  await page.goto(base + 'fixture?section=Constraints'); await page.locator('#C004').waitFor();
  const input = page.getByRole('searchbox'); await input.fill('C004'); assert.equal(await page.locator('.system-rule').count(), 1);
  await page.screenshot({ path: '.reports/system-site/constraints.png', fullPage: false });
  const phone = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 320, height: 844 } });
  const mobile = await phone.newPage(); await mobile.goto(base + 'fixture'); await mobile.locator('button[role="switch"]').first().waitFor();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(await mobile.evaluate(() => window.measure()), []);
  await mobile.screenshot({ path: '.reports/system-site/phone.png', fullPage: false });
  await mobile.goto(base + 'fixture?section=Constraints'); await mobile.locator('#C004').waitFor();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []); console.log('System browser acceptance passed.');
} finally { await browser.close(); await server.close(); }
