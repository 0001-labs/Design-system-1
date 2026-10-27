import { afterAll, beforeAll, expect, test } from 'vite-plus/test';
import { build } from 'esbuild';
import { chromium, webkit, type Browser } from 'playwright';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
const root = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(root,path),'utf8');
const css = (path: string): string => readFileSync(path,'utf8').replace(/@import\s+["']([^"']+)["'];/g, (_, imported) => css(resolve(dirname(path),imported)));
let browsers: Browser[], bundle: string;
beforeAll(async () => {
  browsers = await Promise.all([chromium.launch(),webkit.launch()]);
  bundle = (await build({stdin:{contents:"import './DS1/2-core/ds-tag'; export {inspectConstraints} from './DS1/0-face/constraints';",resolveDir:root,loader:'ts'},bundle:true,format:'iife',globalName:'TagCheck',write:false,plugins:[{name:'inline-styles',setup(build){
    build.onResolve({filter:/\.css\?inline$/}, args => ({path:resolve(args.resolveDir,args.path.replace('?inline','')),namespace:'inline-styles'}));
    build.onLoad({filter:/.*/,namespace:'inline-styles'},args=>({contents:`export default ${JSON.stringify(css(args.path))}`,loader:'js'}));
  }}]})).outputFiles[0]!.text;
});
afterAll(async()=>{await Promise.all(browsers.map(browser=>browser.close()));});

test('tag text clears 4.5:1 across the palette in both themes and row states', async () => {
  const palette = read('DS1/1-root/palette.css');
  const accents = ['', ...new Set([...palette.matchAll(/(--one-[\w-]+):/g)].map(match=>match[1]!))];
  for (const browser of browsers) {
    const page = await browser.newPage();
    try {
      await page.setContent(`<style>${css(join(root,'DS1/1-root/component-tokens.css'))}${palette}body{margin:0}section{color-scheme:light;background:white;color:black;padding:20px}.dark{color-scheme:dark;background:#2a2a2a;color:white}.selected{background:light-dark(#ddd,#444)}ds-tag{margin:4px}</style>`+['light','dark'].map(theme=>`<section class="${theme}">${['normal','selected'].map(state=>`<div class="${state}">${accents.map((accent,i)=>`<ds-tag id="${theme}-${state}-${i}" style="${accent?`--ds-tag-accent:var(${accent})`:''}">Prospect</ds-tag>`).join('')}</div>`).join('')}</section>`).join(''));
      await page.addScriptTag({content:bundle});
      await page.evaluate(async()=>{await customElements.whenDefined('ds-tag');await Promise.all(Array.from(document.querySelectorAll('ds-tag')).map(tag=>(tag as any).updateComplete));});
      const failures = await page.evaluate(()=>(window as any).TagCheck.inspectConstraints(document).filter((finding:any)=>finding.constraint.code==='color.text-contrast').map((finding:any)=>finding.message));
      expect(failures).toEqual([]);
    } finally {await page.close();}
  }
});
