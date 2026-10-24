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
 for (const path of ['/account/', '/libraries/workspace/', '/libraries/playground/', '/visual-kit/gallery/', '/visual-kit/']) {
   await page.goto(`http://127.0.0.1:${server.address().port}${path}`);
   await page.locator('.docs-navigation-rail').waitFor({state:'visible'});
   if(path==='/account/') assert.equal(await page.locator('#library-app').getAttribute('data-src'),'/app/profile?embed=docs');
 }
 assert.equal(await page.locator('.platform-examples ds-window').count(),8);
 assert.equal(await page.locator('.chrome-example > ds-app-chrome').count(),16);
 for(const width of [320,375,393,430]) {
   await page.setViewportSize({width,height:1000});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`VisualKit overflow ${width}`);
 }
 console.log('Navigation: Account, libraries, playground and VisualKit retain the sidebar; all window and chrome examples fit four phone widths.');
}finally{await browser.close();server.close();}
