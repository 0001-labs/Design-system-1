import { type Editor, type EditorOptions } from './editor';
declare const AaEditorElement_base: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
/**
 * `<aa-editor>`: the editor as an element, in the page's own DOM so the
 * page's type and colours reach it. `value` is the Markdown; `input` fires
 * on every change the person makes. With `options.correct`, words are
 * corrected as they are written, unless `correct="off"`.
 */
export declare class AaEditorElement extends AaEditorElement_base {
    #private;
    static observedAttributes: string[];
    get options(): EditorOptions;
    set options(value: EditorOptions);
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, _old: string | null, value: string | null): void;
    get value(): string;
    set value(text: string);
    get readOnly(): boolean;
    set readOnly(value: boolean);
    focus(): void;
    undo(): boolean;
    redo(): boolean;
    get editor(): Editor | null;
}
export declare function defineAaEditor(tag?: string): void;
export {};
