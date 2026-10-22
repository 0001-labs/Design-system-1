/**
 * The words a correction changed shimmer once: a band of the accent colour
 * passes through their letters and is gone. It is drawn over the text, never
 * in it, as Aa's other floating pieces are, so the block's element and how it
 * reads back are untouched. Blended onto the page, the band colours the
 * letters and leaves the paper as it is: lightening on a light page, darkening
 * on a dark one. It moves by transform and fades by opacity alone; with
 * reduced motion it only fades, and with forced colours it is not drawn.
 */
/** How long a shimmer lasts, and the most it waits before a later word's begins. */
export declare const SHIMMER = 900;
/** How light a CSS colour is, from 0 to 1, or null when it is written in a way not read here. */
export declare function lightness(color: string): number | null;
/** Shimmer the ranges of a block's source once; gives back what takes the shimmer away early. */
export declare function shimmer(element: HTMLElement, ranges: readonly (readonly [number, number])[], root?: Element): () => void;
