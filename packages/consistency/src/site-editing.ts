/**
 * Editing a site's words in the editor: the pure parts of `site-editor.ts`, kept apart from the DOM so they test
 * in Node. A site is one of the workspace's Consistency sites; its page is shown from the owner gateway
 * (`/api/consistency/sites/<id>/document`) in a frame on this origin, sandboxed without scripts, and its words
 * are the site engine's fields, saved one by one as the site engine edits.
 */

/**
 * One of the workspace's sites by its IDv1 code (a list's shape), as `/api/consistency/sites` gives it: `url` the
 * address its pages are opened on, `address` its built-in colour address under c9y.site, `domain` a domain of its
 * own connected.
 */
export interface SiteSummary { code: string; name: string; url: string; address?: string; domain?: string }
export interface SitePage { path: string; lang: string; title: string; fields: number; edited: number }
export interface SiteField { key: string; tag: string; kind: 'text' | 'meta' | 'image'; label: string; markdown: string; built?: string; edited?: boolean }
export interface PageDetail { path: string; lang: string; title: string; fields: SiteField[] }

const base = (site: string) => `/api/consistency/sites/${encodeURIComponent(site)}`;
export const siteAddress = {
  pages: (site: string) => `${base(site)}/pages`,
  page: (site: string, path: string) => `${base(site)}/page?path=${encodeURIComponent(path)}`,
  document: (site: string, path: string) => `${base(site)}/document?path=${encodeURIComponent(path)}`,
  edit: (site: string) => `${base(site)}/edit`,
  composition: (site: string, path: string) => `${base(site)}/api/composition?path=${encodeURIComponent(path)}`,
  nativePage: (site: string, path: string) => `${base(site)}/api/native-page?path=${encodeURIComponent(path)}`,
};

/**
 * Which fields are edited here: a page's words (`text`). The title, the description (`meta`) and the share image
 * (`image`) are not on the page; the platform still takes them under the site engine's rules, and Pages in each site's
 * own editor edits them.
 */
export const isWordsField = (field: Pick<SiteField, 'kind'>) => field.kind === 'text';

/** One line of words, saved on Enter: a heading or a button, as the site engine decides. */
export const isPlainField = (field: Pick<SiteField, 'kind' | 'tag' | 'label'>) =>
  field.kind === 'meta' || /^h[1-6]$/i.test(field.tag) || field.tag.toLowerCase() === 'button' || field.label.toLowerCase() === 'button';

const NAMES: Record<string, string> = {
  h1: 'Main heading', h2: 'Heading', h3: 'Heading', h4: 'Heading', h5: 'Heading', h6: 'Heading',
  p: 'Paragraph', li: 'List item', dt: 'Term', dd: 'Meaning', summary: 'Question', figcaption: 'Caption',
  caption: 'Caption', td: 'Table cell', th: 'Table heading', blockquote: 'Quote', span: 'Words', a: 'Link', button: 'Button',
};
/** A field's name in the bar over it, in the site engine's words. */
export function fieldName(field: Pick<SiteField, 'tag' | 'label'>): string {
  const label = field.label?.trim();
  if (label && !NAMES[label.toLowerCase()]) return label.charAt(0).toUpperCase() + label.slice(1);
  return NAMES[(label || field.tag).toLowerCase()] ?? NAMES[field.tag.toLowerCase()] ?? 'Words';
}

/** The pages in the picker: by language as the site lists them, the front page of each first. */
export function pageGroups(pages: SitePage[]): { lang: string; pages: SitePage[] }[] {
  const groups = new Map<string, SitePage[]>();
  for (const page of pages) groups.set(page.lang, [...(groups.get(page.lang) ?? []), page]);
  return [...groups].map(([lang, list]) => {
    const front = list.reduce((best, page) => (page.path.length < best.path.length ? page : best));
    return { lang, pages: [front, ...list.filter(page => page !== front)] };
  });
}

/** The page the editor opens first: the site's root, else its first page. */
export const firstPage = (pages: SitePage[]) => pages.find(page => page.path === '/')?.path ?? pages[0]?.path ?? null;

/** One of the site's pages a link goes to, as the manifest writes its path; null for anywhere else. */
export function sitePagePath(href: string, origin: string, paths: Iterable<string>): string | null {
  let url: URL;
  try { url = new URL(href, origin); } catch { return null; }
  if (url.origin !== origin) return null;
  const known = new Set(paths);
  let decoded = url.pathname;
  try { decoded = decodeURIComponent(url.pathname); } catch { /* read as written */ }
  for (const path of new Set([url.pathname, decoded])) {
    const bare = path.replace(/index\.html$/, '');
    for (const each of [path, bare, bare.endsWith('/') ? bare.slice(0, -1) : `${bare}/`]) if (each && known.has(each)) return each;
  }
  return null;
}

export interface Press {
  /** Inside the words being edited. */
  inEditing: boolean;
  /** The field pressed, when it is one edited here. */
  field: boolean;
  /** The link around the press, and whether a field is inside or around it. */
  link: { href: string } | null;
  /** ⌘ or Ctrl held. */
  mod: boolean;
}
export type PressAction = { do: 'caret' } | { do: 'edit' } | { do: 'go'; path: string } | { do: 'stop' };

/**
 * What a press in the frame does. Words are edited where they stand; a link to one of the site's pages is
 * followed, and the editor follows it (Mod+press follows a link that is a field); anything else does nothing,
 * since the page's scripts never run here and a form never sends.
 */
export function pressAction(press: Press, site: { origin: string; paths: Iterable<string> }): PressAction {
  const page = press.link ? sitePagePath(press.link.href, site.origin, site.paths) : null;
  if (press.link && press.mod) return page ? { do: 'go', path: page } : { do: 'stop' };
  if (press.inEditing) return { do: 'caret' };
  if (press.field) return { do: 'edit' };
  if (page) return { do: 'go', path: page };
  return { do: 'stop' };
}

/** What a key does while words are edited: Escape cancels, Mod+Enter saves, Enter saves one line of words. */
export function editKey(event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'isComposing'>, plain: boolean): 'cancel' | 'save' | null {
  if (event.isComposing) return null;
  if (event.key === 'Escape') return 'cancel';
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) return 'save';
  if (event.key === 'Enter' && plain && !event.shiftKey) return 'save';
  return null;
}

/** Why a site's words cannot be read or saved, in words. */
export function failureWords(status: number, error?: string): string {
  if (status === 401 || status === 403) return 'Your session ended. Sign in again in another tab, then try again.';
  if (error === 'not-editable') return 'This site keeps its words in its own editor.';
  if (error === 'unknown-field' || error === 'unknown-page') return 'The site was published again. Open the page again to edit it.';
  if (status === 409) return 'This page changed elsewhere. Your edits are still here. Discard these changes to open its latest version.';
  if (error === 'bad-link') return 'Enter a page path or a complete web, email or phone address.';
  if (error === 'composition-too-large') return 'This page has too much added content. Remove an addition and try again.';
  if (error === 'bad-image') return 'Choose one of the site’s own pictures.';
  if (status === 413 || error === 'too-long') return 'Too many words for one field.';
  return 'The site could not be reached. Try again.';
}
