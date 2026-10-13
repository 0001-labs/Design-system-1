/** Distribute the one DS1 globe without refreshing unrelated product code. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('..', import.meta.url));
const studio = resolve(root, '..');
const check = process.argv.includes('--check');
const svg = readFileSync(resolve(root, 'DS1/x-icon/globe.svg'), 'utf8').trim();
const paths = [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)];
if (paths.length !== 1 || !svg.includes('viewBox="0 0 16 16"')) throw new Error('Expected the canonical 16-unit globe path');
const d = paths[0][1];
let count = 0;
function put(file, next) {
  const path = resolve(studio, file);
  const previous = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const content = typeof next === 'function' ? next(previous) : next;
  if (previous !== content) {
    if (check) throw new Error(`Globe drift: ${file}. Run vp run icons:sync-globe.`);
    writeFileSync(path, content);
    console.log(`Updated ${file}`);
  }
  count++;
}
function replace(source, pattern, replacement) {
  if (!pattern.test(source)) throw new Error(`Missing globe target: ${pattern}`);
  return source.replace(pattern, replacement);
}

for (const file of [
  'Design system 1/DS1/x-icon/ezo-android-screen-globe.svg',
  'Design system 1/website/public/icons/interface/globe.svg',
  'Design system 1/website/public/icons/library/ezo-android-screen-globe.svg',
  'Link/public/icons/public-globe.svg',
]) put(file, file.includes('/icons/library/') ? svg : svg + '\n');
// Android's SVG loader uses an explicit source colour, then applies its tint.
put('Ezo/android/shared/src/main/resources/screen-icons/Screen-globe.svg', svg.replace('currentColor', '#1E1E1E') + '\n');

for (const base of ['Design system 1/DS1', 'Ezo/client/design', 'Consistency/src/design']) {
  for (const part of ['ds-icon-map', 'icons-extra']) {
    put(`${base}/2-core/generated/${part}.ts`, source => {
      for (const name of ['globe', 'ezo-android-screen-globe']) {
        const pattern = new RegExp(`(^\\s*"${name}":\\s*)("(?:[^"\\\\]|\\\\.)*")`, 'm');
        if (pattern.test(source)) source = source.replace(pattern, (_match, prefix) => prefix + JSON.stringify(svg));
        else if (name === 'globe') throw new Error(`Missing globe in ${base}/${part}`);
      }
      return source;
    });
  }
}
// Keep the source-owned snapshot manifest in step with the two changed maps.
for (const base of ['Consistency/src/design', 'Ezo/client/design']) put(`${base}/components-manifest.json`, source => {
  const manifest = JSON.parse(source);
  for (const part of ['ds-icon-map', 'icons-extra']) {
    const file = `2-core/generated/${part}.ts`;
    if (file in manifest.files) {
      manifest.files[file] = createHash('sha256').update(readFileSync(resolve(studio, base, file))).digest('hex');
    }
  }
  return JSON.stringify(manifest, null, 2) + '\n';
});
put('tau99/src/vendor/design-system.js', source => replace(source, /globe:`<svg[\s\S]*?<\/svg>`/, `globe:\`${svg}\``));

// React adapters keep each product's public props; the geometry is always filled.
for (const [file, defaults, propsType] of [
  ['Consistency/src/icons/Globe.tsx', 'size = 24', 'IconProps'],
  ['Link/client/components/Globe.tsx', 'size = 24', 'Omit<SVGProps<SVGSVGElement>, "stroke"> & { size?: string | number; stroke?: string | number }'],
]) {
  const isConsistency = file.startsWith('Consistency');
  const imports = isConsistency
    ? 'import { forwardRef } from "react";\nimport type { IconProps } from "./createIcon";'
    : 'import { forwardRef, type SVGProps } from "react";';
  put(file, `// Generated from Design system 1/DS1/x-icon/globe.svg by icons:sync-globe.\n${imports}\n\nexport const Globe = forwardRef<SVGSVGElement, ${propsType}>(\n  ({ ${defaults}, color = "currentColor", className, ${isConsistency ? 'absoluteStrokeWidth: _absoluteStrokeWidth, ' : 'stroke: _stroke, '}strokeWidth: _strokeWidth, ...props }, ref) => (\n    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" width={size} height={size} className={${isConsistency ? '["consistency-icon", className].filter(Boolean).join(" ")' : 'className'}} aria-hidden="true" {...props} viewBox="0 0 16 16" fill={color} stroke="none">\n      <path d=${JSON.stringify(d)} />\n    </svg>\n  ),\n);\nGlobe.displayName = "Globe";\n`);
}

// Native paths are a mechanical conversion, never an approximation of the SVG.
const commands = [...d.matchAll(/([MCHVZ])([^MCHVZ]*)/g)];
if (commands.map(m => m[0]).join('') !== d) throw new Error('Unsupported globe path command');
const statements = commands.map(([, command, args]) => {
  const n = args.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const point = (index) => `CGPoint(x: ${n[index]}, y: ${n[index + 1]})`;
  if (command === 'M' && n.length === 2) return `path.move(to: ${point(0)})`;
  if (command === 'C' && n.length === 6) return `path.addCurve(to: ${point(4)}, control1: ${point(0)}, control2: ${point(2)})`;
  if (command === 'H' && n.length === 1) return `path.addLine(to: CGPoint(x: ${n[0]}, y: path.currentPoint!.y))`;
  if (command === 'V' && n.length === 1) return `path.addLine(to: CGPoint(x: path.currentPoint!.x, y: ${n[0]}))`;
  if (command === 'Z' && !n.length) return 'path.closeSubpath()';
  throw new Error(`Unsupported globe command ${command} ${args}`);
});
const marker = '// BEGIN generated DS1 globe';
const native = `${marker}\n// Source: Design system 1/DS1/x-icon/globe.svg; run icons:sync-globe to update.\nprivate func ds1GlobePath() -> Path {\n    var path = Path()\n${statements.map(line => '    ' + line).join('\n')}\n    return path\n}\n// END generated DS1 globe\n`;
for (const file of ['Ezo/ios/Ezo/Views/ScreenPills.swift', 'Link/ios/Link/Views/DirectoryView.swift']) {
  put(file, source => source.includes(marker)
    ? replace(source, /\/\/ BEGIN generated DS1 globe[\s\S]*?\/\/ END generated DS1 globe\n/, native)
    : source.trimEnd() + '\n\n' + native);
}
console.log(`${check ? 'Verified' : 'Synchronized'} ${count} globe consumers.`);
