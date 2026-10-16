import type { Block } from './markdown';
import type { Pos } from './document';
export type Snapshot = {
    blocks: Block[];
    anchor: Pos;
    focus: Pos;
};
/**
 * Undo as a stack of whole documents, which are small. Letters typed one
 * after another within a moment are one step, so undo takes back the word,
 * not the letter.
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
    record(snapshot: Snapshot, kind: 'type' | 'edit', now?: number): void;
    undo(): Snapshot | null;
    redo(): Snapshot | null;
}
