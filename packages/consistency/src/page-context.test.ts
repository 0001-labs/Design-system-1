// @vitest-environment happy-dom
import { expect, test, vi } from 'vite-plus/test';
vi.mock('../../../DS1/3-unit/ds-context', () => ({ Context: class extends HTMLElement {} }));
import { isPageBackground } from './page-context';
import { CompositionHistory } from './model';
test('background menu excludes every editable or interactive surface', () => {
 const sheet = document.createElement('div');
 for (const tag of ['aa-editor', 'ds-card', 'ds-button', 'ds-stat', 'input', 'button']) {
  const node = document.createElement(tag), child = document.createElement('span'); node.append(child);sheet.append(node);
  expect(isPageBackground(child, sheet)).toBe(false);
 }
 const empty = document.createElement('section');sheet.append(empty);expect(isPageBackground(empty,sheet)).toBe(true);expect(isPageBackground(sheet,sheet)).toBe(true);
 expect(isPageBackground(document.createElement('section'), sheet)).toBe(false);
});
test('page colour is one undoable document property', () => {
 const history = new CompositionHistory();const text = history.value.text;history.commit({pageTone:'pink'});expect(history.value.pageTone).toBe('pink');expect(history.value.text).toBe(text);history.undo();expect(history.value.pageTone).toBe('');
});
