import { EXAMPLES, TABLE_DATA } from './component-examples';
import type { DsTable } from '../../../DS1/3-unit/ds-table';

// A preview has its own preferences. Trying a language or theme must not
// overwrite the reader's choice in the surrounding documentation.
const preferences = new Map<string, string>();
Object.defineProperty(window, 'localStorage', {
  value: {
    get length() { return preferences.size; },
    key: (index: number) => [...preferences.keys()][index] ?? null,
    getItem: (key: string) => preferences.get(String(key)) ?? null,
    setItem: (key: string, value: string) => { preferences.set(String(key), String(value)); },
    removeItem: (key: string) => { preferences.delete(String(key)); },
    clear: () => { preferences.clear(); },
  } satisfies Storage,
});
await import('../../../DS1/index');
const { configureI18n, loadTranslations, setLanguage } = await import('../../../DS1/0-face/i18n');
configureI18n({ languages: ['en', 'da', 'ja'], sharedWords: true });
loadTranslations({ en: { Save: 'Save' }, da: { Save: 'Gem' }, ja: { Save: '保存' } });
setLanguage('en');
const output = document.querySelector<HTMLOutputElement>('#event-output')!;
const sample = document.querySelector<HTMLElement>('#sample')!;
// Parse the sample with all its elements already registered, so attributes
// and initial tooltip state are applied before the example becomes ready.
const example = EXAMPLES[document.body.dataset.exampleId!];
sample.innerHTML = example.html;

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
for (const name of ['change', 'press']) sample.addEventListener(name, event => {
  if ((event.target as HTMLElement).localName === 'ds-split')
    output.textContent = `${name}: ${(event as CustomEvent).detail.value}`;
});

const sidebar = sample.querySelector('ds-sidebar');
if (sidebar) {
  let expanded = true;
  let selected = 'overview';
  const render = () => {
    sidebar.items = [
      { id: 'overview', label: 'Overview', current: selected === 'overview' },
      { id: 'projects', label: 'Projects', expanded, meta: '3' },
      ...(expanded ? [
        { id: 'atlas', label: 'Atlas', depth: 1, current: selected === 'atlas' },
        { id: 'harbor', label: 'Harbor', depth: 1, current: selected === 'harbor' },
        { id: 'studio', label: 'Studio', depth: 1, disabled: true, meta: 'Unavailable' },
      ] : []),
      { id: 'guidelines', label: 'Guidelines', current: selected === 'guidelines' },
    ];
  };
  sidebar.addEventListener('sidebar-toggle', event => { expanded = (event as CustomEvent).detail.expanded; render(); });
  sidebar.addEventListener('sidebar-activate', event => { selected = (event as CustomEvent).detail.id; render(); output.textContent = `Selected: ${selected}`; });
  render();
}
const grid = sample.querySelector('ds-grid');
if (grid) sample.querySelectorAll<HTMLSelectElement>('[data-grid-option]').forEach(control => {
  control.addEventListener('change', () => {
    const attribute = control.dataset.gridOption!;
    if (control.value) grid.setAttribute(attribute, control.value);
    else grid.removeAttribute(attribute);
    output.textContent = `${attribute}: ${control.selectedOptions[0].text}`;
  });
});
const table = sample.querySelector<DsTable>('ds-table');
if (table) table.data = TABLE_DATA;
// A tooltip example should show the label on first sight, before someone
// knows that they need to hover. Use its real hover behaviour for the demo.
sample.querySelectorAll('ds-tooltip').forEach(tooltip => {
  tooltip.dispatchEvent(new MouseEvent('mouseenter'));
});
parent.postMessage({ type: 'ds1-example-ready' }, location.origin);
