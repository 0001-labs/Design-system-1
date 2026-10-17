// Writes the palette tokens from DS1/1-root/palette.ts into palette.css, the palette on its own
// (imported by one.css), and into the CLASSless stylesheet (one.semantic.css), between its palette
// markers. Run: vp exec tsx scripts/write-palette-css.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { paletteCss, paletteEnd, paletteSheet, paletteStart } from '../DS1/1-root/palette';

writeFileSync(fileURLToPath(new URL('../DS1/1-root/palette.css', import.meta.url)), paletteSheet());

const file = fileURLToPath(new URL('../DS1/1-root/one.semantic.css', import.meta.url));
const css = readFileSync(file, 'utf8');
const start = css.indexOf(paletteStart);
const end = css.indexOf(paletteEnd);
let next: string;
if (start >= 0 && end > start) next = css.slice(0, start) + paletteCss() + css.slice(end + paletteEnd.length);
else {
  // First run: after the light and dark surface tokens.
  const anchor = '  --one-border: light-dark(#d8d8d5, #555555);\n';
  if (!css.includes(anchor)) throw new Error('Could not find where to put the palette in one.semantic.css');
  next = css.replace(anchor, `${anchor}\n${paletteCss()}\n`);
}
writeFileSync(file, next);
console.log('Palette written to palette.css and one.semantic.css');
