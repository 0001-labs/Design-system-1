/**
 * The pure parts of the Pages place: a site's pages across their languages, as one row each, and what search and a
 * share show of a page. A site writes each page once per language under the language's prefix (`/blueraft/`,
 * `/en/blueraft/`, `/de/blueraft/`); the list shows them as one row, and the language tabs choose which is shown.
 * The languages are read from the pages themselves, since the site engine names each page's `lang`. Nothing here
 * touches the DOM, so the tests read it directly.
 */

export interface Language {
  code: string;
  /** The language's own name, in sentence case: "Dansk", "English". */
  name: string;
  /** The address prefix: "" for the language at the root, "/en" for one under /en/. */
  prefix: string;
}

/** Who made a field's latest edit (their address), and when (milliseconds since 1970). */
export interface LastEdit { editor: string; at: number }

/** A page as the site engine's `pages` answers it. */
export interface PageSummary { path: string; lang: string; title: string; fields: number; edited: number; lastEdit?: LastEdit | null }

export type FieldKind = 'text' | 'meta' | 'image';
/** One field of a page, as `page?path=` answers it: its words now, the built words, and its last edit. */
export interface PageField { key: string; tag: string; kind: FieldKind; label: string; markdown: string; built?: string; edited?: boolean; lastEdit?: LastEdit | null }
export interface PageFields { path: string; lang: string; title: string; fields: PageField[] }
/** An edit kept for words the site's source no longer has. */
export interface DetachedEdit { id?: number; path: string; key: string; markdown: string; editor: string; at: number }

/** A language's own name, in sentence case: "da" is "Dansk"; a code the browser does not know is its code. */
export function languageName(code: string): string {
  if (!code) return 'Every language';
  let name = code;
  try { name = new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code; } catch { /* the code itself */ }
  return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
}

const firstSegment = (path: string) => /^\/[^/]+/.exec(path)?.[0] ?? '';

/**
 * The site's languages, from its pages: in the order the site lists them, the front page's first. A language with
 * the page at `/` stands at the root; another stands under the first part its pages' addresses share (`/en`).
 */
export function languagesOf(pages: readonly Pick<PageSummary, 'path' | 'lang'>[]): Language[] {
  const byLang = new Map<string, string[]>();
  for (const page of pages) byLang.set(page.lang || '', [...(byLang.get(page.lang || '') ?? []), page.path]);
  const front = pages.find(page => page.path === '/')?.lang ?? pages[0]?.lang ?? '';
  const codes = [...byLang.keys()].sort((a, b) => (a === front ? -1 : b === front ? 1 : 0));
  return codes.map(code => {
    const paths = byLang.get(code)!;
    const segment = firstSegment(paths[0] ?? '');
    const shared = !paths.includes('/') && segment && paths.every(path => path === segment || path.startsWith(`${segment}/`));
    return { code, name: languageName(code), prefix: shared ? segment : '' };
  });
}

export interface PageGroup {
  /** The page's address without its language prefix: "/blueraft/". */
  base: string;
  title: string;
  /** The page in each language the site has it in, in the site's order. */
  pages: { language: Language; page: PageSummary }[];
  edited: number;
  lastEdit: LastEdit | null;
}

const under = (path: string, prefix: string) => prefix !== '' && (path === prefix || path === `${prefix}/` || path.startsWith(`${prefix}/`));

/** The language a path is in and the path without its prefix. The page's own `lang` wins where the manifest gives one. */
export function splitPath(path: string, languages: Language[], lang?: string): { language: Language | null; base: string } {
  const named = lang ? languages.find(language => language.code === lang) : undefined;
  const byPrefix = [...languages].sort((a, b) => b.prefix.length - a.prefix.length).find(language => under(path, language.prefix));
  const language = named ?? byPrefix ?? languages.find(language => language.prefix === '') ?? null;
  const base = language && under(path, language.prefix) ? path.slice(language.prefix.length) || '/' : path;
  return { language, base: base.startsWith('/') ? base : `/${base}` };
}

/** The address of a page in a language. */
export const pathIn = (base: string, language: Language) => `${language.prefix}${base}`;

/** A page's name as short as a row wants it: its title up to the first " | " or " - ", unless nothing comes before it. */
export function shortTitle(title: string): string {
  const first = title.split(/ \| | - /)[0]!.trim();
  return first || title.trim();
}

const later = (a: LastEdit | null, b: LastEdit | null) => (!a ? b : !b ? a : b.at > a.at ? b : a);

/** The pages as rows across their languages, the front page first and the rest by address. */
export function groupPages(pages: PageSummary[], languages: Language[]): PageGroup[] {
  const groups = new Map<string, PageGroup>();
  for (const page of pages) {
    const { language, base } = splitPath(page.path, languages, page.lang);
    const group = groups.get(base) ?? { base, title: '', pages: [], edited: 0, lastEdit: null };
    groups.set(base, group);
    group.pages.push({ language: language ?? { code: page.lang || '', name: page.lang || page.path, prefix: '' }, page });
    group.edited += page.edited || 0;
    group.lastEdit = later(group.lastEdit, page.lastEdit ?? null);
  }
  const order = (language: Language) => { const index = languages.findIndex(each => each.code === language.code); return index < 0 ? languages.length : index; };
  for (const group of groups.values()) {
    group.pages.sort((a, b) => order(a.language) - order(b.language));
    group.title = group.pages.find(each => each.page.title)?.page.title || group.base;
  }
  return [...groups.values()].sort((a, b) => (a.base === '/' ? -1 : b.base === '/' ? 1 : a.base.localeCompare(b.base)));
}

/** A row of the Pages list: the page in the chosen language, where the site has it, else its first. */
export interface PageRow {
  base: string;
  /** The short title, the row's name. */
  name: string;
  title: string;
  /** The address shown, in the chosen language. */
  path: string;
  language: Language;
  /** How many words are edited across the page's languages, or "" for none. */
  edited: string;
  lastEdit: LastEdit | null;
}

/** The Pages list's rows in a language. */
export function pageRows(groups: PageGroup[], language: Language | null): PageRow[] {
  return groups.map(group => {
    const there = group.pages.find(each => each.language.code === language?.code) ?? group.pages[0]!;
    return {
      base: group.base,
      name: shortTitle(there.page.title || group.title),
      title: there.page.title || group.title,
      path: there.page.path,
      language: there.language,
      edited: group.edited > 0 ? group.edited.toLocaleString('en-GB') : '',
      lastEdit: group.lastEdit,
    };
  });
}

/** The row chosen: the one asked for while it is still a page, else the first. */
export const chosenRow = (rows: PageRow[], base: string | null) => rows.find(row => row.base === base) ?? rows[0] ?? null;

/** What search engines and shares show of a title and a description before they cut it off. */
export const TITLE_LIMIT = 60;
export const DESCRIPTION_LIMIT = 155;

/** A count of characters against its recommended length: "42 of 60", and whether it is over. */
export function lengthNote(words: string, limit: number): { count: number; limit: number; over: boolean; words: string } {
  const count = Array.from(words.trim()).length;
  return { count, limit, over: count > limit, words: `${count.toLocaleString('en-GB')} of ${limit.toLocaleString('en-GB')}` };
}

/**
 * Words cut to a length at a space where there is one, as a share cuts them. No ellipsis is added: where the card
 * cuts its words, they fade (Design system 1 never writes an ellipsis).
 */
export function clip(words: string, limit: number): string {
  const all = Array.from(words.trim().replace(/\s+/g, ' '));
  if (all.length <= limit) return all.join('');
  const cut = all.slice(0, limit).join('');
  const space = cut.lastIndexOf(' ');
  return (space > limit / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, '');
}

/** A page's search and sharing fields: its title, its description and its share image, where the build found them. */
export function shareFields<F extends Pick<PageField, 'kind' | 'tag' | 'label'>>(fields: F[]): { title?: F; description?: F; image?: F } {
  return {
    title: fields.find(field => field.kind === 'meta' && field.tag === 'title'),
    description: fields.find(field => field.kind === 'meta' && field.tag !== 'title'),
    image: fields.find(field => field.kind === 'image'),
  };
}

/** What a link to the page shows when it is shared: the site's host, the title and the description, each cut to its length. */
export function shareCard(title: string, description: string, origin: string): { host: string; title: string; description: string } {
  let host = '';
  try { host = new URL(origin).host.replace(/^www\./, ''); } catch { host = ''; }
  return { host, title: clip(title, TITLE_LIMIT) || 'Untitled', description: clip(description, DESCRIPTION_LIMIT) };
}

/** A path on the site itself, as the site engine takes a share image: one slash first, never two. */
const SITE_PATH = /^\/(?![/\\])[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/;

/** The pictures to choose a share image from: the manifest's paths on the site, once each, with the one in use among them. */
export function pickerImages(images: readonly unknown[] | undefined, current?: string): string[] {
  const out: string[] = [];
  for (const image of [...(images ?? []), current]) if (typeof image === 'string' && SITE_PATH.test(image) && !out.includes(image)) out.push(image);
  return out;
}

/** A site picture's address as the app shows it: through the owner gateway's files, since the site's own origin is not this one. */
export const siteFile = (code: string, path: string) => `/api/consistency/sites/${encodeURIComponent(code)}/files${path.split('/').map(encodeURIComponent).join('/')}`;

/** When something happened, as a detail line writes it: "26 Oct 2026, 14:05". */
export const when = (at: number) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(at);
