/** All examples: idle pink guides, real spacing, growing pages, and safe links. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium, webkit } from 'playwright';
const root = resolve('website/dist');
const templates = JSON.parse(await readFile('shared/consistency-template-pages.json', 'utf8'));
const server = createServer(async (request, response) => {
 const path = new URL(request.url, 'http://localhost').pathname;
 const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
 if (!file.startsWith(root + '/')) return response.writeHead(403).end();
 try { response.setHeader('content-type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(file)] ?? 'application/octet-stream'); response.end(await readFile(file)); }
 catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
try {
 for (const engine of [chromium, webkit]) {
  if (process.env.ENGINE_ONLY && process.env.ENGINE_ONLY !== engine.name()) continue;
  const browser = await engine.launch({headless:true});
  try {
   const page = await browser.newPage({viewport:{width:1440,height:1000}});
   await page.route('**/api/consistency/pages', route => route.fulfill({json:{pages:[]}}));
   await page.route('**/api/consistency/sites', route => route.fulfill({json:{sites:[]}}));
   await page.goto(`http://127.0.0.1:${server.address().port}/editor/`);
   // Navigation is observed, never sent to a live external service.
   await page.evaluate(() => { window.openedLinks = []; window.open = url => { window.openedLinks.push(String(url)); return null; }; });
   const mount = async (id, width, saved) => {
    await page.evaluate(async ({id,template,width,saved}) => {
     document.querySelector('#spacing-check')?.remove();
     const stage = document.createElement('div'); stage.id = 'spacing-check';
     Object.assign(stage.style,{position:'fixed',inset:'0',background:'white',zIndex:'999',width:width+'px',height:'900px'}); document.body.append(stage);
     const host = document.createElement('consistency-workspace-page');
     host.loadDocument(saved ?? {schema:2,kind:'page',example:id,library:'original',fonts:{},page:template.document});
     const ready = new Promise(done => host.addEventListener('page-ready',done,{once:true})); stage.append(host); await ready;
     await host.querySelector('iframe').contentDocument.fonts.ready;
    }, {id,template:templates[id],width,saved});
    await page.waitForTimeout(150);
   };
   for (const width of [1120,390]) for (const id of Object.keys(templates)) {
    if (process.env.TEMPLATE_ONLY && process.env.TEMPLATE_ONLY !== id) continue;
    await mount(id,width);
    const label = `${engine.name()} ${id}:${width}`;
    const frame = page.frameLocator('#spacing-check iframe');
    const visibility = await frame.locator('[data-spacing-key]:not([hidden])').evaluateAll(handles => handles.map(el => ({key:el.dataset.spacingKey,value:Number(el.getAttribute('aria-valuenow')),background:getComputedStyle(el).backgroundColor,line:getComputedStyle(el,'::after').opacity,opacity:getComputedStyle(el).opacity})));
    for (const handle of visibility) assert.ok(handle.opacity !== '0' && (handle.value === 0 ? handle.line === '1' : !['transparent','rgba(0, 0, 0, 0)'].includes(handle.background)), `${label}: invisible idle spacer ${handle.key}`);
    // Exercise every example's actual links, including shadow-DOM button anchors.
    const links = frame.locator('a[href],ds-button[href],ds-link[href]');
    const count = await links.count();
    for (let n=0;n<count;n++) {
     // Dispatch the browser's default link action even for offscreen links; actual pointer presses below cover hit testing.
     await links.nth(n).evaluate(el => el.click());
     assert.equal(await frame.locator('[data-c9y-native-root][data-editor-surface]').count(),1,`${label}: link ${n} replaced its editor`);
    }
    await page.waitForTimeout(100);
    assert.equal(await frame.locator('consistency-editor,consistency-workspace,consistency-workspace-page,iframe').count(),0,`${label}: nested editor after following a link`);
    const target = await page.locator('#spacing-check iframe').evaluate(iframe => {
     const doc=iframe.contentDocument;
     for(const el of doc.querySelectorAll('[data-spacing-key][aria-orientation="vertical"]:not([hidden])')) {
      const r=el.getBoundingClientRect();
      if(r.width<30||r.height<4||r.height>100||r.top<5||r.bottom>iframe.clientHeight-100)continue;
      const x=r.left+r.width/2,y=r.top+r.height/2;
      if(!el.contains(doc.elementFromPoint(x,y)))continue;
      const f=iframe.getBoundingClientRect();
      const owner=doc.querySelector(`[data-native-block="${el.dataset.spacingKey.split(':')[0]}"]`)??doc.querySelector('[data-c9y-native-root]');
      return {height:owner?.getBoundingClientRect().height??0,key:el.dataset.spacingKey,value:Number(el.getAttribute('aria-valuenow')),x:f.left+x,y:f.top+y};
     }
     return null;
    });
    if(target) {
     const before = await page.locator('#spacing-check consistency-workspace-page').evaluate(host => JSON.stringify(host.readDocument()));
     await page.mouse.move(target.x,target.y);await page.mouse.down();await page.mouse.move(target.x,target.y+80,{steps:12});await page.mouse.up();
     await page.waitForFunction(previous => JSON.stringify(document.querySelector('#spacing-check consistency-workspace-page').readDocument()) !== previous,before);
     await page.mouse.move(1400,980);
     const growth=await page.locator('#spacing-check iframe').evaluate((iframe,key)=>{
      const doc=iframe.contentDocument,el=doc.querySelector(`[data-native-block="${key.split(':')[0]}"]`)??doc.querySelector('[data-c9y-native-root]');
      return {height:el.getBoundingClientRect().height,client:el.clientHeight,scroll:el.scrollHeight};
     },target.key);
     assert.ok(growth.height>=target.height-2,`${label}: increasing vertical spacing shrank its container`);
     assert.ok(growth.scroll<=growth.client+2,`${label}: edited container clips or scrolls vertically ${JSON.stringify(growth)}`);
     const saved=await page.locator('#spacing-check consistency-workspace-page').evaluate(host=>host.readDocument());
     await mount(id,width,saved);
     assert.deepEqual(await page.locator('#spacing-check consistency-workspace-page').evaluate(host=>host.readDocument()),saved,`${label}: spacing did not reopen`);
    }
    console.log(`${label}: ${visibility.length} idle pink guides, ${count} safe links, ${target?'pointer spacing and reopen':'no visible vertical spacing target'}`);
   }
   // A previously resized text container must expand as its gap grows, including after reopening.
   for(const id of ['shop','booking']) {
    const template=templates[id];
    const find=blocks=>blocks.flatMap(b=>[b,...find(b.children??[])]);
    const original=find(template.document.blocks).find(b=>template.components[b.name]?.attributes.class?.includes(id==='shop'?'example-shop-intro':'trip-hero'));
    assert.ok(original,`${id}: missing growth fixture`);
    const saved={schema:2,kind:'page',example:id,library:'original',fonts:{},page:structuredClone(template.document)};
    find(saved.page.blocks).find(b=>b.id===original.id).height=200;
    await mount(id,1120,saved);
    const handle=frameHandle(page,original.id);
    await handle.press('End');
    const result=await page.locator('#spacing-check consistency-workspace-page').evaluate(host=>host.readDocument());
    await mount(id,1120,result);
    const bounds=await page.frameLocator('#spacing-check iframe').locator(`[data-native-block="${original.id}"]`).evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight}));
    assert.ok(bounds.height>=bounds.scroll-2,`${engine.name()} ${id}: vertical spacing overflows resized container ${JSON.stringify(bounds)}`);
    console.log(`${engine.name()} ${id}: resized page grows with its spacing after reopening`);
   }
  } finally { await browser.close(); }
 }
} finally { await new Promise(done => server.close(done)); }
function frameHandle(page,id){return page.frameLocator('#spacing-check iframe').locator(`[data-spacing-key^="${id}:"][aria-orientation="vertical"]`).first();}
