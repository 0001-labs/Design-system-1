import type { Block } from './markdown';
export type Cell = {
    text: string;
    from: number;
    to: number;
};
/** Cells keep offsets into the original Markdown, including escaped pipes. */
export declare function tableRows(source: string): Cell[][];
export declare function writeTable(rows: readonly (readonly string[])[]): string;
export declare function fromTSV(text: string): string | null;
export type TableAction = 'add-row' | 'delete-row' | 'add-column' | 'delete-column';
export declare function editTable(block: Block, action: TableAction, row: number, column: number): string;
