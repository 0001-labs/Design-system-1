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
 const spacing=page.getByRole('switch',{name:'Spacing',exact:true}), resizing=page.getByRole('switch',{name:'Resizing',exact:true});
 // Keep one preference off, to prove closing does not turn everything on.
 await resizing.click();
 await page.locator('aa-editor[data-editor-key="intro"]').evaluate(e=>{e.editor.focus();e.editor.selectRange(2,12);});
 await page.locator('.aa-toolbar:not([hidden])').waitFor();
 await page.waitForFunction(()=>document.querySelector('[role="switch"][aria-label="Spacing"]').disabled);
 if(await spacing.getAttribute('aria-checked')!=='false'||!(await resizing.isDisabled()))throw Error('Menu did not pause controls visibly');
 const preferences=await page.locator('consistency-editor').evaluate(e=>e.layers);
 if(!preferences.spacing||preferences.resizing)throw Error('Temporary state overwrote layer preferences');
 await page.locator('.aa-toolbar:not([hidden]) [data-action="bold"]').click();
 if(!(await page.locator('.aa-toolbar:not([hidden])').isVisible())||!(await spacing.isDisabled()))throw Error('Formatting choice unexpectedly dismissed context');
 // A pointer outside closes immediately, with no delayed same-range reopen.
 await page.locator('.consistency-inspector h2').click();
 await page.waitForFunction(()=>!document.querySelector('[role="switch"][aria-label="Spacing"]').disabled);
 if(await spacing.getAttribute('aria-checked')!=='true'||await resizing.getAttribute('aria-checked')!=='false')throw Error('Closing context did not restore saved preferences');
 await page.waitForTimeout(80);if(await page.locator('.aa-toolbar:not([hidden])').count())throw Error('Formatting toolbar reopened after outside click');
 const sheet=page.locator('.consistency-sheet'), box=await sheet.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+5,{button:'right'});
 await page.locator('ds-context[data-consistency-context][open]').waitFor();
 await page.waitForFunction(()=>document.querySelector('[role="switch"][aria-label="Spacing"]').disabled);
 await page.locator('.consistency-inspector h2').click();await page.waitForFunction(()=>!document.querySelector('ds-context[data-consistency-context][open]'));
 await page.waitForFunction(()=>!document.querySelector('[role="switch"][aria-label="Spacing"]').disabled);
 if(await resizing.getAttribute('aria-checked')!=='false')throw Error('Context close changed disabled resize preference');
 console.log('Context: formatting stays open; outside closes; spacing/resize visibly pause and restore saved preferences');
 await page.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
