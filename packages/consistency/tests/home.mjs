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
 let signedOut=false;await page.route('**/api/dashboard/session',async route=>{signedOut=route.request().method()==='DELETE';await route.fulfill({status:204});});
 await page.route('**/app/signin',route=>route.fulfill({status:200,contentType:'text/html',body:'signed out'}));
 await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/home.html`);await page.locator('consistency-home ds-card').first().waitFor();
 if(!await page.getByRole('button',{name:'New',exact:true}).isDisabled())throw Error('New is not disabled');
 const cards=await page.locator('consistency-home ds-card').evaluateAll(cards=>cards.map(card=>card.getAttribute('href')));
 if(cards.join()!=='https://flavo.c9y.site/,https://cphraft.c9y.site/,https://soendergaarden.c9y.site/')throw Error('Projects: '+cards.join());
 await page.getByRole('button',{name:'List',exact:true}).click();await page.locator('consistency-home ds-list ds-row').first().waitFor();
 if(await page.locator('consistency-home ds-list ds-row').count()!==3)throw Error('List view missing projects');
 await page.reload();await page.locator('consistency-home ds-list ds-row').first().waitFor();
 for(const width of [300,390,768,1440]){await page.setViewportSize({width,height:800});await page.waitForTimeout(100);if(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth))throw Error(`Home overflows at ${width}`);}
 await page.setViewportSize({width:1440,height:800});
 await page.locator('consistency-home ds-sidebar[label="Settings"]').getByText('Sign out',{exact:true}).click();await page.waitForURL('**/app/signin');
 if(!signedOut)throw Error('Sign out did not end the session');
 console.log('Home projects, disabled New, grid and list views, sign out and viewports passed');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
