import type { EditorMedia } from './media';
import { createSurfaceElement } from './editor-surface';
import { createButtonActionControls } from './button-action';
import { carouselAtom, readCarousel, type CarouselContent } from './carousel';
import { applyLibraryTokens } from './libraries';
import type { Atom } from '../../../website/src/vendor/aa/aa';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-card';
import { createPlainEditor } from '../../../website/src/vendor/aa/aa';
import '../../../DS1/3-unit/ds-context';
import './elements.css';
import { provideIcons } from '../../../DS1/2-core/ds-icon';
import cursorIcon from '../../../DS1/x-icon/cursor.svg?raw';
provideIcons({ cursor: cursorIcon });
import '../../../DS1/4-page/ds-overlay';

import { tones, componentDefaults as defaults, readBasicContentElement, writeBasicContentElement, type BasicContentElement } from '../../../shared/consistency-content';
export type ContentElement = CarouselContent | BasicContentElement;
export function readContentElement(source: string): ContentElement | null {
  return source.startsWith('```c9y-carousel') ? readCarousel(source) : readBasicContentElement(source);
}
export function writeContentElement(value: ContentElement): string {
  if (value.kind === 'carousel') {
    const { kind: _, ...fields } = value;
    return '```c9y-carousel\n' + JSON.stringify(fields).replaceAll('`', '\\u0060') + '\n```';
  }
  return writeBasicContentElement(value);
}
function paint(face: HTMLElement, value: Exclude<ContentElement, CarouselContent>) {
  face.replaceChildren();
  if (value.kind === 'button') {
    const label = face.ownerDocument.createElement('span'); label.textContent = value.label; face.append(label); face.setAttribute('control', 'host'); face.toggleAttribute('secondary', value.secondary); face.toggleAttribute('primary', !value.secondary);
  } else {
    const label = face.ownerDocument.createElement('span'); label.slot = 'label'; label.textContent = value.label;
    const title = face.ownerDocument.createElement('span'); title.slot = 'title'; title.textContent = value.title;
    const body = face.ownerDocument.createElement('p'); body.textContent = value.body;
    for (const [key, gap] of Object.entries(value.gaps ?? {})) face.style.setProperty(`--ds-card-${key}-gap`, `calc(${gap}px * var(--sf))`);
    face.append(label, title, body); face.setAttribute('variant', value.variant ?? 'outlined'); if (value.tone) face.setAttribute('tone', value.tone); face.setAttribute('data-ds-prose', ''); face.setAttribute('height', String((value.height ?? 160) / 20)); if (value.width) face.style.width = `calc(${value.width}px * var(--sf))`; if (value.height) face.style.height = `calc(${value.height}px * var(--sf))`;
  }
}
/** Aa owns insertion, selection and undo; only this adapter knows component data. */
export function contentElementAtoms(canWrite: () => boolean, getHost: () => HTMLElement | null = () => null, media?: EditorMedia): Atom[] {
  const atoms: Atom[] = (['button', 'card'] as const).map(kind => ({
    name: `consistency-${kind}`, fence: `c9y-${kind}`, match: () => 0,
    insert: { label: kind === 'button' ? 'Button' : 'Card', icon: kind === 'button' ? 'plus' : 'square', source: writeContentElement(defaults[kind]), keywords: kind, preview: (target: HTMLElement, context?: { input: 'pointer' | 'keyboard' }) => {
      const owner = getHost()?.closest<HTMLElement>('[data-consistency-library]');
      const update = () => applyLibraryTokens(target, owner?.dataset.consistencyLibrary ?? 'original', owner?.dataset.consistencyFonts);
      update();
      const observer = new MutationObserver(update);
      if (owner) observer.observe(owner, { attributes: true, attributeFilter: ['data-consistency-library', 'data-consistency-fonts'] });
      target.classList.add('consistency-element-preview');
      const frame = target.ownerDocument.createElement('div'); frame.className = 'consistency-element-preview-stage';
      const face = createSurfaceElement(target.ownerDocument, kind === 'button' ? 'ds-button' : 'ds-card');
      paint(face, defaults[kind]); face.inert = true; face.setAttribute('aria-hidden', 'true'); frame.append(face);
      const cursor = createSurfaceElement(target.ownerDocument, 'ds-icon'); cursor.type = 'cursor'; cursor.className = 'consistency-element-preview-cursor'; cursor.setAttribute('aria-hidden', 'true'); frame.append(cursor);
      const label = target.ownerDocument.createElement('span'); label.className = 'consistency-element-preview-label'; label.textContent = kind === 'button' ? 'A button from your library' : 'A card from your library';
      const inner = target.ownerDocument.createElement('div'); inner.className = 'consistency-element-preview-inner'; inner.append(frame, label); target.append(inner); target.setAttribute('aria-hidden', 'true');
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
      if (!value || value.kind === 'carousel') { element.textContent = source; return; }
      const doc = element.ownerDocument;
      element.classList.add('consistency-content-element', `consistency-content-${kind}`);
      if (kind === 'button') element.setAttribute('data-aa-interactive', '');
      const face = createSurfaceElement(doc, kind === 'button' ? 'ds-button' : 'ds-card');
      paint(face, value); element.append(face);
      const editors: ReturnType<typeof createPlainEditor>[] = [];
      const fields = value.kind === 'card' ? ['label', 'title', 'body'] as const : ['label'] as const;
      const nodes = Array.from(face.children) as HTMLElement[];
      const commit = () => {
        if (!canWrite() || !value) return false;
        const next = { ...value };
        fields.forEach((field, index) => { (next as unknown as Record<string, unknown>)[field] = editors[index].value.slice(0, field === 'body' ? 5000 : field === 'title' ? 500 : 200); });
        const nextSource = writeContentElement(next);
        const previous = readContentElement(source);
        if (previous && writeContentElement(previous) === nextSource) return false;
        value = next; source = nextSource;
        element.dispatchEvent(new CustomEvent('aa-atom-source', { bubbles: true, detail: { source } }));
        return true;
      };
      fields.forEach((field, index) => {
        const node = nodes[index];
        node.setAttribute('data-aa-interactive', ''); node.setAttribute('aria-label', `${kind} ${field}`);
        const editor = createPlainEditor(node, { value: (value as unknown as Record<string, string>)[field], readOnly: !canWrite() });
        editors.push(editor);
      });
      // Keep native text selection, paste and composition within the rendered face.
      // Commit at the end of a field edit so Aa records one normal atom history entry.
      const resize = (event: Event) => { if (value?.kind !== 'card' || !canWrite()) return; const size = (event as CustomEvent<{ width: number; height: number }>).detail; value = { ...value, width: size.width, height: size.height }; commit(); };
      element.addEventListener('consistency-resize', resize);
      const gap = (event: Event) => { if (value?.kind !== 'card' || !canWrite()) return; const detail = (event as CustomEvent<{ key: string; value: number; height: number }>).detail; value = { ...value, gaps: { ...value.gaps, [detail.key]: detail.value }, height: detail.height }; commit(); };
      element.addEventListener('consistency-card-gap', gap);
      const blur = (event: FocusEvent) => { if (nodes.some(node => node.contains(event.target as Node))) commit(); };
      element.addEventListener('focusout', blur);
      let actionBar: HTMLElement | undefined;
      let actionControls: ReturnType<typeof createButtonActionControls> | undefined;
      if (value.kind === 'button') {
        actionControls = createButtonActionControls(doc, value.action, canWrite, action => { if (value?.kind === 'button') { value = { ...value, action }; commit(); } });
        actionBar = actionControls.element; actionBar.className = 'consistency-button-action'; actionBar.inert = true; actionBar.setAttribute('aria-hidden', 'true');
        actionBar.setAttribute('role', 'toolbar'); actionBar.setAttribute('aria-label', 'Button action'); actionBar.setAttribute('data-aa-interactive', '');
        element.append(actionBar);
      }
      let hover = false, leaveTimer: ReturnType<typeof setTimeout> | undefined;
      const showAction = (keyboard = false) => {
        if (!actionBar || !canWrite()) return;
        clearTimeout(leaveTimer); actionBar.inert = false; actionBar.removeAttribute('aria-hidden');
        actionBar.toggleAttribute('data-keyboard', keyboard); actionBar.setAttribute('data-open', '');
      };
      const focus = () => showAction(true);
      const leave = () => {
        clearTimeout(leaveTimer);
        leaveTimer = setTimeout(() => {
          if (!actionBar || hover || element.contains(doc.activeElement)) return;
          actionBar.removeAttribute('data-open'); actionBar.inert = true; actionBar.setAttribute('aria-hidden', 'true');
        }, 150);
      };
      const dismissAction = (event: PointerEvent) => {
        if (!actionBar || event.composedPath().includes(element)) return;
        clearTimeout(leaveTimer); actionBar.removeAttribute('data-open'); actionBar.inert = true; actionBar.setAttribute('aria-hidden', 'true');
      };
      doc.addEventListener('pointerdown', dismissAction, true);
      const enter = (event: PointerEvent) => { if (hover || event.pointerType === 'touch' || event.buttons || element.closest('[data-pointer-busy]')) return; hover = true; showAction(); };
      const pointerLeave = () => { hover = false; leave(); };
      element.addEventListener('focusin', focus); element.addEventListener('focusout', leave);
      element.addEventListener('pointerenter', enter); element.addEventListener('pointermove', enter); element.addEventListener('pointerleave', pointerLeave);
      const menu = createSurfaceElement(doc, 'ds-context');
      menu.setAttribute('data-aa-interactive', ''); menu.setAttribute('data-consistency-context', ''); menu.setAttribute('aria-label', `${kind} appearance`);
      const option = (label: string, change: () => void) => {
        const row = doc.createElement('button'); row.type = 'button'; row.setAttribute('role', 'menuitem'); row.textContent = label;
        row.addEventListener('click', () => { if (!canWrite()) return; change(); commit(); }); menu.append(row);
      };
      if (value.kind === 'button') {
        option('Primary button', () => { if (value?.kind === 'button') { value.secondary = false; face.toggleAttribute('primary', true); face.toggleAttribute('secondary', false); } });
        option('Secondary button', () => { if (value?.kind === 'button') { value.secondary = true; face.toggleAttribute('primary', false); face.toggleAttribute('secondary', true); } });
      } else {
        for (const variant of ['filled', 'outlined'] as const) option(variant === 'filled' ? 'Filled card' : 'Outlined card', () => { if (value?.kind === 'card') { value.variant = variant; face.setAttribute('variant', variant); } });
        for (const tone of tones) option(tone ? tone.replaceAll('-', ' ').replace(/^./, char => char.toUpperCase()) : 'Default colour', () => {
          if (value?.kind === 'card') { value.tone = tone; value.variant = 'filled'; face.setAttribute('tone', tone); face.setAttribute('variant', 'filled'); }
        });
      }
      const refresh = () => {
        element.tabIndex = canWrite() ? 0 : -1;
        element.setAttribute('role', 'group'); element.setAttribute('aria-label', kind === 'button' ? 'Button' : 'Card');
        editors.forEach(editor => { editor.readOnly = !canWrite(); });
        face.inert = !canWrite();
        if (!canWrite()) { menu.open = false; if (actionBar) { actionBar.inert = true; actionBar.removeAttribute('data-open'); actionBar.setAttribute('aria-hidden', 'true'); } }
      };
      refresh();
      const observer = new MutationObserver(refresh);
      queueMicrotask(() => { const block = element.closest('.aa-block'); if (element.isConnected && block) observer.observe(block, { attributes: true, attributeFilter: ['data-readonly'] }); });
      const context = (event: MouseEvent) => {
        if (!canWrite()) return;
        event.preventDefault(); event.stopPropagation();
        const host = getHost(), index = host ? Array.from(host.querySelectorAll('.aa-atom')).indexOf(element) : -1;
        commit();
        // A changed field may redraw its atom. Open the context on that live
        // replacement, never a menu whose write callback belongs to detached DOM.
        if (!element.isConnected) {
          const replacement = index >= 0 ? host?.querySelectorAll('.aa-atom')[index] : null;
          replacement?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: event.clientX, clientY: event.clientY }));
          return;
        }
        applyLibraryTokens(menu, getHost()?.closest<HTMLElement>('[data-consistency-library]')?.dataset.consistencyLibrary ?? 'original');
        (element.closest('dialog') ?? doc.body).append(menu); menu.openOver({ left: event.clientX, right: event.clientX, top: event.clientY, bottom: event.clientY, width: 0, height: 0 });
      };
      const key = (event: KeyboardEvent) => {
        if (!canWrite()) return;
        if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
          event.preventDefault(); const rect = element.getBoundingClientRect(); context(new MouseEvent('contextmenu', { clientX: rect.left, clientY: rect.bottom })); return;
        }
        if (event.target !== element) return;
        if (event.key === 'Enter') { event.preventDefault(); editors[0].focus(); }
        if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); event.stopPropagation(); element.dispatchEvent(new CustomEvent('aa-atom-source', { bubbles: true, detail: { source: '' } })); }
      };
      element.addEventListener('contextmenu', context); element.addEventListener('keydown', key);
      return () => { actionControls?.dispose(); doc.removeEventListener('pointerdown', dismissAction, true); clearTimeout(leaveTimer); element.removeEventListener('pointerenter', enter); element.removeEventListener('pointermove', enter); element.removeEventListener('pointerleave', pointerLeave); observer.disconnect(); element.removeEventListener('consistency-resize', resize); element.removeEventListener('consistency-card-gap', gap); element.removeEventListener('focusin', focus); element.removeEventListener('focusout', leave); editors.forEach(editor => editor.destroy()); menu.remove(); element.removeEventListener('focusout', blur); element.removeEventListener('contextmenu', context); element.removeEventListener('keydown', key); };
    },
  }));
  return [...atoms, carouselAtom(canWrite, getHost, media)];
}
