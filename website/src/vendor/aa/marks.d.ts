/**
 * What an AI answer changed, marked so it can be seen and taken back: a
 * small blue dot after a block it changed, or a soft blue hold round a run of
 * blocks it rewrote or wrote. Hovered or focused, the dot grows into a
 * Revert button (Design system 1's button, in Sharp blue), which puts that
 * change back as it was, the answer's other changes left as they are.
 *
 * The marks stand over the page, as Aa's other floating pieces do, so the
 * blocks and how they read back are untouched; they follow the page as it
 * scrolls and the writing as it moves. A mark goes when its blocks change by
 * hand (they are then other blocks), when it is reverted, or when the marks
 * are put away. They grow and fade by transform and opacity alone, and with
 * less motion asked for they only appear.
 */
import type { Block } from './markdown';
/**
 * One change an answer made: the blocks it put in, the blocks they took the
 * place of, and where in each block put in its words are new (in the block's
 * own offsets); `box` when only a box was ticked or unticked.
 */
export type AiChange = {
    blocks: Block[];
    before: Block[];
    words: [number, number][][];
    box?: boolean;
};
/** The words of `after` that are not in `before`, as ranges into `after`: whole words, the space between two changed words with them. */
export declare function changedWords(before: string, after: string): [number, number][];
/** Whether two blocks differ only in their box being ticked or unticked. */
export declare function onlyBox(before: string, after: string): boolean;
export type Marks = {
    /** Mark these changes, in place of any marked before. */
    set(changes: AiChange[]): void;
    /** Put the marks away, the blue fading back into the ink. */
    clear(): void;
    /** Whether anything is marked. */
    readonly size: number;
    /** Draw the marks where their blocks stand now; a mark whose blocks are gone goes. */
    draw(): void;
    destroy(): void;
};
export type MarksOptions = {
    /** The blocks as they are now, and the element each is drawn in. */
    blocks: () => readonly Block[];
    elements: () => readonly HTMLElement[];
    /** Put a change back; false when it can no longer be. */
    revert: (change: AiChange) => boolean;
    /** The changes still marked, each time they are drawn, so their words can be coloured. */
    shown?: (changes: readonly AiChange[]) => void;
    root?: Element;
};
export declare function createMarks(host: HTMLElement, options: MarksOptions): Marks;
