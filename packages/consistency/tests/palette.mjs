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
import { COMPONENT_PALETTE, paletteInsertion } from '../../../shared/consistency-palette.ts';
try {
 const page = await browser.newPage({ viewport: { width: 390, height: 1000 } });
 const errors = []; page.on('pageerror', error => errors.push(error.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/`);
 await page.waitForSelector('aa-editor[data-editor-key="intro"] .aa-block');
 for (const entry of COMPONENT_PALETTE) {
  await page.evaluate(async label => {
   const shell = document.querySelector('consistency-editor'); shell.history.commit({ text: '/' + label }); shell.requestUpdate(); await shell.updateComplete;
   const host = document.querySelector('aa-editor[data-editor-key="intro"]'); await host.updateComplete;
   host.editor.focus(); host.editor.selectRange(host.value.length); host.dispatchEvent(new Event('aa-change')); document.dispatchEvent(new Event('selectionchange'));
  }, entry.label);
  const choice = page.locator(`.aa-menu [data-command="insert-consistency-${entry.id}"]`);
  await choice.waitFor({ state: 'visible' }); await choice.click();
  const host = page.locator('aa-editor[data-editor-key="intro"]');
  await host.locator(entry.tag).first().waitFor({ state: 'attached' });
  await page.waitForTimeout(40);
  const result = await host.evaluate(host => ({ source: host.value, scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth, content: host.innerText }));
  if (result.source !== paletteInsertion(entry)) throw Error(`${entry.name}: picker did not insert canonical source`);
  if (result.scroll > result.width) throw Error(`${entry.name}: escaped the phone viewport`);
  if (!['button', 'card', 'carousel'].includes(entry.id)) {
   await host.locator('.consistency-palette-edit').click();
   const dialog = page.getByRole('dialog', { name: `Edit ${entry.name}`, exact: true }); await dialog.waitFor({ state: 'visible' });
   const bounds = await dialog.boundingBox(); if (!bounds || bounds.x < 0 || bounds.x + bounds.width > 390) throw Error(`${entry.name}: fields exceed viewport`);
   await dialog.getByText('Cancel', { exact: true }).click(); await dialog.waitFor({ state: 'detached' });
  }
  await host.evaluate(host => host.editor.undo());
  if (await host.evaluate(host => host.value) !== '/' + entry.label) throw Error(`${entry.name}: undo did not restore prompt: ${await host.evaluate(host => host.value)}`);
 }
 // The block context picker uses the same entries, without a slash query.
 await page.evaluate(async () => { const shell = document.querySelector('consistency-editor'); shell.history.commit({ text: 'Keep these words' }); shell.requestUpdate(); await shell.updateComplete; const host = document.querySelector('aa-editor[data-editor-key="intro"]'); await host.updateComplete; host.editor.focus(); host.editor.selectRange(2); });
 await page.keyboard.press('Meta+/');
 await page.locator('.aa-menu [data-command="insert-consistency-avatar"]').waitFor({ state: 'visible' });
 for (const entry of COMPONENT_PALETTE) if (await page.locator(`.aa-menu [data-command="insert-consistency-${entry.id}"]`).count() !== 1) throw Error(`${entry.name}: absent from context picker`);
 await page.locator('.aa-menu [data-command="insert-consistency-stat"]').click();
 await page.locator('aa-editor[data-editor-key="intro"] .consistency-palette-edit').click();
 const dialog = page.getByRole('dialog', { name: 'Edit Stat', exact: true });
 await dialog.getByRole('textbox', { name: 'Label', exact: true }).fill('Visitors');
 await dialog.getByText('Save', { exact: true }).click(); await dialog.waitFor({ state: 'detached' });
 const saved = await page.locator('aa-editor[data-editor-key="intro"]').evaluate(host => host.value);
 if (!saved.includes('Visitors') || !saved.includes('Keep these words')) throw Error('Content edit lost the surrounding text');
 if (errors.length) throw Error(errors.join('\n'));
 console.log(`Palette: ${COMPONENT_PALETTE.length} insertions, renderers, phone dialogs and undo; context picker and content save passed`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
