import { mountChartExample } from './chart-example';
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
  if (button && !button.hasAttribute('disabled') && !button.hasAttribute('split')) output.textContent = `click: ${button.textContent?.trim()}`;
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
  if (((event.target as HTMLElement).localName === 'ds-split' || (event.target as HTMLElement).matches('ds-button[split]')))
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

// Library previews use the identical examples and component runtime as the catalogue.
const legacyPreviewStyle = document.createElement('style');
const libraryStyle = document.createElement('style');
document.head.append(legacyPreviewStyle, libraryStyle);
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'ds1-example-styles') return;
  if (typeof event.data.css !== 'string' || new TextEncoder().encode(event.data.css).length > 524288) return;
  libraryStyle.textContent = event.data.css;
});

// The library's box diagram measures the real shared control and never reaches
// into its shadow root to override implementation styles. Editing uses its part.
let libraryRequestId: number | undefined;
let libraryHoverRegion: string | null = null;
const boxOverlay = document.createElement('div');
boxOverlay.setAttribute('aria-hidden', 'true');
Object.assign(boxOverlay.style, { position: 'fixed', pointerEvents: 'none', zIndex: '1000', outline: '1px dashed var(--sharp-blue)', background: 'color-mix(in srgb, var(--sharp-blue) 12%, transparent)', display: 'none' });
document.body.append(boxOverlay);
function buttonMetrics() {
  if (libraryRequestId === undefined) return;
  const host = sample.querySelector<HTMLElement>('ds-button');
  const control = host?.shadowRoot?.querySelector<HTMLElement>('button');
  if (!host || !control) return;
  const style = getComputedStyle(control); const outer = getComputedStyle(host);
  const scale = Number.parseFloat(getComputedStyle(host).getPropertyValue('--ds-sf')) || 1;
  const px = (value: string) => (Number.parseFloat(value) || 0) / scale;
  const box = { paddingX: px(style.paddingRight), paddingY: px(style.paddingTop), radius: px(style.borderTopLeftRadius), gap: px(style.columnGap),
    borderTop: px(style.borderTopWidth), borderRight: px(style.borderRightWidth), borderBottom: px(style.borderBottomWidth), borderLeft: px(style.borderLeftWidth),
    marginTop: px(outer.marginTop), marginRight: px(outer.marginRight), marginBottom: px(outer.marginBottom), marginLeft: px(outer.marginLeft) };
  const rect = control.getBoundingClientRect();
  const contentSize = { width: Math.round(rect.width / scale - box.paddingX * 2 - box.borderLeft - box.borderRight), height: Math.round(rect.height / scale - box.paddingY * 2 - box.borderTop - box.borderBottom) };
  parent.postMessage({ type: 'ds1-example-button-metrics', requestId: libraryRequestId, box, contentSize }, location.origin);
  boxOverlay.style.display = libraryHoverRegion ? 'block' : 'none';
  let top = rect.top, left = rect.left, width = rect.width, height = rect.height;
  if (libraryHoverRegion === 'content') { top += (box.paddingY + box.borderTop) * scale; left += (box.paddingX + box.borderLeft) * scale; width = contentSize.width * scale; height = contentSize.height * scale; }
  else if (libraryHoverRegion === 'padding') { top += box.borderTop * scale; left += box.borderLeft * scale; width -= (box.borderLeft + box.borderRight) * scale; height -= (box.borderTop + box.borderBottom) * scale; }
  else if (libraryHoverRegion === 'margin' || libraryHoverRegion === 'all') { top -= box.marginTop * scale; left -= box.marginLeft * scale; width += (box.marginLeft + box.marginRight) * scale; height += (box.marginTop + box.marginBottom) * scale; }
  Object.assign(boxOverlay.style, { top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` });
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'ds1-example-styles' || typeof event.data.css !== 'string' || new TextEncoder().encode(event.data.css).length > 524288) return;
  syncLegacyButtonPreview(event.data.css);
  libraryRequestId = event.data.requestId;
  libraryHoverRegion = ['margin', 'border', 'padding', 'content', 'all'].includes(event.data.hoverRegion) ? event.data.hoverRegion : null;
  requestAnimationFrame(buttonMetrics);
});
const measuredButton = sample.querySelector('ds-button');
if (measuredButton) new ResizeObserver(buttonMetrics).observe(measuredButton);

// Earlier libraries authored ordinary button rules. Project that authored face
// onto the real DS1 control only inside its preview; keep saved CSS untouched.
let legacyReference: HTMLButtonElement | undefined;
function syncLegacyButtonPreview(css: string) {
  if (!/--one-button-padding-inline\s*:/.test(css)) { legacyPreviewStyle.textContent = ''; return; }
  if (!legacyReference) {
    legacyReference = document.createElement('button');
    legacyReference.setAttribute('aria-hidden', 'true'); legacyReference.tabIndex = -1;
    legacyReference.textContent = 'Save changes';
    Object.assign(legacyReference.style, { position: 'fixed', left: '-10000px', visibility: 'hidden', pointerEvents: 'none' });
    document.body.append(legacyReference);
  }
  const properties = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-style', 'border-color', 'border-radius', 'column-gap', 'background-color', 'color', 'font-family', 'font-size', 'font-weight', 'line-height'];
  const variants = [
    ['ds-button[primary]:not([disabled])', '', false],
    ['ds-button[secondary]:not([disabled])', 'neutral', false],
    ['ds-button:not([primary]):not([secondary]):not([disabled])', 'subtle', false],
    ['ds-button[danger]:not([disabled])', 'danger', false],
    ['ds-button[disabled]', '', true],
  ] as const;
  legacyPreviewStyle.textContent = variants.map(([selector, variant, disabled]) => {
    if (variant) legacyReference!.setAttribute('variant', variant); else legacyReference!.removeAttribute('variant');
    legacyReference!.disabled = disabled;
    const face = getComputedStyle(legacyReference!);
    // Zero selector specificity lets the user's authored part rules win.
    return `:where(${selector}) { margin: ${face.margin}; } :where(${selector})::part(control) { ${properties.map(name => `${name}: ${face.getPropertyValue(name)};`).join(' ')} height: auto; min-height: 0; max-height: none; }`;
  }).join('\n');
}

if (document.body.dataset.exampleId === 'chart') {
  mountChartExample(sample);
  const refreshCharts = () => requestAnimationFrame(() => sample.querySelectorAll('ds-chart,ds-spark').forEach(chart => (chart as HTMLElement & { refreshTheme(): void }).refreshTheme()));
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === parent && ['ds1-example-theme', 'ds1-example-styles'].includes(event.data?.type)) refreshCharts();
  });
}

// Announce readiness after the library listeners exist, including in browsers
// whose iframe load event precedes completion of awaited module imports.
parent.postMessage({ type: 'ds1-example-library-ready' }, location.origin);
