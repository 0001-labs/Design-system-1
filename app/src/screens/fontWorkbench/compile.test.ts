import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { create, type Font } from 'fontkitten';
import { emptySource } from '../../../../shared/font-source';
import { compileSource } from './compile';
import { oval, rectangle, reverseContour } from './geometry';
import { readReference } from './references';

describe('a drawn face as a font', () => {
  it('writes an OpenType font on the vertical measures it is drawn to', async () => {
    const source = emptySource('Workbench Test');
    source.glyphs.push(
      { unicode: 0x20, advance: 245, contours: [] },
      { unicode: 0x48, advance: 718, contours: [rectangle(80, 0, 170, 710), rectangle(548, 0, 638, 710), rectangle(170, 320, 548, 400)] },
      { unicode: 0x6f, advance: 566, contours: [oval(40, -10, 526, 510), reverseContour(oval(130, 70, 436, 430))] },
    );
    const bytes = new Uint8Array(await compileSource(source));
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('OTTO');
    const font = create(bytes as never) as Font;
    expect(font.unitsPerEm).toBe(1000);
    expect(font.familyName).toBe('Workbench Test');
    expect([font.hhea.ascent, font.hhea.descent]).toEqual([1000, -258]);
    const os2 = font['OS/2'] as unknown as Record<string, number>;
    expect([os2.typoAscender, os2.typoDescender, os2.typoLineGap, os2.winAscent, os2.winDescent, os2.capHeight, os2.xHeight, os2.usWeightClass]).toEqual([785, -215, 258, 1000, 258, 710, 500, 400]);
    expect(font.glyphForCodePoint(0x48).advanceWidth).toBe(718);
    expect(font.glyphForCodePoint(0x20).advanceWidth).toBe(245);
    const o = font.glyphForCodePoint(0x6f);
    expect(o.path.commands.filter(command => command.command === 'bezierCurveTo')).toHaveLength(8);
    expect(Math.round(o.bbox.minY)).toBe(-10);
    expect(font.hasGlyphForCodePoint(0x61)).toBe(false);
  });
  it('gives every figure a tabular copy in one width, which tnum swaps in', async () => {
    const source = emptySource('Workbench Test');
    source.metrics.figureWidth = 620;
    source.glyphs.push(
      { unicode: 0x30, advance: 676, contours: [oval(70, -17, 606, 727), reverseContour(oval(162, 63, 514, 647))] },
      { unicode: 0x31, advance: 354, contours: [rectangle(174, 0, 269, 710)] },
      { unicode: 0x48, advance: 718, contours: [rectangle(80, 0, 170, 710)] },
    );
    const loaded = await import('opentype.js');
    // Under Node the CommonJS build puts the parser on the default export.
    const parse = ('parse' in loaded ? loaded.parse : undefined) ?? loaded.default.parse;
    const font = parse(await compileSource(source));
    for (const script of ['DFLT', 'latn']) {
      const pairs = font.substitution.getSingle('tnum', script, 'dflt');
      expect(pairs.map(pair => font.glyphs.get(pair.sub).name)).toEqual(['uni0030', 'uni0031']);
      expect(pairs.map(pair => font.glyphs.get(pair.by).name)).toEqual(['uni0030.tnum', 'uni0031.tnum']);
      expect(pairs.map(pair => font.glyphs.get(pair.by).advanceWidth)).toEqual([620, 620]);
    }
    // The proportional figures keep their own widths.
    expect(font.glyphs.get(font.charToGlyphIndex('1')).advanceWidth).toBe(354);
    // Without a figure width the widest figure's is used.
    delete source.metrics.figureWidth;
    const widest = parse(await compileSource(source));
    expect(widest.substitution.getSingle('tnum', 'latn', 'dflt').map(pair => widest.glyphs.get(pair.by).advanceWidth)).toEqual([676, 676]);
  });
  it('reads a reference face in the drawing’s units', () => {
    const file = fileURLToPath(new URL('../../../../DS1/1-root/fonts/GT-America-Standard-Regular.woff2', import.meta.url));
    const reference = readReference(new Uint8Array(readFileSync(file)), 1000);
    expect(reference.name).toMatch(/GT America/);
    const h = reference.glyph(0x48)!;
    expect(h.advance).toBe(718);
    expect(h.d).toMatch(/^M/);
    expect(reference.glyph(0x4e00)).toBeNull();
  });
});
