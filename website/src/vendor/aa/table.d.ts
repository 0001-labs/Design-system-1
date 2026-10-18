import type { Block } from './markdown';
export type Cell = {
    text: string;
    from: number;
    to: number;
};
/** Cells keep offsets into the original Markdown, including escaped pipes. */
export declare function tableRows(source: string): Cell[][];
/** A column's alignment, from the delimiter row: `:---` start, `:---:` centre, `---:` end. */
export type Alignment = 'start' | 'center' | 'end' | null;
export declare function tableAlignments(source: string): Alignment[];
export declare function writeTable(rows: readonly (readonly string[])[], alignments?: readonly Alignment[]): string;
export declare function fromTSV(text: string): string | null;
export type TableAction = 'add-row' | 'delete-row' | 'add-column' | 'delete-column';
export declare function editTable(block: Block, action: TableAction, row: number, column: number): string;
