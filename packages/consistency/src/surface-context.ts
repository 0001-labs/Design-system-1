import { Context } from '../../../DS1/3-unit/ds-context';
import { applyLibraryTokens } from './libraries';
export type StatDesign = { color?: string };
export type ButtonDesign = { appearance?: 'plain' | 'primary' | 'secondary' };
export const SURFACE_TONES = ['', 'sharp-blue', 'apple-green', 'pink', 'orange', 'yellow', 'purple', 'ink'] as const;
export function editableSurface(target: Element): HTMLElement | null {
 const surface = target.closest<HTMLElement>('ds-card[data-selectable],ds-stat[data-selectable],ds-button[data-selectable]');
 return surface && surface.closest('.consistency-sheet') && !surface.closest('.aa-atom') ? surface : null;
}
/** Rendered sample components own their appearance menu; Aa retains its text menu. */
export class SurfaceContextMenu {
 private menu?: Context;
 private buttonDefaults = new WeakMap<HTMLElement, { primary: boolean; secondary: boolean }>();
 constructor(private root: HTMLElement, private state: {
  stats: () => Record<string, StatDesign>;
  buttons: () => Record<string, ButtonDesign>;
  commit: (kind: 'card' | 'stat' | 'button', id: string, patch: Record<string, unknown>) => void;
 }) { root.addEventListener('contextmenu', this.context); root.addEventListener('keydown', this.keyboard); }
 refresh() {
  for (const surface of this.root.querySelectorAll<HTMLElement>('.consistency-sheet ds-card[data-selectable],.consistency-sheet ds-stat[data-selectable],.consistency-sheet ds-button[data-selectable]')) {
   if (surface.tagName !== 'DS-BUTTON') surface.tabIndex = 0;
   const id = surface.dataset.selectable!;
   if (surface.tagName === 'DS-STAT') {
    const color = this.state.stats()[id]?.color;
    const value = color && SURFACE_TONES.includes(color as typeof SURFACE_TONES[number]) ? color === 'ink' ? 'light-dark(var(--ds-black),var(--ds-white))' : `light-dark(color-mix(in srgb,var(--ds-${color}) 50%,var(--ds-black)),color-mix(in srgb,var(--ds-${color}) 50%,var(--ds-white)))` : '';
    for (const role of ['--ds-text-color', '--ds-text-color-muted']) { if (value) surface.style.setProperty(role, value); else surface.style.removeProperty(role); }
   }
   if (surface.tagName === 'DS-BUTTON') {
    if (!this.buttonDefaults.has(surface)) this.buttonDefaults.set(surface, { primary: surface.hasAttribute('primary'), secondary: surface.hasAttribute('secondary') });
    const appearance = this.state.buttons()[id]?.appearance, defaults = this.buttonDefaults.get(surface)!;
    surface.toggleAttribute('primary', appearance ? appearance === 'primary' : defaults.primary); surface.toggleAttribute('secondary', appearance ? appearance === 'secondary' : defaults.secondary);
   }
  }
 }
 private context = (event: MouseEvent) => { if (!(event.target instanceof Element) || event.defaultPrevented) return; const surface = editableSurface(event.target); if (!surface) return; event.preventDefault(); event.stopPropagation(); this.open(surface, event.clientX, event.clientY); };
 private keyboard = (event: KeyboardEvent) => { if (!(event.target instanceof Element) || !(event.key === 'ContextMenu' || event.shiftKey && event.key === 'F10')) return; const surface = editableSurface(event.target); if (!surface) return; event.preventDefault(); event.stopPropagation(); const rect = surface.getBoundingClientRect(); this.open(surface, rect.left, rect.bottom); };
 private open(surface: HTMLElement, x: number, y: number) {
  this.menu?.remove(); const menu = this.menu = new Context(); const kind = surface.tagName === 'DS-CARD' ? 'card' : surface.tagName === 'DS-STAT' ? 'stat' : 'button';
  menu.setAttribute('aria-label', `${kind[0].toUpperCase() + kind.slice(1)} appearance`); applyLibraryTokens(menu, surface.closest<HTMLElement>('[data-consistency-library]')?.dataset.consistencyLibrary ?? 'original');
  const option = (label: string, patch: Record<string, unknown>) => { const row = document.createElement('button'); row.type = 'button'; row.setAttribute('role', 'menuitem'); row.textContent = label; row.addEventListener('click', () => this.state.commit(kind, surface.dataset.selectable!, patch)); menu.append(row); };
  if (kind === 'card') {
   option('Filled card', { variant: 'filled' }); option('Outlined card', { variant: 'outlined' });
   for (const tone of SURFACE_TONES) option(tone ? tone.replaceAll('-', ' ').replace(/^./, value => value.toUpperCase()) : 'Default colour', { tone, variant: 'filled' });
  } else if (kind === 'stat') {
   for (const color of SURFACE_TONES) option(color ? `${color.replaceAll('-', ' ').replace(/^./, value => value.toUpperCase())} text` : 'Default text colour', { color });
  } else { option('Plain button', { appearance: 'plain' }); option('Primary button', { appearance: 'primary' }); option('Secondary button', { appearance: 'secondary' }); }
  (surface.closest('dialog') ?? document.body).append(menu); menu.openOver({ left: x, right: x, top: y, bottom: y, width: 0, height: 0 });
 }
 destroy() { this.root.removeEventListener('contextmenu', this.context); this.root.removeEventListener('keydown', this.keyboard); this.menu?.remove(); }
}
