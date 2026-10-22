/**
 * Lines drawn as with a marker on paper, the way Anthropic draws its charts
 * (anthropic.com/institute/econ-scenarios, read from its DOM): a line is not
 * a stroke but a filled ribbon whose two edges wander on their own, laid down
 * as short overlapping strokes, each with a chisel tip cut at an angle and
 * thinning a little at its ends. A filter then takes grain out of the ink
 * (fine fractal noise subtracted from its alpha) and warps it a little
 * (coarse noise displacing it), and a ruled line gets the same treatment
 * lighter.
 *
 * What makes it read as material is the layers. A mark is never one ribbon:
 * its body is laid solid, then thinner passes of the same ink go over it a
 * little apart, darker where they cross the body (they multiply in the light),
 * the paper's own colour is let through in faint streaks, and along its edges
 * the ink pools in thin darker lines, as a felt tip's does where it stops
 * (`MarkerLayer`, `markerLine`, `markerSquare`).
 *
 * Everything is drawn from a seed, so a chart drawn again is the same chart.
 */
/** The filters, in user units of a twenty-to-the-square drawing: marker ink and the faint rule. */
export declare const MARKER_FILTERS = "\n  <filter id=\"aa-marker\" x=\"-8%\" y=\"-8%\" width=\"116%\" height=\"116%\" color-interpolation-filters=\"sRGB\">\n    <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.55\" numOctaves=\"2\" seed=\"7\" result=\"grain\"/>\n    <feColorMatrix in=\"grain\" type=\"luminanceToAlpha\" result=\"ga\"/>\n    <feComposite in=\"SourceGraphic\" in2=\"ga\" operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"-0.3\" k4=\"0\" result=\"inked\"/>\n    <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.11\" numOctaves=\"2\" seed=\"11\" result=\"warp\"/>\n    <feDisplacementMap in=\"inked\" in2=\"warp\" scale=\"2.6\" xChannelSelector=\"R\" yChannelSelector=\"G\"/>\n  </filter>\n  <filter id=\"aa-marker-fine\" x=\"-12%\" y=\"-12%\" width=\"124%\" height=\"124%\" color-interpolation-filters=\"sRGB\">\n    <feTurbulence type=\"fractalNoise\" baseFrequency=\"1.1\" numOctaves=\"2\" seed=\"7\" result=\"grain\"/>\n    <feColorMatrix in=\"grain\" type=\"luminanceToAlpha\" result=\"ga\"/>\n    <feComposite in=\"SourceGraphic\" in2=\"ga\" operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"-0.3\" k4=\"0\" result=\"inked\"/>\n    <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.22\" numOctaves=\"2\" seed=\"11\" result=\"warp\"/>\n    <feDisplacementMap in=\"inked\" in2=\"warp\" scale=\"1.3\" xChannelSelector=\"R\" yChannelSelector=\"G\"/>\n  </filter>\n  <filter id=\"aa-marker-rule\" x=\"-8%\" y=\"-50%\" width=\"116%\" height=\"200%\" color-interpolation-filters=\"sRGB\">\n    <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.72\" numOctaves=\"2\" seed=\"5\" result=\"grain\"/>\n    <feColorMatrix in=\"grain\" type=\"luminanceToAlpha\" result=\"ga\"/>\n    <feComposite in=\"SourceGraphic\" in2=\"ga\" operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"-0.12\" k4=\"0\" result=\"inked\"/>\n    <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.07\" numOctaves=\"2\" seed=\"3\" result=\"warp\"/>\n    <feDisplacementMap in=\"inked\" in2=\"warp\" scale=\"0.6\" xChannelSelector=\"R\" yChannelSelector=\"G\"/>\n  </filter>";
type Point = {
    x: number;
    y: number;
};
/**
 * A marker's line through the points, as the outlines of the strokes it is
 * laid down in: each a closed ribbon `width` across, its edges wandering
 * apart and together, its ends cut at the chisel's angle, the next stroke
 * starting a little before this one ends.
 */
export declare function markerStrokes(points: Point[], width: number, seed: number, { offset, whole }?: {
    offset?: number;
    whole?: boolean;
}): string[];
/** A ruled line from one point to another as a hand would draw it: nearly straight, a sample every few units, wandering a fraction of a unit. */
export declare function markerRule(from: Point, to: Point, seed: number): string;
/**
 * One pass of a mark: its outline, which ink it is laid in and how strongly.
 * `body` is the mark's own colour, `pass` the same ink laid over itself (a
 * shade darker, as ink over ink is), `edge` the ink pooled darker still, and
 * `paper` the paper's colour showing back through.
 */
export type MarkerTone = "body" | "pass" | "edge" | "paper";
export type MarkerLayer = {
    d: string;
    tone: MarkerTone;
    opacity: number;
};
/**
 * A chart's line as a marker lays it, measured from Anthropic's own: one
 * continuous ribbon as the body, a touch under solid (0.86); a narrower pass
 * of the same ink along its middle, under half its width (0.3); and a thin
 * streak of it a third of the way to one edge (0.22), where a felt tip's
 * worn side drags.
 */
export declare function markerLine(points: Point[], width: number, seed: number, body?: number): MarkerLayer[];
/**
 * A card's edge ruled by hand, as Anthropic frames each chart: a ribbon a
 * little over a pixel and a half wide along each side, faint.
 */
export declare function markerFrame(x: number, y: number, w: number, h: number, seed: number): MarkerLayer[];
/**
 * A square coloured in with a marker, as Anthropic colours its squares: five
 * strokes across it, each two fifths of its side and overlapping the next,
 * laid solid; then the paper let back through in two faint streaks, the ink
 * laid over itself in pairs of streaks, one wide and faint and one narrow and
 * stronger, across, slantwise and down, so the colour is uneven as a hand
 * leaves it; and the ink pooled along each of its four edges. It keeps a
 * little of the square clear all round, so squares side by side stand apart.
 */
export declare function markerSquare(x: number, y: number, size: number, seed: number): MarkerLayer[];
export type RibbonShape = {
    width: number;
    seed: number;
    /** How much of the stroke, at each end, the tip takes to reach its width. */
    taperIn?: number;
    taperOut?: number;
    /** The width the stroke starts and ends at, against its full width. */
    startWidth?: number;
    endWidth?: number;
    /** How much fuller its middle is, as a felt tip pressed down mid-stroke. */
    belly?: number;
    /** How much its width wanders along it. */
    wobble?: number;
    /** How far each edge wanders on its own, in units. */
    edge?: number;
    /** How far the tip is cut across, against the width. */
    chisel?: number;
};
/** One ribbon of ink along a line, as a closed outline. */
export declare function ribbon(points: Point[], shape: RibbonShape): string;
export type StrokeOptions = Omit<RibbonShape, "width" | "seed"> & {
    width: number;
    seed: number;
    opacity?: number;
    core?: boolean;
    streaks?: boolean;
};
/**
 * One marker stroke: its body; then, once it is wide enough to show it, the
 * ink laid over itself in a narrower ribbon wandering about its middle (a
 * shade deeper, three tenths) and dragged along one edge (deeper still, a
 * fifth); and on a broad stroke, the paper let back through in three faint
 * streaks.
 */
export declare function markerStroke(points: Point[], options: StrokeOptions): MarkerLayer[];
export type DashOptions = {
    width: number;
    seed: number;
    dashLength?: number;
    gap?: number;
    opacity?: number;
    samples?: number;
};
/**
 * A line laid in dashes, as a hand lays one: each dash its own short stroke,
 * a little longer or shorter than the last, the gaps likewise, each turned a
 * hair off the line about its middle, its width and strength its own, and
 * about one in three gone over again a shade deeper. Returns the dashes in
 * order, so they can be laid down one after another.
 */
export declare function markerDashes(points: Point[], options: DashOptions): MarkerLayer[][];
/** Smoothly varying noise for a place, 0 to 1, the same every time for the same number. */
export declare function hashed(n: number): number;
export {};
