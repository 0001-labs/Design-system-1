/** Local-only viewport contract. Build first; no customer data or live host. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../../../website/dist/', import.meta.url));
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
  try { const body = await readFile(file); response.setHeader('content-type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[extname(file)] ?? 'application/octet-stream'); response.end(body); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const base = `http://127.0.0.1:${server.address().port}/private-consistency/`;
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    await page.goto(base); await page.waitForSelector('.consistency-sheet');
    const check = async label => {
      const result = await page.evaluate(() => { window.scrollTo(100, window.scrollY); return { client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, left: window.scrollX }; });
      if (result.scroll > result.client || result.left !== 0) throw Error(`${width}px ${label}: document ${result.scroll}px exceeds viewport ${result.client}px`);
    };
    await check('initial');
    await page.locator('select[aria-label="Library preset"]').selectOption('bold');
    await page.evaluate(() => { const editor = document.querySelector('consistency-editor'); editor.history.commit({ width: 960, sizes: { bookshop: { width: 800, height: 400 } }, text: '```c9y-button\n{"label":"Read more","secondary":false}\n```' }); editor.requestUpdate(); });
    await page.locator('.consistency-content-button').waitFor();
    await check('wide authored website and Bold library');
    if (width < 1000) { const canvas = await page.locator('.consistency-stage').evaluate(element => ({ overflow: getComputedStyle(element).overflowX, client: element.clientWidth, scroll: element.scrollWidth })); if (canvas.overflow !== 'auto' || canvas.scroll <= canvas.client) throw Error(`${width}px: wide canvas must scroll inside its stage`); }
    const text = page.locator('.consistency-content-button [contenteditable="plaintext-only"]');
    await text.focus(); await page.getByRole('toolbar', { name: 'Button action', exact: true }).waitFor({ state: 'visible' });
    await check('open button action toolbar');
    const toolbar = page.getByRole('toolbar', { name: 'Button action', exact: true }); await toolbar.locator('select').selectOption('link'); await toolbar.locator('ds-input').evaluate(element => { element.value = 'https://example.com/' + 'long-destination'.repeat(30); element.dispatchEvent(new Event('input', { bubbles: true })); }); await check('long destination field');
    await page.getByRole('button', { name: 'Mobile preview', exact: true }).click();
    await page.waitForTimeout(100);
    await check('mobile preview');
    const sheet = await page.locator('.consistency-sheet').evaluate(element => ({ client: element.clientWidth, scroll: element.scrollWidth }));
    if (sheet.scroll > sheet.client + 1) throw Error(`${width}px: mobile website itself overflows (${sheet.scroll} > ${sheet.client})`);
    await page.getByRole('button', { name: 'Desktop preview', exact: true }).click(); await check('restored desktop');
    console.log(`Viewport ${width}px: initial, wide canvas, Bold, action toolbar and mobile preview passed`);
    await page.close();
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
