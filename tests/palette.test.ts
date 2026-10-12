import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vite-plus/test';
import { palette, paletteCss } from '../DS1/1-root/palette';

describe('Palette', () => {
  test('the CLASSless stylesheet carries the palette as written from palette.ts', () => {
    const css = readFileSync(new URL('../DS1/1-root/one.semantic.css', import.meta.url), 'utf8');
    expect(css).toContain(paletteCss());
  });
  test('derives Apple green\'s dark version as the Figma file does', () => {
    expect(palette().find(c => c.name === 'Apple green')?.dark).toBe('#529d36');
  });
  test('keeps the named pastels', () => {
    expect(palette().find(c => c.name === 'Sharp blue')?.pastel).toBe('#ccccff');
    expect(palette().find(c => c.name === 'Chartreuse')?.pastel).toBe('#f2ffcf');
  });
});
