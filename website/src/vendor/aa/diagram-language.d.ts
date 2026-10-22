/**
 * Aa's diagrams: boxes and lines drawn on Design system 1's squares.
 *
 * A diagram is written, not drawn, so it lives in writing like any other
 * words: a fenced ```diagram block in a document, a note or a block of
 * writing on a list. Aa draws it in place (`diagram.ts`); this file only
 * reads it and lays it out, with nothing of the page, so a server can count
 * a diagram's squares too.
 * Everything in it stands on the grid. A box is a whole number of squares, a
 * label takes one row, a group's boxes stack edge to edge, and a line between
 * two groups runs from the centre of one to the centre of the other, turning
 * only on a grid line.
 *
 *     # A continuous loop
 *
 *     Spec/docs @ 0 3
 *       Figma
 *       Notion
 *       Convex
 *
 *     [Ideas] @ 6 3
 *
 *     Development @ 6 6
 *       Agents
 *
 *     Ideas -- Development
 *
 * `# words` is the title, on the first row. A line at the left edge starts a
 * group and names it; the lines indented under it (or written `- Box`) are its
 * boxes. `[Box]` is a group that is one box with no name above it. `@ x y`
 * places a group, in squares from the top left, and a pale accent after the
 * name (`light-green`, `light-blue`, `pink`, `yellow`, `orange`, `red`, or
 * `white`, the plainest: white in the dark and the paper's pale grey in the
 * light) fills its boxes in that colour. A colour as a box's last word fills
 * that box alone, over its group's (`Google sign-in light-green`), so a row of
 * groups side by side reads as a table of states; a box that is only a
 * colour's name keeps it as its words. `A -- B` joins two groups or boxes by name, `A -> B`
 * ends in an arrow, `A <-> B` in two, and `A -> B -> C` joins each to the
 * next. `Group.Box` names one box where two groups share a name. A line
 * starting `//` is left out.
 *
 * Every box is an item cell, four squares across and one down, or a wider
 * item of whole items, as a board draws one sized by hand: `w8` makes a
 * group's boxes two items across, `w12` three, and a width between whole
 * items keeps the one under it, so `w6` is still an item's width. Every group
 * a line reaches stands on the grid two squares at a time, on a column or
 * halfway across one: its place across is taken to the nearest even square,
 * so two groups side by side stand two squares apart and the line between
 * them is two squares long. A group no line reaches keeps the square it
 * names, so chips in a row can stand a square apart, as a legend's do; and so
 * does a group placed on a post-it, since the post-it is the frame it is set
 * in.
 *
 * `{Ship}` is a post-it: a square frame that holds whatever groups are placed
 * on it, its name one square in from its top left corner. It is twelve
 * squares a side unless `w8` makes it eight (`h8` says the same), always a
 * whole number of columns, and a colour fills it the way it fills boxes.
 *
 * A group with no `@` takes the next column along with one left free after the
 * last, starting again two rows under the tallest once the row is full.
 *
 * `(2026-10)` is a month: a day a square, seven across from Monday as a
 * calendar has them, its weeks one under the other, and its name, the words
 * written before it, on the row above. A line under it that starts with a
 * colour gives the days that wear it, `pink 1 5 8 12` or `yellow 2-6`; a
 * line of seven words names the days, Monday first, on a row of their own
 * over the weeks.
 *
 *     10月 (2026-10) @ 0 3
 *       月 火 水 木 金 土 日
 *       pink 1 5 8 12 15
 *       yellow 2 9 16
 *
 * `(30x8)` is a grid of squares, thirty across and eight down, for whatever
 * is counted a square at a time: its name on the row above, as a month's is.
 * A colour's line under it gives the squares that wear it, by column and
 * then row from one: `pink 3` is the whole third column, `pink 3-5` three
 * columns, `light-green 8:1-2` the first two squares of the eighth, and a
 * later line colours over an earlier one. A line of as many words as it has
 * columns names them on a row over the squares, each in a box of its own as
 * a calendar's days are; a column whose squares wear nothing is named
 * faintly, as a day with nothing on it is. A line of as many words as it has
 * rows names those in a column before them, in the condensed face a
 * calendar's hours wear; one word more names the lines instead, each word on
 * its line from the squares' top edge to their foot, as the hours of a day
 * stand on theirs (`09` to `17` for eight hours).
 *
 *     September (30x8) @ 0 2
 *       1 2 3 … 30
 *       09 10 11 12 13 14 15 16
 *       pink 1-4 7-11
 *       light-green 8:1-2 9
 *
 * `(chart 12x6)` is a line chart, its plot twelve squares across and six
 * down, drawn as if with a marker on the paper. Under it, a line of words
 * names the points along its foot (the first under the left edge, the last
 * under the right), a line of numbers gives the values its lines stand on,
 * from the foot up (`0 10 20`, always the line after the names, ruled across the plot; without one it runs
 * from nought to its highest value), and a colour's line gives one series,
 * a value a point from left to right (`orange 3.4 3.8 6 11 17.9`), its last
 * value written at its end. The values' names stand in a column before the
 * plot and the last values in two after it, and the whole stands on a card a
 * square wider all round, its name inside its top corner, as Anthropic's
 * charts do.
 *
 *     Extreme scenario (chart 12x6) @ 0 2
 *       2026 2030
 *       0 10 20
 *       orange 3.4 3.8 6 11 17.9
 *       light-blue 5.4 5 4.2 4 3.9
 *
 * `marker` inside a grid's or a month's brackets, `(30x8 marker)` or
 * `(2026-10 marker)`, colours its squares in with a marker, a few short
 * strokes laid over one another, rather than as chips.
 *
 * A column's name longer than three letters slants up and to the right from
 * its square, so a grid of states (an app a column, a feature a row) stays a
 * square a cell whatever its columns are called (`gridHeadRows`).
 *
 * A line comes into a group's name at the middle of the name, not of the
 * group, to the nearest half square: the drawing measures each name and hands
 * its width over (`measure`), since only it knows the typeface.
 */
/** An edge a box shares with the box beside it, as cells on a board do. */
export type DiagramEdge = 'top' | 'right' | 'bottom' | 'left';
/** The pale accents a group's boxes can wear, by the names note colours go by. */
export declare const DIAGRAM_COLORS: readonly ["light-green", "light-blue", "pink", "yellow", "orange", "red", "white"];
export type DiagramColor = typeof DIAGRAM_COLORS[number];
export type DiagramBox = {
    text: string;
    x: number;
    y: number;
    w: number;
    color?: DiagramColor;
    shared?: Partial<Record<DiagramEdge, true>>;
};
export type DiagramLabel = {
    text: string;
    x: number;
    y: number;
    w: number;
    title?: true;
};
/** A frame groups stand on, drawn under them, in squares like a box. */
export type DiagramPostIt = {
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
    color?: DiagramColor;
};
/**
 * A group as it was written, for whatever edits the diagram where it is
 * drawn: the source line it starts on and the last line under it (by number
 * from one), its name, its boxes and the line each is written on, and the
 * squares it was set on. `box` is `[Box]`, a group that is one box; `stack`
 * a name over boxes; the rest are what their brackets say.
 */
export type DiagramGroup = {
    kind: 'box' | 'stack' | 'post-it' | 'month' | 'grid' | 'chart';
    line: number;
    end: number;
    name?: string;
    boxes: {
        text: string;
        line: number;
        color?: DiagramColor;
    }[];
    x: number;
    y: number;
    w: number;
    h: number;
    /** Whether its place is written (`@ x y`), or it took the next along. */
    placed: boolean;
    color?: DiagramColor;
};
/**
 * A day of a month, one square: its number, the colour it wears, and the
 * edges it shares with the coloured days beside it. `name` marks a day's
 * name, on the row over the weeks.
 */
export type DiagramDay = {
    text: string;
    x: number;
    y: number;
    color?: DiagramColor;
    name?: true;
    shared?: Partial<Record<DiagramEdge, true>>;
    /** A grid's column's name: in a box of its own, as a calendar's day is. */
    head?: true;
    /** A grid's row's name, in the condensed face. */
    row?: true;
    /** A name that stands on the line over its square rather than in the square: a row's line, as an hour's. */
    edge?: true;
    /** A grid's column's name too long for its square, set slanting up and to the right from the square's foot. */
    slant?: true;
    /** A coloured square filled in with a marker, as Anthropic colours its squares, rather than laid as a chip. */
    marker?: true;
};
/**
 * A line chart drawn as with a marker, in squares from the diagram's top
 * left: its plot, the names along its foot and up its side (each at the
 * point or line it names), and each series' points and the value at its end.
 */
export type DiagramChart = {
    x: number;
    y: number;
    w: number;
    h: number;
    /** The card the chart is drawn on, a square in from everything it holds, its edges ruled by hand. */
    frame: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    across: {
        text: string;
        at: number;
    }[];
    down: {
        text: string;
        at: number;
    }[];
    /** Each line's points, its last value, and where that value is written: beside its end, moved apart from the others so none overlap. */
    series: {
        color: DiagramColor;
        points: {
            x: number;
            y: number;
        }[];
        end: string;
        endAt: number;
    }[];
};
/** A straight run between two points, in squares: halves where it meets a box's centre. */
export type DiagramSegment = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};
export type DiagramLine = {
    segments: DiagramSegment[];
    arrow: boolean;
};
/** Where a line is written: its source line, and the two names it joins as written there. */
export type DiagramJoin = {
    line: number;
    from: string;
    to: string;
};
export type Diagram = {
    /** Squares across and down, from the top left square to the far edge of the last. */
    columns: number;
    rows: number;
    labels: DiagramLabel[];
    postIts: DiagramPostIt[];
    boxes: DiagramBox[];
    days: DiagramDay[];
    charts: DiagramChart[];
    lines: DiagramLine[];
    /** Every group as written, in the order written, with the squares it stands on. */
    groups: DiagramGroup[];
    /** Where each of `lines` is written, by the same place in the list. */
    joins: DiagramJoin[];
    /** Lines of the source that said nothing the diagram understood, by number from one. */
    unread: number[];
};
/** A box is an item cell, four squares across; a post-it stands on columns this wide. */
export declare const DIAGRAM_BOX_WIDTH = 4;
/** The widest a box or a post-it is written, in squares: ten items. */
export declare const DIAGRAM_MAX_WIDTH = 40;
/** A group stands on the grid this many squares at a time, a column or half of one: two side by side are two squares apart. */
export declare const DIAGRAM_STEP = 2;
/** How far across a row of groups placed in turn runs before the next row: the app's width. */
export declare const DIAGRAM_FLOW_COLUMNS = 12;
/** A post-it is square, the app's width a side unless it says otherwise. */
export declare const DIAGRAM_POST_IT_SIZE = 12;
/** A month is a week across, a day a square. */
export declare const DIAGRAM_MONTH_WIDTH = 7;
/** A box's width in squares for the width written for it: whole items, the one under it between two, an item at the least. */
export declare function diagramBoxWidth(written?: number): number;
/** How a diagram is laid out: `room`, the squares across it may take, to wrap it into when it is wider. */
export type DiagramLayoutOptions = {
    room?: number;
};
/** A name's width in squares, as the drawing sets it, or nothing when it cannot tell. */
export type DiagramMeasure = (text: string) => number | undefined;
/** A grid is at most this many squares a side. */
export declare const DIAGRAM_GRID_SIDE = 60;
/**
 * The rows a grid's columns' names stand on. Names of three letters or fewer
 * fit their squares and take one row, boxed as a calendar's days are; a
 * longer name (an app, a platform) slants up and to the right at 45 degrees
 * from its square, so a column stays one square wide whatever it is called,
 * and takes as many rows as the longest name rises: about a third of a square
 * for each letter, and its own height.
 */
export declare function gridHeadRows(names: string[]): number;
/** Whether a block of writing is a diagram, fenced from its first line to its last. */
export declare function isDiagramBlock(text: string): boolean;
/**
 * Whether a fenced diagram wraps: ```` ```diagram wrap ```` lays it out again
 * to fit the room it is given, in strips one under another as lines of
 * writing wrap, so nobody scrolls sideways to read it. Unwrapped, it keeps
 * its own layout.
 */
export declare function diagramWraps(fence: string): boolean;
/** The fence's first line with wrapping turned on or off, the rest of it kept. */
export declare function diagramFenceWrapped(fence: string, wrap: boolean): string;
/** The source inside a fenced diagram, without its fences. */
export declare function diagramSource(block: string): string;
/**
 * Where the closed diagram fences in a block of writing start and end, by
 * line from nought, both fence lines included. An open fence with no close is
 * not a diagram yet: it is still being written.
 */
export declare function diagramFences(text: string): {
    start: number;
    end: number;
}[];
/**
 * How many rows a block of writing holds at the least: a row a line, with
 * each fenced diagram counted as the rows it is drawn on instead of its lines.
 */
export declare function writingLineRows(text: string): number;
/**
 * How many of a list's columns (four squares each) the widest diagram in a
 * block of writing needs, or 0 when it holds none.
 */
export declare function diagramListColumns(text: string): number;
/** How many of the board's rows a fenced diagram takes. */
export declare function diagramBlockRows(block: string): number;
/**
 * Read a diagram's source and set every box, label and line on the grid.
 * `measure` gives a name's width, so a line into it meets its middle.
 */
export declare function layoutDiagram(source: string, measure?: DiagramMeasure, options?: DiagramLayoutOptions): Diagram;
