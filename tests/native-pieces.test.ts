import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';

const read = (path: string) => readFileSync(join(import.meta.dirname, '../DS1', path), 'utf8');
const controls = read('1-root/controls.css');
/** The body of the rule whose selector list is exactly this one. */
const rule = (css: string, selector: string) => {
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const found = rules.find(([, list]) => list!.split(';').pop()!.trim().replace(/\s+/g, ' ') === selector.replace(/\s+/g, ' '));
  expect(found, selector).toBeDefined();
  return found![2]!;
};
const native = (selector: string) => rule(controls, selector);

test('a field stands on one-square rows, its label above or four squares beside the control', () => {
  expect(native('.ds-field')).toContain('grid-auto-rows: minmax(var(--ds-row-height), auto)');
  expect(native('.ds-field')).toContain('line-height: var(--ds-unit)');
  expect(native('.ds-field--beside')).toContain('var(--ds-field-label-width, calc(4 * var(--ds-unit)))');
  expect(native('.ds-field--beside > .ds-field__label')).toContain('grid-row: 1');
  expect(native('.ds-field__hint')).toContain('var(--ds-text-color-muted)');
  expect(native('.ds-field__error')).toContain('var(--ds-danger-color)');
  expect(controls).toMatch(/\.ds-field__hint:empty,\n\.ds-field__error:empty \{\n {2}display: none;/);
});

test('a native avatar has the element’s sizes, type and ways of colouring it', () => {
  const element = read('2-core/styles/ds-avatar.css');
  expect(rule(element, ':host')).toContain('--avatar-size: var(--ds-control-height)');
  expect(native('.ds-avatar')).toContain('--ds-avatar-size: var(--ds-control-height)');
  expect(rule(element, ':host([size="large"])')).toContain('--avatar-size: calc(2 * var(--ds-unit))');
  expect(native('.ds-avatar--large')).toContain('--ds-avatar-size: calc(2 * var(--ds-unit))');
  expect(native('.ds-avatar--large')).toContain('font-size: var(--ds-unit)');
  for (const token of ['var(--ds-avatar-background, var(--ds-fill))', 'var(--ds-avatar-color, var(--ds-text-color))', 'border-radius: 50%', 'var(--ds-type-size-small)']) {
    expect(native('.ds-avatar'), token).toContain(token);
  }
  expect(native('.ds-avatar--pair')).toContain('calc((var(--ds-avatar-size) - 2px) / 2)');
  expect(native('.ds-avatar--outlined::after')).toContain('border: 1px solid var(--ds-avatar-outline, currentColor)');
});

test('a native badge is one square high on the fill, rounding its width up to whole squares where it can', () => {
  const element = rule(read('2-core/styles/ds-badge.css'), '.frame');
  const badge = native('.ds-badge');
  for (const declaration of ['height: var(--ds-row-height)', 'min-width: var(--ds-row-height)', 'var(--ds-badge-background, var(--ds-fill))', 'var(--ds-badge-color, var(--ds-text-color))', 'calc(4px * var(--ds-sf))']) {
    expect(element, declaration).toContain(declaration);
    expect(badge, declaration).toContain(declaration);
  }
  expect(badge.indexOf('width: max-content')).toBeLessThan(badge.indexOf('width: calc-size(max-content, round(up, size, var(--ds-unit)))'));
  expect(native('.ds-badge--icon')).toContain('width: var(--ds-row-height)');
  expect(native('.ds-badge--icon > :not(.ds-icon)')).toContain('clip-path: inset(50%)');
});

test('a toggle button is the secondary face off and the primary face on, as a chosen segment is', () => {
  expect(native('.ds-toggle')).toContain('--ds-button-background: var(--ds-button-background-color-secondary)');
  const pressed = native('.ds-toggle[aria-pressed="true"],\n.ds-toggle[aria-pressed="true"]:hover:not(:disabled, [aria-disabled="true"])');
  const chosen = native('.ds-tabs[role="group"] > .ds-button:is([aria-pressed="true"], [aria-selected="true"], [aria-current]:not([aria-current="false"]))');
  for (const declaration of ['--ds-button-background: var(--ds-button-background-color-primary)', '--ds-button-color: var(--ds-button-text-color-on-accent)']) {
    expect(pressed, declaration).toContain(declaration);
    expect(chosen, declaration).toContain(declaration);
  }
});

test('a native icon masks its file in the text colour at the element’s sizes, at no specificity', () => {
  const element = read('2-core/styles/ds-icon.css');
  const icon = native(':where(.ds-icon)');
  expect(rule(element, ':host')).toContain('--ds-icon-box: calc(var(--ds-icon-size, 14px) * var(--ds-sf))');
  expect(icon).toContain('--ds-icon-box: calc(var(--ds-icon-size, 14px) * var(--ds-sf))');
  expect(icon).toContain('mask: var(--ds-icon) center / contain no-repeat');
  expect(icon).toContain('background-color: currentColor');
  expect(rule(element, ':host([size="small"])')).toContain('--ds-icon-size: 12px');
  expect(native(':where(.ds-icon--small)')).toContain('--ds-icon-size: 12px');
  expect(rule(element, ':host([size="large"])')).toContain('--ds-icon-size: 16px');
  expect(native(':where(.ds-icon--large)')).toContain('--ds-icon-size: 16px');
  expect(controls.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/^\.ds-icon(?:--small|--large)?\s*\{/m);
});

test('a drop zone is the file picker’s area: eight squares, four compact, the input covering it', () => {
  const element = read('2-core/styles/ds-file-picker.css');
  expect(element).toContain(':host([area]) { width: 100%; height: calc(8 * var(--ds-unit)); }');
  expect(native('.ds-drop')).toContain('height: calc(8 * var(--ds-unit))');
  expect(element).toContain(':host([area][compact]) { height: calc(4 * var(--ds-unit)); }');
  expect(native('.ds-drop--compact')).toContain('height: calc(4 * var(--ds-unit))');
  expect(native('.ds-drop')).toContain('background: var(--ds-button-background-color-secondary)');
  const input = native(':is(.ds-drop, label.ds-button) > input[type="file"]:not([hidden])');
  expect(input).toContain('inset: 0');
  expect(input).toContain('opacity: 0');
  expect(native('.ds-drop:has(> input:focus-visible),\n.ds-drop[data-dragging]:not(:has(> input:disabled)),\nlabel.ds-button:has(> input[type="file"]:focus-visible)')).toContain('outline: 2px solid var(--ds-focus-ring)');
  expect(native('label.ds-button:has(> input[type="file"])')).toContain('--ds-button-height: var(--ds-row-height)');
});

test('the pieces scale with the surface: every length is a token, a square count or scaled', () => {
  const start = controls.indexOf('/*\n * Pieces the components draw');
  expect(start).toBeGreaterThan(0);
  const section = controls.slice(start).replace(/\/\*[\s\S]*?\*\//g, '');
  const bare = [...section.matchAll(/(?<![\w-])-?\d+(?:\.\d+)?px/g)].map(match => {
    const before = section.slice(Math.max(0, match.index - 40), match.index);
    const after = section.slice(match.index, match.index + 30);
    return { length: match[0], scaled: /\*\s*var\(--ds-sf\)/.test(after) || /--ds-icon-size(?::|,)\s*$/.test(before) };
  });
  // Hairlines, the focus ring and its offset, and the 2px between an initial's hairline edges stay as drawn.
  expect(bare.filter(found => !found.scaled).map(found => found.length).sort()).toEqual(['1px', '1px', '1px', '1px', '2px', '2px']);
});
