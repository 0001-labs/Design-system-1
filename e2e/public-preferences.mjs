import { createServer } from 'vite';
import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

// Exercise the built documentation, including its real header and sidebar.
const remote = process.env.DS1_SITE_ORIGIN;
const server = remote ? null : await createServer({ configFile: false, root: fileURLToPath(new URL('../website/dist', import.meta.url)), appType: 'mpa', logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
await server?.listen();
const origin = remote ?? `http://127.0.0.1:${server.httpServer.address().port}`;
try {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ locale: 'fr-FR', viewport: { width: 430, height: 932 } });
      let catalogueRequests = 0;
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/translations.json', route => { catalogueRequests++; return route.abort('failed'); });
      // Keep the authentication bridge isolated from production records.
      await page.route('**/app/navigation-auth', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html>' }));
      await page.goto(`${origin}/3-unit/context/`);
      await page.waitForFunction(() => globalThis[Symbol.for('design-system-1.translate')]?.('About') === 'À propos');
      await page.waitForFunction(() => document.querySelector('#docs-navigation')?.shadowRoot?.textContent.includes('Bouton'));
      assert.equal(await page.locator('html').getAttribute('data-docs-compact'), '', 'header initialized without a language request');
      await page.locator('#mobile-menu-btn').click();
      await page.waitForFunction(() => document.querySelector('#mobile-navigation-panel')?.open);
      assert.equal(await page.locator('#mobile-menu-btn').getAttribute('aria-expanded'), 'true');
      await page.locator('#sidebar-close-btn').click();
      await page.waitForFunction(() => !document.querySelector('#mobile-navigation-panel')?.open);
      assert.equal(await page.locator('#mobile-menu-btn').getAttribute('aria-expanded'), 'false');
      assert.equal(catalogueRequests, 0, 'catalogue ships inside the documentation bundle');
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`${engine.name()}: bundled French catalogue and mobile navigation work with /translations.json blocked.`);
    } finally { await browser.close(); }
  }
} finally { await server?.close(); }
