import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium, webkit } from 'playwright';
const root=resolve('website/dist'),check=(value,message)=>{if(!value)throw Error(message)};
const server=createServer(async(request,response)=>{
 const path=decodeURIComponent(new URL(request.url,'http://localhost').pathname),file=resolve(root,'.'+(path==='/'?'/editor/index.html':path.endsWith('/')?path+'index.html':path));
 if(!file.startsWith(root+'/'))return response.writeHead(403).end();
 try{response.setHeader('content-type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[extname(file)]??'application/octet-stream');response.end(await readFile(file));}catch{response.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const eventually=async(test)=>{const end=Date.now()+10000;while(!test()){if(Date.now()>end)throw Error('Save did not settle');await new Promise(resolve=>setTimeout(resolve,30));}};
try{for(const engine of [chromium,webkit]){
const browser=await engine.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),drafts=new Map(),errors=[];let reject=false;
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/consistency/sites',route=>route.fulfill({json:{sites:[]}}));
 await page.route('**/api/consistency/pages**',async route=>{
  const request=route.request(),id=new URL(request.url()).pathname.split('/')[4];
  if(request.method()==='PUT'){
   const input=request.postDataJSON(),old=drafts.get(id);
   if(reject||input.revision!==(old?.revision??0))return route.fulfill({status:409,json:{error:'revision-conflict'}});
   const saved={...input,id,revision:input.revision+1,updatedAt:Date.now()};drafts.set(id,saved);return route.fulfill({json:saved});
  }
  return route.fulfill({json:id?drafts.get(id):{pages:[...drafts.values()]}});
 });
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.getByRole('button',{name:'New page',exact:true}).waitFor();
 const shell=await page.evaluate(()=>{
  const nav=document.querySelector('.consistency-editor-nav').getBoundingClientRect(),stage=document.querySelector('.composition-work').getBoundingClientRect();
  return {registered:!!customElements.get('ds-page'),navWidth:nav.width,x:stage.x,y:stage.y,width:stage.width,height:stage.height};
 });
 check(shell.registered&&shell.navWidth===240&&shell.x===300&&shell.y===20&&shell.width===1120&&shell.height===960,`${engine.name()}: editor sidebar and canvas must fill the Page layout: ${JSON.stringify(shell)}`);
 await page.getByRole('button',{name:'New page',exact:true}).click();
 const frame=page.frameLocator('consistency-page-editor iframe');
 await frame.locator('[data-c9y-native-root][data-editor-surface]').waitFor({timeout:15000});
 const first=[...drafts.values()][0];check(first?.document.schema===2,'New lab pages still save the legacy composition');
 check(!('composition'in first.document),'New page stores a second block model');
 const spacing=frame.locator('[data-spacing-key^="sequence_0:gap:"]').first();
 await spacing.press('ArrowUp');
 await page.waitForFunction(()=>document.querySelector('.composition-status')?.textContent==='Saved');
 await page.waitForTimeout(900);
 check([...drafts.values()][0].document.page.blocks[0].gap===40,'Shared spacing did not save');
 await spacing.press('ArrowDown');await eventually(()=>[...drafts.values()][0].document.page.blocks[0].gap===20);
 check([...drafts.values()][0].document.page.blocks[0].gap===20,'Shared spacing did not decrease: '+JSON.stringify({saved:[...drafts.values()][0].document.page.blocks[0].gap,visible:await spacing.getAttribute('aria-valuenow'),status:await page.locator('.composition-status').textContent()}));
 await page.reload();await frame.locator('[data-c9y-native-root][data-editor-surface]').waitFor();
 check(await frame.locator('[data-spacing-key^="sequence_0:gap:"]').first().getAttribute('aria-valuenow')==='20','Spacing did not reopen');
 reject=true;await frame.locator('[data-spacing-key^="sequence_0:gap:"]').first().press('ArrowUp');await page.getByRole('button',{name:'Save a copy',exact:true}).waitFor();
 check([...drafts.values()][0].document.page.blocks[0].gap===20,'Refused edit overwrote saved page');
 reject=false;await page.getByRole('button',{name:'Save a copy',exact:true}).click();await eventually(()=>drafts.size===2);
 check(drafts.size===2&&[...drafts.values()][1].document.page.blocks[0].gap===40,'Save a copy lost the pending canonical document');
 check(!errors.length,errors.join('\n'));console.log('Shared workspace editor: native blocks, spacing both directions, reopen, revision conflict and recovery passed.');
}finally{await browser.close();}
}}finally{server.close();}
