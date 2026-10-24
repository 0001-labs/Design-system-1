import { type SourceCommentsOptions } from './comments-editor';
/**
 * The editor: one editable element a block, each drawn from the document and
 * read back from the screen after every change, the way Notion's blocks are.
 * The browser types, spells and composes; Aa owns Enter, Backspace at an
 * edge, paste, marks, undo and the caret's way between blocks.
 */
import { type AtomSyntax, type Block, type TextColor, type CalloutColor } from './markdown';
import { type TurnKind } from './document';
import { type Decoration } from './render';
import { type TableAction } from './table';
import { type Command, type ToolbarAction } from './controls';
import { type Corrector } from './correction';
import { type Prompter } from './prompt';
import type { AnchoredThread, CommentStore } from './comments';
/**
 * An atom the editor reads and draws: what it is in the text, and how it is
 * drawn into the element Aa gives it. What `draw` returns is called once the
 * atom leaves the page, to stop whatever it started.
 */
export type Atom = AtomSyntax & {
    draw?(element: HTMLElement, source: string): void | (() => void);
    /** A block that starts one, offered in the toolbar and the slash menu: its name, icon and first source. */
    insert?: {
        label: string;
        icon: string;
        source: string;
        keywords?: string;
        preview?(element: HTMLElement, context: {
            input: 'pointer' | 'keyboard';
        }): void | (() => void);
    };
};
/**
 * A drawn picture made sizable: as wide as its Markdown says in squares (`![caption](address "w12")`),
 * or its own size up to sixteen, with the grip that sizes it. For a product's own picture atom too.
 */
export declare function sizePicture(element: HTMLElement, source: string): void;
/** A picture drawn as itself, as wide as its Markdown says in squares, or its own size up to sixteen. */
export declare const imageAtom: Atom;
export type EditorOptions = {
    value?: string;
    readOnly?: boolean;
    placeholder?: string;
    /**
     * What an empty block shows while the caret is in it, so the slash menu is
     * found without a button beside the block: "Press space for AI or / for commands" where the product answers prompts, "Type / for commands" otherwise, unless set,
     * nothing for ''. Never without menus or in a read-only editor.
     */
    blockPlaceholder?: string;
    /** Called after every change the person made, and every correction, with the document as Markdown. */
    onChange?: (value: string) => void;
    /** The atoms to read and draw; a picture unless told otherwise. */
    atoms?: readonly Atom[];
    /** Inline DS1 illustrations, inserted with @button. Opt in for documentation. */
    partials?: boolean;
    /** Files pasted or dropped into the editor. Without it, they are ignored. */
    onFiles?: (files: File[]) => void;
    /** Keep touch formatting sheets modeless so the host page stays interactive. */
    nonModalSheets?: boolean;
    toolbar?: boolean | readonly ToolbarAction[];
    commands?: readonly Command[];
    blockCommands?: readonly Command[];
    menus?: boolean;
    /** Same-flow block shuffling by pointer, keyboard and block commands. Defaults to true. */
    reordering?: boolean;
    /** Side/column destinations and external file-drop placement. Defaults to true; paste stays available. */
    placing?: boolean;
    drawEquation?: (element: HTMLElement, source: string, display: boolean) => void | (() => void);
    /**
     * Corrects the person's words as they write, in place: Aa sends a block's
     * Markdown once its words rest and puts the answer in, one step to undo.
     * The product makes the call; without it, nothing is corrected.
     */
    correct?: Corrector;
    /**
     * Asks AI where the words are: Space in an empty block opens a prompt in a
     * live colour (Space twice listens instead), Enter sends it, and the
     * answer, Markdown, takes the empty block's place as one step to undo. A
     * diagram's board asks it too, for its words written again. The product
     * makes the call; without it, Space is a space.
     */
    prompt?: Prompter;
    /** Whether `correct` starts on; `editor.correcting` turns it on and off. */
    correcting?: boolean;
    /**
     * Comments on ranges of the text (`src/comments.ts`): the product's store
     * of threads, people and permissions. Aa marks the commented words, keeps
     * the anchors right as the text changes, and draws the threads in a popover
     * at the words or in the store's `panel`. Without it, nothing is commented.
     */
    comments?: CommentStore;
    /** Keep threads in editable Markdown; author identity and permissions belong to the host. */
    sourceComments?: SourceCommentsOptions;
};
/** The comments from outside: open a thread, start one on the selection, close what is open. */
export type EditorComments = {
    open(threadId: string): void;
    start(): boolean;
    close(): boolean;
    readonly threads: readonly AnchoredThread[];
};
export type Editor = {
    readonly element: HTMLElement;
    value: string;
    /** Downloadable Markdown, with comment markers and metadata removed. */
    exportMarkdown(): string;
    readOnly: boolean;
    placeholder: string;
    focus(): void;
    blur(): void;
    /** Leave editing: clear owned selection and transient controls without changing the document. */
    dismiss(): void;
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
    format(mark: 'bold' | 'italic' | 'strike' | 'underline' | 'code' | 'link' | 'equation' | 'highlight'): void;
    /** Write the selected words in one of `TEXT_COLORS` (`<span color="red">`), or in the text's own colour with `null`. */
    color(color: TextColor | null): void;
    turnInto(kind: TurnKind): void;
    blockAction(action: 'delete' | 'duplicate' | 'up' | 'down'): void;
    /** Move `count` blocks from `from` so the first stands at `to` once they have left; they stay selected, the editor focused. */
    moveBlock(from: number, to: number, count?: number): void;
    /** Runtime movement switches; disabling either cancels an active gesture. */
    reordering: boolean;
    placing: boolean;
    indent(direction: -1 | 1): void;
    toggle(open?: boolean): void;
    /**
     * Give the callout the caret is in (or the one at `index`) an icon, an emoji
     * or a picture's address (null takes it away), or a colour of `CALLOUT_COLORS`
     * (null the default grey): its brackets are written again, one step to undo.
     */
    callout(head: {
        icon?: string | null;
        color?: CalloutColor | null;
    }, index?: number): void;
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
    /** The words from `start` to `end`, offsets into the Markdown, as a range in the page: to stand something over them. */
    rangeOf(start: number, end: number): Range | null;
    transaction(action: () => void): void;
    setHistoryProvider(provider: {
        undo(): boolean;
        redo(): boolean;
    } | null): void;
    /** Whether the words are corrected as they are written; always false without `correct`. */
    correcting: boolean;
    /**
     * Ask AI about the selected words, from the bar over them: the answer takes
     * their place as one step to undo, and stays selected. False with nothing
     * selected, no `prompt`, or no answer.
     */
    askAbout(said: string): Promise<boolean>;
    /** The comments, where the editor has a `comments` store. */
    readonly comments?: EditorComments;
    destroy(): void;
};
export declare function createEditor(host: HTMLElement, options?: EditorOptions): Editor;
