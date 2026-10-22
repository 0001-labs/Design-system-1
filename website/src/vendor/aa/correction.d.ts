/**
 * Correction as the person writes. The product supplies the call that
 * corrects a block's words (`correct` in the editor's options); Aa decides
 * when to ask and how much of the answer to take. A block is asked about once
 * its words rest: after a short pause in typing, or as soon as the caret
 * leaves it. The answer is put in as an edit from outside, and only where it
 * is safe: the words between Markdown's syntax, never the syntax, never the
 * word the caret is in, never during a composition, and never in a block that
 * changed since it was asked about. Each correction is a step of its own to
 * undo, and one taken back is not made again. The words it changed shimmer
 * once as they are put in (`shimmer.ts`).
 */
import { type AtomSyntax, type Block, type BlockKind } from './markdown';
import type { Pos } from './document';
export type CorrectionContext = {
    /** What the block is: a paragraph, a heading, a bullet, a quote or a callout. */
    kind: BlockKind;
    /** The Markdown just before and after the block, to read it by; never to be corrected. */
    before: string;
    after: string;
    /** Aborted once the answer can no longer be used: the block changed, or correction stopped. */
    signal: AbortSignal;
};
/** Given a block's Markdown, the same Markdown with its spelling, grammar and punctuation corrected. */
export type Corrector = (text: string, context: CorrectionContext) => Promise<string>;
/** One change to a block's source: the characters from `from` to `to` give way to `text`. */
export type Edit = {
    from: number;
    to: number;
    text: string;
};
/** How long typing rests before the block with the caret is asked about. */
export declare const PAUSE = 400;
/** Whether a block has words for correction to read. */
export declare function correctable(block: Block): boolean;
/** The ranges of a block's source that are words: its text, without syntax, code, atoms or addresses. */
export declare function wordRanges(block: Block, atoms?: readonly AtomSyntax[]): [number, number][];
/** The edits that turn `before` into `after`, a word at a time, in order. */
export declare function diffWords(before: string, after: string): Edit[];
export declare const pair: (old: string, text: string) => string;
export type Corrections = {
    edits: Edit[];
    partial: boolean;
};
/**
 * What of an answer may be put in a block: the edits within its words, none
 * that touches the protected range (the words the caret is in), none taken
 * back before, and only while the block reads as the same Markdown. An answer
 * that rewrites rather than corrects is not taken at all. `partial` says some
 * edits were held back for the caret, to be made once it has gone.
 */
export declare function corrections(block: Block, answer: string, options?: {
    atoms?: readonly AtomSyntax[];
    protect?: readonly [number, number] | null;
    rejected?: ReadonlySet<string>;
}): Corrections;
export declare function applyEdits(source: string, edits: readonly Edit[]): string;
/** The words the edits changed, as they stand once made: each edit widened to the whole words it touches. */
export declare function correctedWords(source: string, edits: readonly Edit[]): [number, number][];
/** Where an offset into a source stands once the edits are made. */
export declare function shift(offset: number, edits: readonly Edit[]): number;
/** The words a selection is in, which are being written: from the start of the first to the end of the last. */
export declare function wordAround(text: string, from: number, to?: number): [number, number];
/** What the editor lends correction: its blocks, its selection, and a way to put a correction in. */
export type CorrectionHost = {
    blocks(): readonly Block[];
    atoms: readonly AtomSyntax[];
    selection(): {
        anchor: Pos;
        focus: Pos;
    } | null;
    /** Whether the text may not be touched now: during a composition, or read only. */
    busy(): boolean;
    /** Put a block's corrected source in, as one step to undo, offsets in it moving through `shift`; `changed` are the words corrected, in the new source. */
    apply(index: number, source: string, shift: (offset: number) => number, changed: readonly [number, number][]): void;
    value(): string;
};
export type Correction = {
    /** Whether it corrects; false stops it, dropping what is asked. */
    enabled: boolean;
    /** The person changed the blocks; `typed` when it was typing rather than a command. */
    written(before: readonly Block[], typed: boolean): void;
    /** The caret moved: the blocks it left are asked about now. */
    moved(): void;
    /** Undo is about to take a step back: a correction it takes back is not made again. */
    undoing(): void;
    /** Drop everything asked and waiting. */
    stop(): void;
};
export declare function createCorrection(host: CorrectionHost, correct: Corrector, enabled?: boolean): Correction;
