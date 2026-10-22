/**
 * Comments drawn: the commented words marked in the text (a decoration layer
 * of their own, `comments`), and the threads on Design system 1's squares, in
 * a popover at the range or in a panel the product gives. One square a row,
 * the words on the sixteen; a 16px round avatar with the person's initial in
 * their colour; the name in the medium weight, the time relative and muted;
 * the body on 20px lines indented one square. The composer is one square high
 * and grows as a reply is written: Enter sends, Shift-Enter breaks a line,
 * and `@` opens the people menu in the Context face. Everything stands over
 * the page, as Aa's other floating pieces do, and moves by transform and
 * opacity alone.
 */
import { type AnchoredThread, type CommentPerson, type CommentStore } from './comments';
import type { Decoration } from './render';
import { type Prompter } from './prompt';
export type CommentsViewOptions = {
    store: CommentStore;
    /** The Markdown now. */
    value: () => string;
    /** The selection as offsets into the Markdown; null when it is not in the editor. */
    selection: () => {
        start: number;
        end: number;
    } | null;
    /** Draw these on the `comments` layer. */
    decorate: (ranges: readonly Decoration[]) => void;
    selectRange: (start: number, end?: number) => void;
    readOnly: () => boolean;
    /** Answers AI, where the product does: Space in an empty comment field asks about the commented words. */
    prompt?: Prompter;
    root?: Element;
};
export type CommentsView = {
    /** Open a thread: in the popover at its words, or expanded in the panel. */
    open(threadId: string): void;
    /** Start a thread on the selected words; false with nothing selected or nobody to write as. */
    start(): boolean;
    /** Put the popover away, or fold the panel's open thread; true when something was open. */
    close(): boolean;
    /** The text changed: the anchors follow it. */
    changed(): void;
    readonly threads: readonly AnchoredThread[];
    destroy(): void;
};
/** A person's mark: Design system 1's avatar, round and one control high, the initial lettered in their ink inside a ring of it. */
export declare const avatar: (person: CommentPerson) => HTMLSpanElement;
export declare function createCommentsView(host: HTMLElement, options: CommentsViewOptions): CommentsView;
