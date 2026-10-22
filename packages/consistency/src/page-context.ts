import { Context } from '../../../DS1/3-unit/ds-context';
import { applyLibraryTokens, libraryTokens } from './libraries';
export const PAGE_TONES = ['', 'sharp-blue', 'apple-green', 'pink', 'orange', 'yellow', 'ink'] as const;
/** Only the website's empty surface owns this menu; child editors keep theirs. */
export function isPageBackground(target: Element, sheet: HTMLElement): boolean {
 return sheet.contains(target) && !target.closest('aa-editor,ds-card,ds-button,ds-stat,input,textarea,select,button,a,[contenteditable],[role="slider"],.consistency-resize-edge,.consistency-card-gap');
}
export class PageContextMenu {
 private menu = new Context();
 private sheet?: HTMLElement;
 constructor(private root: HTMLElement, private state: { tone: () => string; commit: (tone: string) => void }) {
  this.menu.setAttribute('aria-label', 'Page background colour');
  for (const tone of PAGE_TONES) {
   const row = document.createElement('button'); row.type = 'button'; row.setAttribute('role', 'menuitem');
   row.textContent = tone ? tone.replaceAll('-', ' ').replace(/^./, value => value.toUpperCase()) : 'Default colour';
   row.addEventListener('click', () => this.state.commit(tone)); this.menu.append(row);
  }
  root.addEventListener('contextmenu', this.context);
  root.addEventListener('keydown', this.keyboard);
 }
 private context = (event: MouseEvent) => {
  if (!this.sheet || !(event.target instanceof Element) || !isPageBackground(event.target, this.sheet) || event.defaultPrevented) return;
  event.preventDefault(); event.stopPropagation();
  this.openAt(event.clientX, event.clientY);
 };
 private openAt(x: number, y: number) {
  if (!this.sheet) return;
  applyLibraryTokens(this.menu, this.sheet.dataset.consistencyLibrary ?? 'original');
  (this.sheet.closest('dialog') ?? document.body).append(this.menu);
  this.menu.openOver({ left: x, right: x, top: y, bottom: y, width: 0, height: 0 });
 };
 private keyboard = (event: KeyboardEvent) => {
  if (!this.sheet || event.target !== this.sheet || !(event.key === 'ContextMenu' || event.shiftKey && event.key === 'F10')) return;
  event.preventDefault(); const rect = this.sheet.getBoundingClientRect();
  this.openAt(rect.left + 20, rect.top + 20);
 };
 refresh() {
  this.sheet = this.root.querySelector<HTMLElement>('.consistency-sheet') ?? undefined;
  if (!this.sheet) return;
  this.sheet.tabIndex = 0; this.sheet.setAttribute('aria-label', 'Website page');
  const tone = PAGE_TONES.find(value => value === this.state.tone()) ?? '';
  this.sheet.style.backgroundColor = tone === 'ink' ? 'var(--ds-black)' : tone ? `var(--one-${tone}-pastel)` : '';
  const base = libraryTokens(this.sheet.dataset.consistencyLibrary ?? 'original');
  for (const key of ['--ds-text-color', '--ds-text-color-muted']) {
   const value = tone ? key === '--ds-text-color' ? tone === 'ink' ? 'var(--ds-white)' : 'var(--ds-black)' : tone === 'ink' ? 'var(--ds-slate-light)' : 'var(--ds-grey)' : base[key];
   if (value) this.sheet.style.setProperty(key, value); else this.sheet.style.removeProperty(key);
  }
  this.sheet.style.colorScheme = tone ? tone === 'ink' ? 'dark' : 'light' : this.sheet.dataset.consistencyLibrary === 'ink' ? 'dark' : this.sheet.dataset.consistencyLibrary === 'blue' ? 'light' : '';
 }
 destroy() { this.root.removeEventListener('contextmenu', this.context); this.root.removeEventListener('keydown', this.keyboard); this.menu.remove(); }
}
