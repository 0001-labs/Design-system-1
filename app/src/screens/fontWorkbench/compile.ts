/**
 * Write a drawn face as an OpenType font in the browser, so it can be tried as
 * text and kept as a build. opentype.js loads only when a build is written.
 */
import { glyphName, type FontSource } from '../../../../shared/font-source';
import { segments } from './geometry';

export async function compileSource(source: FontSource): Promise<ArrayBuffer> {
  const { Font, Glyph, Path } = await import('opentype.js');
  const { metrics } = source;
  const glyphs = [new Glyph({ name: '.notdef', advanceWidth: Math.round(metrics.unitsPerEm / 2), path: new Path() })];
  const space = source.glyphs.find(glyph => glyph.unicode === 0x20);
  glyphs.push(new Glyph({ name: 'space', unicode: 0x20, advanceWidth: space?.advance ?? Math.round(metrics.unitsPerEm / 4), path: new Path() }));
  for (const glyph of source.glyphs) {
    if (glyph.unicode === 0x20) continue;
    const path = new Path();
    for (const contour of glyph.contours) {
      const parts = segments(contour);
      if (!parts.length) continue;
      const first = contour[parts[0]!.end]!;
      path.moveTo(first.x, first.y);
      for (const part of [...parts.slice(1), parts[0]!]) {
        const end = contour[part.end]!;
        if (part.controls.length === 2) {
          const a = contour[part.controls[0]!]!, b = contour[part.controls[1]!]!;
          path.curveTo(a.x, a.y, b.x, b.y, end.x, end.y);
        } else if (part !== parts[0]) path.lineTo(end.x, end.y);
      }
      path.close();
    }
    glyphs.push(new Glyph({ name: glyphName(glyph.unicode), unicode: glyph.unicode, advanceWidth: glyph.advance, path }));
  }
  const font = new Font({
    familyName: source.family,
    styleName: source.style,
    unitsPerEm: metrics.unitsPerEm,
    // hhea: the line box a browser builds, as the face this one replaces has it.
    ascender: metrics.lineAscent,
    descender: metrics.lineDescent,
    weightClass: source.weight,
    glyphs,
    tables: {
      os2: {
        sTypoAscender: metrics.ascender,
        sTypoDescender: metrics.descender,
        sTypoLineGap: metrics.lineAscent - metrics.lineDescent - (metrics.ascender - metrics.descender),
        usWinAscent: metrics.lineAscent,
        usWinDescent: -metrics.lineDescent,
        sxHeight: metrics.xHeight,
        sCapHeight: metrics.capHeight,
      },
    },
  });
  return font.toArrayBuffer();
}
