import { applyLibraryTokens } from './libraries';
import type { Atom } from '../../../website/src/vendor/aa/aa';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-card';
import '../../../DS1/2-core/ds-input';
import '../../../DS1/2-core/ds-switch';
import { provideIcons } from '../../../DS1/2-core/ds-icon';
import cursorIcon from '../../../DS1/x-icon/cursor.svg?raw';
provideIcons({ cursor: cursorIcon });
import '../../../DS1/4-page/ds-overlay';

export type ContentElement = { kind: 'button'; label: string; secondary: boolean } | { kind: 'card'; label: string; title: string; body: string };
const defaults: Record<ContentElement['kind'], ContentElement> = {
  button: { kind: 'button', label: 'Get in touch', secondary: false },
  card: { kind: 'card', label: 'A new idea', title: 'Something worth making', body: 'Write a little about it.' },
};
const text = (value: unknown, limit: number): value is string => typeof value === 'string' && value.length <= limit;
/** Closed fenced Markdown keeps the component data local, readable and lossless. */
export function readContentElement(source: string): ContentElement | null {
  const match = /^```c9y-(button|card)\r?\n([\s\S]*)\r?\n```$/.exec(source);
  if (!match) return null;
  try {
    const value: unknown = JSON.parse(match[2]);
    if (!value || typeof value !== 'object') return null;
    const data = value as Record<string, unknown>;
    if (!text(data.label, 200)) return null;
    if (match[1] === 'button') return typeof data.secondary === 'boolean' ? { kind: 'button', label: data.label, secondary: data.secondary } : null;
    return text(data.title, 500) && text(data.body, 5000) ? { kind: 'card', label: data.label, title: data.title, body: data.body } : null;
  } catch { return null; }
}
export function writeContentElement(value: ContentElement): string {
  const { kind, ...fields } = value;
  // A literal closing fence inside JSON would otherwise close the Markdown atom.
  return `\`\`\`c9y-${kind}\n${JSON.stringify(fields).replaceAll('`', '\\u0060')}\n\`\`\``;
}
function paint(face: HTMLElement, value: ContentElement) {
  face.replaceChildren();
  if (value.kind === 'button') {
    face.textContent = value.label; face.toggleAttribute('secondary', value.secondary); face.toggleAttribute('primary', !value.secondary);
  } else {
    const label = face.ownerDocument.createElement('span'); label.slot = 'label'; label.textContent = value.label;
    const title = face.ownerDocument.createElement('span'); title.slot = 'title'; title.textContent = value.title;
    const body = face.ownerDocument.createElement('p'); body.textContent = value.body;
    face.append(label, title, body); face.setAttribute('variant', 'outlined'); face.setAttribute('data-ds-prose', ''); face.setAttribute('height', '8');
  }
}
/** Aa owns insertion, selection and undo; only this adapter knows component data. */
export function contentElementAtoms(canWrite: () => boolean, getHost: () => HTMLElement | null = () => null): Atom[] {
  return (['button', 'card'] as const).map(kind => ({
    name: `consistency-${kind}`, fence: `c9y-${kind}`, match: () => 0,
    insert: { label: kind === 'button' ? 'Button' : 'Card', icon: kind === 'button' ? 'plus' : 'square', source: writeContentElement(defaults[kind]), keywords: kind, preview: (target: HTMLElement, context?: { input: 'pointer' | 'keyboard' }) => {
      const owner = getHost()?.closest<HTMLElement>('[data-consistency-library]');
      const update = () => applyLibraryTokens(target, owner?.dataset.consistencyLibrary ?? 'original');
      update();
      const observer = new MutationObserver(update);
      if (owner) observer.observe(owner, { attributes: true, attributeFilter: ['data-consistency-library'] });
      target.classList.add('consistency-element-preview');
      const frame = target.ownerDocument.createElement('div'); frame.className = 'consistency-element-preview-stage';
      const face = target.ownerDocument.createElement(kind === 'button' ? 'ds-button' : 'ds-card');
      paint(face, defaults[kind]); face.inert = true; face.setAttribute('aria-hidden', 'true'); frame.append(face);
      const cursor = target.ownerDocument.createElement('ds-icon'); cursor.type = 'cursor'; cursor.className = 'consistency-element-preview-cursor'; cursor.setAttribute('aria-hidden', 'true'); frame.append(cursor);
      const label = target.ownerDocument.createElement('span'); label.className = 'consistency-element-preview-label'; label.textContent = kind === 'button' ? 'A button from your library' : 'A card from your library';
      target.append(frame, label); target.setAttribute('aria-hidden', 'true');
      // Pointer-only feedback demonstrates the specimen; keyboard browsing stays instant.
      const media = target.ownerDocument.defaultView?.matchMedia;
      const canAnimate = () => !!media && media.call(window, '(hover: hover) and (pointer: fine)').matches && !media.call(window, '(prefers-reduced-motion: reduce)').matches;
      let animation: Animation | undefined;
      const over = () => {
        if (!canAnimate() || !cursor.animate) return;
        animation?.cancel();
        animation = cursor.animate([
          { transform: 'translate(20px, 20px)', opacity: 0 },
          { transform: 'translate(0, 0)', opacity: 1, offset: 0.5 },
          { transform: 'translate(0, 0)', opacity: 1, offset: 0.8 },
          { transform: 'translate(0, 0)', opacity: 0 },
        ], { duration: 500, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      };
      target.addEventListener('pointerenter', over);
      const frameRequest = context?.input === 'pointer' ? requestAnimationFrame(over) : undefined;
      return () => { if (frameRequest !== undefined) cancelAnimationFrame(frameRequest); observer.disconnect(); animation?.cancel(); target.removeEventListener('pointerenter', over); target.replaceChildren(); };
    } },
    draw(element, initialSource) {
      let source = initialSource, value = readContentElement(source);
      if (!value) { element.textContent = source; return; }
      const doc = element.ownerDocument;
      element.classList.add('consistency-content-element', `consistency-content-${kind}`);
      element.setAttribute('data-aa-interactive', '');
      const face = doc.createElement(kind === 'button' ? 'ds-button' : 'ds-card');
      face.inert = true; face.setAttribute('aria-hidden', 'true'); paint(face, value); element.append(face);
      let closePanel: (() => void) | undefined;
      const refresh = () => {
        element.tabIndex = canWrite() ? 0 : -1;
        element.setAttribute('role', canWrite() ? 'button' : 'img');
        element.setAttribute('aria-label', `${canWrite() ? 'Edit ' : ''}${kind}: ${value!.label || (value!.kind === 'card' ? value!.title : 'Button')}`);
        if (!canWrite()) closePanel?.();
      };
      refresh();
      const observer = new MutationObserver(refresh);
      queueMicrotask(() => { const block = element.closest('.aa-block'); if (element.isConnected && block) observer.observe(block, { attributes: true, attributeFilter: ['data-readonly'] }); });
      const open = () => {
        if (!canWrite() || closePanel || !value) return;
        const overlay = doc.createElement('ds-overlay');
        const libraryOwner = getHost()?.closest<HTMLElement>('[data-consistency-library]');
        applyLibraryTokens(overlay, libraryOwner?.dataset.consistencyLibrary ?? 'original');
        overlay.type = 'popover'; overlay.closeOnOutside = true; overlay.returnFocus = () => element;
        overlay.setAttribute('data-aa-interactive', '');
        const rect = element.getBoundingClientRect(); overlay.anchor = { x: rect.left, y: rect.bottom };
        const dialog = doc.createElement('dialog'); dialog.className = 'consistency-element-properties'; dialog.setAttribute('aria-label', `Edit ${kind}`);
        const fields = doc.createElement('div'); fields.className = 'consistency-element-fields';
        const field = (label: string, initial: string, max: number) => {
          const input = doc.createElement('ds-input'); input.labelText = label; input.value = initial; input.setAttribute('aria-label', `${kind} ${label.toLowerCase()}`); input.setAttribute('maxlength', String(max)); fields.append(input); return input;
        };
        const label = field('Label', value.label, 200);
        const title = value.kind === 'card' ? field('Title', value.title, 500) : null;
        const body = value.kind === 'card' ? field('Body', value.body, 5000) : null;
        const styleLabel = doc.createElement('label'); styleLabel.textContent = 'Secondary button';
        const secondary = doc.createElement('button'); secondary.type = 'button'; secondary.setAttribute('role', 'switch'); secondary.setAttribute('aria-label', 'Secondary button'); secondary.setAttribute('aria-checked', String(value.kind === 'button' && value.secondary));
        secondary.addEventListener('click', () => secondary.setAttribute('aria-checked', String(secondary.getAttribute('aria-checked') !== 'true')));
        if (value.kind === 'button') { const toggle = doc.createElement('ds-switch'); toggle.append(secondary); styleLabel.prepend(toggle); fields.append(styleLabel); }
        const actions = doc.createElement('div'); actions.className = 'consistency-element-actions';
        const cancel = doc.createElement('ds-button'); cancel.textContent = 'Cancel';
        const apply = doc.createElement('ds-button'); apply.textContent = 'Apply'; apply.primary = true;
        const close = () => { closePanel = undefined; overlay.close(); overlay.remove(); }; closePanel = close;
        cancel.addEventListener('click', close);
        apply.addEventListener('click', () => {
          if (!canWrite()) { close(); return; }
          const next: ContentElement = kind === 'button' ? { kind, label: label.value.slice(0, 200), secondary: secondary.getAttribute('aria-checked') === 'true' } : { kind, label: label.value.slice(0, 200), title: title!.value.slice(0, 500), body: body!.value.slice(0, 5000) };
          const nextSource = writeContentElement(next); close();
          if (nextSource !== source) { source = nextSource; value = next; paint(face, next); refresh(); element.dispatchEvent(new CustomEvent('aa-atom-source', { bubbles: true, detail: { source: nextSource } })); }
        });
        overlay.addEventListener('ds-close-request', event => { event.preventDefault(); close(); });
        actions.append(cancel, apply); dialog.append(fields, actions); overlay.append(dialog); (element.closest('dialog') ?? doc.body).append(overlay);
        void overlay.show({ immediate: true }).then(() => { if (overlay.isConnected) label.focus(); });
      };
      const click = (event: Event) => { event.preventDefault(); event.stopPropagation(); open(); };
      const key = (event: KeyboardEvent) => {
        if (!canWrite()) return;
        if (event.key === 'Enter' || event.key === ' ') click(event);
        if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); event.stopPropagation(); element.dispatchEvent(new CustomEvent('aa-atom-source', { bubbles: true, detail: { source: '' } })); }
      };
      element.addEventListener('click', click); element.addEventListener('keydown', key);
      return () => { observer.disconnect(); closePanel?.(); element.removeEventListener('click', click); element.removeEventListener('keydown', key); };
    },
  }));
}
