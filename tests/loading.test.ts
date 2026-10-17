// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoadingIndicator, LOADING_CONTROLS, LOADING_LABEL } from '../DS1/2-core/ds-loading';
import { LoadingIndicator as Loading } from '../DS1/react/loading';
import { configureI18n, loadSharedWords, setLanguage } from '../DS1/0-face/i18n';
import { SHARED_WORDS } from '../DS1/0-face/shared-words';
import { LANGUAGES } from '../DS1/0-face/languages';
// The language runtime asks for a translations file as it loads.
vi.hoisted(() => { globalThis.fetch = async () => new Response('{}'); });

afterEach(() => { document.body.replaceChildren(); setLanguage('en'); });

const status = (element: LoadingIndicator) => element.shadowRoot!.querySelector('.ds-loading')!;

test('every shared language says "Loading" in its own words', () => {
  const files = Object.keys(SHARED_WORDS);
  expect(files.length).toBeGreaterThan(10);
  for (const language of files) expect(SHARED_WORDS[language]?.[LOADING_LABEL], language).toBeTruthy();
  expect(SHARED_WORDS.ja?.[LOADING_LABEL]).not.toBe('Loading');
  expect(LANGUAGES.length).toBeGreaterThan(0);
});

test('an unlabelled indicator reads the shared word in the page language, and follows a change', async () => {
  configureI18n({ sharedWords: true });
  await loadSharedWords();
  setLanguage('da');
  const element = new LoadingIndicator();
  document.body.append(element);
  await element.updateComplete;
  expect(status(element).getAttribute('aria-label')).toBe('Indlæser');
  setLanguage('ja');
  await element.updateComplete;
  expect(status(element).getAttribute('aria-label')).toBe('読み込み中');
  element.label = 'Opening document';
  await element.updateComplete;
  expect(status(element).getAttribute('aria-label')).toBe('Opening document');
  expect(renderToStaticMarkup(createElement(Loading, {}))).toContain('aria-label="読み込み中"');
  expect(renderToStaticMarkup(createElement(Loading, { label: 'Saving' }))).toContain('aria-label="Saving"');
  expect(renderToStaticMarkup(createElement(Loading, { decorative: true }))).not.toContain('aria-label');
});

test('a spinner in a button or field knows it, through shadow roots too; on its own it does not', async () => {
  const alone = Object.assign(new LoadingIndicator(), { variant: 'spinner' });
  const button = document.createElement('ds-button');
  const inButton = Object.assign(new LoadingIndicator(), { variant: 'spinner' });
  button.append(inButton);
  const field = document.createElement('label');
  field.className = 'ds-field';
  const host = document.createElement('div');
  field.append(host);
  const nested = Object.assign(new LoadingIndicator(), { variant: 'spinner' });
  host.attachShadow({ mode: 'open' }).append(nested);
  document.body.append(alone, button, field);
  await Promise.all([alone.updateComplete, inButton.updateComplete, nested.updateComplete]);
  expect(status(alone).getAttribute('data-context')).toBe('page');
  expect(status(inButton).getAttribute('data-context')).toBe('control');
  expect(status(nested).getAttribute('data-context')).toBe('control');
});

test('the stylesheet sizes a spinner one control high in the same controls, and one square alone', () => {
  const css = readFileSync('DS1/2-core/styles/ds-loading.css', 'utf8');
  const listed = /:where\(([^)]*)\) \.ds-loading\[data-variant="spinner"\]/.exec(css)?.[1];
  const normalise = (list: string) => list.split(',').map(entry => entry.trim().replaceAll('"', "'")).sort();
  expect(listed).toBeTruthy();
  expect(normalise(listed!)).toEqual(normalise(LOADING_CONTROLS));
  expect(css).toContain('[data-context="control"] { --ds-loading-context-size: var(--ds-control-height, calc(16px');
  expect(css).toMatch(/--ds-loading-box: var\(--ds-loading-size, var\(--ds-loading-context-size, calc\(20px/);
});
