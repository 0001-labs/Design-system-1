import { chromium, webkit } from 'playwright';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { nativePageFixture, nativePicture } from './native-page-fixture.mjs';
const check=(ok,message)=>{if(!ok)throw Error(message);};
const definition={document:{schema:1,kind:'native-page',title:'Device frames',lang:'en',layout:{padding:40,gap:40},blocks:[{id:'work',kind:'component',name:'Carousel',children:[{id:'card',kind:'component',name:'Card',children:[{id:'words',kind:'text',text:'Your balance and budget'},{id:'phone',kind:'component',name:'Phone',children:[{id:'screen',kind:'image',src:nativePicture,alt:'App screen',height:400}]}]}]}]},components:{Carousel:{tag:'ds-carousel',attributes:{'slide-width':'24',bleed:'none'},fields:[]},Card:{tag:'ds-card',attributes:{},fields:[]},Phone:{tag:'ds-device-bezel',attributes:{device:'iphone-17-pro-max-deep-blue','asset-base':'/assets/device/','chrome-assets':'/assets/device/',static:'',network:'wifi'},fields:[]}},images:[nativePicture],bindings:{},collections:{},allowedRuntimes:{}};
for(const engine of [chromium,webkit])for(const omitCanvas of [false,true]){
 const fixture=await nativePageFixture({definition,omitCanvas,styles:'ds-device-bezel{display:block;width:300px}'}),browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),requests=[],errors=[];page.setDefaultTimeout(8000);page.on('pageerror',error=>errors.push(error.message));await fixture.route(page);
  await page.route('**/assets/device/*',async route=>{const url=new URL(route.request().url());requests.push(url.pathname);if(!url.pathname.startsWith('/api/consistency/sites/10VNDG/files/'))return route.fulfill({status:404});const name=url.pathname.split('/').at(-1);if(!['iphone-17-pro-max-deep-blue.png','status-wifi.svg','status-battery.svg'].includes(name))return route.fulfill({status:404});return route.fulfill({body:await readFile(resolve(homedir(),'0001/0001/dist-c9y/assets/device',name)),contentType:name.endsWith('.png')?'image/png':'image/svg+xml'});});
  await page.goto(fixture.url);const frame=page.frameLocator('.consistency-site-frame');await frame.locator('[data-editor-surface]').waitFor();
  const art=frame.locator('ds-device-bezel .art');await art.waitFor();
  check((await art.getAttribute('src')).startsWith('/api/consistency/sites/10VNDG/files/'),'The device frame requests artwork from the editor instead of the site file route');
  await page.waitForFunction(()=>{const doc=document.querySelector('.consistency-site-frame').contentDocument,img=doc.querySelector('ds-device-bezel')?.shadowRoot?.querySelector('.art');return img?.complete&&img.naturalWidth>0;});
  await page.waitForFunction(()=>{const phone=document.querySelector('.consistency-site-frame').contentDocument.querySelector('ds-device-bezel'),chrome=phone?.shadowRoot?.querySelector('ds-app-chrome'),images=[...chrome?.shadowRoot?.querySelectorAll('img')??[]];return images.length>=2&&images.every(image=>image.complete&&image.naturalWidth>0);});
  check(requests.length>0&&requests.every(path=>path.startsWith('/api/consistency/sites/10VNDG/files/')),'Device artwork escaped the authenticated site file route');
  const phone=frame.locator('[data-native-block="phone"]');await phone.click({button:'right',position:{x:10,y:30}});
  for(const name of ['Add writing','Add group','Add section','Ask'])check(await page.getByRole('menuitem',{name,exact:true}).count()===0,`${name} is offered inside a carousel slide`);
  await page.keyboard.press('Escape');await frame.locator('[data-native-block="work"]').dispatchEvent('contextmenu',{button:2,bubbles:true,cancelable:true,clientX:100,clientY:100});
  check(await page.getByRole('menuitem',{name:'Add writing',exact:true}).count()===0,'The carousel itself offers arbitrary writing');
  await page.keyboard.press('Escape');await frame.locator('body').dispatchEvent('contextmenu',{button:2,bubbles:true,cancelable:true,clientX:200,clientY:900});
  check(await page.getByRole('menuitem',{name:'Add writing',exact:true}).count()===1,'Writing outside carousels was disabled');await page.keyboard.press('Escape');
  const unchanged=await page.evaluate(()=>{const controller=document.querySelector('consistency-page-editor').controller,before=JSON.stringify(controller.state.document);controller.add('phone','content');controller.add('work','flow');controller.addSection('hero','card');controller.landAsk({level:'section',intent:'make',block:{id:'new-words',kind:'content',source:'Unwanted'}},'card');return before===JSON.stringify(controller.state.document);});
  check(unchanged,'An insertion command changed a carousel slide');
  await page.reload();await frame.locator('[data-editor-surface]').waitFor();
  await page.waitForFunction(()=>{const doc=document.querySelector('.consistency-site-frame').contentDocument,img=doc.querySelector('ds-device-bezel')?.shadowRoot?.querySelector('.art');return img?.complete&&img.naturalWidth>0;});
  check(fixture.writes.length===0,'Opening device frames or menus changed the page');check(!errors.length,errors.join('; '));
  console.log(`${engine.name()} ${omitCanvas?'URL':'inline'}: Device frames load through site files and carousel insertion stays unavailable`);
 }finally{await browser.close();await fixture.close();}
}
