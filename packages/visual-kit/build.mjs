import { build } from 'esbuild';
import { mkdir, copyFile, readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const here=fileURLToPath(new URL('.',import.meta.url));
const out=resolve(here,'../../website/dist/private-app');
await mkdir(out,{recursive:true});
const bezels=JSON.parse(await readFile(resolve(here,'bezel-imports.json'),'utf8'));
// These originals are intentionally not in Git or the npm package. Missing or changed sources stop publication.
for(const bezel of bezels){
 const filename=bezel.asset.split('/').pop(); const source=resolve(here,'private-assets',filename);
 const bytes=await readFile(source);
 if(createHash('sha256').update(bytes).digest('hex')!==bezel.sha256)throw new Error(`Bezel source differs: ${filename}`);
 await copyFile(source,resolve(out,filename));
}
for(const file of ['status-wifi.svg','status-battery.svg']){await access(resolve(here,'private-assets',file));await copyFile(resolve(here,'private-assets',file),resolve(out,file));}
await build({entryPoints:[resolve(here,'preview.ts')],outfile:resolve(out,'visual-kit.js'),bundle:true,format:'esm',minify:true,loader:{'.css':'text','.svg':'dataurl'},plugins:[{name:'inline-css',setup(b){b.onLoad({filter:/\.css$/,namespace:'inline'},async a=>{const result=await build({entryPoints:[a.path],bundle:true,write:false,loader:{'.svg':'dataurl'}});return {contents:result.outputFiles[0].text,loader:'text'};});b.onLoad({filter:/\.svg$/,namespace:'raw'},async a=>({contents:await readFile(a.path,'utf8'),loader:'text'}));b.onResolve({filter:/\.(css|svg)\?(inline|raw|url)$/},a=>({path:resolve(a.resolveDir,a.path.replace(/\?(inline|raw|url)$/,'')),namespace:a.path.endsWith('?raw')?'raw':a.path.endsWith('?inline')?'inline':'file'}));}}]});
await copyFile(resolve(here,'index.html'),resolve(out,'visual-kit.html'));
console.log(`VisualKit: ${bezels.length} verified bezels in the owner-only preview.`);

await build({entryPoints:[resolve(here,'../../DS1/1-root/one.css')],outfile:resolve(out,'visual-kit.css'),bundle:true,minify:true,loader:{'.woff2':'file','.woff':'file'},assetNames:'[name]-[hash]'});

// Keep third-party notices beside the hosted component bundle as well as copied source.
const resources=resolve(here,'../../website/dist/resources');
await mkdir(resources,{recursive:true});
await copyFile(resolve(here,'../../DS1/5-visual-kit/browser-icons.LICENSE'),resolve(resources,'browser-icons.LICENSE'));
