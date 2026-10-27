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
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const drafts=new Map();let conflict=false;
 await page.route('**/api/consistency/pages**',async route=>{
  const request=route.request(),id=new URL(request.url()).pathname.split('/')[4];
  if(request.method()==='PUT'){
   const data=request.postDataJSON(),old=drafts.get(id);
   if(conflict||data.revision!==(old?.revision??0)){await route.fulfill({status:409,json:{error:'revision-conflict'}});return;}
   const saved={...data,id,revision:data.revision+1,updatedAt:Date.now()};drafts.set(id,saved);await route.fulfill({json:saved});return;
  }
  await route.fulfill({json:id?drafts.get(id):{pages:[...drafts.values()]}});
 });
 await page.goto(base);await page.getByText('Create a page to begin.',{exact:false}).waitFor();
 await page.getByRole('button',{name:'New page',exact:true}).click();await page.locator('.consistency-sheet').waitFor();
 const geometry=await page.evaluate(()=>{
   const stage=document.querySelector('.consistency-stage').getBoundingClientRect();
   const controls=document.querySelector('.consistency-inspector').getBoundingClientRect();
   const unit=parseFloat(getComputedStyle(document.querySelector('ds-page')).getPropertyValue('--ds-unit'));
   return {x:stage.x,y:stage.y,width:stage.width,height:stage.height,right:controls.right,unit};
 });
 if(geometry.x!==300||geometry.y!==20||geometry.width!==1120||geometry.height!==960||geometry.right>geometry.x)throw Error('Editor must match the product Page viewport: '+JSON.stringify(geometry));
 await page.locator('.consistency-editor-brand').getByText('Editor',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Mobile preview',exact:true}).click();
 await page.locator('.consistency-mobile-preview').waitFor();
 await page.getByRole('button',{name:'Desktop preview',exact:true}).click();
 if(process.env.EDITOR_SCREENSHOT)await page.screenshot({path:process.env.EDITOR_SCREENSHOT});
 await page.getByLabel('Page name',{exact:true}).fill('My page');await page.getByRole('status').filter({hasText:/^Saved$/}).waitFor();
 await page.evaluate(()=>{const e=document.querySelector('consistency-editor');e.history.commit({text:'Durable words'});e.revision++;});
 await page.getByRole('status').filter({hasText:/^Saved$/}).waitFor();
 await page.waitForTimeout(900);await page.reload();await page.locator('.consistency-sheet').waitFor();
 if(await page.getByLabel('Page name',{exact:true}).inputValue()!=='My page')throw Error('Page name did not reopen');
 if(await page.evaluate(()=>document.querySelector('consistency-editor').readDocument().composition.text)!=='Durable words')throw Error('Composition did not reopen');
 conflict=true;await page.getByLabel('Page name',{exact:true}).fill('Conflict');await page.getByText('This page changed in another tab.',{exact:false}).waitFor();
 conflict=false;await page.getByRole('button',{name:'Save a copy',exact:true}).click();await page.waitForTimeout(900);
 if(drafts.size!==2)throw Error('Conflict copy missing');
 for(const width of [300,390,768,1440]){await page.setViewportSize({width,height:1000});await page.waitForTimeout(100);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);if(overflow)throw Error(`Workspace overflows at ${width}`);}
 console.log('Workspace create, rename, save, reopen, conflict recovery and viewports passed');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
