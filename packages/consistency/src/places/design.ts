/**
 * Design, one of an open site's places in Consistency's app, ported from the sites' own editor (deleted 26 October
 * 2026): the site's design read from the site itself, through the owner gateway's `document` route, the page as a
 * visitor sees it, on this origin and sandboxed with `allow-same-origin` alone, so none of the site's scripts run.
 *
 * - **Colours in use**, measured: each page (one per address, in the first language) is loaded in a hidden frame,
 *   one after another, saying how far it has got. Every visible element in its body gives its words', its
 *   background's, and its drawn borders' and outline's colours, counted the most used first, each with its share of
 *   the elements and the names of the tokens on the page's root whose value it is. It measures the theme the site
 *   draws in this browser, and says which.
 * - **The library's colours**, quieter: its semantic tokens in light and dark, resolved in the site's page.
 * - **Type and pieces**, drawn live in the site's own stylesheets: the typefaces and type sizes, then buttons, a card,
 *   a tag, a table, messages and prose, in a frame of their own (`srcdoc`, the site's stylesheets and no script).
 * - **Measures**: the square, the control and row heights, and the corners, as the site's page resolves them.
 * - A link to the libraries on designsystem1.com, when the site loads a published library.
 *
 * What was measured is kept for the next visit's first paint; it is measured again on entry, and on coming back to
 * the place or the window once the last measure is five minutes old.
 */
import { LitElement, html, nothing } from 'lit';
import '../../../../DS1/2-core/ds-button';
import '../../../../DS1/2-core/ds-text';
import '../../../../DS1/2-core/ds-message';
import '../../../../DS1/2-core/ds-empty';
import { siteAddress, type SiteSummary } from '../site-editing';
import { siteApi } from './api';
import { addTallies, hexOf, namesOf, parseColour, shareOf, tallyColours, type Rgba } from './colours';
import { kept, readWhenShown } from './fresh';
import { groupPages, languagesOf, type PageSummary } from './pages-group';
import './places.css';

type Theme = 'light' | 'dark';
interface Token { name: string; value: string }
/** What the site's pages say of its design. */
export interface Measured {
  at: number;
  theme: Theme;
  pages: number;
  unread: number;
  elements: number;
  colours: { hex: string; elements: number; names: string[] }[];
  library: { label: string; name: string; light: string; dark: string }[];
  faces: Token[];
  sizes: Token[];
  measures: Token[];
  corners: Token[];
  /** The site's stylesheets, as the page links them (addresses on this origin), and its own style blocks. */
  sheets: string[];
  styles: string[];
  /** The page root's class and theme, so the pieces are drawn as the site draws them. */
  rootClass: string;
  rootTheme: string;
  libraryUrl: string | null;
}

const AGAIN_AFTER = 5 * 60_000;

/** The library's semantic colours, by what they are for. */
const LIBRARY: [string, string][] = [
  ['Paper', '--ds-paper'], ['Text', '--ds-text-color'], ['Muted', '--ds-text-color-muted'], ['Fill', '--ds-fill'], ['Hover', '--ds-fill-hover'],
  ['Border', '--ds-border-color'], ['Accent', '--ds-accent-color'], ['On accent', '--ds-button-text-color-on-accent'], ['Focus', '--ds-focus-ring'],
  ['Danger', '--ds-danger-color'], ['Warning', '--ds-warning-color'], ['Success', '--ds-success-color'],
];

/** Every custom property a document's stylesheets declare, found through their rules (imports, layers and media too). Rules are read by their shape, since a frame's are of another window's classes. */
function declaredTokens(doc: Document): Set<string> {
  const names = new Set<string>();
  const safely = (sheet: CSSStyleSheet) => { try { walk(sheet.cssRules); } catch { /* a sheet from another origin cannot be read; the site's own are on this origin */ } };
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if ('selectorText' in rule && 'style' in rule) for (const name of Array.from((rule as CSSStyleRule).style)) if (name.startsWith('--')) names.add(name);
      if ('styleSheet' in rule && (rule as CSSImportRule).styleSheet) safely((rule as CSSImportRule).styleSheet as CSSStyleSheet);
      if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) walk((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) safely(sheet);
  const view = doc.defaultView ?? window;
  for (const name of Array.from(view.getComputedStyle(doc.documentElement))) if (name.startsWith('--')) names.add(name);
  return names;
}

/** A token's value in a colour scheme, resolved by a probe element in a document's body. */
function resolved(doc: Document, name: string, property: 'color' | 'font-size' | 'font-family' | 'border-radius' | 'width', scheme?: Theme): string {
  const probe = doc.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  Object.assign(probe.style, { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' });
  if (scheme) probe.style.colorScheme = scheme;
  probe.style.setProperty(property, `var(${name})`);
  doc.body.append(probe);
  const style = (doc.defaultView ?? window).getComputedStyle(probe);
  const value = property === 'width' ? style.width : style.getPropertyValue(property);
  probe.remove();
  return value;
}

const isColour = (value: string) => value !== '' && !/^(?:-?\d|calc\(|inherit$|initial$|unset$|revert|currentcolor$)/i.test(value) && CSS.supports('color', value);

let pixel: CanvasRenderingContext2D | null = null;
/** A colour the browser writes in a form colours.ts does not read (oklch, say), painted on one pixel and read back in sRGB. */
function painted(value: string): Rgba | null {
  pixel ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
  if (!pixel || !CSS.supports('color', value)) return null;
  pixel.clearRect(0, 0, 1, 1);
  pixel.fillStyle = value;
  pixel.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = pixel.getImageData(0, 0, 1, 1).data;
  return { r: r!, g: g!, b: b!, a: a! / 255 };
}
const known = new Map<string, string | null>();
/** A computed colour as one hex, or null when it is transparent. */
function hexFor(value: string): string | null {
  if (!known.has(value)) { const colour = parseColour(value) ?? painted(value); known.set(value, colour ? hexOf(colour) : null); }
  return known.get(value) ?? null;
}

/** The theme a document is drawn in: Design system 1's mark on the root, else its colour scheme. */
function themeOf(doc: Document): Theme {
  const root = doc.documentElement;
  if (root.classList.contains('dark-theme') || root.dataset.theme === 'dark') return 'dark';
  if (root.classList.contains('light-theme') || root.dataset.theme === 'light') return 'light';
  const view = doc.defaultView ?? window;
  const scheme = view.getComputedStyle(root).colorScheme;
  if (/\bdark\b/.test(scheme) && !/\blight\b/.test(scheme)) return 'dark';
  if (/\blight\b/.test(scheme) && !/\bdark\b/.test(scheme)) return 'light';
  return view.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const SIDES = ['top', 'right', 'bottom', 'left'] as const;
/** Each visible element's colours on a page: its words, its background, and its borders and outline where they are drawn. */
function coloursOn(doc: Document): string[][] {
  const view = doc.defaultView;
  if (!view || !doc.body) return [];
  const elements: string[][] = [];
  for (const element of [doc.body, ...Array.from(doc.body.querySelectorAll('*'))]) {
    if (!element.getClientRects().length) continue;
    const style = view.getComputedStyle(element);
    if (style.visibility !== 'visible' || style.opacity === '0') continue;
    const colours: string[] = [];
    const add = (value: string) => { const found = hexFor(value); if (found) colours.push(found); };
    add(style.color);
    add(style.backgroundColor);
    for (const side of SIDES) if (Number.parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0 && !/^(none|hidden)$/.test(style.getPropertyValue(`border-${side}-style`))) add(style.getPropertyValue(`border-${side}-color`));
    if (style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0) add(style.outlineColor);
    elements.push(colours);
  }
  return elements;
}

/** Everything the first page tells of the design, beyond its colours. */
function designOf(doc: Document, tokens: string[]) {
  const root = (doc.defaultView ?? window).getComputedStyle(doc.documentElement);
  const value = (name: string) => root.getPropertyValue(name).trim();
  const colourTokens = tokens.flatMap(name => {
    if (!isColour(value(name))) return [];
    const found = hexFor(resolved(doc, name, 'color'));
    return found ? [[name, found] as [string, string]] : [];
  });
  const hex = (colour: string) => hexFor(colour) ?? colour;
  const library = LIBRARY.filter(([, name]) => isColour(value(name))).map(([label, name]) => ({ label, name, light: hex(resolved(doc, name, 'color', 'light')), dark: hex(resolved(doc, name, 'color', 'dark')) }));
  const pick = (test: (name: string) => boolean, property: Parameters<typeof resolved>[2]) => tokens.filter(name => test(name) && value(name)).map(name => ({ name, value: resolved(doc, name, property) }));
  const sheets = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]')).map(link => link.href).filter(href => { try { return new URL(href).origin === location.origin; } catch { return false; } });
  return {
    colourTokens, library,
    faces: pick(name => /^--(?:ds-)?typeface-/.test(name), 'font-family'),
    sizes: pick(name => name.startsWith('--ds-type-size-'), 'font-size'),
    measures: ['--ds-unit', '--ds-control-height', '--ds-row-height'].filter(name => value(name)).map(name => ({ name, value: resolved(doc, name, 'width') })),
    corners: pick(name => name.startsWith('--ds-radius'), 'border-radius'),
    sheets,
    styles: Array.from(doc.querySelectorAll('style')).map(style => style.textContent ?? ''),
    rootClass: doc.documentElement.className,
    rootTheme: doc.documentElement.dataset.theme ?? '',
    libraryUrl: sheets.some(href => /\/library\/ds1-library\//.test(href)) ? 'https://designsystem1.com/libraries/' : null,
  };
}

/** Loads a page into the measuring frame and answers its document once it has drawn, or null if it does not load. */
function load(frame: HTMLIFrameElement, url: string): Promise<Document | null> {
  return new Promise(resolve => {
    let timer = 0;
    const done = (doc: Document | null) => { window.clearTimeout(timer); frame.removeEventListener('load', loaded); resolve(doc); };
    const loaded = () => requestAnimationFrame(() => done(frame.contentDocument));
    timer = window.setTimeout(() => done(null), 15000);
    frame.addEventListener('load', loaded);
    frame.src = url;
  });
}

const escapeText = (text: string) => text.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!);

/**
 * The document the type and the pieces are drawn in: the site's stylesheets and style blocks, its root's class and
 * theme, and Design system 1's native classes, with no script at all.
 */
export function specimenDocument(measured: Pick<Measured, 'sheets' | 'styles' | 'rootClass' | 'rootTheme' | 'faces' | 'sizes'>, name: string): string {
  const site = escapeText(name);
  return [
    '<!doctype html>',
    `<html class="${escapeText(measured.rootClass)}"${measured.rootTheme ? ` data-theme="${escapeText(measured.rootTheme)}"` : ''}><head><meta charset="utf-8">`,
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:">`,
    ...measured.sheets.map(href => `<link rel="stylesheet" href="${escapeText(href)}">`),
    ...measured.styles.map(style => `<style>${style.replace(/<\/style/gi, '<\\/style')}</style>`),
    '<style>body{margin:0;padding:2px}.specimen{display:flex;flex-direction:column;gap:var(--ds-unit,20px)}.specimen-row{display:flex;flex-wrap:wrap;align-items:flex-end;gap:var(--ds-unit,20px)}.specimen code{font-size:13px;opacity:.6}</style>',
    '</head><body><div class="specimen">',
    ...measured.faces.map(face => `<div class="specimen-row"><span style="font-family:var(${face.name})">${site}, 0123456789 →</span><code>${escapeText(face.name)}</code></div>`),
    ...measured.sizes.map(size => `<div class="specimen-row"><span style="font-size:var(${size.name});line-height:1">Aa</span><code>${escapeText(size.name)} ${escapeText(size.value)}</code></div>`),
    '<div class="specimen-row"><button class="ds-button ds-button--primary" type="button">Book a trip</button><button class="ds-button ds-button--secondary" type="button">Read more</button><a class="ds-link" href="#">A link</a></div>',
    '<div class="specimen-row"><div class="ds-card" style="width:calc(12 * var(--ds-unit,20px))"><span class="ds-card__label">A card</span><span class="ds-card__title">Its title</span><p class="ds-card__body">Writing on the card, one square a line.</p></div><span class="ds-badge">A tag</span></div>',
    '<table class="ds-table"><thead><tr><th scope="col">Trip</th><th scope="col">Time</th><th scope="col" data-numeric>People</th></tr></thead><tbody><tr><th scope="row">Morning</th><td>9:00</td><td data-numeric>8</td></tr><tr><th scope="row">Evening</th><td>19:00</td><td data-numeric>12</td></tr></tbody></table>',
    '<div class="ds-notice ds-notice--success"><span class="ds-notice__mark"></span><div><p class="ds-notice__title">Saved</p></div></div>',
    '<div class="ds-notice ds-notice--danger"><span class="ds-notice__mark"></span><div><p class="ds-notice__title">Something went wrong</p><p class="ds-notice__text">Words in the danger colour.</p></div></div>',
    '<div data-ds-prose style="max-width:calc(32 * var(--ds-unit,20px))"><h2>A heading in writing</h2><p>Long-form writing on the site: <strong>strong words</strong>, <em>emphasis</em> and <a href="#">a link</a>.</p><ul><li>A list</li><li>of two things</li></ul></div>',
    '</div></body></html>',
  ].join('');
}

export class ConsistencyPlaceDesign extends LitElement {
  static properties = { measured: { state: true }, progress: { state: true }, problem: { state: true }, specimenHeight: { state: true } };
  declare measured: Measured | null;
  /** How far the measuring has got: "Reading 3 of 11 pages", or nothing while it is not measuring. */
  declare progress: string;
  declare problem: string;
  declare specimenHeight: number;
  site!: SiteSummary;
  private stop: (() => void) | null = null;
  private measuring: Promise<void> | null = null;
  private turn = 0;

  constructor(site?: SiteSummary) {
    super();
    if (site) this.site = site;
    this.measured = null; this.progress = ''; this.problem = ''; this.specimenHeight = 0;
  }
  protected createRenderRoot() { return this; }

  private get key() { return `consistency-place-design:${this.site.code}`; }

  connectedCallback() {
    super.connectedCallback();
    this.measured ??= kept.read<Measured>(this.key) ?? null;
    this.stop = readWhenShown(this, () => { if (!this.measured || Date.now() - this.measured.at > AGAIN_AFTER) void this.measure(); });
    void this.measure();
  }
  disconnectedCallback() { super.disconnectedCallback(); this.stop?.(); this.stop = null; this.turn++; this.measuring = null; }

  /** The site's pages, each read in a hidden frame in turn; once at a time. */
  measure(): Promise<void> {
    this.measuring ??= this.read().finally(() => { this.measuring = null; });
    return this.measuring;
  }

  private async read() {
    const mine = ++this.turn;
    const still = () => mine === this.turn && this.isConnected;
    let pages: PageSummary[];
    try { pages = (await siteApi<{ pages?: PageSummary[] }>(this.site.code, 'pages')).pages ?? []; }
    catch (error) { if (still()) this.problem = (error as Error).message; return; }
    const paths = groupPages(pages, languagesOf(pages)).map(group => group.pages[0]!.page.path);
    if (!paths.length) { this.problem = ''; this.progress = ''; return; }
    const frame = document.createElement('iframe');
    frame.className = 'place-measure';
    frame.setAttribute('sandbox', 'allow-same-origin');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.title = '';
    document.body.append(frame);
    const tally = new Map<string, number>();
    let design: ReturnType<typeof designOf> | null = null;
    let theme: Theme = 'light';
    let elements = 0, unread = 0;
    try {
      for (const [index, path] of paths.entries()) {
        if (!still()) return;
        this.progress = `Reading ${index + 1} of ${paths.length} ${paths.length === 1 ? 'page' : 'pages'}`;
        const doc = await load(frame, siteAddress.document(this.site.code, path));
        if (!still()) return;
        if (!doc?.body) { unread += 1; continue; }
        if (!design) { design = designOf(doc, [...declaredTokens(doc)].sort()); theme = themeOf(doc); }
        const page = coloursOn(doc);
        elements += page.length;
        addTallies(tally, tallyColours(page));
      }
    } finally { frame.remove(); }
    if (!still()) return;
    this.progress = '';
    if (!design) { this.problem = 'The site’s pages did not load here.'; return; }
    const { colourTokens, ...rest } = design;
    const colours = [...tally].map(([hex, uses]) => ({ hex, elements: uses, names: namesOf(hex, colourTokens) })).sort((a, b) => b.elements - a.elements || a.hex.localeCompare(b.hex));
    this.measured = { at: Date.now(), theme, pages: paths.length - unread, unread, elements, colours, ...rest };
    this.problem = '';
    kept.write(this.key, this.measured);
  }

  render() {
    const measured = this.measured;
    const count = (value: number) => value.toLocaleString('en-GB');
    const heading = (words: string, quiet = false) => html`<ds-text class="place-design__heading" role="heading" aria-level="2" literal ?strong=${!quiet} tone=${quiet ? 'muted' : nothing} text=${words}></ds-text>`;
    return html`<div class="place place-column place-design">
      <div class="place-design__head">
        <ds-text class="place-title" role="heading" aria-level="1" literal size="display" text="Design"></ds-text>
        ${measured?.libraryUrl ? html`<ds-button secondary href=${measured.libraryUrl} target="_blank" rel="noopener">Open the library</ds-button>` : nothing}
      </div>
      ${this.problem ? html`<ds-message role="alert" tone="danger" literal heading="The site's design could not be read" text=${this.problem}></ds-message>` : nothing}
      <section class="place-section" aria-label="Colours in use">
        ${heading('Colours in use')}
        ${this.progress ? html`<ds-text class="place-design__progress" literal tone="muted" text=${this.progress}></ds-text>` : nothing}
        ${measured ? html`<ds-text literal wrap tone="muted" text=${`${count(measured.elements)} elements on ${count(measured.pages)} ${measured.pages === 1 ? 'page' : 'pages'}, in the ${measured.theme} theme: ${count(measured.colours.length)} colours.${measured.unread ? ` ${count(measured.unread)} could not be read.` : ''}`}></ds-text>
          <ul class="place-swatches" role="list">${measured.colours.map(colour => html`<li class="place-swatch">
            <span class="place-swatch__chip" aria-hidden="true"><span style=${`background:${colour.hex}`}></span></span>
            <span class="place-swatch__words"><span><code class="place-code">${colour.hex}</code> <span class="place-muted">${shareOf(colour.elements, measured.elements)} of elements</span></span>
            <ds-text literal tone="muted" text=${colour.names.length ? colour.names.join(', ') : 'No token'}></ds-text></span>
          </li>`)}</ul>` : nothing}
      </section>
      ${measured ? html`
        <section class="place-section" aria-label="The library's colours">
          ${heading('The library’s colours', true)}
          ${measured.library.length ? html`<ul class="place-swatches" role="list">${measured.library.map(each => html`<li class="place-swatch">
            <span class="place-swatch__chip" aria-hidden="true"><span style=${`background:${each.light}`}></span><span style=${`background:${each.dark}`}></span></span>
            <span class="place-swatch__words"><span>${each.label} <code class="place-code">${each.name}</code></span>
            <ds-text literal tone="muted" text=${each.light === each.dark ? each.light : `${each.light} · ${each.dark} dark`}></ds-text></span>
          </li>`)}</ul>` : html`<ds-message tone="warning" literal heading="The site's library was not found" text="The site's pages load none of Design system 1's tokens."></ds-message>`}
        </section>
        <section class="place-section" aria-label="Measures">
          ${heading('Measures')}
          <ul class="place-design__list" role="list">
            ${measured.measures.map(each => html`<li class="place-design__measure"><span class="place-design__bar" style=${`width:${each.value}`}></span><code class="place-code">${each.name}</code> <span class="place-muted">${each.value}</span></li>`)}
            ${measured.corners.map(each => html`<li class="place-design__measure"><span class="place-design__corner" style=${`border-radius:${each.value}`}></span><code class="place-code">${each.name}</code> <span class="place-muted">${each.value}</span></li>`)}
          </ul>
        </section>
        <section class="place-section" aria-label="Type and pieces">
          ${heading('Type and pieces')}
          <iframe class="place-design__specimen" title=${`${this.site.name}'s type and pieces`} sandbox="allow-same-origin" tabindex="-1"
            style=${this.specimenHeight ? `height:${this.specimenHeight}px` : ''} .srcdoc=${specimenDocument(measured, this.site.name)}
            @load=${(event: Event) => { const doc = (event.target as HTMLIFrameElement).contentDocument; if (doc) this.specimenHeight = Math.ceil(doc.documentElement.scrollHeight); }}></iframe>
        </section>` : nothing}
    </div>`;
  }
}
if (!customElements.get('consistency-place-design')) customElements.define('consistency-place-design', ConsistencyPlaceDesign);
