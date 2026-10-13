import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, test } from 'vite-plus/test';
import sources from '../DS1/x-icon/product-sources.json';
import { iconNameToSvgMap } from '../DS1/2-core/generated/ds-icon-map';
import catalog from '../website/src/lib/icons/interface-catalog.json';

test('every inventoried product drawing survives in the runtime and public collection', () => {
  for (const source of sources) {
    const svg = readFileSync(new URL(`../DS1/x-icon/${source.name}.svg`, import.meta.url), 'utf8');
    expect(createHash('sha256').update(svg).digest('hex'), source.source).toBe(source.iconHash);
    expect(iconNameToSvgMap[source.name], source.source).toBe(svg.trim());
    expect(catalog.some(icon => icon.key === source.name), source.source).toBe(true);
  }
  expect(sources.some(source => source.product === 'Aa')).toBe(true);
  expect(sources.some(source => source.source.includes('#3d:'))).toBe(true);
  expect(sources.some(source => source.source.includes('screen-icons/'))).toBe(true);
});

test('globe is continuous curve geometry and Duplicate uses the reference command-D drawing', () => {
  const globe = iconNameToSvgMap.globe;
  expect(globe.match(/<path\b/g)).toHaveLength(1);
  expect(globe).toContain('C');
  expect(globe).not.toContain('stroke-width');
  const reference = readFileSync(new URL('../website/public/icons/interface/duplicate.svg', import.meta.url), 'utf8');
  const paths = (svg: string) => [...svg.matchAll(/\bd="([^"]+)"/g)].map(match => match[1]);
  expect(paths(iconNameToSvgMap.duplicate)).toEqual(paths(reference));
});
