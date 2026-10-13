import '../../../DS1/index';
import { TABLE_DATA } from './component-examples';
import { configureI18n, loadTranslations, setLanguage } from '../../../DS1/0-face/i18n';
import type { DsTable } from '../../../DS1/3-unit/ds-table';

configureI18n({ languages: ['en', 'da', 'ja'], sharedWords: true });
loadTranslations({ en: { Save: 'Save' }, da: { Save: 'Gem' }, ja: { Save: '保存' } });
setLanguage('en');
const output = document.querySelector<HTMLOutputElement>('#event-output')!;
const sample = document.querySelector<HTMLElement>('#sample')!;

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'ds1-example-theme') return;
  const dark = event.data.theme === 'dark';
  document.documentElement.classList.toggle('dark-theme', dark);
  document.documentElement.classList.toggle('light-theme', !dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
});

sample.addEventListener('click', event => {
  const button = event.composedPath().find(node => node instanceof HTMLElement && node.tagName === 'DS-BUTTON') as HTMLElement | undefined;
  if (button && !button.hasAttribute('disabled')) output.textContent = `click: ${button.textContent?.trim()}`;
});
sample.addEventListener('input-change', event => {
  const detail = (event as CustomEvent).detail;
  output.textContent = `input-change: ${detail.name} = ${detail.value}`;
});
sample.addEventListener('form-submit', event => {
  output.textContent = `form-submit: ${JSON.stringify((event as CustomEvent).detail.data)}`;
});
sample.addEventListener('form-invalid', () => { output.textContent = 'form-invalid: fill in the required field.'; });

const table = sample.querySelector<DsTable>('ds-table');
if (table) table.data = TABLE_DATA;
