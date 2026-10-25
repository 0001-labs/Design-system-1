import { expect, test } from 'vite-plus/test';
import { baseOverrides, baseSheet, TOKENS_END, TOKENS_START } from '../shared/base-sheet';

const block = (body: string) => `:root { --ds-unit: 20px; }\n\n${TOKENS_START}\n:root {\n${body}\n}\n${TOKENS_END}\n`;

test('the live sheet carries only the final override block', () => {
  const read = baseOverrides(block('  --ds-radius: 4px;\n  --ds-accent-color: #0a6;'));
  expect(read).toEqual({ overrides: [['--ds-radius', '4px'], ['--ds-accent-color', '#0a6']] });
  expect(baseSheet((read as { overrides: [string, string][] }).overrides, 3)).toBe('/* Design system 1 base, version 3 */\n:root {\n  --ds-radius: 4px;\n  --ds-accent-color: #0a6;\n}\n');
  expect(baseOverrides(':root { --ds-unit: 20px; }')).toEqual({ overrides: [] });
  expect(baseSheet([], 1)).toBe('/* Design system 1 base, version 1 */\n:root {\n}\n');
});

test('values that could reach outside a token are refused', () => {
  for (const value of ['url(https://example.com/x.png)', 'red} body{display:none', '@import "x"', 'a\\62', '1px /* c */', 'image-set("a.png" 1x)', '<script>']) {
    expect(baseOverrides(block(`  --ds-radius: ${value};`))).toHaveProperty('error');
  }
  expect(baseOverrides(block('  color: red;'))).toHaveProperty('error');
  expect(baseOverrides(`${TOKENS_START}\n:root { --a: 1px; }`)).toHaveProperty('error');
  expect(baseOverrides(`${TOKENS_START}\nbody { --a: 1px; }\n${TOKENS_END}`)).toHaveProperty('error');
});
