import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';

const css = readFileSync(join(import.meta.dirname, '../DS1/1-root/controls.css'), 'utf8');
const rule = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf('}', start));
};

test('every native control class has a focus ring and a disabled state', () => {
  for (const name of ['.ds-input', '.ds-textarea', '.ds-select', '.ds-checkbox', '.ds-radio', '.ds-switch']) {
    expect(css).toMatch(new RegExp(`${name.replace('.', '\\.')}:focus-visible`));
    expect(css).toMatch(new RegExp(`${name.replace('.', '\\.')}:disabled`));
  }
});

test('a native switch is two control heights wide and its thumb travels one', () => {
  const track = rule('.ds-switch');
  expect(track).toContain('width: calc(2 * var(--ds-choice-unit))');
  expect(track).toContain('height: var(--ds-choice-unit)');
  expect(rule('.ds-switch[aria-checked="true"]::after')).toContain('translateX(var(--ds-choice-unit))');
});

test('a native text area spans whole rows and a dialog is twenty squares wide', () => {
  expect(rule('.ds-textarea')).toContain('calc(var(--ds-textarea-rows, 3) * var(--ds-row-height))');
  expect(rule('dialog.ds-dialog')).toContain('calc(20 * var(--ds-unit))');
});

test('a segmented group marks its chosen native button in the accent', () => {
  expect(css).toContain('.ds-tabs[role="group"] > .ds-button:is([aria-pressed="true"], [aria-selected="true"]');
});

test('a menu item that is a button loses only the button look, at no extra specificity', () => {
  const reset = rule(':where(button).ds-menu__item');
  expect(reset).toContain('background: transparent');
  expect(css.indexOf(':where(button).ds-menu__item')).toBeLessThan(css.indexOf('.ds-menu__item:hover'));
});
