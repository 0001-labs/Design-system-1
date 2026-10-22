import type { Atom, Editor } from './editor';
import './vendor/ds1/2-core/ds-button';
import './vendor/ds1/2-core/ds-input';
import './vendor/ds1/3-unit/ds-select';
import './vendor/ds1/4-page/ds-overlay';
export { BUTTON_STATES, BUTTON_PARTIAL, readButtonPartial, writeButtonPartial, type ButtonState, type ButtonPartial } from './button-partial';
/** A real component used as an illustration. The wrapper edits even a disabled specimen. */
export declare function buttonPartialAtom(canWrite: () => boolean): Atom;
/** Suggestions keep the caret in the sentence; DS1 owns placement and keyboard navigation. */
export declare function createPartialPicker(editor: Editor): () => void;
