import { expect, it } from 'vite-plus/test';
import { defaultButtonBox, writeButtonBox } from '../app/src/lib/buttonBoxModel';
it('changes the real button part and keeps existing branded CSS intact', () => {
  const original = ':root { --one-button-padding-inline: 12px; --one-button-padding-block: 8px; --brand: pink; }\n.brand { color: var(--brand); }';
  const next = writeButtonBox(original, { ...defaultButtonBox, paddingX: 20, paddingY: 4, borderTop: 2, marginLeft: 10 });
  expect(next).toContain(original);
  expect(next).toContain('--one-button-padding-inline: 20px;');
  expect(next).toContain('ds-button:not([split])::part(control)');
  expect(next).toContain('border-width: calc(2px * var(--ds-sf, 1))');
  expect(writeButtonBox(next, { ...defaultButtonBox, radius: 8 }).match(/ds1:button-box:start/g)).toHaveLength(1);
});
