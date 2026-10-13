import { readFile, readdir, writeFile, mkdir, rm } from 'node:fs/promises';
import figma from '../website/src/lib/icons/figma-interface.json';
import additions from '../website/src/lib/icons/figma-additions.json';
import { isSharedInterfaceIcon, sharedIconName } from '../website/src/lib/icons/icon-scope';
const root = new URL('../', import.meta.url);
const sourceDir = new URL('DS1/x-icon/', root);
const publicDir = new URL('website/public/icons/', root);
await mkdir(new URL('library/', publicDir), { recursive: true });
const catalog: { key: string; name: string; source: string; node?: string; svg: string; url: string; shapes: number }[] = [];
function check(svg: string, name: string) {
  if (!/<svg\b/.test(svg) || !/viewBox="0 0 16 16"/.test(svg)) throw new Error(`${name}: expected a 16 × 16 SVG`);
  if (/<(?:script|foreignObject|image|iframe)\b|\bon[a-z]+\s*=|(?:href|src)\s*=/i.test(svg)) throw new Error(`${name}: only self-contained SVG geometry is supported`);
}
for (const icon of [...figma, ...additions]) {
  if (!isSharedInterfaceIcon(icon.key)) continue;
  const svg = (await readFile(new URL('interface/' + icon.file, publicDir), 'utf8')).trim(); check(svg, icon.name);
  catalog.push({ key:icon.key,name:sharedIconName(icon.key),source:'Figma',node:icon.node,svg,url:'/icons/interface/'+icon.file,shapes:(svg.replace(/<defs\b[^>]*>[\s\S]*?<\/defs>/g,'').match(/<(?:path|circle|ellipse|rect|line|polyline|polygon)\b/g)||[]).length });
}
for (const file of (await readdir(sourceDir)).filter(file => file.endsWith('.svg')).sort()) {
  const key = file.slice(0,-4);
  if (!isSharedInterfaceIcon(key)) {
    await rm(new URL('library/'+file,publicDir), { force: true });
    continue;
  }
  if (catalog.some(icon => icon.key === key)) continue;
  const original = (await readFile(new URL(file,sourceDir),'utf8')).trim();
  const bounds = original.match(/viewBox="([\d. -]+)"/)?.[1].split(/\s+/).map(Number);
  if (!bounds || bounds.length !== 4 || bounds[0] !== 0 || bounds[1] !== 0 || bounds[2] <= 0 || bounds[3] <= 0) throw new Error(`${key}: invalid SVG bounds`);
  const [,,width,height] = bounds;
  const scale = Math.min(1,16/Math.max(width,height));
  const svg = width === 16 && height === 16 ? original : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g transform="translate(${(16-width*scale)/2} ${(16-height*scale)/2}) scale(${scale})">${original}</g></svg>`;
  check(svg,key);
  await writeFile(new URL('library/'+file,publicDir),svg);
  catalog.push({key,name:sharedIconName(key),source:'Library',svg,url:'/icons/library/'+file,shapes:(svg.replace(/<defs\b[^>]*>[\s\S]*?<\/defs>/g,'').match(/<(?:path|circle|ellipse|rect|line|polyline|polygon)\b/g)||[]).length});
}
catalog.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
await writeFile(new URL('website/src/lib/icons/interface-catalog.json',root),JSON.stringify(catalog,null,2)+'\n');
await writeFile(new URL('catalog.json',publicDir),JSON.stringify(catalog.map(({svg,...icon})=>icon),null,2)+'\n');
console.log(`Built SVG library: ${figma.length + additions.length} Figma icons, ${catalog.length-figma.length-additions.length} additions.`);
