import { expect, test } from 'vite-plus/test';
import { PRODUCTS, copyDrawing, drawingSvg, packIco, readDrawing, fileStem } from '../website/src/lib/icons/studio';
import { FIGMA_ICONS } from '../website/src/lib/icons/gridIconFigma';
import { parseIcon } from '../website/src/lib/icons/gridIcon';

test('all product concepts and the full Ezo collection round-trip without losing geometry or alpha', () => {
  for (const preset of [...PRODUCTS, ...FIGMA_ICONS.map(p => ({...p,radius:0,padding:0}))]) {
    const original = copyDrawing(preset);
    expect(readDrawing(JSON.parse(JSON.stringify(original)))).toEqual(original);
    expect(parseIcon(preset.icon)).not.toBeNull();
    const copy = copyDrawing(preset); copy.icon.cells[0] = -1; copy.icon.inks[0] = '#123456';
    expect(preset.icon.inks[0]).not.toBe('#123456');
  }
  expect(FIGMA_ICONS).toHaveLength(17);
});

test('import rejects executable colour markup, malformed cells and unsafe framing values', () => {
  const valid = copyDrawing(PRODUCTS[0]);
  expect(readDrawing({...valid, icon:{...valid.icon,inks:['red"/><script>alert(1)</script>']}})).toBeNull();
  expect(readDrawing({...valid,icon:{...valid.icon,cells:[0]}})).toBeNull();
  for (const padding of [NaN, Infinity, -1, 5]) expect(readDrawing({...valid,padding})).toBeNull();
  for (const radius of [NaN, Infinity, -1, 9]) expect(readDrawing({...valid,radius})).toBeNull();
});

test('export escapes names and uses unique clips while preserving transparent, padded geometry', () => {
  const value = {...copyDrawing(PRODUCTS.find(preset => preset.key === 'ezo')!),name:'<svg onload="alert(1)">',padding:1,radius:2};
  const exported = drawingSvg(value,32,'test-icon');
  expect(exported).not.toContain('<svg onload=');
  expect(exported).toContain('width="32" height="32"');
  expect(exported).toContain('translate(1 1) scale(0.875)');
  expect(exported).toContain('id="test-icon-clip"');
  expect(exported).toContain('#fec20d40');
  expect(drawingSvg(value,16,'another')).not.toContain('test-icon-clip');
  expect(fileStem('../An icon<script>')).toBe('an-icon-script');
});

test('multi-resolution ICO points to the exact PNG bytes at each size', () => {
  const images=[{size:16,bytes:new Uint8Array([137,80,78,71,1])},{size:256,bytes:new Uint8Array([137,80,78,71,2,3])}];
  const ico=packIco(images);const view=new DataView(ico.buffer);
  expect(view.getUint16(2,true)).toBe(1);expect(view.getUint16(4,true)).toBe(2);
  expect(ico[6]).toBe(16);expect(ico[22]).toBe(0);
  let expectedOffset=38;
  images.forEach((image,index)=>{
    const at=6+index*16;
    expect(view.getUint32(at+12,true)).toBe(expectedOffset);
    expect(view.getUint32(at+8,true)).toBe(image.bytes.length);
    expect(ico.slice(expectedOffset,expectedOffset+image.bytes.length)).toEqual(image.bytes);
    expectedOffset+=image.bytes.length;
  });
  expect(ico.byteLength).toBe(expectedOffset);
  expect(()=>packIco([])).toThrow();
});
