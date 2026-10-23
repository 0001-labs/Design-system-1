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
 const base=`http://127.0.0.1:${server.address().port}/private-consistency/`;
 for(const width of [300,390,768,1365,1440,1920]) {
  const page=await browser.newPage({viewport:{width,height:1000}});await page.goto(base);await page.waitForSelector('select[aria-label="Example page"]');
  if(await page.locator('select[aria-label="Example page"]').inputValue()!=='editor')throw Error('The editor introduction is not the default');
  await page.waitForSelector('aa-diagram');
  if(await page.locator('aa-diagram').count()!==2)throw Error('The introduction must render two editable Aa diagrams');
  const geometry=()=>page.evaluate(()=>{const stage=document.querySelector('.consistency-stage'),sheet=document.querySelector('.consistency-sheet'),inspector=document.querySelector('.consistency-inspector');return{viewport:innerWidth,scroll:document.documentElement.scrollWidth,stage:stage.clientWidth,sheet:sheet.getBoundingClientRect().width,height:stage.getBoundingClientRect().height,sheetHeight:sheet.getBoundingClientRect().height,header:document.querySelectorAll('.consistency-top,.consistency-bar,.consistency-footer,.consistency-hint').length,obsolete:[...document.querySelectorAll('ds-button')].filter(button=>['Undo','Redo','Reset'].includes(button.textContent.trim())).length,previewInInspector:!!inspector.querySelector('ds-button[aria-pressed]'),switches:inspector.querySelectorAll('[role="switch"]').length,helpers:[...inspector.querySelectorAll('[role="switch"]')].filter(button=>{const id=button.getAttribute('aria-describedby');return id&&document.getElementById(id)?.textContent.trim()}).length};});
  await page.waitForTimeout(50);let data=await geometry();if(data.scroll>width||Math.abs(data.sheet-data.stage)>1||Math.abs(data.sheetHeight-data.height)>1||data.header||data.obsolete||!data.previewInInspector||data.helpers!==data.switches)throw Error(`Layout ${width}: ${JSON.stringify(data)}`);
  await page.locator('select[aria-label="Library preset"]').selectOption('bold');
  for(const id of await page.locator('select[aria-label="Example page"] option').evaluateAll(options=>options.map(option=>option.value).filter(id=>id!=='studio'&&id!=='booking'))) {
   await page.locator('select[aria-label="Example page"]').selectOption(id);await page.waitForTimeout(80);
   if(await page.locator('[data-selectable="bookshop"]').count())throw Error(`${id} retained Studio content`);
   const text=page.locator('aa-editor[data-editor-key="intro"]>.aa-block').first();await text.click();await page.keyboard.press('End');await page.keyboard.type(' Draft');
   const edited=await page.locator('consistency-editor').evaluate(e=>e.history.value.text);if(!edited.includes('Draft'))throw Error(`${id} text not editable`);
   await page.locator('select[aria-label="Example page"]').selectOption('studio');await page.locator('select[aria-label="Example page"]').selectOption(id);if((await page.locator('consistency-editor').evaluate(e=>e.history.value.text))!==edited)throw Error(`${id} draft lost`);
   await page.locator('.consistency-sheet').focus();await page.keyboard.press('Meta+z');await page.waitForTimeout(30);if((await page.locator('consistency-editor').evaluate(e=>e.history.value.text)).includes('Draft'))throw Error(`${id} keyboard undo failed`);await page.keyboard.press('Meta+Shift+z');await page.waitForTimeout(30);if((await page.locator('consistency-editor').evaluate(e=>e.history.value.text))!==edited)throw Error(`${id} keyboard redo failed`);
   if((await page.locator('select[aria-label="Library preset"]').inputValue())!=='bold')throw Error('Library changed on page switch');
   await page.getByRole('button',{name:'Mobile preview',exact:true}).click();await page.waitForTimeout(80);
   const mobile=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,columns:[...document.querySelectorAll('.aa-column')].map(e=>e.getBoundingClientRect().width),sheet:document.querySelector('.consistency-sheet').getBoundingClientRect().width,stage:document.querySelector('.consistency-stage').clientWidth}));if(mobile.overflow||mobile.columns.some(size=>size<199)||mobile.sheet>mobile.stage+1)throw Error(`${width} ${id} mobile: ${JSON.stringify(mobile)}`);
   await page.getByRole('button',{name:'Desktop preview',exact:true}).click();
  }
  if(width===1440){await page.locator('select[aria-label="Example page"]').selectOption('shop');await page.waitForFunction(()=>[...document.querySelectorAll('.consistency-sheet img')].length>0&&[...document.querySelectorAll('.consistency-sheet img')].every(image=>image.complete&&image.naturalWidth>0),{timeout:15000});}
  if(width===1365){await page.setViewportSize({width:1537,height:1000});await page.waitForTimeout(80);data=await geometry();if(Math.abs(data.sheet-data.stage)>1)throw Error('Window resize did not fill stage');}
  console.log(`Example pages ${width}px: full width, no header, helpers, independent editable drafts, mobile columns and containment passed`);await page.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
