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
 for(const kind of ['flow','beside','column','unit','duplicate-unit','duplicate-side']) {
  await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/`);await page.waitForSelector('aa-editor');
  await page.locator('consistency-editor').evaluate(async(e,kind)=>{const card='```c9y-card\n'+JSON.stringify({label:'Unit',title:'Carried card',body:'Independent words.',width:240,height:200})+'\n```';const text=kind==='duplicate-side'?'# First\n\nSecond paragraph\n\n# First':kind==='duplicate-unit'?'<columns>\n<column>\n'+card+'\n</column>\n<column>\n'+card+'\n</column>\n</columns>':kind==='unit'?'<columns>\n<column>\n'+card+'\n</column>\n<column>\nThird paragraph\n</column>\n</columns>':kind==='column'?'<columns>\n<column>\n# First\n</column>\n<column>\nThird paragraph\n</column>\n</columns>':'# First\n\nSecond paragraph\n\nThird paragraph';e.history.commit({text,gaps:{...e.history.value.gaps,'intro-text-1':80,'intro-text-2':20}});e.requestUpdate();await e.updateComplete;},kind);await page.waitForTimeout(120);
  const leaf=text=>page.locator('aa-editor[data-editor-key="intro"] .aa-block').filter({hasText:text}).filter({hasNot:page.locator('.aa-block')});
  const source=kind.includes('unit')?page.locator('aa-editor[data-editor-key="intro"] .aa-block:has(>.aa-atom[data-atom="consistency-card"])').first():leaf('# First').first(),target=kind==='duplicate-side'?leaf('# First').last():kind==='duplicate-unit'?page.locator('aa-editor[data-editor-key="intro"] .aa-columns>.aa-column:nth-child(2)>.aa-block'):leaf('Third paragraph');const a=await source.boundingBox(),b=await target.boundingBox();
  await page.mouse.move(a.x+(kind.includes('unit')?8:Math.min(100,a.width/2)),a.y+(kind.includes('unit')?8:a.height/2));await page.waitForTimeout(650);await page.mouse.down();await page.mouse.move(b.x+(kind==='duplicate-side'?b.width-8:kind==='beside'?8:b.width/2),b.y+(kind==='flow'?b.height-2:b.height/2),{steps:15});await page.waitForTimeout(80);
  await page.evaluate(kind=>{window.sampleKind=kind;window.framesSample=[];window.sampleEnd=performance.now()+900;const tick=()=>{const p=document.querySelector('[data-drag-preview]');const n=window.sampleKind==='duplicate-side'?document.querySelector('aa-editor[data-editor-key="intro"] .aa-columns>.aa-column:last-child>.aa-block'):window.sampleKind==='duplicate-unit'?document.querySelector('aa-editor[data-editor-key="intro"] .aa-columns>.aa-column:nth-child(2)>.aa-block'):window.sampleKind==='unit'?document.querySelector('aa-editor[data-editor-key="intro"] .aa-block:has(>.aa-atom[data-atom="consistency-card"])'):[...document.querySelectorAll('aa-editor[data-editor-key="intro"] .aa-block')].find(e=>!e.querySelector('.aa-block')&&e.textContent==='# First');window.framesSample.push({preview:p?.getBoundingClientRect().top,top:n?.getBoundingClientRect().top,left:n?.getBoundingClientRect().left,previewLeft:p?.getBoundingClientRect().left});if(performance.now()<window.sampleEnd)requestAnimationFrame(tick)};requestAnimationFrame(tick)},kind);
  await page.mouse.up();await page.waitForTimeout(1000);
  const frames=await page.evaluate(()=>window.framesSample),last=frames.filter(f=>f.preview!==undefined).at(-1),final=frames.at(-1),handoff=frames.findIndex((f,i)=>i&&f.preview===undefined&&frames[i-1].preview!==undefined);
  if(!last||handoff<0||Math.abs(last.preview-final.top)>1||Math.abs(last.previewLeft-final.left)>1)throw Error(`${kind}: second landing ${JSON.stringify({last,final})}`);
  if(frames.slice(handoff).some(f=>Math.abs(f.top-final.top)>1||Math.abs(f.left-final.left)>1))throw Error(`${kind}: geometry changed after preview handoff`);
  console.log(`Single landing: ${kind}, preview and final authored block agree within 1px; no subsequent movement`);
 }
 await page.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
