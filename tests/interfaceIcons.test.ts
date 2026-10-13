import { readFileSync, readdirSync } from 'node:fs';
import { expect, test } from 'vite-plus/test';
import icons from '../website/src/lib/icons/interface-catalog.json';
import sources from '../website/src/lib/icons/figma-interface.json';
import additions from '../website/src/lib/icons/figma-additions.json';
import { isSharedInterfaceIcon } from '../website/src/lib/icons/icon-scope';
import { scopedSvg } from '../website/src/lib/icons/svgView';

test('the 69-icon Figma collection is present with its original vector geometry',()=>{
  expect(sources).toHaveLength(69);
  expect(new Set(icons.map(icon=>icon.key)).size).toBe(icons.length);
  for(const source of [...sources, ...additions]){
    const icon=icons.find(icon=>icon.key===source.key)!;
    expect(icon.source).toBe('Figma');
    expect(icon.svg).toBe(readFileSync(new URL('../website/public/icons/interface/'+source.file,import.meta.url),'utf8').trim());
    expect(icon.svg).toMatch(/^<svg[^>]*width="16"[^>]*height="16"/);
    expect(icon.svg).toContain('viewBox="0 0 16 16"');
    expect(icon.shapes).toBeGreaterThan(0);
    expect(icon.svg).not.toContain('#F5F5F5');
    expect(icon.svg).not.toContain('#9747FF');
    expect(icon.svg).not.toMatch(/<(script|image|foreignObject)\b|\bon\w+=|(?:href|src)=/i);
  }
});
test('shared interface icons are discoverable and Ezo artwork is excluded',()=>{
  for(const file of readdirSync(new URL('../DS1/x-icon/',import.meta.url)).filter(file=>file.endsWith('.svg'))){
    expect(icons.some(icon=>icon.key===file.slice(0,-4)),file).toBe(isSharedInterfaceIcon(file.slice(0,-4)));
  }
  for(const icon of icons.filter(icon=>icon.source==='Library'))expect(icon.svg).toContain('viewBox="0 0 16 16"');
});
test('inline copies isolate clip IDs while keeping exact path geometry and source immutable',()=>{
  const svg='<svg><defs><clipPath id="clip"><path d="M0 0L16 16Z"/></clipPath></defs><g id="layer" clip-path="url(#clip)"><path d="M2 3C4 5 6 7 8 9"/></g></svg>';
  const a=scopedSvg(svg,'first');const b=scopedSvg(svg,'second');
  expect(a).toContain('id="first-0"');expect(a).toContain('url(#first-0)');expect(a).toContain('id="first-1"');
  expect(b).not.toContain('first-');expect(svg).toContain('id="clip"');
  expect(a.match(/d="[^"]+"/g)?.filter(v=>v.startsWith('d="M'))).toEqual(svg.match(/d="[^"]+"/g)?.filter(v=>v.startsWith('d="M')));
});
