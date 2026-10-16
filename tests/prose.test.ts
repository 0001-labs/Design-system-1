import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';

const css = readFileSync(join(import.meta.dirname, '../DS1/1-root/prose.css'), 'utf8');
const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
/** Each rule's selector list and body, in order. */
const rules = [...code.matchAll(/([^{}@;]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector!.trim().replace(/\s+/g, ' '), body: body! }));
const rule = (element: string) => {
  const found = rules.find(({ selector }) => selector === `[data-ds-prose] :where(${element}):not(:where([data-ds-not-prose] *))`);
  expect(found, element).toBeDefined();
  return found!.body;
};
/** Split a selector list on its top-level commas. */
function selectors(list: string) {
  const parts: string[] = []; let depth = 0, start = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++; else if (list[i] === ')') depth--;
    else if (list[i] === ',' && depth === 0) { parts.push(list.slice(start, i).trim()); start = i + 1; }
  }
  return [...parts, list.slice(start).trim()];
}

test('the prose sheet reaches nothing outside an element marked data-ds-prose', () => {
  expect(rules.length).toBeGreaterThan(10);
  for (const { selector } of rules) for (const part of selectors(selector)) expect(part, part).toMatch(/^\[data-ds-prose\](?:\s|$)/);
});

test('every rule below the container leaves data-ds-not-prose parts alone', () => {
  for (const { selector } of rules.slice(1)) expect(selector, selector).toContain('[data-ds-not-prose] *');
});

test('it imports no fonts and names only the typeface tokens', () => {
  expect([...code.matchAll(/@import\s+([^;]+);/g)].map(match => match[1])).toEqual(['"./component-metrics.css"']);
  expect(code).not.toMatch(/googleapis|@font-face|url\(/);
  for (const [, family] of code.matchAll(/font-family:\s*([^;]+);/g)) expect(family).toMatch(/^var\(--ds-typeface-(?:regular|medium|mono)\)$/);
});

test('every length is a token, a scaled measure or a hairline', () => {
  const lengths = code.match(/-?\d+(?:\.\d+)?(?:px|rem|em|vw|vh)\b/g) ?? [];
  const scaled = [...code.matchAll(/calc\(var\(--[\w-]+, (-?[\d.]+px)\) \* var\(--ds-sf, 1\)\)|calc\((-?[\d.]+px) \* var\(--ds-sf, 1\)\)/g)].map(match => match[1] ?? match[2]);
  const unscaled = [...lengths]; for (const length of scaled) unscaled.splice(unscaled.indexOf(length!), 1);
  expect(unscaled.every(length => ['1px', '-1px', '2px'].includes(length)), unscaled.join(' ')).toBe(true);
  expect(code).not.toMatch(/\d(?:rem|em|vw|vh)\b|clamp\(/);
});

test('text stands on one-square lines, a title on two, with a square between blocks and two before a heading', () => {
  expect(rules[0]!.selector).toBe('[data-ds-prose]');
  expect(rules[0]!.body).toContain('line-height: var(--ds-unit)');
  expect(rule('p, li, dt, dd, td, th, blockquote, summary, figcaption')).toContain('line-height: var(--ds-unit)');
  expect(rule('h1')).toContain('font-size: var(--ds-type-size-display)');
  expect(rule('h1')).toContain('line-height: calc(2 * var(--ds-unit))');
  expect(rules.find(({ selector }) => selector.includes(' + :where(:not('))?.body).toContain('margin-top: var(--ds-unit)');
  expect(rules.find(({ selector }) => selector.includes(' + :where(h1, h2, h3, h4, h5, h6)'))?.body).toContain('margin-top: calc(2 * var(--ds-unit))');
  expect(rule('th, td')).toContain('padding: calc(var(--ds-unit) / 2)');
});

test('it draws headings, paragraphs, lists, links, quotes, code, rules and tables', () => {
  for (const element of ['h1', 'h2', 'h3', 'ul, ol', 'a', 'blockquote', 'pre', 'hr', 'table', 'th, td']) rule(element);
  expect(rule('code, kbd, samp, pre')).toContain('font-family: var(--ds-typeface-mono)');
  expect(rule(':not(pre) > code, kbd, samp')).toContain('border-radius: var(--ds-radius)');
});
