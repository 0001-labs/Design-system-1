import { componentFixture } from './component-fixture.mjs';
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
  try { const body = await componentFixture(file); response.setHeader('content-type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[extname(file)] ?? 'application/octet-stream'); response.end(body); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
 const page = await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(`http://127.0.0.1:${server.address().port}/editor/`);
 await page.waitForSelector('aa-editor');
 await page.locator('select[aria-label="Example page"]').selectOption('studio');
 await page.locator('consistency-editor').evaluate(async e=>{
  e.history.commit({text:'## Heading\n\nA paragraph\n\n```c9y-button\n'+JSON.stringify({label:'Open a page',secondary:false})+'\n```'});
  e.requestUpdate();await e.updateComplete;
 });
 const button=page.locator('.consistency-button-action').first();
 await button.waitFor({state:'attached'});await page.waitForTimeout(100);
 // Selecting a section retains command identity, but paints only its authored leaves.
 await page.locator('consistency-editor').evaluate(async e=>{e.selection=new Set(['group-intro']);await e.updateComplete;});
 const faces=await page.locator('[data-sort-group="intro"]').evaluate(group=>({
  selected:group.hasAttribute('data-selected'), parentFace:getComputedStyle(group,'::after').content,
  leaves:[...group.querySelectorAll('[data-selection-face]')].map(e=>({empty:!e.textContent.trim(),children:!!e.querySelector('[data-selectable],.aa-block'),paint:getComputedStyle(e,'::after').content})),
  gapPaint:[...group.querySelectorAll('.consistency-gap,.consistency-text-gap')].some(e=>e.hasAttribute('data-selection-face'))
 }));
 if(!faces.selected||!['none','normal'].includes(faces.parentFace)||faces.gapPaint||faces.leaves.length<5||faces.leaves.some(e=>e.empty||e.children||e.paint!=='""'))throw Error('Selection painted group spacing '+JSON.stringify(faces));
 await page.keyboard.press('Escape');
 if(await page.locator('[data-selection-face]').count())throw Error('Escape left component selection faces');
 const before = await page.locator('consistency-editor').evaluate(e=>JSON.stringify(e.history.value));
 // Count full editor updates and hit-test layout reads, not machine-dependent timings.
 await page.locator('consistency-editor').evaluate(e=>{
  window.interactionMetrics={updates:0,reads:0};
  const updated=e.updated;e.updated=function(...args){window.interactionMetrics.updates++;return updated.apply(this,args);};
  const rect=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){if(this.matches('.aa-block[data-selectable]'))window.interactionMetrics.reads++;return rect.call(this);};
 });
 const sheet=await page.locator('.consistency-sheet').boundingBox();
 const atom=await button.locator('..').boundingBox();
 await page.mouse.move(sheet.x+sheet.width/2,sheet.y+4);
 await page.mouse.down();
 await page.waitForTimeout(80);
 await page.evaluate(()=>{window.interactionMetrics.updates=0;window.interactionMetrics.reads=0;});
 await page.mouse.move(atom.x+atom.width/2,atom.y+atom.height/2,{steps:15});
 await page.waitForTimeout(50);
 if(await page.getByRole('switch',{name:'Spacing',exact:true}).isDisabled())throw Error('Marquee crossing a button opened its toolbar and disabled spacing');
 if(await button.getAttribute('data-open')!==null)throw Error('Passive hover stole marquee gesture');
 const metrics=await page.evaluate(()=>window.interactionMetrics);
 if(metrics.updates || metrics.reads)throw Error(`Marquee rebuilt the document or remeasured stable content during movement: ${JSON.stringify(metrics)}`);
 await page.mouse.up();
 await page.waitForTimeout(30);
 if(await page.getByRole('switch',{name:'Spacing',exact:true}).isDisabled())throw Error('Releasing marquee disabled spacing');
 if(await page.locator('consistency-editor').evaluate(e=>JSON.stringify(e.history.value))!==before)throw Error('Selection wrote document history');
 if(await page.locator('consistency-editor').evaluate(e=>e.selection.size)===0)throw Error('Marquee did not select content');
 const selected=await page.locator('consistency-editor').evaluate(e=>[...e.selection]);
 const gap=page.locator('.consistency-text-gap').first();
 const original=Number(await gap.getAttribute('aria-valuenow'));
 const gapBox=await gap.boundingBox();
 await page.mouse.move(gapBox.x+gapBox.width/2,gapBox.y+gapBox.height/2);
 await page.mouse.down();await page.mouse.move(gapBox.x+gapBox.width/2,gapBox.y+gapBox.height/2+30,{steps:5});
 if(Number(await gap.getAttribute('aria-valuenow'))===original)throw Error('A selected element lost its working spacing handle');
 await page.mouse.up();await page.waitForTimeout(250);
 if(JSON.stringify(await page.locator('consistency-editor').evaluate(e=>[...e.selection]))!==JSON.stringify(selected))throw Error('Spacing a selection cleared the selection');
 await page.locator('.consistency-inspector [role="status"]').click();await page.keyboard.press('Meta+z');await page.waitForTimeout(50);
 if(await page.locator('consistency-editor').evaluate(e=>JSON.stringify(e.history.value))!==before)throw Error('Spacing after selection did not form one undo transaction');
 // A cancelled new marquee restores the previous selection, rather than its empty additive base.
 await page.mouse.move(sheet.x+sheet.width/2,sheet.y+4);await page.mouse.down();
 await page.mouse.move(sheet.x+sheet.width-5,sheet.y+10);await page.waitForTimeout(30);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.up();
 if(JSON.stringify(await page.locator('consistency-editor').evaluate(e=>[...e.selection]))!==JSON.stringify(selected))throw Error('Blur failed to restore the original selection');
 // Shift gives marquee priority over section reordering on unused row space.
 const row=await page.locator('.consistency-sample-actions').first().boundingBox();
 await page.keyboard.down('Shift');await page.mouse.move(row.x+row.width-3,row.y+row.height/2);await page.mouse.down();
 await page.mouse.move(row.x+row.width-80,row.y-60,{steps:5});await page.waitForTimeout(50);
 if(await page.locator('.consistency-marquee').count()!==1||await page.locator('[data-drag-preview]').count())throw Error('Section reordering stole additive marquee '+JSON.stringify(await page.evaluate(({x,y})=>({hit:document.elementFromPoint(x,y)?.outerHTML.slice(0,300),additive:document.querySelector('consistency-editor').hasAttribute('data-pointer-additive'),marquees:document.querySelectorAll('.consistency-marquee').length,previews:document.querySelectorAll('[data-drag-preview]').length}),{x:row.x+row.width-3,y:row.y+row.height/2})));
 const scrollBefore=await page.locator('.consistency-sheet').evaluate(e=>e.scrollTop);
 await page.locator('.consistency-sheet').evaluate(e=>e.scrollBy(0,60));await page.waitForTimeout(80);
 const scrolled=await page.locator('.consistency-sheet').evaluate(e=>e.scrollTop)-scrollBefore;
 // The upper corner here is the moving pointer, so inspect the lower anchored corner.
 const bottom=await page.locator('.consistency-marquee').evaluate(e=>e.getBoundingClientRect().bottom);
 if(!scrolled||Math.abs(bottom-(row.y+row.height/2-scrolled))>1)throw Error('Marquee origin did not follow content scrolling '+JSON.stringify({scrolled,bottom,row,scroll:await page.locator('.consistency-stage').evaluate(e=>({top:e.scrollTop,height:e.clientHeight,scrollHeight:e.scrollHeight,parents:[...document.querySelectorAll('.consistency-workspace,.consistency-shell')].map(p=>[p.className,p.scrollTop,p.clientHeight,p.scrollHeight])}))}));
 await page.mouse.up();await page.keyboard.up('Shift');
 if(await page.locator('consistency-editor').evaluate(e=>JSON.stringify(e.history.value))!==before)throw Error('Additive marquee reordered content');
 const added=await page.locator('consistency-editor').evaluate(e=>[...e.selection]);
 if(selected.some(id=>!added.includes(id)))throw Error('Shift marquee discarded the existing selection');
 console.log('Interaction ownership: marquee keeps spacing available and does not open passive hover contexts');
 await page.close();
} finally { await browser.close();await new Promise(resolve=>server.close(resolve)); }
