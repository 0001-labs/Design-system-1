/** Local-only viewport contract. Build first; no customer data or live host. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../../../website/dist/', import.meta.url));
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (pathname === '/standalone/') { response.setHeader('content-type','text/html'); response.end(`<div id="host"></div><script type="module">import {createEditor} from '/vanilla-aa.js';window.editor=createEditor(document.querySelector('#host'),{value:'Keep these words',toolbar:new URLSearchParams(location.search).has('toolbar'),menus:false});</script>`); return; }
  if (pathname === '/vanilla-aa.js') { response.setHeader('content-type','text/javascript'); response.end(await readFile(new URL('../../../website/src/vendor/aa/aa.js',import.meta.url))); return; }
  const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
  try { const body = await readFile(file); response.setHeader('content-type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[extname(file)] ?? 'application/octet-stream'); response.end(body); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const base=`http://127.0.0.1:${server.address().port}`;
 for(const toolbar of [false,true]) {
  await page.goto(`${base}/standalone/${toolbar?'?toolbar':''}`);await page.waitForSelector('.aa-block');
  await page.locator('.aa-block').click();await page.keyboard.press('End');
  await page.keyboard.press('Escape');
  const result=await page.evaluate(()=>({focused:document.querySelector('#host').contains(document.activeElement),ranges:getSelection().rangeCount,value:editor.value}));
  if(result.focused||result.ranges||result.value!=='Keep these words')throw Error('Vanilla Escape retained caret or changed text: '+JSON.stringify(result));
  await page.keyboard.type('Ignored');
  if(await page.evaluate(()=>editor.value)!=='Keep these words')throw Error('Dismissed Aa still accepted typing');
  await page.locator('.aa-block').click();await page.keyboard.press('End');await page.keyboard.type('!');
  if(await page.evaluate(()=>editor.value)!=='Keep these words!')throw Error('Aa could not resume after dismissal');
 }
 await page.goto(`${base}/private-consistency/`);await page.waitForSelector('aa-editor[data-editor-key="intro"]');
 await page.locator('select[aria-label="Example page"]').selectOption('studio');
 const intro=page.locator('aa-editor[data-editor-key="intro"]');
 for(const selected of [false,true]) {
  await intro.evaluate((e,selected)=>{e.editor.focus();e.editor.selectRange(2,selected?12:2)},selected);
  if(selected)await page.locator('.aa-toolbar:not([hidden])').waitFor();
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('.aa-toolbar:not([hidden])'));
  await page.waitForFunction(()=>!document.querySelector('[role="switch"][aria-label="Spacing"]').disabled);
  if(await intro.evaluate(e=>e.contains(document.activeElement)||getSelection().rangeCount>0))throw Error('Integration Escape retained caret');
 }
 const guide=page.getByRole('link',{name:'Editor guide',exact:true});
 if(await guide.getAttribute('target')!=='_blank')throw Error('Guide would replace the current draft');
 await page.goto(base+await guide.getAttribute('href'));
 await page.getByRole('heading',{name:'Aa edits text. Consistency builds sites.',exact:true}).waitFor();
 for(const width of [300,390,1440]) {
  await page.setViewportSize({width,height:1000});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Guide overflow at '+width);
 }
 console.log('Escape: vanilla Aa and Consistency clear focus/caret; typing resumes deliberately; ownership guide fits phone and desktop');
 await page.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
