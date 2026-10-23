import type { Atom } from '../../../website/src/vendor/aa/aa';
import { COMPONENT_PALETTE, defaultPaletteContent, paletteDefinition, paletteInsertion, readPaletteContent, writePaletteContent, type PaletteContent, type PaletteDefinition } from '../../../shared/consistency-palette';
import { applyLibraryTokens } from './libraries';
import './palette.css';
import '../../../DS1/2-core/ds-avatar';
import '../../../DS1/2-core/ds-chart';
import '../../../DS1/2-core/ds-checkbox';
import '../../../DS1/2-core/ds-cycle';
import '../../../DS1/2-core/ds-empty';
import '../../../DS1/2-core/ds-gap';
import '../../../DS1/2-core/ds-icon';
import '../../../DS1/2-core/ds-image';
import '../../../DS1/2-core/ds-input';
import '../../../DS1/2-core/ds-number';
import '../../../DS1/2-core/ds-message';
import '../../../DS1/2-core/ds-progress';
import '../../../DS1/2-core/ds-stat';
import '../../../DS1/2-core/ds-switch';
import '../../../DS1/2-core/ds-tag';
import '../../../DS1/2-core/ds-text';
import '../../../DS1/2-core/ds-tooltip';
import '../../../DS1/3-unit/ds-accordion';
import '../../../DS1/3-unit/ds-calendar';
import '../../../DS1/3-unit/ds-bento';
import '../../../DS1/3-unit/ds-context';
import '../../../DS1/3-unit/ds-form';
import '../../../DS1/4-page/ds-footer';
import '../../../DS1/4-page/ds-header';
import '../../../DS1/3-unit/ds-list';
import '../../../DS1/3-unit/ds-matrix';
import '../../../DS1/3-unit/ds-row';
import '../../../DS1/3-unit/ds-select';
import '../../../DS1/3-unit/ds-sidebar';
import '../../../DS1/3-unit/ds-table';
import '../../../DS1/3-unit/ds-table-of-contents';
import '../../../DS1/3-unit/ds-tabs';
import '../../../DS1/4-page/ds-container';
import '../../../DS1/4-page/ds-document';
import '../../../DS1/4-page/ds-grid';
import '../../../DS1/4-page/ds-overlay';
import '../../../DS1/4-page/ds-page';
import '../../../DS1/4-page/ds-panel';

/** Only fixed catalogue tags and properties enter the DOM; authored values stay text. */
export function drawPaletteFace(doc: Document, value: PaletteContent): HTMLElement {
  const entry = paletteDefinition(value.component)!;
  const face = doc.createElement(entry.tag);
  const v = value.values, variant = value.variant ?? entry.variants?.[0];
  const node = (tag: string, text?: string, attrs: Record<string, string> = {}) => {
    const result = doc.createElement(tag); if (text !== undefined) result.textContent = text;
    for (const [key, value] of Object.entries(attrs)) result.setAttribute(key, value);
    return result;
  };
  const literal = () => face.setAttribute('literal', '');
  const props = (values: Record<string, unknown>) => Object.assign(face, values);
  const attr = (key: string, value: string | undefined) => { if (value !== undefined) face.setAttribute(key, value); };
  switch (entry.id) {
    case 'avatar': props({ label: v.label, initial: v.initial, shape: variant === 'square' ? 'square' : '' }); break;
    case 'chart': props({ data: v.values!.split(',').map((number, index) => ({ time: index + 1, value: Number(number) })), rows: 8, labels: true }); attr('aria-label', v.label); break;
    case 'checkbox': face.append(node('input', undefined, { type: 'checkbox', 'aria-label': v.label! })); break;
    case 'cycle': props({ type: 'custom', label: v.label, values: ['Small', 'Medium', 'Large'], value: 'Medium' }); break;
    case 'empty': case 'message': literal(); props({ heading: v.heading, text: v.text }); if (entry.id === 'message') attr('tone', variant); break;
    case 'gap': attr('size', variant); break;
    case 'icon': attr('type', v.type); attr('aria-label', v.type); break;
    case 'image': props({ src: v.src, alt: v.alt, caption: v.caption, ratio: '4/3', fit: variant }); break;
    case 'input': props({ label: v.label, placeholder: v.placeholder, type: variant }); break;
    case 'number': props({ label: v.label, value: Number(v.value) }); break;
    case 'link': face.textContent = v.label!; attr('href', v.href); break;
    case 'progress': props({ value: Number(v.value), max: Number(v.max) }); break;
    case 'stat': literal(); props({ label: v.label, value: Number(v.value), caption: v.caption }); break;
    case 'switch': face.append(node('button', undefined, { type: 'button', role: 'switch', 'aria-checked': 'false', 'aria-label': v.label! })); break;
    case 'tag': face.textContent = v.label!; break;
    case 'text': literal(); attr('wrap', ''); face.textContent = v.text!; break;
    case 'tooltip': literal(); props({ text: v.text }); face.append(node('ds-button', v.label)); break;
    case 'accordion': literal(); props({ summary: v.summary, details: v.details, open: variant === 'open' }); break;
    case 'calendar': props({ compact: true, view: variant }); break;
    case 'bento': attr('columns', '1'); face.append(node('ds-card', v.first), node('ds-card', v.second)); break;
    case 'context': props({ floating: false, open: true }); face.append(node('button', v.first, { type: 'button', role: 'menuitem' }), node('button', v.second, { type: 'button', role: 'menuitem' })); break;
    case 'form': { const input = node('ds-input', undefined, { type: 'email', label: v.label! }); face.append(input, node('ds-button', v.button)); break; }
    case 'footer': literal(); props({ brand: v.brand, tagline: v.tagline, preferences: 'none' }); break;
    case 'header': literal(); props({ brand: v.brand }); face.append(node('a', v.first, { href: '#work' }), node('a', v.second, { href: '#about' })); break;
    case 'list': face.append(node('ds-row', v.first), node('ds-row', v.second)); break;
    case 'matrix': literal(); props({ label: v.label, names: 8, rows: [{ id: 'row', label: v.row }], columns: [{ id: 'column', label: v.column }], cells: [{ row: 'row', column: 'column', mark: 'fill' }] }); break;
    case 'row': face.append(node('span', v.label), node('span', v.detail)); face.toggleAttribute('stacked', variant === 'stacked'); break;
    case 'select': { const select = node('select', undefined, { 'aria-label': 'Choose an option' }); select.append(node('option', v.first), node('option', v.second)); face.append(select); break; }
    case 'sidebar': props({ items: [{ id: 'first', label: v.first, current: true }, { id: 'second', label: v.second }] }); break;
    case 'table': props({ columns: [{ key: 'name', label: v.column }], data: [{ name: v.first }, { name: v.second }] }); break;
    case 'table-of-contents': literal(); props({ items: [{ href: '#introduction', label: v.first }, { href: '#details', label: v.second }] }); break;
    case 'tabs': if (variant !== 'buttons') attr(variant!, ''); face.append(node('ds-button', v.first, { active: '', role: 'tab', 'aria-selected': 'true' }), node('ds-button', v.second, { role: 'tab', 'aria-selected': 'false' })); break;
    case 'container': face.append(node('p', v.text)); break;
    case 'document': face.append(node('h2', v.title), node('p', v.text)); break;
    case 'grid': attr('contained', ''); attr('pattern', variant); face.style.minHeight = 'calc(8 * var(--ds-unit))'; break;
    // Overlay content is visible in its inline frame while authoring; it never opens a page modal itself.
    case 'overlay': attr('type', variant); face.append(node('h2', v.title), node('p', v.text)); break;
    case 'page': attr('layout', variant); face.append(node('h2', v.title, { slot: 'header' }), node('p', v.text)); break;
    case 'panel': face.append(node('h2', v.title, { slot: 'header' }), node('p', v.text)); break;
    default: throw new Error(`Missing palette renderer: ${entry.id}`);
  }
  face.inert = true;
  return face;
}

function preview(entry: PaletteDefinition, target: HTMLElement, getHost: () => HTMLElement | null) {
  const owner = getHost()?.closest<HTMLElement>('[data-consistency-library]');
  const update = () => applyLibraryTokens(target, owner?.dataset.consistencyLibrary ?? 'original');
  update(); const observer = new MutationObserver(update);
  if (owner) observer.observe(owner, { attributes: true, attributeFilter: ['data-consistency-library'] });
  target.classList.add('consistency-palette-preview');
  const stage = target.ownerDocument.createElement('div'); stage.className = 'consistency-palette-face';
  stage.append(drawPaletteFace(target.ownerDocument, defaultPaletteContent(entry))); target.append(stage);
  return () => { observer.disconnect(); target.replaceChildren(); };
}

/** Aa owns both pickers and each insertion/replace/undo. All entries share one fenced adapter. */
export function paletteAtoms(canWrite: () => boolean, getHost: () => HTMLElement | null): Atom[] {
  const entries = COMPONENT_PALETTE.filter(entry => !['button', 'card', 'carousel'].includes(entry.id));
  const draw: NonNullable<Atom['draw']> = (element, initial) => {
    const value = readPaletteContent(initial);
    if (!value) { element.textContent = initial; return; }
    const entry = paletteDefinition(value.component)!, doc = element.ownerDocument;
    element.classList.add('consistency-content-element', 'consistency-palette-element');
    element.dataset.component = entry.id; element.setAttribute('role', 'group'); element.setAttribute('aria-label', entry.label);
    element.tabIndex = canWrite() ? 0 : -1;
    const stage = doc.createElement('div'); stage.className = 'consistency-palette-face'; stage.append(drawPaletteFace(doc, value)); element.append(stage);
    let overlay: HTMLElementTagNameMap['ds-overlay'] | undefined;
    const commit = (next: PaletteContent) => {
      const source = writePaletteContent(next);
      if (canWrite() && readPaletteContent(source) && source !== initial) element.dispatchEvent(new CustomEvent('aa-atom-source', { bubbles: true, detail: { source } }));
    };
    const edit = () => {
      if (!canWrite() || overlay) return;
      overlay = doc.createElement('ds-overlay'); overlay.setAttribute('aria-label', `Edit ${entry.name}`); overlay.setAttribute('data-aa-interactive', ''); overlay.setAttribute('data-consistency-context', '');
      applyLibraryTokens(overlay, getHost()?.closest<HTMLElement>('[data-consistency-library]')?.dataset.consistencyLibrary ?? 'original');
      const form = doc.createElement('form'); form.className = 'consistency-palette-fields';
      const heading = doc.createElement('h2'); heading.textContent = entry.name; form.append(heading);
      const controls: Record<string, HTMLElementTagNameMap['ds-input']> = {};
      for (const [key, field] of Object.entries(entry.fields)) {
        const input = doc.createElement('ds-input'); input.type = field.type === 'number' ? 'number' : 'text'; input.label = field.label; input.setAttribute('aria-label', field.label); input.value = value.values[key]!; controls[key] = input; form.append(input);
      }
      let variants: HTMLSelectElement | undefined;
      if (entry.variants) {
        const label = doc.createElement('label'); label.textContent = 'Appearance'; const select = doc.createElement('ds-select'); variants = doc.createElement('select'); variants.setAttribute('aria-label', 'Appearance');
        for (const variant of entry.variants) { const option = doc.createElement('option'); option.value = variant; option.textContent = variant; variants.append(option); }
        variants.value = value.variant ?? entry.variants[0]!; select.append(variants); label.append(select); form.append(label);
      }
      const status = doc.createElement('p'); status.setAttribute('role', 'status'); form.append(status);
      const save = doc.createElement('ds-button'); save.textContent = 'Save'; save.setAttribute('primary', '');
      const cancel = doc.createElement('ds-button'); cancel.textContent = 'Cancel';
      const close = () => { overlay?.remove(); overlay = undefined; element.focus(); };
      const submit = (event: Event) => {
        event.preventDefault();
        const next = { ...value, values: Object.fromEntries(Object.entries(controls).map(([key, input]) => [key, input.value])), ...(variants ? { variant: variants.value } : {}) };
        if (!readPaletteContent(writePaletteContent(next))) { status.textContent = 'Check the values and addresses, then try again.'; return; }
        close(); commit(next);
      };
      save.addEventListener('click', submit); form.addEventListener('submit', submit); cancel.addEventListener('click', close);
      const actions = doc.createElement('div'); actions.className = 'consistency-palette-actions'; actions.append(save, cancel); form.append(actions);
      const dialog = doc.createElement('dialog'); dialog.setAttribute('aria-label', `Edit ${entry.name}`); dialog.append(form); overlay.append(dialog); overlay.addEventListener('ds-close-request', event => { event.preventDefault(); close(); }); dialog.addEventListener('close', close); (element.closest('dialog') ?? doc.body).append(overlay); void overlay.show();
    };
    const menu = doc.createElement('ds-context'); menu.setAttribute('data-consistency-context', ''); menu.setAttribute('data-aa-interactive', '');
    const option = (label: string, run: () => void) => { const button = doc.createElement('button'); button.type = 'button'; button.setAttribute('role', 'menuitem'); button.textContent = label; button.addEventListener('click', () => { if (canWrite()) run(); }); menu.append(button); };
    option(`Edit ${entry.name.toLowerCase()}`, edit);
    for (const variant of entry.variants ?? []) option(variant, () => commit({ ...value, variant }));
    const remove = () => { if (canWrite()) element.dispatchEvent(new CustomEvent('aa-atom-source', { bubbles: true, detail: { source: '' } })); };
    option('Delete', remove);
    const context = (event: MouseEvent) => { if (!canWrite()) return; event.preventDefault(); event.stopPropagation(); applyLibraryTokens(menu, getHost()?.closest<HTMLElement>('[data-consistency-library]')?.dataset.consistencyLibrary ?? 'original'); (element.closest('dialog') ?? doc.body).append(menu); menu.openOver({ left: event.clientX, right: event.clientX, top: event.clientY, bottom: event.clientY, width: 0, height: 0 }); };
    const key = (event: KeyboardEvent) => {
      if (event.target !== element || !canWrite()) return;
      if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); edit(); }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); event.stopPropagation(); remove(); }
      if (event.key === 'ContextMenu' || event.shiftKey && event.key === 'F10') { event.preventDefault(); const rect = element.getBoundingClientRect(); context(new MouseEvent('contextmenu', { clientX: rect.left, clientY: rect.bottom })); }
    };
    const button = doc.createElement('ds-button'); button.textContent = `Edit ${entry.name.toLowerCase()}`; button.className = 'consistency-palette-edit'; button.setAttribute('data-aa-interactive', ''); button.addEventListener('click', edit); button.hidden = !canWrite(); element.append(button);
    const refresh = () => { button.hidden = !canWrite(); element.tabIndex = canWrite() ? 0 : -1; if (!canWrite()) { menu.open = false; overlay?.remove(); overlay = undefined; } };
    const observer = new MutationObserver(refresh);
    queueMicrotask(() => { const block = element.closest('.aa-block'); if (block && element.isConnected) observer.observe(block, { attributes: true, attributeFilter: ['data-readonly'] }); });
    element.addEventListener('contextmenu', context); element.addEventListener('keydown', key);
    return () => { observer.disconnect(); menu.remove(); overlay?.remove(); element.removeEventListener('contextmenu', context); element.removeEventListener('keydown', key); };
  };
  return entries.map((entry, index) => ({ name: `consistency-${entry.id}`, ...(index === 0 ? { fence: 'c9y-component' } : {}), match: () => 0, draw,
    insert: { label: entry.label, icon: 'square', keywords: entry.keywords, source: paletteInsertion(entry), preview: target => preview(entry, target, getHost) },
  }));
}
