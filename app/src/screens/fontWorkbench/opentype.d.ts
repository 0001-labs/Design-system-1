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
  }
}
