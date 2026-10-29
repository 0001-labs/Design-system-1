import { chromium, webkit } from 'playwright';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

const check = (ok, message) => { if (!ok) throw Error(message); };
const bundle = await build({ stdin: { contents: `import {EditorSurface} from './packages/consistency/src/editor-surface';window.surface=new EditorSurface(document.querySelector('main'),{selection:()=>new Set(),select:()=>{},marquee:()=>false,reorder:()=>false});`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife' });
const styles = await readFile('packages/consistency/src/editor-surface.css', 'utf8');
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>${styles}body{margin:40px}p{margin:0 0 40px;font:20px/30px sans-serif}</style><main><p id="label">Canvas words are not a document selection.</p><p id="other">Another independent piece of the page.</p><p id="writing" contenteditable="true">Select words within this editor.</p><input value="A native field"></main>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const selection = () => page.evaluate(() => window.getSelection().toString());
    const box = await page.locator('#label').boundingBox();
    await page.mouse.move(box.x + 2, box.y + 15); await page.mouse.down();
    await page.mouse.move(box.x + 220, box.y + 85, { steps: 10 }); await page.mouse.up();
    check(!await selection(), 'Dragging over canvas words created a document text selection');
    await page.mouse.move(15, 15); await page.mouse.down();
    await page.mouse.move(box.x + 220, box.y + 85, { steps: 10 }); await page.mouse.up();
    check(!await selection(), 'Dragging from the page margin selected canvas text');
    await page.mouse.click(15, 15);
    const selectAll = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';
    await page.keyboard.press(selectAll);
    check(!await selection(), 'Select all outside writing selected the entire canvas');
    await page.locator('#writing').click(); await page.keyboard.press(selectAll);
    check((await selection()).trim() === 'Select words within this editor.', 'Select all escaped the active text editor');
    await page.keyboard.type('Changed words.');
    check(await page.locator('#writing').textContent() === 'Changed words.', 'Normal text replacement failed');
    await page.locator('input').click(); await page.keyboard.press(selectAll); await page.keyboard.type('Changed field');
    check(await page.locator('input').inputValue() === 'Changed field', 'Native field selection failed');
    await page.evaluate(() => {
      const host = document.createElement('div'); host.id = 'shadow'; document.querySelector('main').append(host);
      host.attachShadow({ mode: 'open' }).innerHTML = '<span contenteditable="true">Shadow words</span>';
    });
    const shadow = page.locator('#shadow [contenteditable]');
    await shadow.click(); await page.keyboard.press(selectAll); await page.keyboard.type('Changed shadow');
    check(await shadow.textContent() === 'Changed shadow', 'Shadow component text selection failed');
    console.log(`${engine.name()}: Canvas selection stays within active writing`);
  } finally { await browser.close(); }
}
