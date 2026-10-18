import type { Block } from './markdown';
import type { Pos } from './document';
export type Snapshot = {
    blocks: Block[];
    anchor: Pos;
    focus: Pos;
};
/** Letters typed, letters deleted, or anything else, which is always a step of its own. */
export type ChangeKind = 'type' | 'delete' | 'edit';
/**
 * Undo as a stack of whole documents, which are small. Letters typed one
 * after another within a moment are one step, so undo takes back the word,
 * not the letter; deleting is a step apart from typing, and a space after a
 * word begins a new step. Undo puts the caret where the change it took back
 * was, not where the caret stood after the step before.
 */
export declare class History {
    private past;
    private future;
    private lastKind;
    private lastTime;
    private lastBlock;
    constructor(initial: Snapshot);
    get current(): Snapshot;
    reset(snapshot: Snapshot): void;
    record(snapshot: Snapshot, kind: ChangeKind, now?: number): void;
    undo(): Snapshot | null;
    redo(): Snapshot | null;
}
/** Where, in `blocks`, the part that differs from `other` ends; null when nothing differs. */
export declare function changeEnd(blocks: readonly Block[], other: readonly Block[]): Pos | null;
