import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('website/dist'),templates=JSON.parse(await readFile('shared/consistency-template-pages.json','utf8'));
const server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(root+'/'))return res.writeHead(403).end();try{res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true});
const baseline=JSON.parse(await readFile('packages/consistency/tests/template-geometry.json','utf8'));
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>{errors.push(error.message);console.error(error.stack)});
 await page.route('**/api/consistency/pages',route=>route.fulfill({json:{pages:[]}}));await page.route('**/api/consistency/sites',route=>route.fulfill({json:{sites:[]}}));
 await page.goto(`http://127.0.0.1:${server.address().port}/editor/`);
 for(const width of [1120,390])for(const[id,template]of Object.entries(templates).filter(([id])=>id!=='studio')){
  if(process.env.TEMPLATE_ONLY&&process.env.TEMPLATE_ONLY!==id)continue;
  const key=`${id}:${width}`;
  const geometry=await page.evaluate(async({id,template,width})=>{
   document.querySelector('#migration-check')?.remove();const stage=document.createElement('div');stage.id='migration-check';Object.assign(stage.style,{position:'fixed',inset:'0',background:'white',zIndex:'999',width:width+'px',height:'900px'});document.body.append(stage);
   const host=document.createElement('consistency-workspace-page');host.loadDocument({schema:2,kind:'page',example:id,library:'original',fonts:{},page:template.document});
   Object.assign(host.style,{display:'block',width:'100%',height:'100%'});const ready=new Promise(resolve=>host.addEventListener('page-ready',resolve,{once:true}));stage.append(host);await ready;
   const frame=host.querySelector('iframe');await frame.contentDocument.fonts.ready;await new Promise(resolve=>setTimeout(resolve,100));
   const doc=frame.contentDocument;const words=[];const read=(node,active=false)=>{if(node.nodeType===3){if(active&&node.textContent?.trim()&&!node.textContent.startsWith('Press space to lift.'))words.push(node.textContent);return;}if(node.nodeType!==1&&node.nodeType!==11)return;if(node.nodeType===1&&node.matches('style,script,svg,[data-editor-chrome],[id^="0001-drag-"]'))return;active=active||node.nodeType===1&&node.hasAttribute('data-template-node');for(const child of node.childNodes)read(child,active);if(node.shadowRoot)read(node.shadowRoot,active);};read(doc.body);return{width:frame.clientWidth,rects:[...doc.querySelectorAll('[data-template-node]')].filter(element=>!element.closest('svg,style')).map(element=>{const r=element.getBoundingClientRect();return{id:element.dataset.templateNode,inline:doc.defaultView.getComputedStyle(element).display==='inline',x:r.x,y:r.y,w:r.width,h:r.height}}),text:words.join(' ').replace(/\s+/g,' ').trim()};
  },{id,template,width});
   // Editable inline ranges include caret whitespace at line ends; verify their position and line count, and exact widths of layout boxes.
   const previous=baseline[key];if(geometry.rects.length!==previous.rects.length)throw Error(`${key}: imported component count changed`);const bad=geometry.rects.filter(rect=>{const before=previous.rects.find(item=>item.id===rect.id);return!before||['x','y','w','h'].some(field=>!(field==='w'&&rect.inline)&&Math.abs(before[field]-rect[field])>1)});
   if(bad.length){console.log('DIFFERENCES',key,bad.slice(0,8).map(rect=>({now:rect,before:previous.rects.find(item=>item.id===rect.id)})));throw Error(`${key}: ${bad.length} component rectangles changed`)}
   if(geometry.text.replace(/(?:^| )\?(?= |$)/g,'')!==previous.text.replace(/(?:^| )\?(?= |$)/g,'')){const at=[...previous.text].findIndex((char,index)=>char!==geometry.text[index]);console.log('TEXT',key,at,previous.text.slice(Math.max(0,at-60),at+160),geometry.text.slice(Math.max(0,at-60),at+160));throw Error(`${key}: rendered words changed`)}
   if(errors.length)throw Error(errors.join('\n'));
  console.log(`${key}: content and design preserved through shared blocks`);
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
