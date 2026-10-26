import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
// The sidebar's edge (src/sidebar-edge.ts): dragged to fold the sidebar and back, a flick, Escape, the keyboard, the
// work a square from every side when folded, the folded sidebar shown from the window's left square by the pointer,
// by focus and by a finger, a place chosen from it, the choice drawn on the first paint after a reload, and no overflow.
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
const limits = { sites: 3, customDomains: true };
const workspaces = [{ code: '01STDO', name: '0001', plan: 'free', role: 'owner', sites: 1, siteCodes: ['10VNDG'], limits }];
const sites = [{ code: '10VNDG', name: 'CPH Raft', url: 'https://cphraft.c9y.site/', address: 'alice-steel-blue.c9y.site' }];
async function routes(page) {
  await page.route('**/api/consistency/workspaces', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ owner: true, workspaces }) }));
  await page.route('**/api/consistency/sites', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ workspace: '01STDO', sites }) }));
  await page.route('**/api/consistency/sites/*/pages', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ pages: [{ path: '/', lang: 'da', title: 'Forside', fields: 1, edited: 0 }] }) }));
  await page.route('**/api/consistency/sites/*/page?**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ path: '/', lang: 'da', title: 'CPH Raft', fields: [] }) }));
  await page.route('**/api/consistency/sites/*/document?**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>CPH Raft</title><h1>Hej</h1>' }));
  await page.route('**/api/consistency/sites/*/places', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ places: [] }) }));
  await page.route('**/api/consistency/workspaces/*/members', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ members: [] }) }));
  await page.route('**/api/consistency/domains**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ domains: [] }) }));
}
const home = `http://127.0.0.1:${server.address().port}/private-consistency/home.html`;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // On every load, what the app says about the sidebar when its page is first put in, before anything is painted.
  await context.addInitScript(() => {
    new MutationObserver((_, observer) => {
      const app = document.querySelector('consistency-home');
      if (!app?.querySelector(':scope > ds-page')) return;
      window.firstSidebar = app.getAttribute('data-sidebar');
      observer.disconnect();
    }).observe(document, { childList: true, subtree: true });
  });
  const page = await context.newPage();
  await routes(page);
  await page.goto(home);
  await page.locator('consistency-home ds-card').first().waitFor();
  const app = page.locator('consistency-home');
  const edge = page.getByRole('separator', { name: 'Sidebar' });
  const state = () => app.getAttribute('data-sidebar');
  const main = () => page.locator('consistency-home .home-main').evaluate(element => { const box = element.getBoundingClientRect(); return { left: box.left, top: box.top, right: innerWidth - box.right, bottom: innerHeight - box.bottom }; });
  const area = () => page.locator('consistency-home ds-page').evaluate(element => { const box = element.shadowRoot.querySelector('[part="main"]').getBoundingClientRect(); return { left: box.left, top: box.top, right: innerWidth - box.right, bottom: innerHeight - box.bottom }; });
  const navBox = () => page.locator('consistency-home nav.home-nav').evaluate(element => { const box = element.getBoundingClientRect(); return { left: Math.round(box.left), shown: getComputedStyle(element).visibility === 'visible' }; });
  const settled = () => page.waitForFunction(() => !document.querySelector('consistency-home').hasAttribute('data-sidebar-moving'));
  const near = (value, expected, what) => { if (Math.abs(value - expected) > 1) throw Error(`${what}: ${value}, not ${expected}`); };
  const overflow = async label => { for (const width of [390, 768, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.waitForTimeout(100); if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw Error(`${label} overflows at ${width}`); } await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(100); };

  // Open: the separator stands on the boundary, the two squares between the sidebar and the work.
  if (await state() !== 'open' || await edge.getAttribute('aria-valuenow') !== '100' || await edge.getAttribute('aria-orientation') !== 'vertical') throw Error('The edge does not say the sidebar is open');
  if (await page.evaluate(() => window.firstSidebar) !== 'open') throw Error('The first paint did not know the sidebar');
  { const box = await edge.boundingBox(); near(box.x + box.width / 2, 300, 'The edge stands at'); near(box.width, 20, 'The edge is wide'); }
  near((await main()).left, 300, 'The open work begins at');
  await overflow('Open');

  // A slow drag to the left: the edge, the sidebar and the work move with the hand, nothing laid out until release.
  await page.mouse.move(300, 450); await page.mouse.down();
  for (const x of [270, 240, 200, 160, 120, 100]) { await page.mouse.move(x, 450); await page.waitForTimeout(30); }
  await page.waitForTimeout(120);
  if (await state() !== 'open' || !(await app.getAttribute('data-sidebar-moving') !== null)) throw Error('The drag committed the layout before release');
  near((await main()).left, 100, 'The work under the hand stands at');
  { const box = await edge.boundingBox(); near(box.x + box.width / 2, 100, 'The edge under the hand stands at'); }
  await page.mouse.up(); await settled();
  if (await state() !== 'collapsed' || await edge.getAttribute('aria-valuenow') !== '0') throw Error('Dragging left past half did not fold the sidebar');
  // Folded: the work takes the window a square from every side, the sidebar away and the edge on the window's left square.
  { const box = await area(); for (const side of ['left', 'top', 'right', 'bottom']) near(box[side], 20, `The folded work's ${side} margin`); }
  near((await main()).left, 20, 'The folded work begins at');
  await page.waitForTimeout(250);
  { const box = await navBox(); if (box.shown || box.left > -260) throw Error('The folded sidebar is still shown: ' + JSON.stringify(box)); }
  { const box = await edge.boundingBox(); near(box.x, 0, 'The folded edge stands at'); }
  if (await page.evaluate(() => localStorage.getItem('consistency-sidebar')) !== 'collapsed') throw Error('The folded sidebar is not kept');
  // The pointer that folded it is still on the edge: nothing is shown until it has left.
  if (await app.getAttribute('data-sidebar-peek') !== null) throw Error('Folding by the edge showed the sidebar at once');
  await overflow('Folded');

  // Hovering the window's left square shows the sidebar over the work, where it stands when open; the work stays, and stays live.
  await page.mouse.move(700, 450); await page.mouse.move(10, 450);
  await page.waitForFunction(() => document.querySelector('consistency-home').hasAttribute('data-sidebar-peek'));
  await page.waitForTimeout(300);
  { const box = await navBox(); if (!box.shown || box.left !== 0) throw Error('The shown sidebar stands at ' + JSON.stringify(box)); }
  near((await main()).left, 20, 'The work under the shown sidebar stands at');
  // No backdrop: beside the sidebar the point is the page's work area itself.
  if (!await page.evaluate(() => { const page = document.querySelector('consistency-home ds-page'); return page.shadowRoot.elementFromPoint(800, 450)?.getAttribute('part') === 'main'; })) throw Error('The work beside the shown sidebar is covered');
  // Leaving it puts it away.
  await page.mouse.move(150, 450); await page.waitForTimeout(250);
  if (await app.getAttribute('data-sidebar-peek') === null) throw Error('The shown sidebar went while the pointer was on it');
  await page.mouse.move(900, 450); await page.waitForFunction(() => !document.querySelector('consistency-home').hasAttribute('data-sidebar-peek'));
  await page.waitForTimeout(300);
  if ((await navBox()).shown) throw Error('The sidebar is still shown after the pointer left');
  // A place chosen from the shown sidebar is shown, and the sidebar goes.
  await page.mouse.move(10, 450); await page.waitForFunction(() => document.querySelector('consistency-home').hasAttribute('data-sidebar-peek'));
  await page.waitForTimeout(250);
  await page.locator('consistency-home ds-sidebar.home-foot').getByText('Settings', { exact: true }).click();
  await page.locator('consistency-home consistency-domains').waitFor();
  if (await app.getAttribute('data-sidebar-peek') !== null) throw Error('Choosing a place left the sidebar shown');
  if (await state() !== 'collapsed') throw Error('Choosing a place opened the sidebar');
  { const box = await main(); near(box.left, 20, 'Settings, folded, begins at'); near(box.right, 20, 'Settings, folded, ends at'); }
  await page.mouse.move(900, 450);

  // A reload draws the folded sidebar on its first paint.
  await page.reload(); await page.locator('consistency-home .home-main').waitFor();
  if (await page.evaluate(() => window.firstSidebar) !== 'collapsed') throw Error('The first paint after a reload drew the sidebar open, then folded it');
  near((await main()).left, 20, 'After a reload the work begins at');

  // A site open, folded: its canvas takes the window a square from every side.
  await page.mouse.move(10, 450); await page.waitForFunction(() => document.querySelector('consistency-home').hasAttribute('data-sidebar-peek')); await page.waitForTimeout(250);
  await page.locator('#home-workspace').click(); await page.mouse.move(900, 450);
  await page.locator('consistency-home ds-card', { hasText: 'CPH Raft' }).click();
  await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();
  { const box = await page.locator('consistency-home .home-stage').evaluate(element => { const box = element.getBoundingClientRect(); return { left: box.left, top: box.top, right: innerWidth - box.right, bottom: innerHeight - box.bottom }; }); for (const side of ['left', 'top', 'right', 'bottom']) near(box[side], 20, `The folded canvas's ${side} margin`); }
  await overflow('A site, folded');

  // Dragging the folded edge to the right opens it again: the shown sidebar stays and the work follows the hand.
  await page.mouse.move(10, 450); await page.waitForFunction(() => document.querySelector('consistency-home').hasAttribute('data-sidebar-peek')); await page.waitForTimeout(250);
  await page.mouse.down();
  for (const x of [20, 60, 120, 180, 220]) { await page.mouse.move(x, 450); await page.waitForTimeout(30); }
  await page.waitForTimeout(120);
  near((await navBox()).left, 0, 'The shown sidebar during the drag stands at');
  await page.mouse.up(); await settled();
  if (await state() !== 'open') throw Error('Dragging right past half did not open the sidebar');
  near((await page.locator('consistency-home .home-main').evaluate(element => element.getBoundingClientRect().left)), 300, 'The opened work begins at');
  { const box = await navBox(); if (!box.shown || box.left !== 20) throw Error('The opened sidebar stands at ' + JSON.stringify(box)); }

  // A short, fast flick folds it, though the edge is released nearer the open side.
  await page.mouse.move(300, 450); await page.mouse.down();
  for (const x of [270, 255, 240]) { await page.mouse.move(x, 450); await page.waitForTimeout(8); }
  await page.mouse.up(); await settled();
  if (await state() !== 'collapsed') throw Error('A flick to the left did not fold the sidebar');
  // A slow, short drag back settles where it started.
  await page.mouse.move(700, 450); await page.mouse.move(10, 450); await page.waitForTimeout(250);
  await page.mouse.down();
  for (const x of [20, 40, 60]) { await page.mouse.move(x, 450); await page.waitForTimeout(60); }
  await page.waitForTimeout(150); await page.mouse.up(); await settled();
  if (await state() !== 'collapsed') throw Error('A short slow drag opened the sidebar');
  // Escape during a drag puts everything back.
  await page.mouse.down();
  for (const x of [40, 120, 240]) { await page.mouse.move(x, 450); await page.waitForTimeout(30); }
  await page.keyboard.press('Escape'); await page.mouse.up(); await settled();
  if (await state() !== 'collapsed') throw Error('Escape did not cancel the drag');
  near((await main()).left, 20, 'After Escape the work begins at');
  await page.mouse.move(900, 450); await page.waitForTimeout(400);

  // The keyboard: focus shows the folded sidebar, Enter and Space open and fold at once, the arrows move it.
  await page.keyboard.press('Shift'); await edge.focus();
  if (await app.getAttribute('data-sidebar-peek') === null) throw Error('Focusing the folded edge did not show the sidebar');
  await page.keyboard.press('Enter');
  if (await state() !== 'open' || await app.getAttribute('data-sidebar-moving') !== null) throw Error('Enter did not open the sidebar at once');
  near((await main()).left, 300, 'Opened by Enter, the work begins at');
  await page.keyboard.press(' ');
  if (await state() !== 'collapsed') throw Error('Space did not fold the sidebar');
  await page.keyboard.press('ArrowRight');
  if (await state() !== 'open') throw Error('ArrowRight did not open the sidebar');
  await page.keyboard.press('ArrowLeft');
  if (await state() !== 'collapsed') throw Error('ArrowLeft did not fold the sidebar');
  await page.keyboard.press('ArrowRight');
  // A mouse press without a drag folds or opens it too.
  await page.mouse.click(300, 450); await settled();
  if (await state() !== 'collapsed') throw Error('Pressing the open edge did not fold the sidebar');
  await page.mouse.move(900, 450); await page.mouse.move(10, 450); await page.waitForTimeout(250);
  await page.mouse.click(10, 450); await settled();
  if (await state() !== 'open') throw Error('Pressing the folded edge did not open the sidebar');
  await context.close();

  // A finger: a press on the folded edge shows the sidebar, a press on the work puts it away.
  const touch = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
  await touch.addInitScript(() => { try { localStorage.setItem('consistency-sidebar', 'collapsed'); } catch { /* */ } });
  const tablet = await touch.newPage(); await routes(tablet);
  await tablet.goto(home); await tablet.locator('consistency-home ds-card').first().waitFor();
  if (await tablet.locator('consistency-home').getAttribute('data-sidebar') !== 'collapsed') throw Error('The tablet did not draw the kept fold');
  await tablet.touchscreen.tap(10, 400);
  await tablet.waitForFunction(() => document.querySelector('consistency-home').hasAttribute('data-sidebar-peek'));
  await tablet.touchscreen.tap(700, 600);
  await tablet.waitForFunction(() => !document.querySelector('consistency-home').hasAttribute('data-sidebar-peek'));
  if (await tablet.locator('consistency-home').getAttribute('data-sidebar') !== 'collapsed') throw Error('A finger opened the sidebar');
  // A phone keeps the page's drawer: no edge, the menu button instead.
  await tablet.setViewportSize({ width: 390, height: 800 }); await tablet.waitForTimeout(100);
  if (await tablet.locator('consistency-home .home-edge').isVisible()) throw Error('A phone shows the edge');
  if (!await tablet.locator('consistency-home ds-page').evaluate(element => getComputedStyle(element.shadowRoot.querySelector('[part="bar"]')).display !== 'none')) throw Error('A phone has no menu button');
  if (await tablet.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw Error('A folded phone overflows');
  await touch.close();

  // Reduced motion: a release lands at once.
  const still = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const calm = await still.newPage(); await routes(calm);
  await calm.goto(home); await calm.locator('consistency-home ds-card').first().waitFor();
  await calm.mouse.move(300, 450); await calm.mouse.down();
  for (const x of [260, 200, 120, 60]) { await calm.mouse.move(x, 450); await calm.waitForTimeout(30); }
  await calm.mouse.up();
  if (await calm.locator('consistency-home').getAttribute('data-sidebar') !== 'collapsed' || await calm.locator('consistency-home').getAttribute('data-sidebar-moving') !== null) throw Error('With reduced motion the release did not land at once');
  await still.close();
  console.log('Sidebar edge: drag to fold and back, flick, short drag, Escape, keyboard and presses, the one-square margin folded, the sidebar shown by hover, focus and a finger, a place chosen from it, the fold drawn on first paint after a reload, phones keeping the drawer, reduced motion, and no overflow at 390, 768 and 1440 passed');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
