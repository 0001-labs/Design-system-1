/** Durable real-site edits through the shared canvas and actual revision-checked platform store. */
import { chromium } from 'playwright';
import { sitePlatformFixture, fixturePicture } from './site-platform-fixture.mjs';
const authored = scale => `<!doctype html><html><head><meta charset="utf-8"><style>
:root{--sf:${scale}}body{margin:0;font:16px/20px Georgia,serif}nav,main{padding:20px}main{display:flex;flex-direction:column;gap:20px}section{display:flex;flex-direction:column;gap:0;padding:20px;background:#eee;box-sizing:border-box;min-height:160px}h1,h2,p{margin:0}img{display:block;height:auto;max-width:100%}
[aria-label="First section"]{padding:20px!important;gap:0!important;width:600px!important;max-width:620px!important;box-sizing:content-box!important}
</style></head><body><nav><a id="about" href="https://fixture-canvas.c9y.site/about/">About</a> <a id="home" href="https://fixture-canvas.c9y.site/">Home</a> <a id="scaled" href="https://fixture-canvas.c9y.site/scaled/">Scaled page</a></nav><main aria-label="Main"><section aria-label="First section" style="padding:20px!important;gap:0!important;width:600px!important;max-width:620px!important;box-sizing:content-box!important"><h1 data-cms="0123456789ab">Original heading</h1><p>The site's own words.</p><img aria-label="Picture" alt="Picture" width="200" src="${fixturePicture}"></section><section aria-label="Second section"><h2>Second section</h2><p>Another authored section.</p></section></main><form><button>Original form</button></form><script>window.siteRan=true</script></body></html>`;
const fixture = await sitePlatformFixture({ '/': authored(1), '/about/': authored(1).replace('Original heading', 'About the site'), '/scaled/': authored(2) });
const browser = await chromium.launch({ headless: true });
const check = (condition, message) => { if (!condition) throw Error(message); };
const eventually = async (test, message) => { const until = Date.now() + 10_000; while (!await test()) { if (Date.now() > until) throw Error(message); await new Promise(done => setTimeout(done, 20)); } };
const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(10_000);
  await fixture.route(page); await page.goto(fixture.url);
  const frame = page.frameLocator('iframe.consistency-site-frame');
  const id = label => fixture.read().nodes.find(node => node.label === label).id;
  const first = id('First section'), second = id('Second section'), picture = id('Picture'), main = id('Main');
  const node = id => frame.locator(`[data-c9y-node="${id}"]`);
  const guide = property => frame.getByRole('slider', { name: `First section ${property}`, exact: true }).first();
  const saved = (property, value, path = '/') => eventually(() => fixture.read(path).document.nodes[first]?.[property] === value, `${path} ${property} did not persist as ${value}`);
  const adjust = async (property, key = property === 'gap' ? 'ArrowUp' : 'ArrowRight') => { const control = guide(property); await control.press(key); return Number(await control.getAttribute('aria-valuenow')); };
  const menu = async (nodeId, action) => { const target = node(nodeId), box = await target.boundingBox(); await target.click({ button: 'right', position: { x: box.width / 2, y: 10 } }); await page.getByRole('menuitem', { name: action, exact: true }).click(); };
  const geometry = () => node(first).evaluate(element => { const style = getComputedStyle(element); return { padding: parseFloat(style.paddingLeft), gap: parseFloat(style.gap), width: element.getBoundingClientRect().width, maxWidth: style.maxWidth, boxSizing: style.boxSizing }; });
  await node(first).waitFor();
  check(await page.locator('iframe').getAttribute('sandbox') === 'allow-same-origin allow-scripts' && !await frame.locator('body').evaluate(() => window.siteRan), 'The real-site sandbox changed');
  check(!await page.getByRole('switch').count() && !await page.locator('.consistency-composition-bar').count(), 'The app exposed lab controls or a replacement toolbar');

  // Chosen styles override authored inline and stylesheet priorities, with preview/public parity.
  const padding = await adjust('padding'); await saved('padding', padding);
  const gap = await adjust('gap'); await saved('gap', gap);
  const width = await adjust('width', 'ArrowLeft'); await saved('width', width);
  const chosen = await geometry();
  check(chosen.padding === padding && chosen.gap === gap && chosen.width === width && chosen.maxWidth === '100%' && chosen.boxSizing === 'border-box', `Authored priorities won over the chosen geometry: ${JSON.stringify(chosen)}`);
  await page.reload(); await node(first).waitFor();
  check(JSON.stringify(await geometry()) === JSON.stringify(chosen), 'Reopening changed chosen important styles');

  // The native Context retains reversible source moves and removal after reopening.
  await menu(first, 'Move down'); await eventually(() => fixture.read().document.order[main]?.join() === [second, first].join(), 'Move down did not persist');
  await menu(first, 'Undo'); await eventually(() => (fixture.read().document.order[main] ?? [first, second]).join() === [first, second].join(), 'Undo did not restore source order');
  await menu(first, 'Redo'); await eventually(() => fixture.read().document.order[main]?.join() === [second, first].join(), 'Redo did not restore moved order');
  await menu(first, 'Undo');
  await menu(picture, 'Remove'); await eventually(() => fixture.read().document.nodes[picture]?.hidden, 'Removing the picture did not persist');
  await page.reload(); await node(first).waitFor(); check(!await node(picture).isVisible(), 'Saved hidden content reappeared');
  await menu(first, 'Show Picture'); await eventually(() => fixture.read().document.nodes[picture]?.hidden === false, 'Saved hidden content could not be restored'); await node(picture).waitFor();

  // A slow response cannot replace newer canvas edits and must advance the next revision.
  const gate = fixture.holdNextWrite(), beforeSlow = fixture.writes.length;
  await adjust('padding'); await gate.seen;
  const latest = await adjust('padding'); gate.release(); await saved('padding', latest);
  check(fixture.writes.length === beforeSlow + 2 && fixture.writes.at(-1).revision === fixture.writes.at(-2).revision + 1, 'A newer edit was dropped or saved with a stale revision');
  check((await geometry()).padding === latest, 'A slow save restored stale canvas geometry');

  // A failure retains the draft, blocks navigation, and remains explicit until retry.
  fixture.failWrites(true); const refused = await adjust('padding');
  await page.getByRole('button', { name: 'Try again', exact: true }).waitFor();
  const beforeFailure = fixture.read().document.nodes[first].padding, failedWrites = fixture.writes.length;
  await page.waitForTimeout(650); check(fixture.writes.length === failedWrites, 'A failed save retried silently');
  await frame.locator('#about').click();
  check(await page.locator('consistency-site-editor').evaluate(editor => editor.path) === '/', 'Failed saving allowed navigation away');
  check(fixture.read().document.nodes[first].padding === beforeFailure && beforeFailure !== refused, 'A failed save changed stored state');
  fixture.failWrites(false); await page.getByRole('button', { name: 'Try again', exact: true }).click(); await saved('padding', refused);
  await frame.locator('#about').click(); await frame.getByRole('heading', { name: 'About the site', exact: true }).waitFor();
  await frame.locator('#home').click(); await frame.getByRole('heading', { name: 'Original heading', exact: true }).waitFor();
  check((await geometry()).padding === refused, 'Returning to the page lost saved geometry');

  // Background site controllers cannot consume foreground workspace undo.
  await page.locator('#home-site').click(); await page.locator('consistency-home ds-card').first().waitFor();
  const beforeHidden = fixture.writes.length; await page.keyboard.press(`${modifier}+Z`); await page.waitForTimeout(500);
  check(fixture.writes.length === beforeHidden, 'A hidden site handled the foreground undo shortcut');
  await page.locator('consistency-home ds-card', { hasText: 'Fixture site' }).click(); await node(first).waitFor();

  // A newer remote revision wins; discard is explicit and reloads the latest saved page.
  const remote = fixture.read(); fixture.store.save('/', remote.build, fixture.pages.get('/'), { ...remote, document: { ...remote.document, nodes: { ...remote.document.nodes, [first]: { ...remote.document.nodes[first], padding: 100 } } } }, 'fixture@example.com', Date.now());
  await adjust('padding'); await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
  check(fixture.read().document.nodes[first].padding === 100, 'A stale draft overwrote a newer revision');
  await page.getByRole('button', { name: 'Confirm discard', exact: true }).click();
  await eventually(async () => (await geometry()).padding === 100, 'Discard did not reopen the latest saved page');

  // Real pointer cancellation and device scale use canonical guides inside the frame.
  await frame.locator('#scaled').click();
  await eventually(() => page.locator('consistency-site-editor').evaluate(editor => editor.path === '/scaled/'), 'The scaled page did not open');
  await node(first).waitFor();
  const beforeScale = await adjust('padding'); await saved('padding', beforeScale, '/scaled/');
  check((await geometry()).padding === beforeScale * 2, 'Device scale changed saved units instead of preview pixels');
  const pointer = await page.context().newCDPSession(page);
  const drag = async (distance, cancel) => { const box = await guide('padding').boundingBox(), from = { x: box.x + box.width / 2, y: box.y + box.height / 2 }, to = { x: from.x + distance, y: from.y }; await pointer.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...from }); await pointer.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...from, button: 'left', buttons: 1, clickCount: 1 }); for (let step = 1; step <= 8; step++) await pointer.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x + distance * step / 8, y: from.y, buttons: 1 }); if (cancel) await page.keyboard.press('Escape'); await pointer.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...to, button: 'left', buttons: 0, clickCount: 1 }); };
  // Canonical padding gain is two design units per physical pixel divided by scale.
  await drag(40, false); await saved('padding', beforeScale + 40, '/scaled/');
  const beforeCancel = fixture.writes.length, scaledGeometry = await geometry(); await drag(40, true); await page.waitForTimeout(500);
  check(fixture.writes.length === beforeCancel && JSON.stringify(await geometry()) === JSON.stringify(scaledGeometry), 'Escape committed or retained a pointer preview');
  await pointer.detach(); await page.reload();
  await frame.locator('#scaled').click(); await eventually(() => page.locator('consistency-site-editor').evaluate(editor => editor.path === '/scaled/'), 'The saved scaled page did not reopen'); await node(first).waitFor();
  check(JSON.stringify(await geometry()) === JSON.stringify(scaledGeometry), 'Device-scaled preview and reopened layout disagree');
  console.log('Site composition: canonical guides/context, important styles, undo/redo, saved hidden recovery, slow/failing/conflicting saves, navigation, background shortcuts and scaled pointer cancellation passed');
} finally { await browser.close(); await fixture.close(); }
