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
 for (const width of [300, 390, 768, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/`);
  await page.locator('select[aria-label="Example page"]').selectOption('booking');
  await page.waitForSelector('consistency-booking .trip-search');
  if (await page.locator('select[aria-label="Library preset"]').inputValue() !== 'voyage') throw Error('Booking did not select Voyage');
  const check = async () => {
   await page.waitForTimeout(150);
   const data = await page.evaluate(() => {
    const sheet = document.querySelector('.consistency-sheet'), booking = document.querySelector('consistency-booking');
    return { overflow: [...booking.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>sheet.getBoundingClientRect().right+1).map(e=>[e.tagName,e.className,e.getBoundingClientRect().width]).slice(0,18), page: document.documentElement.scrollWidth, viewport: innerWidth, sheet: sheet.clientWidth, scroll: sheet.scrollWidth, band: getComputedStyle(booking.querySelector('.trip-band')).backgroundImage, cards: booking.querySelectorAll('ds-card').length, footer: !!booking.querySelector('ds-footer'), search: !!booking.querySelector('ds-calendar') };
   });
   if (data.page > data.viewport || data.scroll > data.sheet + 1 || data.cards !== 11 || !data.footer || !data.search || !data.band.includes('gradient')) throw Error(JSON.stringify(data));
  };
  await check();
  const heading = page.locator('consistency-booking .trip-hero [contenteditable]').first();
  await heading.fill('A different work trip');
  await page.locator('select[aria-label="Example page"]').selectOption('studio');
  await page.locator('select[aria-label="Example page"]').selectOption('booking');
  if (await heading.innerText() !== 'A different work trip') throw Error('Booking edit lost on page switch');
  await heading.focus(); await page.keyboard.press('Meta+z');
  if (await heading.innerText() !== 'Get more from every work trip') throw Error('Booking undo failed');
  await page.keyboard.press('Meta+Shift+z');
  if (await heading.innerText() !== 'A different work trip') throw Error('Booking redo failed');
  await page.getByRole('button', { name: 'Mobile preview', exact: true }).click(); await check();
  const frame=await page.evaluate(()=>{const sheet=document.querySelector('.consistency-sheet'),stage=document.querySelector('.consistency-stage'),a=sheet.getBoundingClientRect(),b=stage.getBoundingClientRect(),style=getComputedStyle(sheet);return{dx:(a.left+a.right-b.left-b.right)/2,dy:(a.top+a.bottom-b.top-b.bottom)/2,inset:b.height-a.height,outline:style.outlineStyle,outlineWidth:parseFloat(style.outlineWidth)};});
  if(Math.abs(frame.dx)>1||Math.abs(frame.dy)>1||frame.inset<39||frame.outline==='none'||frame.outlineWidth<1)throw Error(`Mobile frame ${width}: ${JSON.stringify(frame)}`);
  if(width===1440)await page.screenshot({path:'/tmp/mobile-preview-frame.png',fullPage:false});
  if (width === 1440) { await heading.focus(); await page.keyboard.press('Meta+z'); await page.getByRole('button', { name: 'Desktop preview', exact: true }).click(); await page.screenshot({path:'/tmp/booking-editor.png', fullPage:false}); }
  console.log(`Booking ${width}: complete source, Voyage, editing, history and containment passed`);
  await page.close();
 }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
