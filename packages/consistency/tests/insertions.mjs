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
import { PAGE_INSERTIONS } from '../../../shared/consistency-insertions.ts';
try {
 const page = await browser.newPage({ viewport: { width: 390, height: 1000 } });
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/`);await page.waitForSelector('aa-editor[data-editor-key="intro"] .aa-block');
 await page.locator('select[aria-label="Example page"]').selectOption('studio');
 for (const entry of PAGE_INSERTIONS) {
  await page.evaluate(async label => { const shell=document.querySelector('consistency-editor');shell.history.commit({text:'/'+label});shell.requestUpdate();await shell.updateComplete;const host=shell.querySelector('aa-editor[data-editor-key="intro"]');await host.updateComplete;host.editor.focus();host.editor.selectRange(host.value.length);host.dispatchEvent(new Event('aa-change'));document.dispatchEvent(new Event('selectionchange')); },entry.label);
  const host=page.locator('aa-editor[data-editor-key="intro"]');
  await page.locator(`.aa-menu button[aria-label="${entry.label}"]`).click();
  if(await host.evaluate(host=>host.value)!==entry.source)throw Error(`${entry.label}: wrong source`);
  if(await page.locator('dialog[open]').count() || /Edit (list|tabs|table|carousel|image|link|icon)/i.test(await host.innerText()))throw Error('Unexpected edit control');
  if(entry.id==='table'){
   await host.locator('[data-cell]').last().click();await page.keyboard.press('Enter');
   if(await host.locator('[data-cell]').count()!==6)throw Error('Enter did not add a table row');
   await page.keyboard.type('B');
   if(await host.locator('[data-cell]').nth(4).innerText()!=='B')throw Error('New row did not receive the caret: '+JSON.stringify(await host.evaluate(host=>({value:host.value,active:document.activeElement?.outerHTML,selection:host.editor.selection(),cells:[...host.querySelectorAll('[data-cell]')].map(c=>c.innerText)}))));
   if((await host.innerText()).includes('|'))throw Error('Table exposed source syntax');
   await host.evaluate(host=>host.editor.undo());await host.evaluate(host=>host.editor.undo());
   if(await host.evaluate(host=>host.value)!==entry.source)throw Error('Table row undo failed');
  }
  if(entry.id==='icon'){
   await host.locator('.aa-atom').focus();await page.keyboard.press('Enter');await host.getByRole('textbox',{name:'Icon name',exact:true}).fill('check');await page.keyboard.press('Enter');
   if(await host.evaluate(host=>host.value)!==':icon[check]')throw Error('Icon did not change inline');await host.evaluate(host=>host.editor.undo());
  }
  if(entry.id==='image'){
   const chooser=page.waitForEvent('filechooser');await host.locator('.consistency-image-placeholder').click();await (await chooser).setFiles({name:'sample.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
   await host.locator('img').waitFor();if(!(await host.evaluate(host=>host.value)).startsWith('![sample.png](data:image/png;base64,'))throw Error('Image was not stored as native Aa Markdown');await host.evaluate(host=>host.editor.undo());
  }
  await host.evaluate(host=>host.editor.undo());if(await host.evaluate(host=>host.value)!=='/'+entry.label)throw Error(`${entry.label}: undo failed`);
 }
 await page.evaluate(async()=>{const host=document.querySelector('aa-editor[data-editor-key="intro"]');host.editor.focus();host.editor.selectRange(0);});await page.keyboard.press('Meta+/');
 for(const entry of PAGE_INSERTIONS)if(await page.locator(`.aa-menu button[aria-label="${entry.label}"]`).count()!==1)throw Error(`${entry.label}: context picker mismatch`);
 if(await page.locator('.aa-menu button[aria-label="Context"],.aa-menu button[aria-label="Form"]').count())throw Error('Unapproved components returned');
 if(errors.length)throw Error(errors.join('\n'));console.log('Seven approved insertions: native editing, inline icon change, image upload, undo and context picker passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
