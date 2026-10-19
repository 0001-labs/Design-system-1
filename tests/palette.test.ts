import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vite-plus/test';
import { palette, paletteSheet } from '../DS1/1-root/palette';

describe('Palette', () => {
  test('palette.css is the palette on its own, as written from palette.ts, and one.css imports it', () => {
    const sheet = readFileSync(new URL('../DS1/1-root/palette.css', import.meta.url), 'utf8');
    expect(sheet).toBe(paletteSheet());
    for (const token of ['--one-comfortable-green', '--one-hysteric-blue', '--one-purple', '--one-drip-yellow', '--one-zenith-blue']) expect(sheet).toContain(`${token}: `);
    expect(sheet.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/@import|url\(|\.[a-z][\w-]*\s*{/);
    expect(readFileSync(new URL('../DS1/1-root/one.css', import.meta.url), 'utf8')).toMatch(/^@import "\.\/palette\.css";$/m);
  });
  test('derives Apple green\'s dark version as the Figma file does', () => {
    expect(palette().find(c => c.name === 'Apple green')?.dark).toBe('#529d36');
  });
  test('keeps the named pastels', () => {
    expect(palette().find(c => c.name === 'Sharp blue')?.pastel).toBe('#ccccff');
    expect(palette().find(c => c.name === 'Chartreuse')?.pastel).toBe('#f2ffcf');
  });
});
