import { readCustomProperty, rootBlockRange } from './cssText';
const start = '/* ds1:tokens:start */';
const end = '/* ds1:tokens:end */';
function overrides(css: string) {
  const from = css.lastIndexOf(start);
  const to = from < 0 ? -1 : css.indexOf(end, from);
  return from < 0 || to < 0 ? null : { from, to: to + end.length, css: css.slice(from + start.length, to) };
}
/** Read the last ordinary root declaration; conditional rules remain independent. */
export function readLibraryToken(css: string, name: string): string | undefined {
  let remaining = css; let value: string | undefined;
  while (remaining) {
    const root = rootBlockRange(remaining); if (!root) break;
    const found = readCustomProperty(remaining.slice(root.start - 1, root.end + 1), name);
    if (found !== undefined) value = found;
    remaining = remaining.slice(root.end + 1);
  }
  return value;
}
/** Keep an explicit final override block so defaults and conditional CSS are never rewritten. */
export function setLibraryToken(css: string, name: string, value: string): string {
  if (!/^--[a-zA-Z0-9_-]+$/.test(name) || /[;{}]/.test(value)) return css;
  const section = overrides(css);
  const values = new Map<string, string>();
  for (const match of (section?.css ?? '').matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;]*);/g)) values.set(match[1]!, match[2]!.trim());
  if (value.trim()) values.set(name, value.trim()); else values.delete(name);
  const base = section ? css.slice(0, section.from) + css.slice(section.to) : css;
  if (!values.size) return base;
  return `${base.trimEnd()}\n\n${start}\n:root {\n${[...values].map(([key, text]) => `  ${key}: ${text};`).join('\n')}\n}\n${end}\n`;
}
