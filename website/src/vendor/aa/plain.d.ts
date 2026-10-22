export type PlainEditorOptions = {
    value?: string;
    readOnly?: boolean;
    onChange?: (value: string) => void;
    /** What the empty field says. With `speak`, where the browser can listen, it says "Press space to speak, or …". */
    placeholder?: string;
    /**
     * Space in the empty field listens, as a comment's reply does: the words
     * heard are written in as they come, the caret a breathing dot after them;
     * Escape stops, and any other key stops listening and types on.
     */
    speak?: boolean;
};
/** A single plain-text block, with native editing and Aa's rounded selection. */
export declare function createPlainEditor(host: HTMLElement, options?: PlainEditorOptions): {
    element: HTMLElement;
    value: string;
    readOnly: boolean;
    /** Whether it is listening now. */
    readonly listening: boolean;
    focus: () => void;
    destroy(): void;
};
