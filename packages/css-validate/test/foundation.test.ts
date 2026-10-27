import { expect, test } from 'vite-plus/test';
import { validateCss } from '../src/index';

test('every library keeps the foundation, including conditional and scoped rules', () => {
  for (const declaration of ['--ds-unit: 24px', '--ds-control-height: 32px', '--ds-1: 24px', '--one-unit: 8px', '--ds-control-size: 32px', '--one-control-height: 30px', '--ds-row-size: 30px', '--ds-text-leading: 10px']) {
    for (const css of [`:root { ${declaration} }`, `@media (min-width: 400px) { .brand { ${declaration} !important } }`]) {
      expect(validateCss(css)).toMatchObject({ ok: false, issues: expect.arrayContaining([expect.objectContaining({ code: 'foundation_constraint' })]) });
    }
  }
});

test('designs can change fonts, colours and corners while repeating foundation defaults', () => {
  expect(validateCss(':root { --ds-1: 20.0px; --one-control-height: 16px; --ds-paper: #fff; --ds-text-color: #222; --ds-typeface-regular: Georgia, serif; --ds-corner-size: 8px; }')).toMatchObject({ ok: true });
});
