/**
 * A face Design system 1 did not draw, set on the sixteen: its `@font-face` corrected once so that at 14px on a
 * 16px line its capitals are 10px tall and its baseline stands 3px above the square's foot, as GT America's do
 * (https://designsystem1.com/1-root/constraints/#a-face-you-add). Plain TypeScript with no imports, for the
 * browser and for a build script alike.
 *
 * A face's metrics are fractions of its em: the ascent and descent the browser sets a line with and the height
 * of its capitals (`readFaceMetrics` takes them from a TrueType or OpenType file). `google-face-metrics.json`
 * beside this module holds them for the Google faces 0001's products offer; `scripts/face-metrics.mjs` measures
 * more. Correct the face, never its words: no padding, `top` or transform in a component.
 */

/** A face's vertical metrics, each over its em. */
export interface FaceMetrics {
  ascent: number;
  descent: number;
  capHeight: number;
}

/** GT America's: capitals 0.71 of the em, and its ascent less its descent, which places the baseline in a line. */
export const SIXTEEN_FACE = { capHeight: 0.71, baseline: 0.742 } as const;

/** The four `@font-face` descriptors that put a face on the sixteen, as CSS values. */
export interface FaceDescriptors {
  sizeAdjust: string;
  ascentOverride: string;
  descentOverride: string;
  lineGapOverride: string;
}

/**
 * The descriptors for a face: `size-adjust` makes its capitals 0.71 of the em, and the overrides make its ascent
 * less its descent 0.742 while it keeps its own height of ascent and descent. `size-adjust` scales the overrides
 * too, so they are given before it.
 */
export function faceDescriptors({ ascent, descent, capHeight }: FaceMetrics): FaceDescriptors {
  if (!(capHeight > 0) || !(ascent + descent > 0)) throw new Error('A face needs a cap height and a line height');
  const size = SIXTEEN_FACE.capHeight / capHeight;
  const height = Math.max((ascent + descent) * size, SIXTEEN_FACE.baseline);
  const percent = (value: number) => `${+(value * 100).toFixed(2)}%`;
  return {
    sizeAdjust: percent(size),
    ascentOverride: percent((height + SIXTEEN_FACE.baseline) / 2 / size),
    descentOverride: percent((height - SIXTEEN_FACE.baseline) / 2 / size),
    lineGapOverride: '0%',
  };
}

/** The descriptors as declarations for an `@font-face` rule. */
export function faceCorrection(metrics: FaceMetrics): string {
  const { sizeAdjust, ascentOverride, descentOverride, lineGapOverride } = faceDescriptors(metrics);
  return `size-adjust:${sizeAdjust};ascent-override:${ascentOverride};descent-override:${descentOverride};line-gap-override:${lineGapOverride}`;
}

/**
 * A stylesheet of `@font-face` rules (Google's css2 answer, say) with every face corrected in its own rule,
 * without comments or spaces. A face with no metrics stops it: an uncorrected face would stand off the sixteen.
 */
export function correctFaces(css: string, metrics: Readonly<Record<string, FaceMetrics>>): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*([{};:,])\s*/g, '$1').trim().replace(/@font-face{([^}]*)}/g, (_, body: string) => {
    const family = body.match(/font-family:(['"]?)([^;'"]+)\1(?:;|$)/)?.[2];
    if (!family || !Object.hasOwn(metrics, family)) throw new Error(`No metrics for the face ${family ?? '(unnamed)'}`);
    return `@font-face{${body}${body.endsWith(';') ? '' : ';'}${faceCorrection(metrics[family]!)}}`;
  });
}

/** Google's css2 stylesheet at `href`, read and corrected. css2 answers with woff2 to the browser asking. */
export async function correctedGoogleFonts(href: string, metrics: Readonly<Record<string, FaceMetrics>>, init?: RequestInit): Promise<string> {
  const response = await fetch(href, init);
  if (!response.ok) throw new Error(`Google Fonts answered ${response.status} for ${href}`);
  return correctFaces(await response.text(), metrics);
}

/**
 * The metrics a browser sets a line of the face with, from its TrueType or OpenType file (not woff2): `hhea`'s
 * ascent and descent, or `OS/2`'s typographic ones when the face asks for them (USE_TYPO_METRICS), and `OS/2`'s
 * cap height, each over `head`'s units per em, to four places.
 */
export function readFaceMetrics(file: Uint8Array): FaceMetrics {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const tables = new Map<string, number>();
  for (let i = 0, count = view.getUint16(4); i < count; i++) {
    const at = 12 + i * 16;
    tables.set(String.fromCharCode(...file.subarray(at, at + 4)), view.getUint32(at + 8));
  }
  const head = tables.get('head'), hhea = tables.get('hhea'), os2 = tables.get('OS/2');
  if (head === undefined || hhea === undefined || os2 === undefined) throw new Error('Not a TrueType or OpenType face');
  const em = view.getUint16(head + 18);
  const typo = (view.getUint16(os2 + 62) & 0x80) !== 0;
  const ascent = typo ? view.getInt16(os2 + 68) : view.getInt16(hhea + 4);
  const descent = -(typo ? view.getInt16(os2 + 70) : view.getInt16(hhea + 6));
  const capHeight = view.getUint16(os2) >= 2 ? view.getInt16(os2 + 88) : 0;
  if (!capHeight) throw new Error('The face has no cap height in OS/2');
  const fraction = (value: number) => Math.round((value / em) * 10000) / 10000;
  return { ascent: fraction(ascent), descent: fraction(descent), capHeight: fraction(capHeight) };
}
