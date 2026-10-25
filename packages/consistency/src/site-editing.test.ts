import { describe, expect, it } from 'vite-plus/test';
import { editKey, failureWords, fieldName, firstPage, isPlainField, isWordsField, pageGroups, pressAction, siteAddress, sitePagePath, type SitePage } from './site-editing';

const page = (path: string, lang: string): SitePage => ({ path, lang, title: path, fields: 1, edited: 0 });
const origin = 'https://cphraft.c9y.site';
const paths = ['/', '/blueraft/', '/en/', '/en/blueraft/'];
const key = (key: string, more: Partial<KeyboardEvent> = {}) => ({ key, metaKey: false, ctrlKey: false, shiftKey: false, isComposing: false, ...more });

describe('editing a site in the editor', () => {
  it('asks the gateway for a site by its id and a page by its path', () => {
    expect(siteAddress.pages('10VNDG')).toBe('/api/consistency/sites/10VNDG/pages');
    expect(siteAddress.page('10VNDG', '/en/blue raft/')).toBe('/api/consistency/sites/10VNDG/page?path=%2Fen%2Fblue%20raft%2F');
    expect(siteAddress.document('10VNDG', '/')).toBe('/api/consistency/sites/10VNDG/document?path=%2F');
    expect(siteAddress.edit('10VNDG')).toBe('/api/consistency/sites/10VNDG/edit');
  });

  it('edits a page\'s words here, and leaves its title, description and share image to their rules elsewhere', () => {
    expect(isWordsField({ kind: 'text' })).toBe(true);
    expect(isWordsField({ kind: 'meta' })).toBe(false);
    expect(isWordsField({ kind: 'image' })).toBe(false);
    expect(isPlainField({ kind: 'text', tag: 'h2', label: 'h2' })).toBe(true);
    expect(isPlainField({ kind: 'text', tag: 'a', label: 'Button' })).toBe(true);
    expect(isPlainField({ kind: 'text', tag: 'p', label: 'p' })).toBe(false);
    expect(fieldName({ tag: 'h1', label: 'h1' })).toBe('Main heading');
    expect(fieldName({ tag: 'span', label: 'card title' })).toBe('Card title');
    expect(fieldName({ tag: 'x', label: '' })).toBe('Words');
  });

  it('lists the pages by language, the front page of each first, and opens on the root', () => {
    const pages = [page('/blueraft/', 'da'), page('/', 'da'), page('/en/blueraft/', 'en'), page('/en/', 'en')];
    expect(pageGroups(pages).map(group => [group.lang, group.pages.map(each => each.path)])).toEqual([['da', ['/', '/blueraft/']], ['en', ['/en/', '/en/blueraft/']]]);
    expect(firstPage(pages)).toBe('/');
    expect(firstPage([page('/en/', 'en')])).toBe('/en/');
    expect(firstPage([])).toBeNull();
  });

  it('follows a link to one of the site\'s pages, however it is written', () => {
    expect(sitePagePath('https://cphraft.c9y.site/en/', origin, paths)).toBe('/en/');
    expect(sitePagePath('https://cphraft.c9y.site/en/blueraft', origin, paths)).toBe('/en/blueraft/');
    expect(sitePagePath('https://cphraft.c9y.site/en/blueraft/index.html#top', origin, paths)).toBe('/en/blueraft/');
    expect(sitePagePath('https://cphraft.c9y.site/book/', origin, paths)).toBeNull();
    expect(sitePagePath('https://example.com/en/', origin, paths)).toBeNull();
    expect(sitePagePath('mailto:hi@example.com', origin, paths)).toBeNull();
  });

  it('a press edits words, follows the site\'s own links and does nothing else', () => {
    const site = { origin, paths };
    const press = (more: Partial<Parameters<typeof pressAction>[0]>) => pressAction({ inEditing: false, field: false, link: null, mod: false, ...more }, site);
    expect(press({ field: true })).toEqual({ do: 'edit' });
    expect(press({ inEditing: true, field: true })).toEqual({ do: 'caret' });
    expect(press({ link: { href: `${origin}/en/` } })).toEqual({ do: 'go', path: '/en/' });
    expect(press({ field: true, link: { href: `${origin}/en/` } })).toEqual({ do: 'edit' });
    expect(press({ field: true, link: { href: `${origin}/en/` }, mod: true })).toEqual({ do: 'go', path: '/en/' });
    expect(press({ link: { href: 'https://example.com/' } })).toEqual({ do: 'stop' });
    expect(press({})).toEqual({ do: 'stop' });
  });

  it('saves on Mod+Enter, and on Enter for one line of words; Escape cancels', () => {
    expect(editKey(key('Escape'), false)).toBe('cancel');
    expect(editKey(key('Enter', { metaKey: true }), false)).toBe('save');
    expect(editKey(key('Enter'), true)).toBe('save');
    expect(editKey(key('Enter'), false)).toBeNull();
    expect(editKey(key('Enter', { shiftKey: true }), true)).toBeNull();
    expect(editKey(key('Enter', { isComposing: true }), true)).toBeNull();
  });

  it('says what went wrong in words', () => {
    expect(failureWords(401)).toMatch(/session/);
    expect(failureWords(409, 'not-editable')).toMatch(/own editor/);
    expect(failureWords(404, 'unknown-field')).toMatch(/published again/);
    expect(failureWords(413)).toMatch(/Too many words/);
    expect(failureWords(502)).toMatch(/could not be reached/);
  });
});
