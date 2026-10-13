// @vitest-environment node
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { expect, test } from 'vite-plus/test';
import { Button } from '../DS1/react/button';

test('the shared button keeps real native form semantics during SSR', () => {
  expect(typeof globalThis.HTMLElement).toBe('undefined');
  const output = renderToString(createElement(Button, { type: 'submit', name: 'action', value: 'save', form: 'document', formNoValidate: true, disabled: true, primary: true }, 'Save'));
  expect(output).toContain('<ds-button control="slotted"');
  const native = output.match(/<button\b[^>]+>/)?.[0] ?? '';
  for (const attribute of ['type="submit"', 'name="action"', 'value="save"', 'form="document"', 'formNoValidate=""', 'disabled=""']) expect(native).toContain(attribute);
  expect(output).toContain('>Save</button>');
});
