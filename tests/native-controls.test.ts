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
  for (const name of ['.ds-input', '.ds-select', '.ds-checkbox', '.ds-radio', '.ds-switch', '.ds-range']) {
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
  expect(rule('textarea.ds-input')).toContain('calc(var(--ds-textarea-rows, 3) * var(--ds-row-height))');
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

test('a native range draws the same track and thumb in WebKit and Firefox', () => {
  expect(rule('.ds-range')).toContain('margin: calc(var(--ds-row-height) - var(--ds-control-height)) 0 0');
  expect(rule('.ds-range')).toContain('width: var(--ds-range-width, calc(8 * var(--ds-unit)))');
  for (const engine of ['::-webkit-slider-runnable-track', '::-moz-range-track']) {
    const track = rule(`.ds-range${engine}`);
    expect(track, engine).toContain('height: var(--ds-control-height)');
    expect(track, engine).toContain('/ 100% 1px no-repeat');
  }
  for (const engine of ['::-webkit-slider-thumb', '::-moz-range-thumb']) {
    const thumb = rule(`.ds-range${engine}`);
    expect(thumb, engine).toContain('height: var(--ds-control-height)');
    expect(thumb, engine).toContain('width: var(--ds-range-thumb-width, calc(var(--ds-control-height) / 2))');
    expect(thumb, engine).toContain('background: currentColor');
    expect(thumb, engine).not.toContain('transition');
  }
});
