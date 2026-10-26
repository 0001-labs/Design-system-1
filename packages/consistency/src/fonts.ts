/** A page's Google Fonts: the choice the earlier site builder offered (its twenty curated families and their
 * fallback stacks, the same list its landing's libraries wear), loaded as it loaded them, from Google's css2
 * address with display=swap. A page may set a heading face and a text face over its library's; unset, the
 * library's own faces stay. Faces travel as DS1's typeface roles, so every component follows them. */
import { correctedGoogleFonts } from '../../../DS1/0-face/face-correction';
import FACE_METRICS from '../../../DS1/0-face/google-face-metrics.json';

const MONOSPACE_FALLBACK_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export const GOOGLE_FONTS = {
  Inter: 'Inter, sans-serif',
  Roboto: 'Roboto, sans-serif',
  'Open Sans': '"Open Sans", sans-serif',
  Montserrat: 'Montserrat, sans-serif',
  Poppins: 'Poppins, sans-serif',
  Nunito: 'Nunito, sans-serif',
  'Work Sans': '"Work Sans", sans-serif',
  Manrope: 'Manrope, sans-serif',
  'DM Sans': '"DM Sans", sans-serif',
  'Source Sans 3': '"Source Sans 3", sans-serif',
  Rubik: 'Rubik, sans-serif',
  Urbanist: 'Urbanist, sans-serif',
  Outfit: 'Outfit, sans-serif',
  Raleway: 'Raleway, sans-serif',
  'Noto Sans': '"Noto Sans", sans-serif',
  'Noto Sans JP': '"Noto Sans JP", "Noto Sans", sans-serif',
  Lora: 'Lora, serif',
  'Playfair Display': '"Playfair Display", serif',
  'Source Serif 4': '"Source Serif 4", serif',
  'JetBrains Mono': `"JetBrains Mono", ${MONOSPACE_FALLBACK_STACK}`,
} as const;

export type GoogleFont = keyof typeof GOOGLE_FONTS;
export const GOOGLE_FONT_FAMILIES = Object.keys(GOOGLE_FONTS) as GoogleFont[];

/** The page's faces; an absent one leaves the library's. */
export interface PageFonts { heading?: GoogleFont; text?: GoogleFont }

export const isGoogleFont = (value: unknown): value is GoogleFont => typeof value === 'string' && Object.hasOwn(GOOGLE_FONTS, value);

/** Only known families survive, so a saved document can never name a stylesheet of its own. */
export function readPageFonts(value: unknown): PageFonts {
  if (!value || typeof value !== 'object') return {};
  const { heading, text } = value as Record<string, unknown>;
  return { ...(isGoogleFont(heading) ? { heading } : {}), ...(isGoogleFont(text) ? { text } : {}) };
}

/** The roles the faces set: headings and labels wear the medium face, running text the regular one. */
export function fontTokens(fonts: PageFonts): Record<string, string> {
  return {
    ...(fonts.heading ? { '--ds-typeface-medium': GOOGLE_FONTS[fonts.heading] } : {}),
    ...(fonts.text ? { '--ds-typeface-regular': GOOGLE_FONTS[fonts.text] } : {}),
  };
}

/** One css2 stylesheet for the faces, or none. The heading face comes in 500 and the text face in 400; a
 * family chosen for both comes in both. */
export function googleFontsHref(fonts: PageFonts): string | undefined {
  const weights = new Map<GoogleFont, Set<number>>();
  const add = (family: GoogleFont | undefined, weight: number) => { if (family) weights.set(family, (weights.get(family) ?? new Set()).add(weight)); };
  add(fonts.heading, 500); add(fonts.text, 400);
  if (!weights.size) return undefined;
  const families = [...weights].map(([family, set]) => `family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${[...set].sort((a, b) => a - b).join(';')}`);
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

/** Keeps one stylesheet in the document's head for the faces in use, replacing it when they change. It is Google's
 * css2 answer with each face corrected in its @font-face (DS1's face-correction.ts), so the page's words stand on
 * the sixteen whatever its faces; should Google's answer not be read, the plain stylesheet is linked instead. */
export function loadPageFonts(fonts: PageFonts, root: Document = document): void {
  const href = googleFontsHref(fonts);
  const current = root.head.querySelector<HTMLElement>('[data-consistency-fonts]');
  if (current?.dataset.consistencyFonts === (href ?? '')) return;
  current?.remove();
  if (!href) return;
  if (!root.head.querySelector('link[data-consistency-fonts-preconnect]')) {
    const preconnect = root.createElement('link');
    preconnect.rel = 'preconnect'; preconnect.href = 'https://fonts.gstatic.com'; preconnect.crossOrigin = ''; preconnect.dataset.consistencyFontsPreconnect = '';
    root.head.append(preconnect);
  }
  const style = root.createElement('style');
  style.dataset.consistencyFonts = href;
  root.head.append(style);
  correctedGoogleFonts(href, FACE_METRICS).then((css) => { style.textContent = css; }, () => {
    if (!style.isConnected) return;
    const link = root.createElement('link');
    link.rel = 'stylesheet'; link.href = href; link.dataset.consistencyFonts = href;
    style.replaceWith(link);
  });
}

/** The faces as the sheet carries them for previews outside the composition: `heading|text`. */
export const encodePageFonts = (fonts: PageFonts) => `${fonts.heading ?? ''}|${fonts.text ?? ''}`;
export function decodePageFonts(value: string | undefined): PageFonts {
  const [heading, text] = (value ?? '').split('|');
  return readPageFonts({ heading, text });
}
