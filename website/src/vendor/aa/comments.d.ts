/**
 * Comments on ranges of the text, as a person comments on a document: a
 * thread is anchored to a run of the Markdown (`from` and `to`, offsets into
 * the document, and `quote`, the words there), and kept right as the text
 * changes around it. Link's project comments are the model (a thread on a
 * block, replies, resolving and reopening, who wrote what and when, mentions,
 * an orphaned thread when its words are gone); here the anchor is a range of
 * the words rather than a block.
 *
 * Nothing in this file touches the page: the drawing is comments-view.ts, and
 * the storage, the people, the permissions and the notifications are the
 * product's, reached through a `CommentStore`.
 */
/** Someone who comments: the product's id for them, their name, and the colour they are drawn in (one from the palette by their id otherwise). */
export type CommentPerson = {
    id: string;
    name: string;
    colour?: string;
};
/** Where a thread stands: offsets into the Markdown, and the words there. */
export type CommentRange = {
    from: number;
    to: number;
    quote: string;
};
/** One emoji on a comment: how many gave it, whether the person reading did, and who else did. */
export type CommentReaction = {
    emoji: string;
    count: number;
    reacted: boolean;
    names: readonly string[];
};
export type Comment = {
    id: string;
    author: CommentPerson;
    body: string;
    createdAt: number;
    editedAt?: number;
    /** The people named in the body, as `@Name`. */
    mentions?: readonly CommentPerson[];
    reactions?: readonly CommentReaction[];
};
/** The reactions on offer, Link's sixteen. */
export declare const REACTION_EMOJIS: readonly ["👍", "❤️", "😂", "🎉", "🙏", "👏", "😊", "🔥", "✅", "👀", "🤔", "💡", "🚀", "✨", "🙌", "💯"];
export type CommentThread = CommentRange & {
    /** An explicitly missing source anchor must never be guessed from a duplicate quote. */
    orphaned?: boolean;
    id: string;
    comments: readonly Comment[];
    createdAt: number;
    updatedAt: number;
    resolvedAt?: number;
    resolvedBy?: CommentPerson;
    /** Whether the person reading has not seen its latest comment; the product's to say. */
    unread?: boolean;
    /** Whether the person reading may delete the thread (its creator, as in Link). */
    canDelete?: boolean;
};
/** A thread as it stands in the text now: orphaned when its words are gone. */
export type AnchoredThread = CommentThread & {
    orphaned: boolean;
};
/** A thread moved by an edit, for the store to keep. */
export type CommentMove = {
    id: string;
    from: number;
    to: number;
    quote: string;
};
/**
 * What a product gives Aa for comments: the threads as they are and change,
 * and the writes, each a promise that may refuse. Without `me` the comments
 * read only. `people` answers the `@` menu in the composer.
 */
export type CommentStore = {
    /** The threads now, and again on every change, until the returned function is called. */
    subscribe(receive: (threads: readonly CommentThread[]) => void): () => void;
    /** Who is writing. Without it, nothing can be added, replied to, resolved or edited. */
    me?: CommentPerson;
    add(range: CommentRange, body: string, mentions: readonly CommentPerson[]): Promise<unknown>;
    reply(threadId: string, body: string, mentions: readonly CommentPerson[]): Promise<unknown>;
    edit?(commentId: string, body: string): Promise<unknown>;
    resolve(threadId: string, resolved: boolean): Promise<unknown>;
    remove?(threadId: string): Promise<unknown>;
    /** Threads whose words moved as the text changed, so other readers find them where the words are. */
    move?(moves: readonly CommentMove[]): Promise<unknown>;
    /** The person reading has opened the thread. */
    seen?(threadId: string): Promise<unknown>;
    /** Give a comment an emoji, or take the person's own back. Without it, no reactions. */
    react?(commentId: string, emoji: string): Promise<unknown>;
    /** The people who may be mentioned, for what has been typed after `@`. */
    people?(query: string): readonly CommentPerson[] | Promise<readonly CommentPerson[]>;
    /** Where the threads are drawn: an element beside the text for a panel; without it, a popover at the range. */
    panel?: HTMLElement;
};
/** One replacement in the text: the characters from `start` to `end` became `text`. */
export type TextEdit = {
    start: number;
    end: number;
    text: string;
};
/**
 * The smallest replacement that turns `before` into `after`. Where the same
 * replacement could stand a little earlier ("tiny " put before "two" reads
 * the same as "iny t" put after its t), it is moved back to the nearest
 * start of a word, so a word typed before a commented one stands before it.
 */
export declare function textChange(before: string, after: string): TextEdit;
/**
 * Where a range stands after an edit, or null when its words are gone. An
 * edit before the range moves it; words put in at its start stand before it,
 * words typed at its end go on with it (as a bold word goes on); an edit
 * inside it grows or shrinks it; one over its start or end cuts that end back
 * to what is left; one over all of it takes it away.
 */
export declare function mapRange(range: {
    from: number;
    to: number;
}, edit: TextEdit): {
    from: number;
    to: number;
} | null;
/**
 * The threads as they stand after the text changed: each range mapped
 * through the edit and its quote read again from the words; a thread whose
 * words are gone is orphaned, kept where it was.
 */
export declare function applyEdit<T extends CommentRange & {
    orphaned?: boolean;
}>(threads: readonly T[], edit: TextEdit, after: string): (T & {
    orphaned: boolean;
})[];
/**
 * Where a thread from the store stands in this text: where it says, when its
 * words are there; else where its words are found nearest to it; else nowhere.
 */
export declare function relocate(thread: CommentRange, text: string): {
    from: number;
    to: number;
} | null;
/** The store's threads placed in this text. */
export declare function anchorThreads(threads: readonly CommentThread[], text: string): AnchoredThread[];
/** The threads whose place or words are not what the store has. */
export declare function movedThreads(stored: readonly CommentThread[], placed: readonly AnchoredThread[]): CommentMove[];
/** Open threads first, each group in the order of the text; orphaned ones last among their group. */
export declare function sortThreads<T extends AnchoredThread>(threads: readonly T[]): T[];
/** The threads standing on an offset of the text: the caret in a range, its ends included. */
export declare function threadsAt<T extends AnchoredThread>(threads: readonly T[], offset: number): T[];
export declare function countThreads(threads: readonly CommentThread[]): {
    open: number;
    resolved: number;
};
/** "3 comments · 1 resolved", as Link heads its threads. */
export declare function commentsLabel(open: number, resolved: number): string;
/** The people among `people` named in `body` as `@Name`, longest names first so "Jo Ann" is not taken for "Jo". */
export declare function mentionsIn(body: string, people: readonly CommentPerson[]): CommentPerson[];
/**
 * The `@` and the letters after it just before the caret, for the people
 * menu: null when the caret is not in one, or the letters have a space.
 */
export declare function mentionQuery(text: string, caret: number): {
    start: number;
    query: string;
} | null;
/**
 * When something happened, told as Design system 1 tells it: "now", "3
 * minutes ago", "yesterday" by the calendar, days ago within a week, and the
 * date beyond, with its year once it is another year's.
 */
export declare function relativeTime(at: number, now?: number, locale?: string): string;
/**
 * The letters a person is drawn with, as Ezo draws them: a name in kanji or
 * kana by its first two characters, the family name that leads it; any other
 * by its first letter, a capital.
 */
export declare function initialOf(name: string): string;
export declare function personColour(person: CommentPerson): string;
