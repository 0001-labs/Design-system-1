import { chromium, webkit } from 'playwright';
import { nativePageFixture } from './native-page-fixture.mjs';
const check=(value,message)=>{if(!value)throw Error(message);};
const eventually=async(test,message)=>{const end=Date.now()+10000;while(!await test()){if(Date.now()>end)throw Error(message);await new Promise(done=>setTimeout(done,30));}};
const definition={document:{schema:1,kind:'native-page',title:'Controls',lang:'en',layout:{padding:40,gap:40},blocks:[
 {id:'plain',kind:'link',text:'About',href:'/about/'},
 {id:'button',kind:'component',name:'button',values:{href:'/about/',text:'Visit studio'},children:[]},
 {id:'imported',kind:'component',name:'anchor',values:{href:'/about/'},children:[{id:'anchor-words',kind:'text',text:'Imported link'}]},
 {id:'icon',kind:'component',name:'icon',values:{label:'Icon action'},children:[]},
 {id:'words',kind:'content',source:'Ordinary writing stays directly editable.\n\n[Inline link](/about/)'}
 ]},components:{icon:{tag:'ds-button',attributes:{icon:'',style:'width:20px;height:20px'},fields:['label']},button:{tag:'ds-button',attributes:{},fields:['href','text','label']},anchor:{tag:'a',attributes:{},fields:['href']}},bindings:{},collections:{},allowedRuntimes:{},images:[]};
const fixture=await nativePageFixture({definition}),browser=await (process.env.C9Y_BROWSER==='webkit'?webkit:chromium).launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(8000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await fixture.route(page);await page.goto(fixture.url);
 const frame=page.frameLocator('.consistency-site-frame');
 await frame.locator('[data-editor-surface]').waitFor();
 const edit=page.getByRole('button',{name:'Edit',exact:true});
 for(const id of ['plain','button','imported','icon']){
  const target=frame.locator(`[data-native-block="${id}"]${id==='plain'?' a':''}`);await target.hover();
  await edit.waitFor({state:'visible'});
  await eventually(async()=>{const a=await target.boundingBox(),b=await edit.boundingBox();return a&&b&&Math.abs(a.x+a.width/2-b.x-b.width/2)<1&&b.y+b.height<=a.y;},'Edit is not centred above its control');
  if(id==='imported'){const style=await target.getAttribute('style');await target.evaluate(element=>{element.style.display='inline-block';element.style.width='240px';});await eventually(async()=>{const a=await target.boundingBox(),b=await edit.boundingBox();return Math.abs(a.x+a.width/2-b.x-b.width/2)<1&&b.y+b.height<=a.y;},'Edit lost its centred position after the link resized');await target.evaluate((element,style)=>style===null?element.removeAttribute('style'):element.setAttribute('style',style),style);}
  if(id==='plain')await page.screenshot({path:'/tmp/c9y-hover-edit.png'});
 }
 // Labels are ordinary links until their own hover action is chosen.
 for(const id of ['plain','button','imported']){
  await frame.locator(`[data-native-block="${id}"]${id==='plain'?' a':''}`).click();
  await frame.locator('[data-native-block="about-text"]').waitFor();
  check(fixture.writes.length===0,'Following a link changed its words');
  await frame.locator('[data-native-block="back"] a').click();
  await frame.locator('[data-native-block="button"]').waitFor();
 }
 await frame.getByRole('link',{name:'Inline link',exact:true}).click();
 await frame.locator('[data-native-block="about-text"]').waitFor();
 await frame.locator('[data-native-block="back"] a').click();
 const plain=frame.locator('[data-native-block="plain"] a');
 await plain.hover();await edit.click();
 await page.keyboard.press(process.platform==='darwin'?'Meta+A':'Control+A');await page.keyboard.type('About edited');await page.keyboard.press('Escape');
 await frame.getByRole('link',{name:'About edited',exact:true}).click();
 await frame.locator('[data-native-block="about-text"]').waitFor();await frame.locator('[data-native-block="back"] a').click();
 const imported=frame.locator('[data-native-block="imported"]');
 await imported.hover();await edit.click();
 const input=imported.locator('[contenteditable="plaintext-only"]');await input.waitFor();
 await input.press(process.platform==='darwin'?'Meta+A':'Control+A');await page.keyboard.type('Changed link');
 await frame.locator('[data-native-block="words"]').click();
 await eventually(async()=>JSON.stringify((await fixture.read()).document).includes('Changed link'),'Hover editing did not save');
 await imported.click();await frame.locator('[data-native-block="about-text"]').waitFor();
 await frame.locator('[data-native-block="back"] a').click();
 check((await imported.textContent()).includes('Changed link'),'Navigation lost the edited label');
 // The DS1 shadow label uses the same explicit action and can be entered by keyboard.
 const button=frame.locator('[data-native-block="button"]');if(process.env.C9Y_BROWSER==='webkit'){await button.hover();await edit.click();}else{await button.locator('a').focus();await page.keyboard.press('F2');}
 const buttonWords=button.locator('[contenteditable="plaintext-only"]');await buttonWords.waitFor();
 await buttonWords.press(process.platform==='darwin'?'Meta+A':'Control+A');await page.keyboard.type('Changed button');
 await page.keyboard.press('Escape');
 await eventually(async()=>JSON.stringify((await fixture.read()).document).includes('Changed button'),'DS1 shadow label did not save');
 await button.click();await frame.locator('[data-native-block="about-text"]').waitFor();
 check(errors.length===0,errors.join('\n'));
 console.log('Hover Edit works for native links, imported links and DS1 buttons; normal clicks navigate, and edited labels save.');
}finally{await browser.close();await fixture.close();}
