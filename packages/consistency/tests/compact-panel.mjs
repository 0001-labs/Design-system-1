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
try {
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/`);await page.waitForSelector('.consistency-layer-toggle');
 await page.locator('select[aria-label="Example page"]').selectOption('studio');
 const measures=await page.locator('.consistency-layer-toggle').evaluateAll(rows=>rows.map(row=>{const button=row.querySelector('button'),r=button.getBoundingClientRect(),track=getComputedStyle(button,'::before');return {height:row.getBoundingClientRect().height,target:[r.width,r.height],track:[parseFloat(track.width),parseFloat(track.height)],font:parseFloat(getComputedStyle(row.querySelector('span')).fontSize),colour:track.backgroundColor,helper:row.querySelector('small').textContent.trim()}}));
 for(const m of measures)if(m.height!==40||m.target[0]!==40||m.target[1]!==20||m.track[0]!==24||m.track[1]!==12||m.font!==14||!m.helper||m.colour==='rgb(82, 157, 54)')throw Error('Compact panel contract: '+JSON.stringify(m));
 const spacing=page.getByRole('switch',{name:'Spacing',exact:true});await spacing.focus();await page.keyboard.press('Space');if(await spacing.getAttribute('aria-checked')!=='false')throw Error('Keyboard toggle failed');await page.keyboard.press('Enter');
 await page.locator('aa-editor[data-editor-key="intro"]').evaluate(e=>{e.editor.focus();e.editor.selectRange(2,12)});await page.waitForFunction(()=>document.querySelector('[aria-label="Spacing"]').disabled);
 if(await page.locator('#helper-spacing').textContent()!=='Paused while a menu is open.')throw Error('Paused explanation lost');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[aria-label="Spacing"]').disabled);
 if(process.env.PANEL_SCREENSHOT)await page.locator('.consistency-inspector').screenshot({path:process.env.PANEL_SCREENSHOT});
 for(const width of [300,390,768]){await page.setViewportSize({width,height:1000});await page.waitForTimeout(80);if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Panel overflow at '+width)}
 console.log('Compact panel: 40px setting rows, 24×12 monochrome tracks, 40×20 targets, unchanged text size, keyboard, context pause and phone containment passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
