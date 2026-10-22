/**
 * A diagram changed where it is drawn, written back as words. Every change
 * here takes a diagram's source and its layout (`layoutDiagram`), and gives
 * the source as it would be written by hand for the change: a group moved
 * has its `@ x y`, a group sized has its `w8`, a box added is a line of its
 * own, a line drawn between two boxes is `A -> B` (and `A -- B` once it is
 * made a plain line), and a group taken away takes its lines with it.
 * Nothing else in the source moves, so what a person wrote stays theirs.
 *
 * Nothing here touches the page, so a server can make the same changes.
 */
import { type Diagram, type DiagramColor } from './diagram-language';
/** What is chosen on a drawing: a group, one box of a stack, or a line. */
export type DiagramTarget = {
    group: number;
    box?: number;
} | {
    join: number;
};
/** A name nothing in the diagram goes by yet: `Box`, then `Box 2`, `Box 3`. */
export declare function freeName(diagram: Diagram, base: string): string;
/** The name a line reaches a target by: a group's name, a lone box's words, or `Stack.Box` where a box's words are not its own. */
export declare function referenceOf(diagram: Diagram, target: DiagramTarget): string | undefined;
/** A group set on other squares: its `@ x y` written, or written again. */
export declare function moveGroup(source: string, diagram: Diagram, index: number, x: number, y: number): string;
/**
 * A box, a stack or a post-it set to another width, in squares: a box's in
 * whole items (`w8` for two), a post-it's side in whole columns, nothing
 * written for the size a group has unwritten.
 */
export declare function resizeGroup(source: string, diagram: Diagram, index: number, w: number): string;
/** A new group on a square: a lone box `[Box] @ x y`, or a post-it `{Note} @ x y w8`, after the groups already written. */
export declare function addGroup(source: string, diagram: Diagram, kind: 'box' | 'post-it', name: string, x: number, y: number): string;
/** A line drawn from one name to another, written at the end. */
export declare function addJoin(source: string, from: string, to: string, op?: '--' | '->'): string;
/**
 * A line made plain (`--`) or an arrow (`->`). An arrow already pointing
 * either way, or both, stays as it points.
 */
export declare function joinKind(source: string, diagram: Diagram, target: DiagramTarget, op: '--' | '->'): string;
/** A group or a box called something else, and every line that reached it by its old name. */
export declare function renameTarget(source: string, diagram: Diagram, target: DiagramTarget, name: string): string;
/** A group or one box of a stack in a pale accent, or in none. */
export declare function colorTarget(source: string, diagram: Diagram, target: DiagramTarget, color: DiagramColor | null): string;
/** A group, a box or a line taken away; a group or a box takes the lines that reached it. */
export declare function deleteTarget(source: string, diagram: Diagram, target: DiagramTarget): string;
