/**
 * Blocks are moved by hand, with nothing drawn beside them, on Drag's
 * sortable engine (`src/vendor/drag`, copied from /Users/joachim/0001/Drag
 * with Sync 1): the block lifts into an overlay, the blocks it passes step
 * aside by its whole size, and it lands in its place, as Design system 1's
 * sheet rows and Ezo's lists move.
 *
 * A mouse pressed on a block and held still for a moment lifts it, and it
 * goes where the press is let go. Words are selected along a line, so a
 * press that first moves up or down lifts its block at once, and one that
 * first moves along the line selects words, as it always has. A pointer that
 * rests on a block for a moment takes it in hand (the cursor turns to a
 * grab), and a press then lifts it at once, whichever way it moves. A lifted
 * block let go where it began leaves the caret where the press put it. Blocks already selected (Escape,
 * Shift-arrows, a block just moved) are dragged at once, the one pressed
 * carried and the others dimmed in their places, and they land together.
 * Touch keeps its long press for the system's own selection: there the block
 * menu moves blocks, as ⌘⇧↑ and ⌘⇧↓ do from the keyboard. Files dropped from
 * outside land between blocks, on a line.
 *
 * As Notion places pictures, a block carried to another block's side (its
 * first or last fifth, four squares at most) shows a line down that side,
 * and let go there it stands beside it: the two become columns, or it is one
 * more column of columns already there. Carried out of its column over
 * another column of the same columns, it stands at that column's nearer side
 * as a column of its own, so pictures in columns are put in order sideways.
 */
import type { Editor, EditorOptions } from './editor';
/** How long a still press waits before it lifts its block, in milliseconds. */
export declare const HOLD = 400;
/** How long a pointer rests on a block before it takes the block in hand, in milliseconds. */
export declare const REST = 400;
export declare function createDragging(editor: Editor, options: EditorOptions, root: Element): () => void;
