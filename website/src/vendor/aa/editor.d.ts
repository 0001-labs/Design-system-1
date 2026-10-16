/**
 * The editor: one editable element a block, each drawn from the document and
 * read back from the screen after every change, the way Notion's blocks are.
 * The browser types, spells and composes; Aa owns Enter, Backspace at an
 * edge, paste, marks, undo and the caret's way between blocks.
 */
import { type AtomSyntax, type Block } from './markdown';
import { type TurnKind } from './document';
import { type Decoration } from './render';
import { type TableAction } from './table';
import { type Command, type ToolbarAction } from './controls';
/**
 * An atom the editor reads and draws: what it is in the text, and how it is
 * drawn into the element Aa gives it. What `draw` returns is called once the
 * atom leaves the page, to stop whatever it started.
 */
export type Atom = AtomSyntax & {
    draw?(element: HTMLElement, source: string): void | (() => void);
};
/** A picture drawn as itself. */
export declare const imageAtom: Atom;
export type EditorOptions = {
    value?: string;
    readOnly?: boolean;
    placeholder?: string;
    /** Called after every change the person made, with the document as Markdown. */
    onChange?: (value: string) => void;
    /** The atoms to read and draw; a picture unless told otherwise. */
    atoms?: readonly Atom[];
    /** Files pasted or dropped into the editor. Without it, they are ignored. */
    onFiles?: (files: File[]) => void;
    toolbar?: boolean | readonly ToolbarAction[];
    commands?: readonly Command[];
    blockCommands?: readonly Command[];
    menus?: boolean;
    drawEquation?: (element: HTMLElement, source: string, display: boolean) => void | (() => void);
};
export type Editor = {
    readonly element: HTMLElement;
    value: string;
    readOnly: boolean;
    placeholder: string;
    focus(): void;
    blur(): void;
    /** Where the selection is, as offsets into `value`; null when it is not in the editor. */
    selection(): {
        start: number;
        end: number;
    } | null;
    /** Put `text` in place of `value`'s characters from `start` to `end`, the caret after it, as one step to undo. */
    replace(start: number, end: number, text: string): void;
    undo(): boolean;
    redo(): boolean;
    activeBlock(): {
        index: number;
        start: number;
        end: number;
        block: Block;
    } | null;
    selectBlocks(anchor: number, focus?: number): void;
    format(mark: 'bold' | 'italic' | 'strike' | 'code' | 'link' | 'equation' | 'highlight'): void;
    turnInto(kind: TurnKind): void;
    blockAction(action: 'delete' | 'duplicate' | 'up' | 'down'): void;
    moveBlock(from: number, to: number): void;
    indent(direction: -1 | 1): void;
    toggle(open?: boolean): void;
    table(action: TableAction): void;
    insertFile(file: File): void;
    decorate(ranges: readonly Decoration[], layer?: string): void;
    stats(): {
        words: number;
        characters: number;
        blocks: number;
    };
    find(query: string, caseSensitive?: boolean): {
        start: number;
        end: number;
    }[];
    selectRange(start: number, end?: number): void;
    transaction(action: () => void): void;
    setHistoryProvider(provider: {
        undo(): boolean;
        redo(): boolean;
    } | null): void;
    destroy(): void;
};
export declare function createEditor(host: HTMLElement, options?: EditorOptions): Editor;
