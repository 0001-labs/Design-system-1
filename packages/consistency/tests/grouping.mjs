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
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/`);await page.waitForSelector('aa-editor');
 await page.locator('select[aria-label="Example page"]').selectOption('studio');
 const toggle=page.getByRole('switch',{name:'Grouping',exact:true});
 if(await toggle.getAttribute('aria-checked')!=='false')throw Error('Grouping should start off');
 const before=await page.locator('consistency-editor').evaluate(e=>JSON.stringify(e.history.value));
 await toggle.click();await page.locator('.consistency-group-box').first().waitFor();
 if(!await page.locator('.consistency-group-box[data-group-name^="Section"]').count())throw Error('Missing sections');
 await page.locator('ds-card[data-selectable="bookshop"]').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('.consistency-group-box')).some(e=>e.dataset.groupName.startsWith('Card ·')));
 if(!await page.locator('.consistency-group-box[data-group-name^="Cards"]').count())throw Error('Missing shared card layout');
 // The overlay cannot eat clicks or alter authored layout/history.
 const passThrough=await page.locator('ds-card[data-selectable="bookshop"]').evaluate(e=>{const r=e.getBoundingClientRect();return !document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.consistency-grouping')});
 if(!passThrough)throw Error('Grouping intercepted the pointer');
 await page.getByRole('switch',{name:'Component names',exact:true}).click();
 if(await toggle.getAttribute('aria-checked')!=='true')throw Error('Component names changed grouping');
 await page.waitForTimeout(60);
 const overlap=await page.evaluate(()=>{const groups=[...document.querySelectorAll('.consistency-group-box>span')].map(e=>e.getBoundingClientRect()),names=[...document.querySelectorAll('.consistency-component-name>span')].map(e=>e.getBoundingClientRect());return groups.some(a=>names.some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom-.5&&a.bottom>b.top+.5))});
 if(overlap)throw Error('Grouping obscured component names');
 const after=await page.locator('consistency-editor').evaluate(e=>JSON.stringify(e.history.value));
 if(before!==after)throw Error('Grouping or component names changed authored page');
 await page.getByRole('button',{name:'Mobile preview',exact:true}).click();
 await page.setViewportSize({width:390,height:900});
 await page.waitForTimeout(100);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Grouping caused horizontal overflow');
 await toggle.click();await page.waitForFunction(()=>document.querySelector('.consistency-grouping').hidden);
 if(!await page.locator('.consistency-component-names').isVisible())throw Error('Grouping changed component names');
 await page.locator('consistency-editor').evaluate(e=>e.remove());
 if(await page.locator('.consistency-grouping').count())throw Error('Grouping leaked after editor removal');
 console.log('Grouping: actual nested containers, independent toggles, pointer pass-through, mobile containment, no document mutation and cleanup passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
