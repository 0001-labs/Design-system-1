/** Isolated site storage and the actual shared native renderer; no production writes. */
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdtemp, rm, readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { componentFixture } from './component-fixture.mjs';
import syncExports from '../../../sync.exports.mjs';
const assets=fileURLToPath(new URL('../../../website/dist/',import.meta.url)),ds1=fileURLToPath(new URL('../../../',import.meta.url));
const policy="sandbox allow-same-origin; default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' https:; frame-ancestors 'self'; form-action 'none'; base-uri 'none'";
export const nativePicture='/pictures/sample.jpg';
const picture='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#b4c7a8"/><circle cx="200" cy="200" r="120" fill="#e3a687"/></svg>';
/** The `native-content` export as Sync 1 writes it for the platform, from this checkout: the platform's store is bundled against the renderer it will take, not the copy it last took. */
async function freshNativeContent(into){
 const read=rel=>readFileSync(join(ds1,rel));
 const tree=(rel,{only,skip}={})=>{const map=new Map();for(const file of readdirSync(join(ds1,rel),{recursive:true})){const path=String(file).split(sep).join('/');if(only&&!only.test(path)||skip&&skip.test(path)||!statSync(join(ds1,rel,file)).isFile())continue;map.set(path,readFileSync(join(ds1,rel,file)));}return map;};
 for(const[path,content]of Object.entries(await syncExports.exports['native-content'].files({read,tree,options:{}}))){await mkdir(dirname(join(into,path)),{recursive:true});await writeFile(join(into,path),content);}
}
export async function nativePageFixture(options={}){
 const platform=resolve(process.env.C9Y_PLATFORM_ROOT??join(homedir(),'0001/Consistency/platform')),temporary=await mkdtemp(join(tmpdir(),'c9y-native-fixture-')),output=join(temporary,'platform.mjs'),vendor=join(temporary,'consistency-content');
 await freshNativeContent(vendor);
 const freshVendor={name:'fresh-native-content',setup(build){build.onResolve({filter:/vendor\/consistency-content\//},args=>{const name=args.path.split('vendor/consistency-content/')[1];return{path:join(vendor,extname(name)?name:`${name}.ts`)};});}};
 await build({stdin:{contents:`export * from ${JSON.stringify(join(platform,'worker/site-native.ts'))};export {FakeStorage,teamMigrations} from ${JSON.stringify(join(platform,'tests/fakes.ts'))};export {renderNativePage,nativePageStyles} from ${JSON.stringify(join(platform,'vendor/consistency-content/native-page.ts'))};`,resolveDir:platform,loader:'ts'},outfile:output,bundle:true,platform:'node',format:'esm',logLevel:'silent',plugins:[freshVendor],banner:{js:'import {createRequire} from "node:module";const require=createRequire(import.meta.url);'}});
 const engine=await import(pathToFileURL(output)),storage=new engine.FakeStorage();for(const name of (await readdir(join(platform,'vendor/site-engine/migrations'))).filter(name=>name.endsWith('.sql')).sort())storage.sql.exec(await readFile(join(platform,'vendor/site-engine/migrations',name),'utf8'));const store=new engine.NativePageStore(storage);
 const definition={document:{schema:1,kind:'native-page',title:'Flowers and objects',lang:'en',layout:{maxWidth:1200,padding:20,gap:40},blocks:[
  {id:'header',kind:'flow',role:'header',direction:'row',mobileDirection:'row',gap:20,padding:0,children:[{id:'logo',kind:'image',src:nativePicture,alt:'Brand',width:160,height:80,fit:'contain'},{id:'about',kind:'link',href:'/about/',text:'About'}]},
  {id:'intro',kind:'content',source:'# Flowers and objects\n\nCurrent, living catalogue.',binding:'home.title'},
  {id:'products',kind:'collection',binding:'products',layout:'gallery',columns:3,featured:2,columnGap:40,rowGap:60,imageHeight:280,featuredImageHeight:400,mobileImageHeight:180,fit:'contain'},
  {id:'story',kind:'flow',direction:'column',gap:40,mobileGap:20,padding:20,children:[{id:'words',kind:'content',source:'Words below the gallery.'},{id:'picture',kind:'image',src:nativePicture,alt:'Picture',width:400,height:280,mobileHeight:180,fit:'contain'}]},
  {id:'work-images',kind:'grid',columns:2,mobileColumns:2,columnGap:20,rowGap:20,children:[{id:'work-one',kind:'image',src:nativePicture,alt:'Work one',height:500,mobileHeight:280},{id:'work-two',kind:'image',src:nativePicture,alt:'Work two',height:500,mobileHeight:280}]},
  {id:'responsive-outer',kind:'flow',direction:'column',gap:120,mobileGap:60,padding:0,children:[{id:'responsive-inner',kind:'flow',direction:'row',gap:0,padding:0,children:[{id:'nested-words',kind:'content',source:'Nested layout keeps its own zero gap.'}]}]},
  // Sections of the vocabulary: a hero, cards and questions, each one block with its slots and items.
  {id:'top',kind:'hero',height:24,panel:'centre',panelTone:'cream',picture:{src:nativePicture,alt:'The harbour'},title:'A hero over the harbour',text:'Words on the panel.',actions:[{text:'Book',href:'/book/',appearance:'primary'}]},
  {id:'tours',kind:'cards',columns:3,height:12,items:[{label:'1.5 hours',title:'Green raft',text:'For eight.',action:{text:'Book',href:'/book/'}},{label:'3 hours',title:'Sunset',text:'Evening light.'},{label:'Groups',title:'Quiz',text:'Culture and history.'}]},
  {id:'faq',kind:'questions',open:'first',heading:'Questions',items:[{question:'Do I need a licence?',answer:'No.'},{question:'What if it rains?',answer:'The rafts have a roof.'}]},
  {id:'footer',kind:'flow',role:'footer',direction:'row',gap:20,padding:20,children:[{id:'contact',kind:'link',href:'mailto:hello@example.com',text:'Get in touch'},{id:'cart',kind:'runtime',name:'Cart',props:{}}]},
 ]},bindings:{'home.title':{kind:'team-field',path:'/',key:'native-title',fallback:'# Flowers and objects\n\nCurrent, living catalogue.'}},collections:{products:{items:Array.from({length:5},(_,index)=>({id:`product-${index}`,title:`Object ${index+1}`,image:{src:nativePicture,alt:`Object ${index+1}`},price:`${100+index*10} kr.`}))}},allowedRuntimes:{Cart:[]},images:[nativePicture]};
 if(options.definition)Object.assign(definition,options.definition);
 const definitions={'/':definition,'/about/':{...definition,document:{...definition.document,title:'About',blocks:[{id:'back',kind:'link',href:'/',text:'Back home'},{id:'about-text',kind:'content',source:'# About our studio'}]},bindings:{}}};
 const code='10VNDG',workspace='01STDO',origin='https://native-fixture.c9y.site',writes=[],legacy=[],aiRequests=[];let fail=false,held=null,ai=async()=>null;
 const read=async(path='/')=>({...await store.read(path,'native-build',definitions[path]),origin});
 let staleCanvas=Boolean(options.staleCanvasOnce);
 const html=async(path='/',editor=false)=>{const snapshot=await read(path);const base=editor&&staleCanvas?'previous-build':snapshot.base;if(editor)staleCanvas=false;return`<!doctype html><html${editor?` data-c9y-native-base="${base}"`:''}><head><meta charset="utf-8"><style>${engine.nativePageStyles}\n:root{--sf:1}body{margin:0;background:#faf8f4;color:#2b2c27;font:16px/20px Georgia,serif}a{color:inherit}h1,h2,p{margin:0}h1{font-size:40px;line-height:60px}.c9y-native-collection-item{background:#f3eee6}[data-native-block="logo"]{align-self:start}
${options.styles??''}</style></head><body${editor&&snapshot.document.layout.mode==='document'?' data-c9y-native-root':''}>${engine.renderNativePage(snapshot.document,{images:snapshot.images,collections:snapshot.collections,components:snapshot.components,editor,runtime:block=>block.name==='Cart'?'<button type="button">Cart</button>':''})}</body></html>`;};
 const server=createServer(async(request,response)=>{const url=new URL(request.url,'http://localhost');if(url.pathname==='/fixture-public/'){response.setHeader('content-type','text/html; charset=utf-8');response.end(await html(url.searchParams.get('path')??'/'));return;}if(url.pathname.endsWith(nativePicture)){response.setHeader('content-type','image/svg+xml');response.end(picture);return;}const pathname=decodeURIComponent(url.pathname),file=resolve(assets,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));if(!file.startsWith(assets)){response.writeHead(403).end();return;}try{response.setHeader('content-type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'})[extname(file)]??'application/octet-stream');response.end(await componentFixture(file));}catch{response.writeHead(404).end();}});await new Promise(done=>server.listen(0,'127.0.0.1',done));const base=`http://127.0.0.1:${server.address().port}`;
 return{base,url:`${base}/private-consistency/home.html?open=${code}`,read,store,storage,engine,definition,writes,legacy,aiRequests,html,failWrites(value){fail=value;},
  /** Ask's route: the handler takes the request's body and answers `{ status?, json }`; none answers 503, and one that never settles leaves the request hanging. */
  setAI(handler){ai=handler;},holdNextWrite(){let release,entered;const wait=new Promise(resolve=>release=resolve),seen=new Promise(resolve=>entered=resolve);held={wait,entered};return{release,seen};},async route(page){
  await page.route('**/api/consistency/workspaces',route=>route.fulfill({json:{owner:true,workspaces:[{code:workspace,name:'Native studio',role:'owner',plan:'free',sites:1,siteCodes:[code],limits:{sites:2,customDomains:false}}]}}));
  await page.route('**/api/consistency/ai',async route=>{const body=route.request().postDataJSON();aiRequests.push(body);const answer=await ai(body);if(!answer)return route.fulfill({status:503,json:{error:'AI is not configured.'}});return route.fulfill({status:answer.status??200,json:answer.json});});
  await page.route('**/api/consistency/workspaces/*/members',route=>route.fulfill({json:{members:[]}}));await page.route('**/api/consistency/profile',route=>route.fulfill({json:{companyName:'Native studio'}}));await page.route('**/api/consistency/sites',route=>route.fulfill({json:{workspace,sites:[{code,name:'Native site',url:origin+'/',address:new URL(origin).host}]}}));
  await page.route('**/api/consistency/sites/*/**',async route=>{const request=route.request(),url=new URL(request.url()),what=url.pathname.split('/').slice(5).join('/'),path=url.searchParams.get('path')??'/';
   if(what==='places')return route.fulfill({json:{places:[]}});if(what==='pages')return route.fulfill({json:{pages:Object.keys(definitions).map(path=>({path,title:path==='/'?'Home':'About',lang:'en',fields:1,edited:0})),images:[nativePicture]}});
   if(what==='page'||what==='api/composition'){legacy.push(what);return route.fulfill({status:404,json:{error:'unknown-page'}});}
   if(what==='document')return route.fulfill({body:await html(path,true),headers:{'content-type':'text/html; charset=utf-8','content-security-policy':policy}});
   if(what.startsWith('files/'))return route.fulfill({body:picture,contentType:'image/svg+xml'});
   if(what==='api/native-page'){if(request.method()==='GET')return route.fulfill({json:{...await read(path),...(url.searchParams.get('canvas')==='1'?{canvas:await html(path,true)}:{})}});const body=request.postDataJSON();writes.push(structuredClone(body));if(held){const gate=held;held=null;gate.entered();await gate.wait;}if(fail)return route.fulfill({status:503,json:{error:'unavailable'}});try{return route.fulfill({json:await store.save(path,'native-build',definitions[path],body,'owner@example.com',Date.now())});}catch(error){return route.fulfill({status:error.status??500,json:{error:error.message}});}}
   return route.fulfill({status:404,json:{error:'not-found'}});
  });},async close(){await new Promise(done=>server.close(done));storage.sql.db.close();await rm(temporary,{recursive:true,force:true});}};
}
