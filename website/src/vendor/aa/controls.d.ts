import type { Editor, EditorOptions } from './editor';
export type ToolbarAction = {
    id: string;
    label: string;
    icon: string;
    run(editor: Editor): void;
};
export type Command = ToolbarAction & {
    keywords?: string;
    enabled?(editor: Editor): boolean;
};
declare const AaToolbarElement_base: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
export declare class AaToolbarElement extends AaToolbarElement_base {
    editor: Editor | null;
    actions: readonly ToolbarAction[];
    connectedCallback(): void;
    refresh(): void;
}
export declare function defineAaToolbar(): void;
export declare function createControls(editor: Editor, options: EditorOptions): () => void;
export {};
