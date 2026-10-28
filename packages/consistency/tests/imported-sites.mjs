/** Compare imported public sites with their existing presentation. Read-only requests; no forms or account writes. */
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const platform=resolve('../Consistency/platform');
const bundle=await build({entryPoints:[resolve(platform,'worker/native-build.ts')],bundle:true,platform:'node',format:'esm',write:false});
const {parseNativeBuild,renderNativeHtml}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const browser=await chromium.launch({headless:true});
try{for(const site of [{id:'consistency',origin:'https://consistency.c9y.site',directory:resolve('../Consistency/site/dist'),paths:['/','/examples/'],selectors:['h1','.c9-panel','.c9-stage','c9-wordmark']},{id:'peer',origin:'https://deep-dew-cream.c9y.site',directory:resolve('../Other projects/Peer/dist-site'),paths:['/','/ja','/about'],selectors:['h1','.peer-site','header','footer']}]){
 const native=parseNativeBuild(JSON.parse(await readFile(resolve(site.directory,'native/pages.json'),'utf8')));
 const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,page=native.pages[path];let body,type;if(page){body=renderNativeHtml(native,page,page.document,{origin:site.origin,path});type='text/html';}else if(path.startsWith('/_c9y/blocks.')){body=await readFile(resolve(platform,'vendor/consistency-content/native-client.'+(path.endsWith('.js')?'js':'css')+'.txt'));type=path.endsWith('.js')?'text/javascript':'text/css';}else{body=await readFile(resolve(site.directory,'.'+path));type=({'.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png'})[extname(path)]??'application/octet-stream';}res.setHeader('Content-Type',type);res.end(body);}catch{res.writeHead(404).end();}});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 try{for(const width of [1280,390])for(const path of site.paths){const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',error=>errors.push(error.message));const geometry=async(url)=>{await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);return page.evaluate(selectors=>selectors.flatMap(selector=>[...document.querySelectorAll(selector)].map((element,index)=>{const r=element.getBoundingClientRect();return{selector,index,x:r.x,y:r.y,w:r.width,h:r.height,text:element.textContent?.replace(/\s+/g,' ').trim()};})),site.selectors);};const before=await geometry(site.origin+path),after=await geometry(`http://127.0.0.1:${server.address().port}${path}`);const bad=after.filter((item,index)=>{const previous=before[index];return!previous||['x','y','w','h'].some(key=>Math.abs(item[key]-previous[key])>1);});if(bad.length||before.length!==after.length){console.log(site.id,path,width,JSON.stringify({before,after},null,2));throw Error('Imported site geometry changed');}if(errors.length)throw Error(errors.join('; '));console.log(`${site.id} ${path} ${width}: shared public blocks preserve layout`);await page.close();}}
 finally{await new Promise(done=>server.close(done));}
}}
finally{await browser.close();}
