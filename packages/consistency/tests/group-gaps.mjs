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
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/`);
 await page.locator('select[aria-label="Example page"]').selectOption('financial');
 await page.waitForTimeout(150);
 const check = async (label, expected) => {
  const result = await page.evaluate(() => {
   const editor=document.querySelector('aa-editor[data-editor-key="products"]');
   const blocks=[...editor.querySelectorAll('.aa-block')].filter(block=>(!block.querySelector('.aa-block')||block.querySelector(':scope>.aa-atom:not(.aa-columns)'))&&(block.textContent.trim()||block.querySelector('.aa-atom')));
   const bottom=Math.max(...blocks.map(block=>block.getBoundingClientRect().bottom));
   const next=document.querySelector('aa-editor[data-editor-key="markets"]>.aa-block').getBoundingClientRect();
   const handle=document.querySelector('[data-gap="section-products"]');
   const rect=handle.parentElement.getBoundingClientRect();
   return {gap:next.top-bottom, start:rect.top-bottom, end:next.top-rect.bottom, handles:document.querySelectorAll('[data-gap="section-products"]').length, labels:[...document.querySelectorAll('.consistency-column-gap')].map(node=>node.getAttribute('aria-label'))};
  });
  if(Math.abs(result.gap-expected)>1||Math.abs(result.start)>1||Math.abs(result.end)>1||result.handles!==1||new Set(result.labels).size!==result.labels.length)throw Error(`${label}: split or hidden group gap ${JSON.stringify(result)}`);
  console.log(label, result);
 };
 await check('Before moving',20);
 const before=await page.locator('consistency-editor').evaluate(e=>e.history.value.sections.products);
 const cards=page.locator('aa-editor[data-editor-key="products"] ds-card');
 const first=await cards.first().boundingBox(),last=await cards.last().boundingBox();
 await page.mouse.move(first.x+8,first.y+8);await page.waitForTimeout(650);await page.mouse.down();await page.mouse.move(last.x+last.width/2,last.y+last.height-2,{steps:15});await page.waitForTimeout(80);await page.mouse.up();await page.waitForTimeout(1000);
 const after=await page.locator('consistency-editor').evaluate(e=>e.history.value.sections.products);
 if(before===after)throw Error('The pointer drag did not move a block');
 await check('After moving a card',20);
 await page.locator('[data-gap="section-products"]').focus();await page.keyboard.press('Home');await page.waitForTimeout(100);
 await check('Zero gap',0);
 await page.getByRole('button',{name:'Mobile preview',exact:true}).click();await page.waitForTimeout(150);
 await check('Stacked groups with zero gap',0);
 await page.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
