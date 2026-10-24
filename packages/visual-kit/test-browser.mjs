import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('website/dist');
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(root+'/'))throw Error();const data=await readFile(path);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.html':'text/html'})[extname(path)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/private-app/visual-kit.html`);
 await page.waitForFunction(()=>[...document.querySelectorAll('ds-device-bezel')].length===21&&[...document.querySelectorAll('ds-device-bezel')].every(d=>d.shadowRoot?.querySelector('img')?.naturalWidth>0));
 const geometry=await page.evaluate(()=>[...document.querySelectorAll('ds-device-bezel')].map(d=>{const screen=d.shadowRoot.querySelector('.screen').getBoundingClientRect(),frame=d.getBoundingClientRect();return {inside:screen.left>=frame.left&&screen.right<=frame.right+1&&screen.top>=frame.top&&screen.bottom<=frame.bottom+1,clock:d.shadowRoot.querySelector('ds-app-chrome').shadowRoot.querySelector('.clock').textContent};}));
 assert(geometry.every(g=>g.inside&&g.clock==='00:01'));
 await page.evaluate(()=>document.querySelector('#window').kind='chrome');
 const action=page.locator('#window').locator('ds-app-chrome').getByRole('button',{name:'Reload',exact:true});await action.click();await page.getByText('Chrome action: reload',{exact:true}).waitFor();
 await page.evaluate(()=>{const w=document.querySelector('#window');w.interactive=false;});
 await page.waitForFunction(()=>document.querySelector('#window').shadowRoot.querySelector('ds-app-chrome').shadowRoot.querySelector('button').disabled);
 for(const kind of ['macos','safari','chrome','edge','macos-compact']){await page.evaluate(k=>document.querySelector('#window').kind=k,kind);await page.waitForFunction(k=>document.querySelector('#window').shadowRoot.querySelector('ds-app-chrome').kind===k,kind);}
 const mobile=page.locator('#phone ds-app-chrome[kind="safari-ios"]');
 assert.deepEqual(await mobile.getByRole('button').evaluateAll(bs=>bs.map(b=>b.getAttribute('aria-label'))),['Back','Page menu','Reload','Tabs']);
 const overlay=await page.locator('#phone').evaluate(d=>{const s=d.shadowRoot;const content=s.querySelector('.content').getBoundingClientRect(),bar=s.querySelector('.browser').getBoundingClientRect();return bar.top<content.bottom&&bar.bottom<=content.bottom;});
 assert(overlay,'Safari floats over the app viewport');
 assert.equal(await page.locator('#phone ds-app-chrome[kind="ios"]').getByText('4G',{exact:true}).count(),1);
 await page.evaluate(()=>{const demo=document.createElement('div');demo.id='mobile-reference';demo.style.cssText='position:relative;width:393px;height:852px;background:repeating-linear-gradient(0deg,transparent 0 27px,#ddd 27px 28px),repeating-linear-gradient(90deg,white 0 27px,#ddd 27px 28px);color:black';demo.innerHTML='<ds-app-chrome kind="ios"></ds-app-chrome><ds-app-chrome kind="safari-ios" address="ezo.gs" style="position:absolute;bottom:34px;left:0;right:0"></ds-app-chrome>';document.body.append(demo);});
 await page.locator('#mobile-reference').screenshot({path:'/tmp/visualkit-mobile-reference.png'});
 await page.locator('#mobile-reference').evaluate(el=>el.remove());
 const compact=await page.evaluate(()=>{const w=document.querySelector('#window'),bar=w.shadowRoot.querySelector('ds-app-chrome').shadowRoot.querySelector('.compact');return {height:bar.getBoundingClientRect().height,colours:[...bar.querySelectorAll('.lights button')].map(b=>getComputedStyle(b).backgroundColor),shadow:getComputedStyle(w).boxShadow};});
 assert.equal(compact.height,30);assert.equal(new Set(compact.colours).size,1);assert.equal(compact.shadow,'none');
 await page.evaluate(()=>{const w=document.querySelector('#window');w.href='/examples/layouts/shop/';w.style.setProperty('--sf','1.5');});
 const compactLink=page.locator('#window ds-app-chrome').getByRole('link');
 await compactLink.waitFor();assert.equal(await compactLink.getAttribute('href'),'/examples/layouts/shop/');assert.equal(await compactLink.getAttribute('target'),'_blank');
 assert.equal(await page.locator('#window ds-app-chrome').evaluate(c=>c.shadowRoot.querySelector('.compact').getBoundingClientRect().height),45);
 await page.keyboard.press('Tab');await compactLink.focus();assert(await compactLink.evaluate(a=>a.matches(':focus-visible')));
 await page.evaluate(()=>{const w=document.querySelector('#window');w.href='';w.style.removeProperty('--sf');});
 await page.waitForFunction(()=>!document.querySelector('#window').shadowRoot.querySelector('ds-app-chrome').shadowRoot.querySelector('a'));
 const expectedHeight={safari:52,chrome:86,edge:80};
 for (const kind of ['safari','chrome','edge']) for(const appearance of ['light','dark']) {
   const specimen=page.locator(`#browsers ds-app-chrome[kind="${kind}"][appearance="${appearance}"]`);
   assert.equal(Math.round((await specimen.boundingBox()).height),expectedHeight[kind],`${kind} native toolbar height`);
   assert.equal(await specimen.getByRole('button',{name:'Reload',exact:true}).count(),kind==='safari'?0:1);
   assert.equal(await specimen.getByRole('button',{name:'Share',exact:true}).count(),kind==='safari'?1:0);
   assert.equal(await specimen.getByRole('button',{name:'Forward',exact:true}).count(),kind==='edge'?0:1);
   if(kind!=='edge') assert(await specimen.getByRole('button',{name:'Forward',exact:true}).isDisabled());
   await specimen.screenshot({path:`/tmp/visualkit-${kind}-${appearance}.png`});
 }
 await page.evaluate(()=>{const w=document.querySelector('#window');w.kind='edge';w.interactive=true;w.forwardAvailable=true;});
 await page.locator('#window').getByRole('button',{name:'Forward',exact:true}).click();
 await page.getByText('Chrome action: forward',{exact:true}).waitFor();
 await page.screenshot({path:'/tmp/visual-kit-desktop.png' ,fullPage:false});
 for(const width of [320,375,393,430]){await page.setViewportSize({width,height:900});await page.waitForTimeout(80);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);}
 assert.deepEqual(errors,[]);await page.screenshot({path:'/tmp/visual-kit-phone.png'});
 console.log('VisualKit: all 20 assets, viewport bounds, 00:01 clocks, controls, and four phone widths passed.');
}finally{await browser.close();server.close();}
