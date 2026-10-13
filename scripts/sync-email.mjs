import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(process.cwd(), 'shared/design-system-1/email.ts');
const fontTarget = resolve(process.cwd(), 'public/fonts/GT-America-Standard-Regular.woff2');
const source = resolve(root, 'DS1/4-page/email.ts');
const font = resolve(root, 'DS1/1-root/fonts/GT-America-Standard-Regular.woff2');
if (process.argv.includes('--check')) {
  for (const [from, to] of [[source, target], [font, fontTarget]]) {
    if (!(await readFile(from)).equals(await readFile(to))) throw new Error(`Email copy differs: ${to}`);
  }
  console.log('Email design and font match Design system 1.');
} else {
  for (const [from, to] of [[source, target], [font, fontTarget]]) {
    await mkdir(dirname(to), { recursive: true });
    await copyFile(from, to);
  }
  console.log('Copied the email design and font from Design system 1.');
}
