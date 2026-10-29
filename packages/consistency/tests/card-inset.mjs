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
 const base = `http://127.0.0.1:${server.address().port}/editor/`;
 const page = await browser.newPage({ viewport: { width:1440, height:1000 } });
 await page.goto(base);await page.waitForSelector('.consistency-sheet');
 await page.locator('select[aria-label="Example page"]').selectOption('studio');
 const verify = async (selector, label) => {
  const failures = await page.locator(selector).evaluateAll(cards => cards.flatMap(card => {
   const scale = Number.parseFloat(getComputedStyle(card).getPropertyValue('--sf')) || 1;
   const surface = card.shadowRoot?.querySelector('.ds-card');if (!surface) return ['Missing surface'];
   const bounds = surface.getBoundingClientRect(), failures = [];
   for(const field of card.querySelectorAll('[slot="label"],[slot="title"],p,ds-tag')) {
    const rect=field.getBoundingClientRect();if(!rect.width||!rect.height)continue;
    const sides=[rect.left-bounds.left,bounds.right-rect.right,rect.top-bounds.top,bounds.bottom-rect.bottom].map(value=>value/scale);
    if(sides.some(value=>value<19.5))failures.push(`${card.dataset.selectable??'inserted'} ${field.tagName}: ${sides}`);
   }
   return failures;
  }));
  if(failures.length)throw Error(`${label}: ${failures.join('; ')}`);
 };
 for(const preset of ['original','blue','ink','soft','bold','editorial']) {
  await page.reload();await page.waitForSelector('.consistency-sheet');await page.locator('select[aria-label="Library preset"]').selectOption(preset);
  await page.locator('consistency-editor').evaluate(async e=>{const card=label=>'```c9y-card\n'+JSON.stringify({label,title:'Title words',body:'A short independent paragraph.',width:240,height:80})+'\n```';e.history.commit({text:card('One')+'\n\n'+card('Two'),sizes:{bookshop:{width:240,height:80}}});e.requestUpdate();await e.updateComplete;});await page.waitForTimeout(100);
  await verify('.consistency-sheet ds-card',preset+' narrow cards');
  const edge=page.locator('aa-editor[data-editor-key="intro"] ds-card').first().locator('[aria-label="Card width"]');await edge.focus();await page.keyboard.press('ArrowLeft');await page.waitForTimeout(120);await verify('.consistency-sheet ds-card',preset+' resized cards');
  if(preset==='original') {
   await page.locator('consistency-editor').evaluate(async e=>{e.history.commit({sizes:{...e.history.value.sizes,bookshop:{width:400,height:320}}});e.requestUpdate();await e.updateComplete;});await page.waitForTimeout(100);
   const corner=page.locator('aa-editor[data-editor-key="intro"] ds-card').first().locator('[aria-label="Card size"]');
   const rect=await corner.boundingBox(),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-300,y-220,{steps:10});await page.waitForTimeout(50);
   await verify('.consistency-sheet ds-card','original live diagonal shrink');
   await page.mouse.up();await page.waitForTimeout(200);await verify('.consistency-sheet ds-card','original committed diagonal shrink');
   console.log('Card inset original: live and committed diagonal pointer shrink passed');
  }
  await page.getByRole('button',{name:'Mobile preview',exact:true}).click();await page.waitForTimeout(100);await verify('.consistency-sheet ds-card',preset+' mobile cards');await page.getByRole('button',{name:'Desktop preview',exact:true}).click();
  await page.locator('consistency-editor').evaluate(async e=>{e.history.commit({text:'# Insert a card'});e.requestUpdate();await e.updateComplete;const host=e.querySelector('aa-editor');host.editor.value='/card';host.editor.focus();host.editor.selectRange(5);host.dispatchEvent(new Event('aa-change'));document.dispatchEvent(new Event('selectionchange'));});
  await page.locator('.aa-menu button').filter({hasText:'Card'}).hover();await page.locator('.consistency-element-preview ds-card').waitFor({state:'visible'});await verify('.consistency-element-preview ds-card',preset+' slash preview');await page.keyboard.press('Escape');
  console.log(`Card inset ${preset}: narrow, resize, mobile and slash preview passed`);
 }
 await page.evaluate(async()=>{const card=document.createElement('ds-card');card.dataset.testCardMedia='';card.media='bleed';card.width=14;card.height=12;card.innerHTML='<span slot="label">A picture</span><span slot="title">Words stay inside</span><p>A little writing.</p><div slot="media" style="height:40px;width:100%;background:red"></div>';document.querySelector('.consistency-sheet').append(card);await card.updateComplete;});await page.waitForTimeout(100);
 await verify('[data-test-card-media]','full bleed media words');
 const media=await page.locator('[data-test-card-media]').evaluate(card=>{const surface=card.shadowRoot.querySelector('.ds-card').getBoundingClientRect(),picture=card.querySelector('[slot="media"]').getBoundingClientRect();return{foot:surface.bottom-picture.bottom,end:surface.right-picture.right};});if(Math.abs(media.foot)>1||Math.abs(media.end)>1)throw Error(`Media lost full bleed: ${JSON.stringify(media)}`);
 console.log('Card media: text inset and full foot/end bleed passed');
 await page.close();
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
