// Measures Google faces for DS1/0-face/google-face-metrics.json, which face-correction.ts puts on the sixteen.
// `node scripts/face-metrics.mjs` measures every face already listed again; `node scripts/face-metrics.mjs
// "Family" …` adds or measures those. Without a browser's user agent, css2 answers with TrueType files.
import { readFileSync, writeFileSync } from 'node:fs';
import { readFaceMetrics } from '../DS1/0-face/face-correction.ts';

const path = new URL('../DS1/0-face/google-face-metrics.json', import.meta.url);
const metrics = JSON.parse(readFileSync(path, 'utf8'));
const families = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(metrics);

for (const family of families) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400`)).text();
  const url = css.match(/url\((https:[^)]+)\)/)?.[1];
  if (!url) throw new Error(`Google Fonts has no face ${family}`);
  metrics[family] = readFaceMetrics(new Uint8Array(await (await fetch(url)).arrayBuffer()));
  console.log(family, metrics[family]);
}
const sorted = Object.fromEntries(Object.entries(metrics).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(path, `${JSON.stringify(sorted, null, 2)}\n`);
