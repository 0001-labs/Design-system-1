/** Real Peer pointer movement through the hosted editor, with isolated revisioned storage. */
import {readFile,readdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {nativePageFixture} from './native-page-fixture.mjs';
const source=JSON.parse(await readFile('../Other projects/Peer/site/pages.native.json','utf8')).pages['/'];
const cssFile=(await readdir('../Other projects/Peer/dist-site/assets')).find(name=>/^client-.*\.css$/.test(name));
const styles=await readFile('../Other projects/Peer/dist-site/assets/'+cssFile,'utf8');
const fixture=await nativePageFixture({definition:{...source,bindings:{}},styles}),browser=await chromium.launch({headless:true});
const find=(blocks,id)=>{for(const b of blocks){if(b.id===id)return b;if(b.children){const found=find(b.children,id);if(found)return found;}}};
const check=(condition,message)=>{if(!condition)throw Error(message)};
const eventually=async(test,message)=>{const until=Date.now()+5000;while(!await test()){if(Date.now()>until)throw Error(message);await new Promise(done=>setTimeout(done,40));}};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));await fixture.route(page);await page.goto(fixture.url,{waitUntil:'domcontentloaded'});
 const frame=page.frameLocator('.consistency-site-frame');await frame.locator('[data-editor-surface]').waitFor();
 const order=async()=>find((await fixture.read()).document.blocks,'node_78').children.map(b=>b.id);
 const before=await order(),heading=frame.locator('h1'),a=await heading.boundingBox(),b=await frame.locator('[data-native-block="node_81"]').boundingBox();
 // Raw browser input avoids Playwright's HTML5 drag detector executing timers inside a deliberately script-free frame.
 const input=await page.context().newCDPSession(page),from={x:a.x+100,y:a.y+a.height/2},to={x:a.x+100,y:b.y+b.height+12};
 await input.send('Input.dispatchMouseEvent',{type:'mouseMoved',...from});await input.send('Input.dispatchMouseEvent',{type:'mousePressed',...from,button:'left',buttons:1,clickCount:1});
 for(let i=1;i<=12;i++)await input.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:from.x,y:from.y+(to.y-from.y)*i/12,buttons:1});
 await input.send('Input.dispatchMouseEvent',{type:'mouseReleased',...to,button:'left',buttons:0,clickCount:1});await input.detach();
 await eventually(async()=>before.join()!==(await order()).join(),'Peer heading did not move when dragged from its visible words');
 const after=await order();check(after.includes('node_79')&&after.length===before.length,'Drag lost page content');
 await eventually(async()=>await heading.evaluate(el=>[...el.parentElement.children].filter(e=>e.hasAttribute('data-native-block')).map(e=>e.dataset.nativeBlock).join())===after.join(),'Saved placement was not drawn in the canvas');
 await page.reload();await frame.locator('[data-editor-surface]').waitFor();check((await order()).join()===after.join(),'Reopen lost the moved heading');
 await eventually(async()=>await heading.evaluate(el=>[...el.parentElement.children].filter(e=>e.hasAttribute('data-native-block')).map(e=>e.dataset.nativeBlock).join())===after.join(),'Reopened canvas lost placement');
 await heading.click({button:'right',position:{x:100,y:30}});await page.getByRole('menuitem',{name:'Move up',exact:true}).click();await eventually(async()=>(await order()).indexOf('node_79')===after.indexOf('node_79')-1,'Context Move up did not move the heading');
 await heading.click({button:'right',position:{x:100,y:30}});await page.getByRole('menuitem',{name:'Undo',exact:true}).click();await eventually(async()=>(await order()).join()===after.join(),'Undo did not restore moved placement');
 const words=heading.locator('[contenteditable]');await words.click();await words.press(process.platform==='darwin'?'Meta+A':'Control+A');await words.pressSequentially('Movable heading with spaces');await words.press('Tab');await eventually(async()=>find((await fixture.read()).document.blocks,'node_80').text==='Movable heading with spaces','Movement broke plain writing');
 const parentOf=(blocks,id,parent='page')=>{for(const block of blocks){if(block.id===id)return parent;if(block.children){const found=parentOf(block.children,id,block.id);if(found)return found;}}};
 const originalParent=parentOf((await fixture.read()).document.blocks,'node_79');await heading.scrollIntoViewIfNeeded();
 const cross=await page.context().newCDPSession(page),start=await heading.boundingBox(),point={x:start.x+100,y:start.y+start.height/2};
 await cross.send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await cross.send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',buttons:1,clickCount:1});await cross.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y+12,buttons:1});
 const footer=frame.locator('footer[data-native-block]');await footer.scrollIntoViewIfNeeded();const box=await footer.boundingBox(),end={x:box.x+box.width/2,y:box.y+Math.min(60,box.height/2)};
 for(let n=1;n<=10;n++)await cross.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x+(end.x-point.x)*n/10,y:point.y+(end.y-point.y)*n/10,buttons:1});await cross.send('Input.dispatchMouseEvent',{type:'mouseReleased',...end,button:'left',buttons:0,clickCount:1});await cross.detach();
 await eventually(async()=>parentOf((await fixture.read()).document.blocks,'node_79')!==originalParent,'Heading remained locked to its original container');
 const movedParent=parentOf((await fixture.read()).document.blocks,'node_79');await page.reload();await frame.locator('[data-editor-surface]').waitFor();check(parentOf((await fixture.read()).document.blocks,'node_79')===movedParent,'Reopen lost cross-container placement');
 const publicPage=await browser.newPage();await publicPage.goto(fixture.base+'/fixture-public/');check(await publicPage.locator('h1').getAttribute('data-native-block')==='node_79'&&await publicPage.locator('h1').evaluate(el=>el.parentElement.dataset.nativeBlock)===movedParent,'Public renderer lost cross-container placement');await publicPage.close();
 check(!errors.length,errors.join('; '));console.log('Peer: visible-word pointer drag moves between containers, saves/reopens, preserves writing and undo, and matches public placement.');
}finally{await browser.close();await fixture.close();}
