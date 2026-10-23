import type { Editor, EditorOptions } from './editor';
import { type CalloutColor } from './markdown';
/** A button on the bar over selected words; `shortcut` is named in its tooltip (⌘B). */
export type ToolbarAction = {
    id: string;
    label: string;
    icon: string;
    shortcut?: string;
    run(editor: Editor): void;
};
/** `ink`: one of the text colours its row's mark is drawn in. */
/** `swatch`: a callout fill its row's mark is drawn as, a filled square. */
export type Command = ToolbarAction & {
    keywords?: string;
    ink?: string;
    swatch?: CalloutColor;
    enabled?(editor: Editor): boolean;
    preview?(element: HTMLElement, context: {
        input: 'pointer' | 'keyboard';
    }): void | (() => void);
};
declare const AaToolbarElement_base: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
export declare class AaToolbarElement extends AaToolbarElement_base {
    editor: Editor | null;
    actions: readonly ToolbarAction[];
    /** A second row under the cells: the field that asks AI about the selected words. */
    below: HTMLElement | null;
    connectedCallback(): void;
    refresh(): void;
}
export declare function defineAaToolbar(): void;
/** A fixed half-square gap, independent of how many rows the bar contains. */
export declare function selectionToolbarPosition(rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'bottom'>, box: Pick<DOMRect, 'width' | 'height'>, view: {
    left: number;
    top: number;
    width: number;
    height: number;
}, scale: number): {
    left: number;
    top: number;
};
export declare function createControls(editor: Editor, options: EditorOptions): () => void;
export {};
