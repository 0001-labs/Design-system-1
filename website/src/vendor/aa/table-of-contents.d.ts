import { type Block } from './markdown';
import './vendor/ds1/3-unit/ds-table-of-contents';
/** A document-local outline. Generated words never become part of the Markdown. */
export declare function createTableOfContents(element: HTMLElement, blocks: () => readonly Block[], target: HTMLElement, navigate: (index: number) => void): () => void;
