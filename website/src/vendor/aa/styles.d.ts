/**
 * Aa brings its own drawing, as a Design system 1 component does: the first
 * editor in a document (or a shadow root) puts aa.css there, its fonts and the
 * Design system 1 sheets it imports included, before it draws anything. It
 * goes first, so a product's own rules still come after it; its rules weigh
 * nothing, so any of the product's wins. A page that imports aa.css itself
 * keeps it, and gets no second copy.
 */
export declare function drawStyles(host: HTMLElement): void;
