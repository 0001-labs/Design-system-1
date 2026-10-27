import { expect, test } from 'vite-plus/test';
import { validateCss } from '../src/index';

test('every library keeps the foundation, including conditional and scoped rules', () => {
  for (const declaration of ['--ds-unit: 24px', '--ds-control-height: 32px', '--ds-1: 24px', '--one-unit: 8px', '--ds-control-size: 32px', '--one-control-height: 32px', '--ds-row-size: 24px', '--ds-text-leading: 10px']) {
    for (const css of [`:root { ${declaration} }`, `@media (min-width: 400px) { .brand { ${declaration} !important } }`]) {
      expect(validateCss(css)).toMatchObject({ ok: false, issues: expect.arrayContaining([expect.objectContaining({ code: 'foundation_constraint' })]) });
    }
  }
});

test('designs can change fonts, colours and corners while repeating foundation defaults', () => {
  expect(validateCss(':root { --ds-1: 20.0px; --one-control-height: 16px; --ds-paper: #fff; --ds-text-color: #222; --ds-typeface-regular: Georgia, serif; --ds-corner-size: 8px; }')).toMatchObject({ ok: true });
});

test('a design stands on a 10, 20 or 30px square, its rows, controls and leading on that grid', () => {
  for (const unit of ['10px', '20px', '30px']) expect(validateCss(`:root { --ds-1: ${unit}; --one-unit: ${unit}; }`)).toMatchObject({ ok: true });
  expect(validateCss(':root { --ds-1: 10px; --ds-row-size: 30px; --ds-control-size: 26px; --ds-text-leading: 20px; }')).toMatchObject({ ok: true });
  expect(validateCss('ds-button[data-size="large"] { --ds-control-size: 56px; --ds-row-size: 60px; }')).toMatchObject({ ok: true });
  for (const declaration of ['--ds-1: 15px', '--ds-1: 40px', '--ds-row-size: 25px', '--ds-control-size: 32px', '--ds-control-size: 6px', '--ds-text-leading: 18px']) {
    expect(validateCss(`:root { ${declaration} }`), declaration).toMatchObject({ ok: false });
  }
});
