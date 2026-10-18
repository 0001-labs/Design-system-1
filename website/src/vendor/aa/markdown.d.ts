/**
 * Aa's Markdown. What people write is Markdown, and this is how it is read:
 * block by block, then run by run within a block, with every character kept,
 * so what is drawn on the screen reads straight back into the text.
 */
export type BlockKind = 'paragraph' | 'heading' | 'bullet' | 'quote' | 'code' | 'divider' | 'callout' | 'table' | 'equation';
export type Block = {
    kind: BlockKind;
    /** The block's whole Markdown, prefixes and fences included. */
    source: string;
    /** How many characters the block's prefix takes on its first line: `## `, `- [ ] `, `> `, the opening fence. */
    prefix: number;
    /** A heading's level, 1 to 6. */
    level?: number;
    /** A bullet's box: unset for a plain bullet. */
    checked?: boolean;
    /** A numbered bullet's number. */
    number?: number;
    depth?: number;
    indent?: number;
    callout?: string;
    folded?: boolean;
};
/** A block with where its source started in the text it was read from. */
export type Placed = Block & {
    start: number;
};
export declare const HEADING: RegExp;
export declare const BULLET: RegExp;
export declare const QUOTE: RegExp;
export declare const FENCE: RegExp;
export declare const DIVIDER: RegExp;
/** Read a text into its blocks. A text with nothing in it is one empty paragraph. */
export declare function parseBlocks(text: string): Placed[];
/** Write blocks back as one text: a blank line between blocks, none between two bullets, so a list stays a list. */
export declare function serialize(blocks: readonly Block[]): string;
/** Whether a code block has its closing fence. */
export declare function codeClosed(block: Block): boolean;
export type RunKind = 'text' | 'syntax' | 'break' | 'atom';
export type Run = {
    kind: RunKind;
    from: number;
    to: number;
    bold?: true;
    italic?: true;
    strike?: true;
    code?: true;
    highlight?: true;
    href?: string;
    /**
     * Syntax belongs to a mark: the range of the whole mark, delimiters
     * included, shown together while the caret is in it. Prefix syntax has no
     * group: it shows while its block is being edited.
     */
    group?: [number, number];
    prefix?: true;
    /** An atom's kind: the run is drawn as one thing, never letter by letter. */
    atom?: string;
};
/**
 * A piece of writing drawn as one thing rather than as its letters: a
 * picture, a reference, a link shown as a title. The text stays what it
 * was written as; only the drawing changes, and the caret steps over it whole.
 */
export type AtomSyntax = {
    name: string;
    /** How many characters an atom of this kind takes at `at` in a line, or 0 when none starts there. */
    match(line: string, at: number): number;
    /** A fenced code block in this language is drawn whole as this atom, fences and all: `diagram` for ```diagram. */
    fence?: string;
};
/** The atom a closed code block is drawn as, by its fence's language, if any is given one. */
export declare function fencedAtom<T extends AtomSyntax>(block: Block, atoms: readonly T[]): T | undefined;
/** An atom found by a pattern, optionally only where `accept` agrees. */
export declare function atomPattern(name: string, pattern: RegExp, accept?: (match: RegExpExecArray) => boolean): AtomSyntax;
/** A Markdown picture, `![name](address)`. */
export declare const IMAGE: AtomSyntax;
export declare const EQUATION: AtomSyntax;
/** The atoms an editor reads unless it is given others. */
export declare const DEFAULT_ATOMS: readonly AtomSyntax[];
/** Every run of a block, in order, covering its source from end to end. */
export declare function blockRuns(block: Block, atoms?: readonly AtomSyntax[]): Run[];
