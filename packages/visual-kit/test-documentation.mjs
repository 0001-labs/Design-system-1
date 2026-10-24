import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('website/dist');
const server=createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const path=resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!path.startsWith(root+'/'))throw Error();const data=await readFile(path);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.html':'text/html'})[extname(path)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}});
 await page.goto(`http://127.0.0.1:${server.address().port}/start-here/examples/`);
 await page.waitForFunction(()=>!!document.querySelector('.example-device ds-device-bezel')?.shadowRoot);
 const example=page.locator('[data-layout-example]').first();
 const before=await example.locator('iframe').getAttribute('src');
 await example.evaluate(el=>{el.querySelector('iframe').dataset.persist='yes';el.setAttribute('data-phone','');el.dispatchEvent(new CustomEvent('example-device-change'));});
 await example.locator('ds-device-bezel ds-app-chrome[kind="ios"]').getByText('00:01',{exact:true}).waitFor();
 await example.locator('ds-device-bezel ds-app-chrome[kind="safari-ios"]').getByRole('button',{name:'Reload',exact:true}).waitFor();
 assert.equal(await example.locator('iframe').getAttribute('src'),before);
 assert.equal(await example.locator('iframe').getAttribute('data-persist'),'yes');
 for(const width of [320,375,393,430]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`docs overflow ${width}`);}
 await example.evaluate(el=>el.removeAttribute('data-phone'));
 await page.waitForFunction(()=>document.querySelector('.example-device ds-device-bezel').frameless);
 assert.equal(await example.locator('iframe').getAttribute('data-persist'),'yes');
 console.log('Documentation: shared status and Safari chrome, all phone widths, and persistent iframe across device switches passed.');
}finally{await browser.close();server.close();}
