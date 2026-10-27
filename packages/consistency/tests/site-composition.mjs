// Real-page composition in the app, using only synthetic local sites and a revision-checked stand-in API.
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
  try {
    const body = await readFile(file);
    response.setHeader('content-type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[extname(file)] ?? 'application/octet-stream');
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
const check = (condition, message) => { if (!condition) throw Error(message); };
const eventually = async (test, message) => {
  const deadline = Date.now() + 10_000;
  while (!test()) {
    if (Date.now() > deadline) throw Error(message);
    await new Promise(resolve => setTimeout(resolve, 20));
  }
};
const within = async (promise, message) => {
  let timer;
  try { return await Promise.race([promise, new Promise((_resolve, reject) => { timer = setTimeout(() => reject(Error(message)), 10_000); })]); }
  finally { clearTimeout(timer); }
};
const POLICY = "sandbox allow-same-origin; default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' https:; frame-ancestors 'self'; form-action 'none'; base-uri 'none'";
const CODE = '10VNDG', WORKSPACE = '01STDO';
const origin = 'https://alice-steel-blue.c9y.site';
const nodes = [
  { id: 'n1', tag: 'main', parent: null, children: ['n2', 'n3'], label: 'Main', capabilities: ['gap', 'padding', 'width', 'insert'] },
  { id: 'n2', tag: 'section', parent: 'n1', children: ['n4'], label: 'First section', capabilities: ['gap', 'padding', 'width', 'hide', 'reorder', 'insert'] },
  { id: 'n3', tag: 'section', parent: 'n1', children: [], label: 'Second section', capabilities: ['gap', 'padding', 'width', 'hide', 'reorder', 'insert'] },
  { id: 'n4', tag: 'img', parent: 'n2', children: [], label: 'Picture', capabilities: ['width', 'hide'] },
];
const initial = path => ({ path, build: 'build-one', base: `source-${path}`, revision: 0, document: { schema: 1, nodes: {}, order: {} }, nodes });
const stored = new Map([['/', initial('/')], ['/about/', initial('/about/')]]);
const writes = [];
let failWrites = false;
let siteScale = 1;
let importantStyles = false;
let held = null;
const holdNextWrite = () => {
  let release, entered;
  const wait = new Promise(resolve => { release = resolve; });
  const seen = new Promise(resolve => { entered = resolve; });
  held = { wait, entered };
  return { seen, release };
};
const originalStyle = id => importantStyles && id === 'n2' ? 'padding:20px!important;gap:0!important;width:600px!important;max-width:620px!important;box-sizing:content-box!important' : '';
const style = (id, state) => {
  const value = state.document.nodes[id] ?? {};
  return [originalStyle(id), value.gap === undefined ? '' : `gap:calc(${value.gap}px * var(--sf, 1))!important`, value.padding === undefined ? '' : `padding:calc(${value.padding}px * var(--sf, 1))!important`, value.width === undefined ? '' : `width:calc(${value.width}px * var(--sf, 1))!important;max-width:100%!important;box-sizing:border-box!important`, value.hidden ? 'display:none!important' : ''].filter(Boolean).join(';');
};
const escape = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const insertionNodes = document => {
  const result = structuredClone(nodes);
  for (const item of document.insertions ?? []) {
    result.find(node => node.id === item.parent).children.push(item.id);
    result.push({ id: item.id, tag: item.kind === 'heading' ? 'h2' : 'p', parent: item.parent, children: [], label: item.kind, capabilities: ['hide', 'width', 'reorder'] });
  }
  return result;
};
const rendered = path => {
  const state = stored.get(path);
  const added = parent => (state.document.insertions ?? []).filter(item => item.parent === parent).map(item => `<${item.kind === 'heading' ? 'h2' : 'p'} data-c9y-node="${item.id}">${escape(item.text)}</${item.kind === 'heading' ? 'h2' : 'p'}>`).join('');
  const sections = {
    n2: `<section data-c9y-node="n2" data-c9y-original-style="${originalStyle('n2')}" style="${style('n2', state)}"><h1 data-cms="0123456789ab">${path === '/' ? 'First section' : 'About the site'}</h1><p>The site's own words and layout.</p><img data-c9y-node="n4" data-c9y-original-style="" style="${style('n4', state)}" alt="Picture" width="200" height="60" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='60'%3E%3Crect width='200' height='60' fill='gold'/%3E%3C/svg%3E">${added('n2')}</section>`,
    n3: `<section data-c9y-node="n3" data-c9y-original-style="" style="${style('n3', state)}"><h2>Second section</h2><p>A different part of the same page.</p>${added('n3')}</section>`,
  };
  return `<!doctype html><html data-c9y-composition-base="${escape(state.base)}"><head><title>Fixture site</title><style>:root{--sf:${siteScale}}body{margin:0;font:16px/1.5 sans-serif;color:#171717;background:#fff}nav{padding:20px}main{display:flex;flex-direction:column;gap:20px;padding:20px;box-sizing:border-box}section{display:flex;flex-direction:column;gap:0;box-sizing:border-box;position:relative;min-height:180px;padding:20px;background:#eee}h1,h2,p{margin:0}img{display:block;max-width:100%;object-fit:cover}${importantStyles ? `[data-c9y-node="n2"]{${originalStyle('n2')}}` : ''}</style></head><body><nav><a id="page-link" href="${origin}${path === '/' ? '/about/' : '/'}">${path === '/' ? 'About' : 'Home'}</a></nav><main data-c9y-node="n1" data-c9y-original-style="" style="${style('n1', state)}">${(state.document.order.n1 ?? ['n2', 'n3']).map(id => sections[id]).join('')}</main><form action="https://invalid.example/"><button id="send">Send</button></form><script>document.body.dataset.ran='yes'</script></body></html>`;
};

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(10_000);
  await page.route('**/api/consistency/workspaces', route => route.fulfill({ json: { owner: true, workspaces: [{ code: WORKSPACE, name: 'Fixture studio', role: 'owner', plan: 'free', sites: 1, siteCodes: [CODE], limits: { sites: 2, customDomains: false } }] } }));
  await page.route('**/api/consistency/workspaces/*/members', route => route.fulfill({ json: { members: [] } }));
  await page.route('**/api/consistency/profile', route => route.fulfill({ json: { companyName: 'Fixture studio' } }));
  await page.route('**/api/consistency/sites', route => route.fulfill({ json: { workspace: WORKSPACE, sites: [{ code: CODE, name: 'Fixture site', url: origin + '/', address: new URL(origin).host }] } }));
  await page.route('**/api/consistency/sites/*/**', async route => {
    const request = route.request(), url = new URL(request.url()), what = url.pathname.split('/').slice(5).join('/'), path = url.searchParams.get('path') ?? '/';
    if (what === 'places') return route.fulfill({ json: { places: [] } });
    if (what === 'pages') return route.fulfill({ json: { pages: [...stored.keys()].map(path => ({ path, title: path === '/' ? 'Home' : 'About', lang: 'en', fields: 1, edited: 0 })) } });
    if (what === 'page') return route.fulfill({ json: { path, title: 'Fixture site', lang: 'en', fields: [{ key: '0123456789ab', tag: 'h1', kind: 'text', label: 'h1', markdown: path === '/' ? 'First section' : 'About the site' }] } });
    if (what === 'document') return route.fulfill({ body: rendered(path), headers: { 'content-type': 'text/html', 'content-security-policy': POLICY } });
    if (what === 'api/composition') {
      if (request.method() === 'GET') return route.fulfill({ json: structuredClone(stored.get(path)) });
      const body = request.postDataJSON();
      writes.push(structuredClone({ path, ...body }));
      if (held) { const gate = held; held = null; gate.entered(); await gate.wait; }
      if (failWrites) return route.fulfill({ status: 503, json: { error: 'unavailable' } });
      const before = stored.get(path);
      if (body.build !== before.build || body.base !== before.base || body.revision !== before.revision) return route.fulfill({ status: 409, json: { error: 'revision-conflict' } });
      const saved = { ...before, document: structuredClone(body.document), revision: before.revision + 1, nodes: insertionNodes(body.document) };
      stored.set(path, saved);
      return route.fulfill({ json: saved });
    }
    return route.fulfill({ status: 404, json: { error: 'not-found' } });
  });
  const home = `http://127.0.0.1:${server.address().port}/private-consistency/home.html`;
  await page.goto(home + '?open=' + CODE);
  const frame = page.frameLocator('iframe.consistency-site-frame');
  await frame.locator('[data-c9y-node="n2"]').waitFor();
  check(!await frame.locator('body').getAttribute('data-ran'), 'A site script ran with the app open');
  check(await page.locator('iframe.consistency-site-frame').getAttribute('sandbox') === 'allow-same-origin', 'The site lost its sandbox');
  check(!await page.getByRole('switch').count() && !await page.getByLabel('Example page', { exact: true }).count(), 'The app shows editor switches or example pages');

  const select = async id => {
    const node = frame.locator(`[data-c9y-node="${id}"]`);
    const box = await node.boundingBox();
    await node.click({ position: { x: box.width - 12, y: box.height - 12 } });
    await frame.locator(`[data-c9y-node="${id}"][data-c9y-selected]`).waitFor();
    await page.locator('.consistency-composition-bar').waitFor();
  };
  const handle = property => page.locator(`.consistency-composition-handle[data-property="${property}"]`);
  const adjust = async property => {
    const control = handle(property);
    const before = Number(await control.getAttribute('aria-valuenow'));
    await control.press(property === 'gap' ? 'ArrowUp' : 'ArrowRight');
    const after = Number(await control.getAttribute('aria-valuenow'));
    check(after > before, `${property} did not increase from the keyboard (${before} → ${after})`);
    return after;
  };
  const saved = (id, property, value) => eventually(() => stored.get('/').document.nodes[id]?.[property] === value, `${id} ${property} was not saved as ${value}`);

  // The existing page gets its own canvas controls, without the examples or their layer switches.
  await select('n2');
  const padding = await adjust('padding');
  await saved('n2', 'padding', padding);
  check(writes.at(-1).build === 'build-one' && writes.at(-1).base === 'source-/' && writes.at(-1).revision === 0, 'The write lost its source/revision preconditions');
  // Numeric expressions and fractions remain whole design squares in the saved document.
  const numericPadding = page.getByRole('spinbutton', { name: 'First section padding', exact: true });
  await numericPadding.fill('41 / 2'); await numericPadding.press('Enter');
  await saved('n2', 'padding', 20);
  await numericPadding.fill('39.9'); await numericPadding.press('Enter');
  await saved('n2', 'padding', padding);
  check(writes.every(write => Object.values(write.document.nodes).every(node => Object.entries(node).every(([key, value]) => key === 'hidden' || Number.isInteger(value) && value % 20 === 0))), 'Typed geometry escaped whole-square normalization');
  const gap = await adjust('gap');
  await saved('n2', 'gap', gap);
  // The pointer uses the overlay's real geometry; Escape restores its preview without writing.
  const dragPadding = async (distance, cancel) => {
    const box = await handle('padding').boundingBox();
    const x = box.x + box.width / 2, y = box.y + box.height - 12;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + distance, y, { steps: 8 });
    if (cancel) await page.keyboard.press('Escape');
    await page.mouse.up();
  };
  await dragPadding(20, false);
  await saved('n2', 'padding', padding + 20);
  const beforeCancel = writes.length;
  await dragPadding(40, true);
  await page.waitForTimeout(500);
  check(writes.length === beforeCancel, 'Cancelling a pointer preview wrote a layout');
  check(await frame.locator('[data-c9y-node="n2"]').evaluate(node => Number.parseFloat(node.ownerDocument.defaultView.getComputedStyle(node).paddingLeft)) === padding + 20, 'Escape left the pointer preview on the page');
  await select('n2');
  await page.getByRole('button', { name: 'Move down', exact: true }).click();
  await eventually(() => stored.get('/').document.order.n1?.join() === 'n3,n2', 'Moving a section did not persist sibling order');
  check((await frame.locator('main > section').evaluateAll(nodes => nodes.map(node => node.dataset.c9yNode))).join() === 'n3,n2', 'The saved section order is not on the canvas');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await eventually(() => (stored.get('/').document.order.n1 ?? ['n2', 'n3']).join() === 'n2,n3', 'Undo did not restore the section order');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await eventually(() => stored.get('/').document.order.n1?.join() === 'n3,n2', 'Redo did not restore the moved section');
  // The shared drag engine must receive events from the framed site's own document.
  const dragSection = async (from, to, cancel = false) => {
    await select(from);
    const source = await frame.locator(`[data-c9y-node="${from}"]`).boundingBox();
    const destination = await frame.locator(`[data-c9y-node="${to}"]`).boundingBox();
    // Playwright's drag interception awaits a timer inside every frame; script-free
    // frames block that timer. CDP sends the same real pointer input without it.
    const pointer = await page.context().newCDPSession(page);
    const start = { x: source.x + source.width - 40, y: source.y + source.height - 30 };
    const end = { x: destination.x + destination.width - 40, y: destination.y + (destination.y > source.y ? destination.height - 10 : 10) };
    await pointer.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...start });
    await pointer.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...start, button: 'left', buttons: 1, clickCount: 1 });
    for (let step = 1; step <= 15; step++) {
      await pointer.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x + (end.x - start.x) * step / 15, y: start.y + (end.y - start.y) * step / 15, buttons: 1 });
    }
    if (cancel) await page.keyboard.press('Escape');
    await pointer.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...end, button: 'left', buttons: 0, clickCount: 1 });
    await pointer.detach();
  };
  await dragSection('n2', 'n3');
  await eventually(() => stored.get('/').document.order.n1?.join() === 'n2,n3', 'Dragging an authored section inside the frame did not reorder it');
  const beforeDragCancel = writes.length;
  await dragSection('n2', 'n3', true);
  await page.waitForTimeout(500);
  check(writes.length === beforeDragCancel, 'Cancelling a framed drag wrote its preview');
  await select('n2');
  await page.getByRole('button', { name: 'Move down', exact: true }).click();
  await eventually(() => stored.get('/').document.order.n1?.join() === 'n3,n2', 'Editing stopped after cancelling a framed drag');
  check((await frame.locator('main > section').evaluateAll(nodes => nodes.map(node => node.dataset.c9yNode))).join() === 'n3,n2', 'Cancelling a drag left the canvas unable to render later edits');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await eventually(() => stored.get('/').document.order.n1?.join() === 'n2,n3', 'Undo after a cancelled drag failed');

  // Image sizing is saved on the page, and hiding is deliberate and undoable.
  await select('n4');
  const width = await adjust('width');
  await saved('n4', 'width', width);
  await page.getByRole('button', { name: 'Hide', exact: true }).click();
  check(!stored.get('/').document.nodes.n4?.hidden, 'Hide skipped its in-place confirmation');
  await page.getByRole('button', { name: 'Confirm hide', exact: true }).click();
  await saved('n4', 'hidden', true);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await eventually(() => !stored.get('/').document.nodes.n4?.hidden, 'Undo did not restore the picture');
  await frame.locator('[data-c9y-node="n4"]').waitFor();

  // Saved hidden content remains recoverable after a fresh visit, including the server's inline display override.
  await select('n4');
  await page.getByRole('button', { name: 'Hide', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm hide', exact: true }).click();
  await saved('n4', 'hidden', true);
  await page.reload();
  await frame.locator('[data-c9y-node="n2"]').waitFor();
  check(!await frame.locator('[data-c9y-node="n4"]').isVisible(), 'Reload ignored the saved hidden picture');
  await select('n2');
  await page.getByRole('button', { name: 'Add content', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Show Picture', exact: true }).click();
  await saved('n4', 'hidden', false);
  await frame.locator('[data-c9y-node="n4"]').waitFor();

  // A slower first save must neither overwrite nor discard a newer edit; its revision is used by the next save.
  await select('n2');
  const gate = holdNextWrite();
  const beforeSlow = writes.length;
  await adjust('padding');
  await within(gate.seen, 'The changed layout never started saving');
  const newest = await adjust('padding');
  gate.release();
  await saved('n2', 'padding', newest);
  check(writes.length === beforeSlow + 2, 'The newer change was dropped or saved more than once');
  check(writes.at(-1).revision === writes.at(-2).revision + 1, 'The second save used a stale revision');
  check(await frame.locator('[data-c9y-node="n2"]').evaluate(node => Number.parseFloat(node.ownerDocument.defaultView.getComputedStyle(node).paddingLeft)) === newest, 'The slower response put old padding back on the page');

  // A refused save keeps both the draft and the page open. Retrying the same draft then permits navigation.
  failWrites = true;
  const failedValue = await adjust('padding');
  await page.getByRole('button', { name: 'Try again', exact: true }).waitFor();
  const beforeFailure = stored.get('/').document.nodes.n2.padding;
  await frame.locator('#page-link').click();
  await page.getByRole('button', { name: 'Try again', exact: true }).waitFor();
  check(await page.locator('consistency-site-editor').evaluate(editor => editor.path) === '/', 'A failed save allowed page navigation');
  check(stored.get('/').document.nodes.n2.padding === beforeFailure && beforeFailure !== failedValue, 'The failed save changed the stored page');
  failWrites = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await saved('n2', 'padding', failedValue);
  await frame.locator('#page-link').click();
  await frame.getByRole('heading', { name: 'About the site', exact: true }).waitFor();
  await frame.locator('#page-link').click();
  await frame.getByRole('heading', { name: 'First section', exact: true }).waitFor();
  check(await frame.locator('[data-c9y-node="n2"]').evaluate(node => Number.parseFloat(node.ownerDocument.defaultView.getComputedStyle(node).paddingLeft)) === failedValue, 'Reopening the page lost its saved layout');

  // Content is inserted into the authored section and edited directly on the canvas.
  await select('n2');
  await page.getByRole('button', { name: 'Add content', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Add heading', exact: true }).click();
  const inserted = frame.locator('[data-c9y-node^="new_"]');
  await inserted.waitFor();
  const insertionId = await inserted.getAttribute('data-c9y-node');
  await inserted.locator('[contenteditable]').waitFor();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.type('Added from the canvas');
  await eventually(() => stored.get('/').document.insertions?.some(item => item.id === insertionId && item.text === 'Added from the canvas'), 'Inserted words did not save automatically');
  await select('n3');
  check(await frame.locator('[data-c9y-node="n2"]').evaluate(node => node.lastElementChild.dataset.c9yNode) === insertionId, 'The inserted heading moved ahead of the authored content');

  // A kept but hidden site cannot consume undo intended for the foreground workspace.
  await page.locator('#home-site').click();
  await page.locator('consistency-home ds-card').first().waitFor();
  const beforeHiddenUndo = writes.length;
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');
  await page.waitForTimeout(500);
  check(writes.length === beforeHiddenUndo, 'A hidden site handled the foreground undo shortcut');
  await page.locator('consistency-home ds-card', { hasText: 'Fixture site' }).click();
  await frame.locator(`[data-c9y-node="${insertionId}"]`).waitFor();

  // A fresh visit reads exactly the saved composition; its responsive page and sandbox remain intact.
  await page.reload();
  await frame.locator('[data-c9y-node="n2"]').waitFor();
  check(await frame.locator('[data-c9y-node="n2"]').evaluate(node => Number.parseFloat(node.ownerDocument.defaultView.getComputedStyle(node).paddingLeft)) === failedValue, 'Reload lost the saved layout');
  check(await frame.locator(`[data-c9y-node="${insertionId}"]`).innerText() === 'Added from the canvas', 'Reload lost the inserted heading');
  check(await frame.locator('[data-c9y-node="n2"]').evaluate(node => node.lastElementChild.dataset.c9yNode) === insertionId, 'Reopening changed the inserted heading position');
  check(!await page.getByRole('switch').count() && !await page.getByLabel('Example page', { exact: true }).count(), 'Reload exposed laboratory controls');
  check(!await frame.locator('body').getAttribute('data-ran'), 'Reload executed site scripts');
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    check(!await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `The app overflows at ${width}`);
    check(!await frame.locator('html').evaluate(node => node.scrollWidth > node.clientWidth), `The edited site overflows at ${width}`);
  }

  // Device scale changes preview pixels, not stored design units. A fresh render must match the edited canvas.
  siteScale = 2;
  await page.reload();
  await frame.locator('[data-c9y-node="n2"]').waitFor();
  check(await frame.locator('[data-c9y-node="n2"]').evaluate(node => Number.parseFloat(node.ownerDocument.defaultView.getComputedStyle(node).paddingLeft)) === failedValue * 2, 'The saved padding did not respect device scale');
  await select('n2');
  await dragPadding(40, false);
  await saved('n2', 'padding', failedValue + 20);
  const scaledPreview = await frame.locator('[data-c9y-node="n2"]').evaluate(node => Number.parseFloat(node.ownerDocument.defaultView.getComputedStyle(node).paddingLeft));
  await page.reload();
  await frame.locator('[data-c9y-node="n2"]').waitFor();
  check(await frame.locator('[data-c9y-node="n2"]').evaluate(node => Number.parseFloat(node.ownerDocument.defaultView.getComputedStyle(node).paddingLeft)) === scaledPreview, 'Device-scaled preview and reopened layout disagree');

  // Another writer wins only by a newer revision. The refused local draft stays until explicitly discarded.
  const remote = stored.get('/');
  stored.set('/', { ...remote, revision: remote.revision + 1, document: { ...remote.document, nodes: { ...remote.document.nodes, n2: { ...remote.document.nodes.n2, padding: 100 } } } });
  await select('n2');
  await adjust('padding');
  await page.getByRole('button', { name: 'Discard changes', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
  check(stored.get('/').document.nodes.n2.padding === 100, 'A stale local revision overwrote the newer page');
  await page.getByRole('button', { name: 'Confirm discard', exact: true }).click();
  await frame.locator('[data-c9y-node="n2"]').waitFor();
  await page.waitForFunction(() => {
    const node = document.querySelector('iframe.consistency-site-frame')?.contentDocument?.querySelector('[data-c9y-node="n2"]');
    return node && Number.parseFloat(node.ownerDocument.defaultView.getComputedStyle(node).paddingLeft) === 200;
  });
  // Authored inline and stylesheet priorities cannot override the user's chosen geometry.
  importantStyles = true; siteScale = 1; stored.set('/', initial('/'));
  await page.reload();
  await frame.locator('[data-c9y-node="n2"]').waitFor();
  await select('n2');
  const importantPadding = await adjust('padding');
  await saved('n2', 'padding', importantPadding);
  const importantGap = await adjust('gap');
  await saved('n2', 'gap', importantGap);
  const numericWidth = page.getByRole('spinbutton', { name: 'First section width', exact: true });
  await numericWidth.fill('480'); await numericWidth.press('Enter');
  await saved('n2', 'width', 480);
  const geometry = () => frame.locator('[data-c9y-node="n2"]').evaluate(node => {
    const computed = node.ownerDocument.defaultView.getComputedStyle(node);
    return { padding: Number.parseFloat(computed.paddingLeft), gap: Number.parseFloat(computed.gap), width: node.getBoundingClientRect().width, maxWidth: computed.maxWidth, boxSizing: computed.boxSizing };
  });
  const chosen = await geometry();
  check(chosen.padding === importantPadding && chosen.gap === importantGap && chosen.width === 480 && chosen.maxWidth === '100%' && chosen.boxSizing === 'border-box', `Authored priorities overrode the edited geometry: ${JSON.stringify(chosen)}`);
  await page.reload();
  await frame.locator('[data-c9y-node="n2"]').waitFor();
  check(JSON.stringify(await geometry()) === JSON.stringify(chosen), 'Authored important styles changed the saved geometry after reopening');
  console.log('Site composition: actual app, sandbox, keyboard/pointer geometry and Escape, reordering, hide/undo/redo, insertion, slow writes, failed-save and conflict recovery, hidden-site shortcuts, device scale and responsive persistence passed');
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
