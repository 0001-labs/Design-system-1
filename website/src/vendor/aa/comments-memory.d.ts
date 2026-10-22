/**
 * A comment store that keeps its threads in memory: the playground's, and a
 * product's tests'. It does what a product's backend does, in one tab: ids,
 * times, who may delete, what is unread, the people to mention.
 */
import { type CommentPerson, type CommentStore, type CommentThread } from './comments';
export type MemoryCommentStore = CommentStore & {
    /** The threads as they are kept. */
    readonly threads: readonly CommentThread[];
    /** A thread put in from outside, as another person's comment would arrive. */
    put(thread: CommentThread): void;
};
export type MemoryCommentStoreOptions = {
    me?: CommentPerson;
    people?: readonly CommentPerson[];
    threads?: readonly CommentThread[];
    panel?: HTMLElement;
    /** Milliseconds each write takes, as a server's would. */
    delay?: number;
    now?: () => number;
};
export declare function memoryCommentStore(options?: MemoryCommentStoreOptions): MemoryCommentStore;
