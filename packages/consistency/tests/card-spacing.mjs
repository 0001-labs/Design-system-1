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
 const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
 const read = async selectors => page.locator(selectors).evaluateAll(cards => cards.map(card => ({
   gaps: ['label', 'title'].map(key => parseFloat(getComputedStyle(card.shadowRoot.querySelector(`.ds-card__${key}`)).marginBottom)),
   footer: parseFloat(getComputedStyle(card.querySelector('ds-tag') ?? card).marginTop),
   height: card.getBoundingClientRect().height, css: card.style.cssText,
   text: [...card.querySelectorAll('[slot="label"],[slot="title"],p,ds-tag')].map(node => node.textContent),
 })));
 for (const inserted of [false, true]) {
  await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/`);
  await page.waitForSelector('ds-card[data-selectable="bookshop"]');
  if (inserted) await page.locator('consistency-editor').evaluate(async e => {
   const card = (label,body) => '```c9y-card\n'+JSON.stringify({label,title:label+' title',body,width:280,height:300})+'\n```';
   e.history.commit({text:card('First','Short words.')+'\n\n'+card('Second','Independent words that wrap onto several lines and must retain enough room while spacing changes.')});e.requestUpdate();await e.updateComplete;
  });
  const selectors = inserted ? '.consistency-content-card ds-card' : 'ds-card[data-selectable="bookshop"],ds-card[data-selectable="kitchen"]';
  await page.waitForTimeout(80);
  const cards = page.locator(selectors), source = cards.first();
  for (const key of inserted ? ['label','title'] : ['label','title','footer']) {
   const handle = source.locator(`[aria-label="Card ${key} gap"]`);
   await handle.scrollIntoViewIfNeeded(); await page.waitForTimeout(40);
   const before = await read(selectors), state = await page.locator('consistency-editor').evaluate(e => JSON.stringify(e.history.value));
   const original = Number(await handle.getAttribute('aria-valuenow'));
   let box = await handle.boundingBox(), x = box.x+box.width/2, y = box.y+box.height/2;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+37,{steps:4});await page.waitForTimeout(50);
   const live = await cards.locator(`[aria-label="Card ${key} gap"]`).evaluateAll(handles=>handles.map(h=>Number(h.getAttribute('aria-valuenow'))));
   const during = await read(selectors), gap = c => key === 'footer' ? c.footer : c.gaps[key === 'label' ? 0 : 1];
   if (live.some(value=>value!==original+74) || during.some(c=>Math.abs(gap(c)-gap(during[0]))>1) || Math.abs(gap(during[0])-gap(before[0])-74)>1) throw Error(`Linked gaps must update before release: ${JSON.stringify({inserted,key,live,before,during})}`);
   if (during.some(c=>Math.abs(c.height-during[0].height)>1)) throw Error('Linked card growth must preview together');
   if (await page.locator('consistency-editor').evaluate(e=>JSON.stringify(e.history.value)) !== state) throw Error('Preview wrote history');
   if (JSON.stringify(during.map(c=>c.text))!==JSON.stringify(before.map(c=>c.text))) throw Error('Preview changed independent card text');
   // Escape restores every peer, including originally different sizes.
   await page.keyboard.press('Escape');await page.mouse.up();await page.waitForTimeout(80);
   const cancelled=await read(selectors);
   if (cancelled.some((c,i)=>Math.abs(c.height-before[i].height)>1 || Math.abs(gap(c)-gap(before[i]))>1)) throw Error('Cancellation did not restore every card');
   box=await handle.boundingBox();x=box.x+box.width/2;y=box.y+box.height/2;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+37,{steps:4});await page.mouse.up();await page.waitForTimeout(250);
   const committed=await cards.locator(`[aria-label="Card ${key} gap"]`).evaluateAll(handles=>handles.map(h=>Number(h.getAttribute('aria-valuenow'))));
   if (committed.some(value=>value!==original+80)) throw Error('Release did not snap every linked gap');
   await page.locator('.consistency-sheet').focus();await page.keyboard.press('Meta+z');await page.waitForTimeout(80);
   if (await page.locator('consistency-editor').evaluate(e=>JSON.stringify(e.history.value))!==state) throw Error('One undo must restore the entire linked change');
   console.log(`Linked card spacing: ${inserted?'inserted':'static'} ${key} previews, cancels and commits together; one undo`);
  }
  await page.getByRole('switch',{name:'Consistency',exact:true}).click();
  const handle=source.locator('[aria-label="Card title gap"]');await handle.scrollIntoViewIfNeeded();const before=await read(selectors),box=await handle.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+box.height/2+23,{steps:3});await page.waitForTimeout(50);
  const during=await read(selectors);if(Math.abs(during[1].gaps[1]-before[1].gaps[1])>1||Math.abs(during[1].height-before[1].height)>1)throw Error('Consistency off changed a peer');
  await page.keyboard.press('Escape');await page.mouse.up();
 }
 console.log('Consistency off: static and inserted peers stay independent');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
