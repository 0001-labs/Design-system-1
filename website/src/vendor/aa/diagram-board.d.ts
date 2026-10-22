/**
 * A diagram's board: a diagram drawn in an editor and changed where it
 * stands, by hand. Its words are never shown: the caret come into its block,
 * a press or Tab gives the board the keys, and it rules its squares under
 * the drawing. Its row of tools (Design system 1's Context bar) stands in the
 * middle of the board's last square while the diagram is hovered or in use and
 * the writing can be changed, with one colour picker for the pale accents, a Select-faced menu in the top
 * layer.
 *
 * Everything is carried on Drag's grid engine (`src/vendor/drag/grid.ts`), a
 * whole square at a time: a group pressed and carried lands on other
 * squares; the grip of what is chosen sizes it, a box in whole items and a
 * post-it in whole columns; a box or a post-it carried out of the tools lands
 * where it is let go (pressed, it lands on a free square), and is named at
 * once; with Line or Arrow pressed, a line runs from the box pressed to the
 * box let go over. A click on a box (an item to a person) or a post-it (a
 * note) writes in it where it stands, as a double press or Enter does.
 *
 * The keys reach all of it: Tab and Shift-Tab choose each group, box and
 * line in turn, the arrows move what is chosen a square (Shift four), Alt
 * and the arrows size it, Enter names it, L or A joins it to another (Tab to
 * the one to join, Enter), I and N add an item or a note, Delete takes it
 * away, Escape lets it go, and the arrows with nothing chosen give the caret
 * back to the writing.
 *
 * Every change is written back as the words a person would write
 * (`diagram-edit.ts`) and handed to the editor in `aa-atom-change`, so the
 * document stays Markdown and undo takes a change back as one step. The
 * editor draws a block again after every change, so the board keeps what it
 * was doing (what is chosen, a name being written) for its block, and takes
 * the keys back when it is drawn again.
 */
declare const Base: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
export declare class AaDiagramBoardElement extends Base {
    #private;
    /** The block's whole source, fences included, and the element the diagram is drawn with. */
    set block(value: {
        source: string;
        tag: string;
    });
    connectedCallback(): void;
    disconnectedCallback(): void;
}
/** Define the board, once. */
export declare function defineAaDiagramBoard(): string;
declare global {
    interface HTMLElementTagNameMap {
        'aa-diagram-board': AaDiagramBoardElement;
    }
}
export {};
