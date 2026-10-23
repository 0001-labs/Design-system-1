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
 const spacing=page.getByRole('switch',{name:'Spacing',exact:true}), resizing=page.getByRole('switch',{name:'Resizing',exact:true});
 // Keep one preference off, to prove closing does not turn everything on.
 await resizing.click();
 await page.locator('aa-editor[data-editor-key="intro"]').evaluate(e=>{e.editor.focus();e.editor.selectRange(2,12);});
 await page.locator('.aa-toolbar:not([hidden])').waitFor();
 const toolbar = page.locator('.aa-toolbar:not([hidden])');
 const before = await toolbar.boundingBox();
 const prompt = toolbar.getByRole('textbox', { name: 'Ask AI about the selected words' });
 await prompt.click();
 await page.waitForTimeout(220);
 const after = await toolbar.boundingBox(), writing = await prompt.boundingBox();
 if (Math.abs(before.width-after.width)>0.1 || Math.abs(before.height-after.height)>0.1 || Math.abs(writing.y-after.y)>0.1 || Math.abs(writing.height-after.height)>0.1) throw Error('Prompt expansion changed panel footprint or did not fill its rows');
 if (!(await toolbar.locator('button').evaluateAll(buttons=>buttons.every(button=>button.inert)))) throw Error('Covered formatting buttons remain interactive');
 await prompt.evaluate(field=>field.blur());
 await page.waitForTimeout(220);
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
 const tableEditor = page.locator('aa-editor[data-editor-key="intro"]');
 await tableEditor.evaluate(element => { element.editor.value = '| Name | Value |\n| --- | --- |\n| Milk | 2 |'; });
 await tableEditor.locator('[data-cell="1:0"]').click();
 await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
 await page.keyboard.type('Another year for this');
 const tableValue = await tableEditor.evaluate(element => element.editor.value);
 if (!tableValue.includes('| Another year for this | 2 |')) throw Error('Typing spaces moved the caret out of the table cell: '+tableValue);
 console.log('Table typing: spaces remain in the edited cell and adjacent contents stay unchanged');
 await page.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
