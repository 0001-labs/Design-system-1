// @vitest-environment node
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { expect, test } from 'vite-plus/test';
import { Page } from '../DS1/react/page';

test('the shared page adapter is typed and renders ds-page with its layout and measure during SSR', () => {
  expect(typeof globalThis.HTMLElement).toBe('undefined');
  const output = renderToString(createElement(Page, { layout: 'column', measure: 28, divided: true }, createElement('p', null, 'Work')));
  expect(output).toMatch(/^<ds-page\b/);
  expect(output).toContain('layout="column"');
  expect(output).toContain('measure="28"');
  expect(output).toContain('<p>Work</p>');
});
