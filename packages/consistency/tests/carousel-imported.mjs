/** The actual 0001 showcase markup, in isolated storage; never writes to the hosted site. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { chromium, webkit } from 'playwright';
import { nativePageFixture } from './native-page-fixture.mjs';
const root=resolve(process.env.C9Y_WEBSITE_ROOT??`${homedir()}/0001/0001`);
const source=JSON.parse(await readFile(resolve(root,'dist-c9y/native/pages.json'),'utf8')).pages['/'];
const find=(blocks,id)=>{for(const block of blocks){if(block.id===id)return block;const child=find(block.children??[],id);if(child)return child;}};
const section=find(source.document.blocks,'node_230'),track=find(section.children,'node_237');
const html=source.shell;
const files=[...html.matchAll(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g)].map(match=>match[1]);
const styles=(await Promise.all(files.map(file=>readFile(resolve(root,'dist-c9y','.'+file),'utf8')))).join('\n');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const until=async(test,message)=>{const end=Date.now()+10000;while(!await test()){if(Date.now()>end)throw Error(message);await new Promise(done=>setTimeout(done,30));}};
for(const engine of [chromium,webkit]){
 const fixture=await nativePageFixture({definition:{...source,document:{...source.document,blocks:[section]},bindings:{}},styles}),browser=await engine.launch({headless:true});
 try{
  const width=1956,page=await browser.newPage({viewport:{width,height:1342}}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.text().startsWith('C9Y constraint'))errors.push(message.text());});
  await fixture.route(page);await page.route('**/api/consistency/sites/*/files/assets/device/*',async route=>{const name=new URL(route.request().url()).pathname.split('/').at(-1);if(!['iphone-17-pro-max-deep-blue.png','status-wifi.svg','status-battery.svg'].includes(name))return route.fulfill({status:404});await route.fulfill({body:await readFile(resolve(root,'dist-c9y/assets/device',name)),contentType:name.endsWith('.png')?'image/png':'image/svg+xml'});});await page.goto(fixture.url);
  const frame=page.frameLocator('.consistency-site-frame');await frame.locator('[data-editor-surface]').waitFor();
  await page.waitForFunction(()=>{const doc=document.querySelector('.consistency-site-frame').contentDocument,img=doc.querySelector('ds-device-bezel')?.shadowRoot?.querySelector('.art');return img?.complete&&img.naturalWidth>0;});
  const ids=track.children.filter(block=>block.kind==='component').map(block=>block.id);
  const order=async()=>find((await fixture.read()).document.blocks,track.id).children.filter(block=>block.kind==='component').map(block=>block.id);
  const first=frame.locator(`[data-native-block="${ids[0]}"]`),second=frame.locator(`[data-native-block="${ids[1]}"]`);
  await first.scrollIntoViewIfNeeded();await first.click({button:'right',position:{x:50,y:50}});for(const name of ['Add writing','Add group','Add section','Ask'])check(await page.getByRole('menuitem',{name,exact:true}).count()===0,`${name} is available inside an imported slide`);await page.keyboard.press('Escape');const a=await first.boundingBox(),b=await second.boundingBox();check(b.x>a.x,'The real showcase is not horizontal: '+JSON.stringify({files,styles:styles.length,a,b,css:await frame.locator('.ds-carousel__track').evaluate(el=>({display:getComputedStyle(el).display,gap:getComputedStyle(el).gap,html:el.outerHTML.slice(0,400)}))}));
  const input=engine===chromium?await page.context().newCDPSession(page):null;
  const pointer=async(type,x,y)=>input?input.send('Input.dispatchMouseEvent',{type,x,y,...(type==='mouseMoved'?{buttons:1}:{button:'left',buttons:type==='mousePressed'?1:0,clickCount:1})}):type==='mousePressed'?page.mouse.down():type==='mouseReleased'?page.mouse.up():page.mouse.move(x,y);
  const x=a.x+Math.min(a.width/2,400),y=a.y+Math.min(a.height/2,300),endY=Math.min(1200,a.y+a.height+80);
  await page.mouse.move(x,y);await pointer('mousePressed',x,y);await pointer('mouseMoved',x+40,y);
  const preview=frame.locator('[data-drag-preview]');check(await preview.getAttribute('data-native-block')===ids[0],'The real showcase did not lift the complete card');
  const lifted=await preview.boundingBox();for(let step=1;step<=10;step++)await pointer('mouseMoved',x+40+step*5,y+(endY-y)*step/10);
  check(Math.abs((await preview.boundingBox()).y-lifted.y)<2,'An imported card moved beneath its row');
  await pointer('mouseReleased',x+90,endY);await until(async()=>!await frame.locator('html').getAttribute('data-drag-active'),'The downward drop did not finish');
  check(JSON.stringify(await order())===JSON.stringify(ids),'A downward drop nested or removed an imported card');
  const endX=Math.min(b.x+b.width-10,width-100);
  await page.mouse.move(x,y);await pointer('mousePressed',x,y);for(let step=1;step<=16;step++)await pointer('mouseMoved',x+(endX-x)*step/16,y);await pointer('mouseReleased',endX,y);await input?.detach();
  const expected=[ids[1],ids[0],...ids.slice(2)];await until(async()=>JSON.stringify(await order())===JSON.stringify(expected),'The imported carousel did not reorder within its row');
  await until(async()=>!await frame.locator('html').getAttribute('data-drag-active'),'The reorder did not finish');
  const cards=frame.locator(`[data-native-block="${track.id}"] > [data-native-block]`);const tops=await cards.evaluateAll(elements=>elements.filter(element=>element.getBoundingClientRect().height>0).map(element=>element.getBoundingClientRect().top));
  check(Math.max(...tops)-Math.min(...tops)<2,'Imported cards stacked after release');
  await page.reload();await frame.locator('[data-editor-surface]').waitFor();check(JSON.stringify(await order())===JSON.stringify(expected),'Reopening lost the imported row');check(!errors.length,errors.join('; '));
  console.log(`${engine.name()}: Imported showcase cards stay in one horizontal row`);
 }finally{await browser.close();await fixture.close();}
}
