export type SheetRow = {
    id: string;
    label: string;
    icon?: string;
    key?: string;
    run(): void;
};
export type SheetGroup = {
    label?: string;
    rows: readonly SheetRow[];
};
export type SheetOptions = {
    title: string;
    nonModal?: boolean;
    groups: readonly SheetGroup[];
    /** Where the sheet is appended: the page's body, or the dialog the editor is in. */
    root: Element;
    /** Called once it has closed, with the row chosen, if any, before that row runs. */
    onClose?(chosen: SheetRow | null): void;
};
export declare function openSheet(options: SheetOptions): () => void;
