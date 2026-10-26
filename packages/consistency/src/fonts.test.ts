// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vite-plus/test';
vi.hoisted(() => { globalThis.fetch = async () => new Response('{}'); });
vi.mock('../../../website/public/examples/libraries/voyage.css?raw', () => ({ default: readFileSync('website/public/examples/libraries/voyage.css', 'utf8') }));
import { GOOGLE_FONT_FAMILIES, decodePageFonts, encodePageFonts, fontTokens, googleFontsHref, loadPageFonts, readPageFonts } from './fonts';
import { applyLibraryTokens } from './libraries';
import { ConsistencyEditor } from './index';
afterEach(() => { document.body.replaceChildren(); document.head.querySelectorAll('[data-consistency-fonts],link[data-consistency-fonts-preconnect]').forEach(link => link.remove()); });

test('the choice is the earlier builder’s twenty curated families', () => {
 expect(GOOGLE_FONT_FAMILIES).toHaveLength(20);
 expect(GOOGLE_FONT_FAMILIES).toContain('Playfair Display');
 expect(GOOGLE_FONT_FAMILIES).toContain('JetBrains Mono');
});

test('a saved document names only known families, never a stylesheet of its own', () => {
 expect(readPageFonts({ heading: 'Lora', text: 'Inter' })).toEqual({ heading: 'Lora', text: 'Inter' });
 expect(readPageFonts({ heading: 'Comic Sans', text: 'x");@import url(evil)' })).toEqual({});
 expect(readPageFonts(undefined)).toEqual({});
 expect(decodePageFonts(encodePageFonts({ text: 'DM Sans' }))).toEqual({ text: 'DM Sans' });
});

test('faces become DS1’s typeface roles and one css2 stylesheet in only the weights used', () => {
 expect(fontTokens({ heading: 'Playfair Display', text: 'Source Sans 3' })).toEqual({ '--ds-typeface-medium': '"Playfair Display", serif', '--ds-typeface-regular': '"Source Sans 3", sans-serif' });
 expect(googleFontsHref({})).toBeUndefined();
 expect(googleFontsHref({ heading: 'Playfair Display', text: 'Source Sans 3' })).toBe('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500&family=Source+Sans+3:wght@400&display=swap');
 expect(googleFontsHref({ heading: 'Lora', text: 'Lora' })).toBe('https://fonts.googleapis.com/css2?family=Lora:wght@400;500&display=swap');
 loadPageFonts({ heading: 'Lora' }); loadPageFonts({ heading: 'Lora' });
 expect(document.head.querySelectorAll('[data-consistency-fonts]')).toHaveLength(1);
 loadPageFonts({}); expect(document.head.querySelector('[data-consistency-fonts]')).toBeNull();
});

test('the faces arrive corrected in their own @font-face rules, or as Google’s plain stylesheet should it not be read', async () => {
 const css = "@font-face {\n  font-family: 'Lora';\n  font-weight: 500;\n  src: url(https://fonts.gstatic.com/s/lora/a.woff2) format('woff2');\n}";
 const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(css));
 loadPageFonts({ heading: 'Lora' });
 await vi.waitFor(() => expect(document.head.querySelector('style[data-consistency-fonts]')?.textContent).toContain('size-adjust:101.43%'));
 expect(fetch).toHaveBeenCalledWith('https://fonts.googleapis.com/css2?family=Lora:wght@500&display=swap', undefined);
 fetch.mockRejectedValueOnce(new TypeError('offline'));
 loadPageFonts({ heading: 'Inter' });
 await vi.waitFor(() => expect(document.head.querySelector<HTMLLinkElement>('link[data-consistency-fonts]')?.href).toBe('https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap'));
 fetch.mockRestore();
});

test('previews outside the composition wear the page’s faces over the library’s, and lose them with the library', () => {
 const preview = document.createElement('div');
 applyLibraryTokens(preview, 'editorial', encodePageFonts({ text: 'Inter' }));
 expect(preview.style.getPropertyValue('--ds-typeface-regular')).toBe('Inter, sans-serif');
 expect(preview.style.getPropertyValue('--ds-typeface-medium')).toBe('var(--typeface-canon)');
 applyLibraryTokens(preview, 'original'); expect(preview.style.getPropertyValue('--ds-typeface-regular')).toBe('');
});

test('the faces are saved in the page document, set the sheet’s roles and reopen', async () => {
 const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
 const select = editor.querySelector<HTMLSelectElement>('select[aria-label="Heading face"]')!;
 select.value = 'Montserrat'; select.dispatchEvent(new Event('change')); await editor.updateComplete;
 const sheet = editor.querySelector<HTMLElement>('.consistency-sheet')!;
 expect(sheet.style.getPropertyValue('--ds-typeface-medium')).toBe('Montserrat, sans-serif');
 expect(sheet.dataset.consistencyFonts).toBe('Montserrat|');
 expect(document.head.querySelector<HTMLElement>('[data-consistency-fonts]')?.dataset.consistencyFonts).toContain('family=Montserrat:wght@500');
 const saved = editor.readDocument(); expect(saved.fonts).toEqual({ heading: 'Montserrat' });
 editor.remove();
 const reopened = new ConsistencyEditor(); reopened.loadDocument(saved); document.body.append(reopened); await reopened.updateComplete;
 expect(reopened.fonts).toEqual({ heading: 'Montserrat' });
 const older = new ConsistencyEditor(); const { fonts: _, ...withoutFonts } = saved; older.loadDocument(withoutFonts);
 expect(older.fonts).toEqual({});
});
