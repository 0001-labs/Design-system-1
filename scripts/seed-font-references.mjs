/** Seed only the three existing reference faces; private handwriting builds are uploaded through the owner workspace. */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const references = [
  ['olivetti', 'website/src/assets/fonts/OlivettiDot-Regular.woff2'],
  ['america', 'DS1/1-root/fonts/GT-America-Standard-Regular.woff2'],
  ['iosevka', 'DS1/1-root/fonts/Iosevka-Regular.woff2'],
];
for (const [name, source] of references) {
  execFileSync('vp', ['exec', 'wrangler', 'r2', 'object', 'put', `ds-one-libraries/fonts/reference/${name}.woff2`, '--file', `${root}${source}`, '--remote', '--config', '../wrangler.jsonc'], { cwd: `${root}services`, stdio: 'inherit' });
}
