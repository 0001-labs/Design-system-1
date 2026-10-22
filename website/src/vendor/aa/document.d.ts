/**
 * The document and what can be done to it. Every change is one replacement:
 * the text between two positions gives way to new text, and the blocks it
 * touched are read again, so a bullet typed at the start of a paragraph is a
 * bullet, and a paragraph that lost its `## ` is a paragraph.
 */
import { serialize, type Block, type CalloutColor } from './markdown';
/** A place in the document: a block, and a character offset into its source. */
export type Pos = {
    block: number;
    offset: number;
};
export type Change = {
    blocks: Block[];
    caret: Pos;
};
export declare function fromMarkdown(text: string): Block[];
export declare const toMarkdown: typeof serialize;
export declare function comparePos(a: Pos, b: Pos): number;
/** The two ends of a selection, first one first. */
export declare function order(a: Pos, b: Pos): [Pos, Pos];
/** Replace what stands between `from` and `to` with `text`. The caret lands after the text. */
export declare function replaceRange(blocks: readonly Block[], from: Pos, to: Pos, text: string): Change;
/** The Markdown between two positions, as it would be copied. */
export declare function sliceMarkdown(blocks: readonly Block[], from: Pos, to: Pos): string;
/**
 * Enter: the block ends at the caret and a new one begins with the rest. A
 * bullet goes on as a bullet (numbered one on, its box empty) and an empty
 * one ends the list; a quote goes on quoting and an empty line ends it; a
 * line in code is a line, and after a closed fence a paragraph follows; a
 * heading's rest is a paragraph.
 */
export declare function splitAt(blocks: readonly Block[], pos: Pos): Change;
/** Backspace at the start of a heading, bullet or quote: it becomes a paragraph. */
export declare function liftPrefix(blocks: readonly Block[], index: number): Change | null;
/** Backspace at the very start of a block: it joins the block before it. */
export declare function joinWithPrevious(blocks: readonly Block[], index: number): Change | null;
/** Delete at the very end of a block: the next block joins it. */
export declare function joinWithNext(blocks: readonly Block[], index: number): Change | null;
export type Wrapped = {
    blocks: Block[];
    anchor: Pos;
    focus: Pos;
};
/**
 * Put a mark round the selection, or take it off: `**` for bold. Within
 * each selected block. With nothing selected the delimiters are typed with the
 * caret between them.
 */
export declare function wrapSelection(blocks: readonly Block[], from: Pos, to: Pos, delimiter: string, closing?: string): Wrapped | null;
/**
 * Write the selected words in a colour (`<span color="red">`), or back in the
 * text's own with `null`: a colour already round exactly these words is
 * changed or taken off rather than nested, and colours wholly inside them go.
 * Across blocks each block's part is coloured on its own, as a mark is.
 */
export declare function colorSelection(blocks: readonly Block[], from: Pos, to: Pos, color: string | null): Wrapped | null;
/** Tick or untick a bullet's box. */
export declare function toggleBox(blocks: readonly Block[], index: number): Change | null;
export type TurnKind = 'paragraph' | 'h1' | 'h2' | 'h3' | 'todo' | 'bullet' | 'numbered' | 'quote' | 'code' | 'divider' | 'callout' | 'toggle' | 'toggle-h1' | 'toggle-h2' | 'toggle-h3' | 'table' | 'equation';
export type BlockSelection = {
    anchor: number;
    focus: number;
};
/** Select a contiguous range of whole blocks, clamped to this document. */
export declare function select(blocks: readonly Block[], anchor: number, focus?: number): BlockSelection;
export declare function turnInto(blocks: readonly Block[], selection: BlockSelection, kind: TurnKind): Change;
export declare function deleteBlocks(blocks: readonly Block[], selection: BlockSelection): Change;
export declare function duplicateBlocks(blocks: readonly Block[], selection: BlockSelection): Change;
export declare function moveBlocks(blocks: readonly Block[], selection: BlockSelection, direction: -1 | 1): Change | null;
/** Renumber siblings without changing the starting number of a list. */
export declare function renumber(blocks: readonly Block[]): Block[];
export declare function indentBlocks(blocks: readonly Block[], selection: BlockSelection, direction: -1 | 1): Change | null;
export declare function toggleCallout(blocks: readonly Block[], index: number, open?: boolean): Change | null;
/**
 * The callout at `index` given an icon (an emoji or a picture's address; null
 * takes it away) or a colour (`gray` written as such, so a product reading the
 * Markdown knows it was chosen; null takes the word away, which draws grey
 * too), or both: its brackets are written again and nothing else changes. An
 * alert (`[!note]`) given either becomes a box, and its type word goes.
 */
export declare function setCallout(blocks: readonly Block[], index: number, head: {
    icon?: string | null;
    color?: CalloutColor | null;
}): Change | null;
