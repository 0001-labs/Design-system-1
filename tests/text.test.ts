// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vite-plus/test';

vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
const { loadTranslations, setLanguage } = await import('../DS1/0-face/i18n');
await import('../DS1/2-core/ds-text');

const css = readFileSync(join(import.meta.dirname, '../DS1/2-core/styles/ds-text.css'), 'utf8');
const rule = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf('}', start));
};

afterEach(() => document.body.replaceChildren());

test('tone, size, strength and wrapping are not limited to literal text', () => {
  for (const selector of [':host([strong])', ':host([wrap])', ':host([tone="muted"])', ':host([tone="title"])', ':host([tone="danger"])', ':host([tone="warning"])', ':host([size="small"])', ':host([size="heading"])', ':host([size="display"])']) rule(selector);
  expect(css).not.toMatch(/:host\(\[literal\]\[(?:tone|size|strong|wrap)/);
  // The modifiers follow the literal rule at the same specificity, so they win.
  expect(css.indexOf(':host([literal]) {')).toBeLessThan(css.indexOf(':host([strong]) {'));
  expect(rule(':host')).toContain('color: var(--ds-text-tone, inherit)');
});

test('the danger tone, wrapped lines and a display title are on the grid', () => {
  expect(rule(':host([tone="danger"])')).toContain('var(--ds-danger-color)');
  expect(rule(':host([tone="warning"])')).toContain('var(--ds-warning-color)');
  expect(rule(':host([wrap])')).toContain('line-height: var(--ds-unit)');
  expect(rule(':host([wrap])')).toContain('white-space: normal');
  expect(rule(':host([size="display"])')).toContain('font-size: var(--ds-type-size-display)');
  expect(rule(':host([size="display"])')).toContain('line-height: calc(2 * var(--ds-unit))');
});

test('a translation key keeps its tone, size, strength and wrapping, and follows the language', async () => {
  loadTranslations('da', { 'Could not save': 'Kunne ikke gemme' });
  setLanguage('en');
  const text = document.createElement('ds-text');
  text.textContent = 'Could not save';
  for (const [name, value] of [['tone', 'danger'], ['size', 'heading'], ['strong', ''], ['wrap', ''], ['role', 'alert']]) text.setAttribute(name!, value!);
  document.body.append(text);
  await text.updateComplete;
  expect(text.literal).toBe(false);
  expect([text.tone, text.size, text.strong, text.wrap]).toEqual(['danger', 'heading', true, true]);
  expect(text.shadowRoot!.textContent).toContain('Could not save');
  setLanguage('da');
  await text.updateComplete;
  expect(text.shadowRoot!.textContent).toContain('Kunne ikke gemme');
  expect(text.getAttribute('tone')).toBe('danger');
  expect(text.getAttribute('role')).toBe('alert');
  setLanguage('en');
});

test('a heading keeps its role and level', async () => {
  const text = document.createElement('ds-text');
  text.setAttribute('role', 'heading');
  text.setAttribute('aria-level', '2');
  text.size = 'display';
  text.text = 'Settings';
  document.body.append(text);
  await text.updateComplete;
  expect(text.getAttribute('role')).toBe('heading');
  expect(text.getAttribute('aria-level')).toBe('2');
  expect(text.getAttribute('size')).toBe('display');
  expect(text.shadowRoot!.textContent).toContain('Settings');
});
