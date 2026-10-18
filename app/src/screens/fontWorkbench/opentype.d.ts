/** The parts of opentype.js 2 the workbench uses to write a preview build; the package ships no types. */
declare module 'opentype.js' {
  export class Path {
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void;
    close(): void;
  }
  export class Glyph {
    constructor(options: { name: string; unicode?: number; advanceWidth: number; path: Path });
  }
  export class Font {
    constructor(options: {
      familyName: string;
      styleName: string;
      unitsPerEm: number;
      ascender: number;
      descender: number;
      weightClass?: number;
      glyphs: Glyph[];
      tables?: { os2?: Record<string, number> };
    });
    toArrayBuffer(): ArrayBuffer;
    substitution: {
      addSingle(feature: string, substitution: { sub: number; by: number }, script?: string, language?: string): void;
      getSingle(feature: string, script?: string, language?: string): { sub: number; by: number }[];
    };
    glyphs: { get(index: number): { name: string; advanceWidth: number } };
    charToGlyphIndex(character: string): number;
  }
  export function parse(buffer: ArrayBuffer): Font;
  const opentype: { Font: typeof Font; Glyph: typeof Glyph; Path: typeof Path; parse: typeof parse };
  export default opentype;
}
