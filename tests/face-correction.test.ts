import { expect, test } from 'vite-plus/test';
import { correctFaces, faceCorrection, faceDescriptors, readFaceMetrics, type FaceMetrics } from '../DS1/0-face/face-correction';
import metrics from '../DS1/0-face/google-face-metrics.json';
import { GOOGLE_FONT_FAMILIES } from '../packages/consistency/src/fonts';

/** Where a 14px line of the corrected face puts its baseline down a 16px line box, and how tall its capitals are. */
const setting = (face: FaceMetrics) => {
  const { sizeAdjust, ascentOverride, descentOverride } = faceDescriptors(face);
  const size = parseFloat(sizeAdjust) / 100;
  const ascent = (parseFloat(ascentOverride) / 100) * size, descent = (parseFloat(descentOverride) / 100) * size;
  return { baseline: 8 + 7 * (ascent - descent), capitals: 14 * face.capHeight * size };
};

test('GT America is left as it is drawn', () => {
  expect(faceDescriptors({ ascent: 1, descent: 0.258, capHeight: 0.71 })).toEqual({ sizeAdjust: '100%', ascentOverride: '100%', descentOverride: '25.8%', lineGapOverride: '0%' });
});

test('every face offered stands on the sixteen: baseline 13.2px down the line, 3px above the square, capitals 10px', () => {
  expect(Object.keys(metrics).sort()).toEqual([...GOOGLE_FONT_FAMILIES].sort());
  for (const face of Object.values(metrics)) {
    const { baseline, capitals } = setting(face);
    expect(baseline).toBeCloseTo(13.194, 2);
    expect(capitals).toBeCloseTo(9.94, 2);
  }
});

test('a face shorter than the sixteen never gets a negative descent', () => {
  expect(faceDescriptors({ ascent: 0.6, descent: 0.1, capHeight: 0.71 }).descentOverride).toBe('0%');
});

test('a css2 stylesheet comes back with each face corrected in its own rule', () => {
  const css = `/* latin */\n@font-face {\n  font-family: 'Lora';\n  font-style: normal;\n  font-weight: 400;\n  src: url(https://fonts.gstatic.com/s/lora/v1/a.woff2) format('woff2');\n  unicode-range: U+0000-00FF, U+0131;\n}\n`;
  expect(correctFaces(css, metrics)).toBe(`@font-face{font-family:'Lora';font-style:normal;font-weight:400;src:url(https://fonts.gstatic.com/s/lora/v1/a.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131;${faceCorrection(metrics.Lora)}}`);
  expect(() => correctFaces(css.replace('Lora', 'Comic Neue'), metrics)).toThrow('No metrics for the face Comic Neue');
});

test('metrics come from hhea, or OS/2 when the face asks, over the em', () => {
  const face = (typo: boolean) => {
    const bytes = new Uint8Array(12 + 3 * 16 + 54 + 36 + 96);
    const view = new DataView(bytes.buffer);
    view.setUint16(4, 3);
    const tables: [string, number][] = [['head', 60], ['hhea', 114], ['OS/2', 150]];
    tables.forEach(([tag, at], i) => { for (let j = 0; j < 4; j++) bytes[12 + i * 16 + j] = tag.charCodeAt(j); view.setUint32(12 + i * 16 + 8, at); });
    view.setUint16(60 + 18, 1000);
    view.setInt16(114 + 4, 900); view.setInt16(114 + 6, -300);
    view.setUint16(150, 4); view.setUint16(150 + 62, typo ? 0x80 : 0); view.setInt16(150 + 68, 800); view.setInt16(150 + 70, -200); view.setInt16(150 + 88, 700);
    return bytes;
  };
  expect(readFaceMetrics(face(false))).toEqual({ ascent: 0.9, descent: 0.3, capHeight: 0.7 });
  expect(readFaceMetrics(face(true))).toEqual({ ascent: 0.8, descent: 0.2, capHeight: 0.7 });
});
