import type { Editor, EditorOptions } from './editor';
import type { CommentPerson } from './comments';
export type SourceCommentsOptions = {
    /** An IDv1 account code. Omit for read-only comments. The host authenticates this person. */
    me?: CommentPerson;
    people?: readonly CommentPerson[];
    panel?: HTMLElement;
};
/** Project source onto prose, keeping comment metadata outside contenteditable. */
export declare function createSourceEditor(host: HTMLElement, options: EditorOptions, create: (host: HTMLElement, options: EditorOptions) => Editor): Editor;
