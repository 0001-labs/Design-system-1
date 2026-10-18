/**
 * Reference faces drawn behind a glyph while it is drawn: the face it is
 * measured against, and any face opened from this computer. They are shown,
 * never copied into the drawing, and a file opened here is never uploaded.
 */
import { create, type Font } from 'fontkitten';

export type Reference = {
  name: string;
  /** The reference's outline for a character in the drawing's units, y up, and its width; null when it has none. */
  glyph(unicode: number): { d: string; advance: number } | null;
};

const upright = /^(regular|roman|book|normal|standard)$/i;

export function readReference(bytes: Uint8Array, unitsPerEm: number): Reference {
  const opened = create(bytes as never) as Font | { isCollection: true; fonts: Font[] };
  // A collection (a .ttc, as the Mac keeps its faces) gives its upright face.
  const font: Font = 'fonts' in opened ? opened.fonts.find(face => upright.test(face.subfamilyName)) ?? opened.fonts[0]! : opened;
  const scale = unitsPerEm / font.unitsPerEm;
  const cache = new Map<number, { d: string; advance: number } | null>();
  return {
    name: font.fullName || font.familyName || 'Reference',
    glyph(unicode) {
      if (!cache.has(unicode)) {
        if (!font.hasGlyphForCodePoint(unicode)) cache.set(unicode, null);
        else {
          const glyph = font.glyphForCodePoint(unicode);
          cache.set(unicode, { d: glyph.path.scale(scale, scale).toSVG(), advance: Math.round(glyph.advanceWidth * scale) });
        }
      }
      return cache.get(unicode)!;
    },
  };
}
