/**
 * Diagrams, Aa's optional entry (`@0001-labs/aa/diagram`): boxes and lines
 * on Design system 1's squares, drawn by hand on a board and kept as words.
 * The words are `diagram-language.ts`, which servers and agents read; this
 * draws them.
 *
 * - `<aa-diagram source="[Ideas]&#10;[Agents] @ 0 3&#10;Ideas -> Agents"></aa-diagram>`
 * - `<aa-diagram>…the source as text…</aa-diagram>`
 * - `element.source = "…"`
 *
 * `defineAaDiagram()` defines the element, under a product's own name too
 * (`defineAaDiagram('ezo-diagram')`), and `diagramAtom` gives an editor
 * fenced ```diagram blocks drawn in place and changed there by hand, with a
 * toolbar button and a slash command that start one.
 *
 * It sizes itself in squares (`--diagram-columns`, `--diagram-rows` on the
 * host), so whatever holds it can reserve its rows before it has drawn. Once
 * drawn it measures its names and lays the diagram out again with their
 * widths, so a line into a name meets the name's middle; again when the
 * typeface arrives, since a fallback's names are another width.
 *
 * Its measures are Design system 1's (`--ds-grid-unit`), or a product's own
 * through `--aa-diagram-unit`, `--aa-diagram-stroke`, `--aa-diagram-ink`,
 * `--aa-diagram-cell`, `--aa-diagram-radius` and `--aa-diagram-paper`.
 *
 * Nothing here touches the page until an element is made, so the language it
 * carries can be read on a server too.
 */
import { type Diagram, type DiagramSegment } from './diagram-language';
import type { Atom } from './editor';
export * from './diagram-language';
export * from './diagram-edit';
export { AaDiagramBoardElement, defineAaDiagramBoard } from './diagram-board';
declare const Base: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
export declare class AaDiagramElement extends Base {
    #private;
    static observedAttributes: string[];
    /** Settles once the diagram has drawn what it was last given. */
    updateComplete: Promise<boolean>;
    get source(): string | undefined;
    set source(value: string | undefined);
    /** The diagram as last laid out. */
    get diagram(): Diagram;
    attributeChangedCallback(name: string, old: string | null, value: string | null): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    /** Draw again once the current task is done; many asks make one drawing. */
    requestUpdate(): void;
    /** The interface's shape changed: a line's turns follow the cells' corners. */
    shapeChanged(): void;
}
/**
 * A line through its turns, each turn an arc of `bend` squares, never more
 * than half of either run it joins so two turns close together still meet.
 * With no bend the turns are square corners, as the square shape draws them.
 */
export declare function linePath(segments: DiagramSegment[], bend: number): string;
/**
 * Define the diagram element: `<aa-diagram>` unless a product names its own,
 * which may be defined beside it. Returns the name.
 */
export declare function defineAaDiagram(name?: string): string;
/** A first diagram to start from: two boxes and the line between them. */
export declare const DIAGRAM_START = "```diagram\n[Idea]\n[Plan] @ 6 0\nIdea -> Plan\n```";
/**
 * Fenced ```diagram blocks drawn in place in an editor: `atoms: [imageAtom,
 * diagramAtom]`. The drawing stands in for its words on a board
 * (`diagram-board.ts`), and its words are never shown: pressed, or with the
 * caret come into the block, it shows its squares and the tools that draw
 * on them, is changed there by hand and from the keys, and writes what is
 * drawn back as words. Its toolbar button and slash command start one.
 */
export declare const diagramAtom: Atom;
declare global {
    interface HTMLElementTagNameMap {
        'aa-diagram': AaDiagramElement;
    }
}
