export type PlainEditorOptions = {
    value?: string;
    readOnly?: boolean;
    onChange?: (value: string) => void;
};
/** A single plain-text block, with native editing and Aa's rounded selection. */
export declare function createPlainEditor(host: HTMLElement, options?: PlainEditorOptions): {
    element: HTMLElement;
    value: string;
    readOnly: boolean;
    focus: () => void;
    destroy(): void;
};
