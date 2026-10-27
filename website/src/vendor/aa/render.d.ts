/**
 * A block drawn from its source, and read back from the screen. Every
 * character of the source is in the DOM as text, syntax included; syntax is
 * never displayed, while writing either, so the caret passes over it as if it
 * were not there, and the text still reads straight back.
 */
import { type AtomSyntax, type Block } from './markdown';
/** A run of a block's words drawn with a class (and a title, and attributes a layer reads back, `data-comment` say); `from === to` is a caret. */
export type Decoration = {
    from: number;
    to: number;
    className: string;
    label?: string;
    attributes?: Record<string, string>;
};
/**
 * Makes the element an atom is drawn in: a `.aa-atom` that is not editable,
 * carrying its source in `data-source`, which is what reads back.
 */
export type AtomDrawer = (name: string, source: string) => HTMLElement;
/** The atom as its own words, for an editor given nothing better. */
export declare const drawAtomAsText: AtomDrawer;
export declare function atomElement(name: string, source: string, document?: Document): HTMLElement;
/** Which part of a block the selection is in, in its own offsets; null when the selection is elsewhere. */
export type Reveal = {
    from: number;
    to: number;
} | null;
/** The key of what a reveal shows: which groups, and whether the block is active. Same key, same drawing. */
export declare function revealKey(block: Block, reveal: Reveal, atoms?: readonly AtomSyntax[]): string;
export declare function renderBlock(element: HTMLElement, block: Block, reveal: Reveal, atoms?: readonly AtomSyntax[], draw?: AtomDrawer, decorations?: readonly Decoration[]): void;
/** The block's source, read back from whatever the browser left in it. */
export declare function readBlock(element: HTMLElement): string;
/** A DOM point in a block as an offset into its source. */
export declare function offsetIn(element: HTMLElement, node: Node, nodeOffset: number): number;
/** The DOM point for an offset into a block's source, in text that is displayed. */
export declare function pointAt(element: HTMLElement, offset: number): {
    node: Node;
    offset: number;
};
