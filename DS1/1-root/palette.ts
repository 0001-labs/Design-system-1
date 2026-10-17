// Design system 1's palette: one list, named by colour. The Colours page (website/src/pages/colours.astro)
// draws it and the CLASSless stylesheet (one.semantic.css) carries it as tokens, written by
// scripts/write-palette-css.ts. Change a colour here, then run that script.
//
// Every palette colour has a pastel (its hue and saturation at 90% lightness) and a dark-mode version
// (the hue, the saturation times 0.49, at 41.4% lightness, as the ds1 Figma file derives Apple green:
// #99ff73 to #529d36). In dark mode a pastel becomes a dim version at 20% lightness. Inks turn over.

export const named: [string, string][] = [
  ['Tuned red', '#ff5f5f'], ['Signal red', '#ff4438'], ['Red for blood', '#de0331'], ['Dark red variant', '#c50124'],
  ['Orange', '#fec20d'], ['Old gold', '#b69e55'], ['Sand', '#dbc88f'], ['Drip yellow', '#fde70c'], ['Yellow', '#eaff00'],
  ['Every green', '#979441'], ['Chartreuse', '#ccff4d'], ['Apple green', '#99ff73'], ['Metal green', '#026d5b'],
  ['Hysteric blue', '#69d8fb'], ['Winning blue', '#0275fa'], ['Sharp blue', '#594dff'], ['Purple', '#e63aaf'], ['Pink', '#f5aad1'],
  ['White', '#ffffff'], ['Egg', '#f9f6ef'], ['Light grey', '#e8e8e8'], ['Slate light', '#e6e6e6'], ['Darker grey', '#797979'],
  ['Stealth', '#554455'], ['Slate dark', '#3c3c3c'], ['Ink', '#2c2c2b'], ['Black', '#2a2a2a'], ['Slate', '#1e1e1e'],
];

/** Pastels that already have a name and a value keep them. */
export const namedPastels: Record<string, [string, string]> = {
  'Sharp blue': ['Zenith blue', '#ccccff'],
  Chartreuse: ['Comfortable green', '#f2ffcf'],
};

type Hsl = [number, number, number];

export function toHsl(hex: string): Hsl {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min; const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

export function toHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export const isInk = ([, s, l]: Hsl): boolean => s < 0.15 || l > 0.95;

export function dark(hex: string): string {
  const [h, s, l] = toHsl(hex);
  if (isInk([h, s, l])) return toHex(h, s, 0.12 + (1 - l) * 0.76);
  return toHex(h, l > 0.414 ? s * 0.49 : s, 0.414);
}
export function pastel(hex: string): string { const [h, s] = toHsl(hex); return toHex(h, s, 0.9); }
export function dim(hex: string): string { const [h, s] = toHsl(hex); return toHex(h, s * 0.49, 0.2); }

export const tokenName = (name: string): string => '--one-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export interface PaletteColour {
  name: string; token: string; hex: string; dark: string; ink: boolean;
  pastelName: string; pastel: string; dim: string; hsl: Hsl;
}

/** The palette sorted around the wheel from red (the turn starts 30° before red, so deep reds lead and pink
 *  closes), lighter first within a hue; the inks after it, lightest first. */
export function palette(): PaletteColour[] {
  const turn = (h: number) => (h + 30) % 360;
  return named
    .map(([name, hex]) => {
      const hsl = toHsl(hex);
      return {
        name, hex, hsl, token: tokenName(name), dark: dark(hex), ink: isInk(hsl),
        pastelName: namedPastels[name]?.[0] || `${name} pastel`, pastel: namedPastels[name]?.[1] || pastel(hex), dim: dim(hex),
      };
    })
    .sort((a, b) => {
      if (a.ink !== b.ink) return a.ink ? 1 : -1;
      if (a.ink) return b.hsl[2] - a.hsl[2];
      return turn(a.hsl[0]) - turn(b.hsl[0]) || b.hsl[2] - a.hsl[2];
    });
}

export const paletteStart = '  /* Palette: written by scripts/write-palette-css.ts from DS1/1-root/palette.ts. */';
export const paletteEnd = '  /* Palette: end */';

/** The CLASSless tokens: each colour and its pastel, both following the reader's light or dark mode. */
export function paletteCss(): string {
  const lines = [paletteStart];
  for (const c of palette()) {
    lines.push(`  ${c.token}: light-dark(${c.hex}, ${c.dark});`);
    if (c.ink) continue;
    lines.push(`  ${c.token}-pastel: light-dark(${c.pastel}, ${c.dim});`);
    if (namedPastels[c.name]) lines.push(`  ${tokenName(namedPastels[c.name][0])}: var(${c.token}-pastel);`);
  }
  lines.push(paletteEnd);
  return lines.join('\n');
}

/**
 * The palette on its own, for a page that does not take the classless sheet: palette.css,
 * imported by one.css and copied by Sync 1's `root` and `tokens` exports.
 */
export function paletteSheet(): string {
  return [
    '/* Design system 1\'s named colours as tokens: --one-<colour> and --one-<colour>-pastel,',
    '   each light-dark(light, dark), and the named pastels (--one-zenith-blue,',
    '   --one-comfortable-green). light-dark() follows the page\'s color-scheme, which',
    '   one.css sets. Written by scripts/write-palette-css.ts from palette.ts; never edit it',
    '   by hand. */',
    '',
    ':root {',
    paletteCss(),
    '}',
    '',
  ].join('\n');
}
