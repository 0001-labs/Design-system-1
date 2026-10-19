import { LAYOUT_EXAMPLES } from './layout-examples';

// A preview keeps its own preferences, so trying a theme or language here never
// changes the reader's choice in the surrounding documentation.
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
window.DS_ONE_I18N = { autoLoad: false, persist: false };
await import('../../../DS1/index');
const { startScaling } = await import('../../../DS1/0-face/scaling');
document.documentElement.style.setProperty('--ds-sf', 'var(--sf)');
const { configureI18n, setLanguage } = await import('../../../DS1/0-face/i18n');
configureI18n({ languages: ['en', 'da', 'ja'], sharedWords: true });
setLanguage('en');

type Layer = 2 | 3 | 4;
const NAMES: Record<Layer, string> = { 2: 'Core', 3: 'Unit', 4: 'Page' };
const layers: Record<string, Layer> = JSON.parse(document.body.dataset.layers!);
const example = LAYOUT_EXAMPLES[document.body.dataset.layout!];
const sample = document.querySelector<HTMLElement>('#sample')!;
const overlay = document.querySelector<HTMLElement>('#layers')!;
sample.innerHTML = example.html;
// The script is the sample's own, shown beside it as copyable code.
if (example.script) new Function(example.script)();

const page = sample.querySelector('ds-page');
let showing = false;
let stopScaling: (() => void) | undefined;

/** The elements an author placed, not those a component draws inside itself. */
const placed = () => [...sample.querySelectorAll<HTMLElement>('*')].filter(element => layers[element.localName]);

function draw() {
  overlay.replaceChildren();
  if (!showing) return;
  const scrollX = window.scrollX, scrollY = window.scrollY;
  for (const element of placed()) {
    const layer = layers[element.localName];
    if (layer === 4) continue;
    const box = element.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    const mark = document.createElement('div');
    mark.className = 'mark';
    mark.dataset.layer = String(layer);
    Object.assign(mark.style, { left: `${box.left + scrollX}px`, top: `${box.top + scrollY}px`, width: `${box.width}px`, height: `${box.height}px` });
    // Units are named on sight, once per run of the same kind; a core piece
    // is named when pointed at.
    if (layer === 3 && element.previousElementSibling?.localName !== element.localName) {
      const label = document.createElement('span');
      label.textContent = element.localName;
      mark.append(label);
    }
    overlay.append(mark);
  }
}

let frame = 0;
const redraw = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); };
new ResizeObserver(redraw).observe(document.documentElement);
new MutationObserver(redraw).observe(sample, { subtree: true, childList: true, attributes: true });
sample.addEventListener('scroll', redraw, { capture: true, passive: true });
addEventListener('scroll', redraw, { passive: true });

/** "ds-button, a Core piece, in ds-row, a Unit, in the header of ds-page." */
function describe(target: EventTarget[]): string {
  const chain = target.filter((node): node is HTMLElement => node instanceof HTMLElement && node.getRootNode() === document && Boolean(layers[node.localName]));
  if (!chain.length) return '';
  const [first, ...rest] = chain;
  const parts = [`${first.localName} is ${layers[first.localName] === 3 ? 'a Unit' : layers[first.localName] === 2 ? 'a Core piece' : 'the Page'}`];
  for (const element of rest) {
    if (layers[element.localName] === 4) continue;
    parts.push(`in ${element.localName} (${NAMES[layers[element.localName]]})`);
  }
  if (page && first !== page) {
    const top = chain.findLast(element => element.parentElement === page) ?? first.closest('ds-page > *');
    const area = top?.getAttribute('slot') || 'main';
    parts.push(`in the ${area} area of ds-page`);
  }
  return `${parts.join(', ')}.`;
}

let last = '';
sample.addEventListener('pointermove', event => {
  const text = describe(event.composedPath());
  if (text === last) return;
  last = text;
  parent.postMessage({ type: 'ds1-layout-inspect', text }, location.origin);
});
sample.addEventListener('pointerleave', () => { last = ''; parent.postMessage({ type: 'ds1-layout-inspect', text: '' }, location.origin); });
sample.addEventListener('focusin', event => parent.postMessage({ type: 'ds1-layout-inspect', text: describe(event.composedPath()) }, location.origin));

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent) return;
  if (event.data?.type === 'ds1-example-theme') {
    const dark = event.data.theme === 'dark';
    document.documentElement.classList.toggle('dark-theme', dark);
    document.documentElement.classList.toggle('light-theme', !dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.querySelectorAll('ds-chart').forEach(chart => chart.refreshTheme());
  }
  if (event.data?.type === 'ds1-layout-layers') {
    stopScaling?.();
    stopScaling = startScaling({ surface: sample, mode: event.data.phone ? 'fluid' : 'fixed' });
    showing = Boolean(event.data.on);
    page?.toggleAttribute('view', showing);
    redraw();
  }
});
parent.postMessage({ type: 'ds1-example-ready' }, location.origin);
