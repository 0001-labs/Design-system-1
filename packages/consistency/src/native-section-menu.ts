import type { NativeSection } from '../../../shared/consistency-native-page';
import type { FieldDefinition, KindDefinition } from '../../../shared/consistency-vocabulary';
import { createSurfaceElement } from './editor-surface';
import { TONE_NAMES, kindDefinition, sectionLabel, sectionValue } from './native-page-model';
import '../../../DS1/2-core/ds-number';
import '../../../DS1/2-core/ds-icon';

/** A camelCase field name as words: `panelTone` reads Panel tone. */
export const fieldWords = (name: string) => (name.charAt(0).toUpperCase() + name.slice(1)).replace(/([a-z])([A-Z])/g, (_, a: string, b: string) => `${a} ${b.toLowerCase()}`);
/** A choice or tone as words: `pastel-1` reads Pastel 1, `centre` Centre; a ratio stays as written. */
export const choiceWords = (value: string) => /^\d/.test(value) ? value : (value.charAt(0).toUpperCase() + value.slice(1)).replaceAll('-', ' ');

const check = (doc: Document) => { const icon = createSurfaceElement(doc, 'ds-icon') as HTMLElement & { type: string }; icon.type = 'check'; icon.setAttribute('aria-hidden', 'true'); return icon; };
/** A row that chooses one value or turns one on, staying open so the next choice can follow. */
function choiceRow(menu: HTMLElement, role: 'menuitemradio' | 'menuitemcheckbox', text: string, checked: () => boolean, run: () => void): () => void {
  const doc = menu.ownerDocument, row = doc.createElement('button'); row.type = 'button'; row.setAttribute('role', role); row.setAttribute('data-keep-open', '');
  const words = doc.createElement('span'); words.textContent = text; row.append(words);
  const paint = () => { const on = checked(); row.setAttribute('aria-checked', String(on)); const mark = row.querySelector('ds-icon'); if (on && !mark) row.append(check(doc)); else if (!on && mark) mark.remove(); };
  row.addEventListener('click', run); menu.append(row); paint(); return paint;
}
function label(menu: HTMLElement, text: string) { const row = menu.ownerDocument.createElement('span'); row.setAttribute('data-ds-menu-label', ''); row.textContent = text; menu.append(row); }
function separator(menu: HTMLElement) { const rule = menu.ownerDocument.createElement('hr'); rule.setAttribute('data-ds-menu-separator', ''); menu.append(rule); }
/** A whole number set by hand: the Number control, a step of one, inside the kind's range; the menu keeps its hands off its arrows. */
function numberRow(menu: HTMLElement, name: string, field: FieldDefinition, value: number, run: (value: number) => void) {
  const doc = menu.ownerDocument, row = doc.createElement('div'); row.setAttribute('data-keep-open', ''); row.setAttribute('data-aa-interactive', ''); row.className = 'consistency-native-number';
  const number = createSurfaceElement(doc, 'ds-number') as HTMLElement & { value: number; min?: number; max?: number; step: number; label: string; unit: string; width: number; defaultValue?: number };
  number.label = fieldWords(name); number.setAttribute('aria-label', fieldWords(name)); number.value = value; number.step = field.step ?? 1; number.width = 8;
  if (field.min !== undefined) number.min = field.min; if (field.max !== undefined) number.max = field.max; if (typeof field.default === 'number') number.defaultValue = field.default;
  number.unit = field.type === 'squares' ? 'sq' : '';
  number.addEventListener('change', () => run(Number(number.value)));
  row.addEventListener('keydown', event => { if (event.key !== 'Escape' && event.key !== 'Tab') event.stopPropagation(); });
  row.append(number); menu.append(row);
}

/**
 * A section's fields from the vocabulary, as rows of its menu: a choice as one row a value, the
 * current one checked; a boolean as a row that turns it on or off; a tone as the tone list; a
 * measure in squares or a count as the Number control. Nothing here is a table of the editor's own.
 */
export function appendSectionFields(menu: HTMLElement, read: () => NativeSection | undefined, commit: (patch: Record<string, unknown>) => void) {
  const block = read(); const definition = block && kindDefinition(block.kind); if (!block || !definition) return;
  const fields = Object.entries(definition.fields); if (!fields.length) return;
  separator(menu);
  const paints: Array<() => void> = [], repaint = () => paints.forEach(paint => paint());
  const current = (name: string) => { const value = read(); return value ? sectionValue<unknown>(value, name) : undefined; };
  const set = (patch: Record<string, unknown>) => { commit(patch); repaint(); };
  for (const [name, field] of fields) {
    switch (field.type) {
      case 'boolean': paints.push(choiceRow(menu, 'menuitemcheckbox', fieldWords(name), () => current(name) === true, () => set({ [name]: current(name) !== true }))); break;
      case 'choice': label(menu, fieldWords(name)); for (const choice of field.choices ?? []) paints.push(choiceRow(menu, 'menuitemradio', choiceWords(choice), () => current(name) === choice, () => set({ [name]: choice }))); break;
      case 'tone': paints.push(appendToneList(menu, fieldWords(name), () => current(name) as string | undefined, field.default === undefined, tone => set({ [name]: tone }))); break;
      case 'squares': case 'integer': numberRow(menu, name, field, Number(current(name) ?? field.min ?? 0), value => set({ [name]: value })); break;
      default: break;
    }
  }
}
/** The tone list: every tone the library defines, and None where the field may be left out. Returns what repaints the checks. */
export function appendToneList(menu: HTMLElement, heading: string, current: () => string | undefined, optional: boolean, choose: (tone: string | undefined) => void): () => void {
  label(menu, heading);
  const paints: Array<() => void> = [], repaint = () => paints.forEach(paint => paint()), set = (tone: string | undefined) => { choose(tone); repaint(); };
  if (optional) paints.push(choiceRow(menu, 'menuitemradio', 'None', () => current() === undefined, () => set(undefined)));
  for (const tone of TONE_NAMES) paints.push(choiceRow(menu, 'menuitemradio', choiceWords(tone), () => current() === tone, () => set(tone)));
  return repaint;
}
/** The section kinds by name, each described in its tooltip and to assistive technology. */
export function appendKindChooser(menu: HTMLElement, kinds: readonly KindDefinition[], choose: (kind: string) => void) {
  const doc = menu.ownerDocument;
  for (const definition of kinds) {
    const row = doc.createElement('button'); row.type = 'button'; row.setAttribute('role', 'menuitem'); row.textContent = sectionLabel(definition.kind);
    row.setAttribute('data-tooltip', definition.description); row.setAttribute('aria-description', definition.description);
    row.addEventListener('click', () => choose(definition.kind)); menu.append(row);
  }
}
