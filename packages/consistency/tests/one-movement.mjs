import { componentFixture } from './component-fixture.mjs';
/** C9Y drag.one-movement in a browser: every section moved to every place, by keyboard; nothing moves again after release. Build first; local only. */
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../../../website/dist/', import.meta.url));
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
  try { const body = await componentFixture(file); response.setHeader('content-type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[extname(file)] ?? 'application/octet-stream'); response.end(body); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
let moves = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const broken = [];
  page.on('console', message => { if (message.text().startsWith('C9Y constraint')) broken.push(message.text()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/`); await page.waitForSelector('aa-editor');
  await page.locator('select[aria-label="Example page"]').selectOption('studio');
  await page.waitForSelector('[data-sort-group]');
  const order = () => page.locator('.consistency-sheet > [data-sort-group]').evaluateAll(groups => groups.map(group => group.dataset.sortGroup));
  const count = (await order()).length;
  for (let from = 0; from < count; from++) for (let to = 0; to < count; to++) {
    if (from === to) continue;
    const id = (await order())[from];
    // By keyboard: space lifts, each arrow is one change of place, space drops.
    await page.locator(`[data-sort-group="${id}"]`).focus();
    await page.keyboard.press('Space');
    for (let step = 0; step < Math.abs(to - from); step++) await page.keyboard.press(to > from ? 'ArrowDown' : 'ArrowUp');
    await page.keyboard.press('Space'); await page.waitForTimeout(450);
    const now = await order();
    if (now.indexOf(id) !== to) throw Error(`${id}: dropped at ${now.indexOf(id)}, not ${to}`);
    if (broken.length) throw Error(`${id} ${from}→${to}: ${broken.join('; ')}`);
    moves++;
    // Undo the move so each pair starts from the authored order.
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z'); await page.waitForTimeout(150);
  }
  // Making room is real: siblings take a translate while a section is carried.
  const id = (await order())[0];
  await page.locator(`[data-sort-group="${id}"]`).focus(); await page.keyboard.press('Space'); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(250);
  const shifted = await page.locator(`[data-sort-group="${(await order())[1]}"]`).evaluate(group => group.style.translate);
  if (!shifted || shifted === 'none') throw Error('no sibling made room while a section was carried');
  // The check is real: a page that draws a section somewhere other than where it made room breaks the constraint.
  await page.evaluate(() => addEventListener('keydown', event => { if (event.key === ' ') queueMicrotask(() => { const last = [...document.querySelectorAll('.consistency-sheet > [data-sort-group]')].at(-1); last.style.marginTop = '40px'; }); }, { capture: true, once: true }));
  await page.keyboard.press('Space'); await page.waitForTimeout(450);
  if (!broken.some(text => text.includes('drag.one-movement'))) throw Error('a second movement went unreported');
  console.log(`One movement: ${moves} keyboard moves, nothing moved again after release; a forced second movement was reported`);
} finally { await browser.close(); await new Promise(done => server.close(done)); }
