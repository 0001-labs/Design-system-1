// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { previewPrompt, createPreviewEditorOptions } from './aa';
afterEach(() => vi.unstubAllGlobals());
it('transports context and cancellation to owner endpoint and returns typed edits', async () => {
  const send = vi.fn(async () => Response.json({ document: 'Updated' })); vi.stubGlobal('fetch', send);
  const controller = new AbortController();
  expect(await previewPrompt('Write', { kind: 'writing', text: '', document: '⟦here⟧', signal: controller.signal })).toEqual({ document: 'Updated' });
  expect(send).toHaveBeenCalledWith('/api/consistency/ai', expect.objectContaining({ signal: controller.signal, credentials: 'same-origin' }));
});
it('propagates server failure so Aa keeps the prompt available for retry', async () => {
  vi.stubGlobal('fetch', async () => Response.json({ error: 'Try again.' }, { status: 502 }));
  await expect(previewPrompt('Write', { kind: 'writing', text: 'Keep this', signal: new AbortController().signal })).rejects.toThrow('Try again.');
});

it('creates isolated comment stores with normal tools and correction off', () => {
  const a = createPreviewEditorOptions(() => null, vi.fn());
  const b = createPreviewEditorOptions(() => null, vi.fn());
  expect(a.comments).not.toBe(b.comments);
  expect(a.comments?.me).toEqual({ id: 'owner', name: 'Joachim' });
  expect(a.atoms?.map(atom => atom.name)).toEqual(expect.arrayContaining(['image', 'diagram']));
  expect(a.toolbar).not.toBe(false); expect(a.menus).not.toBe(false);
  expect(a.correcting).toBe(false); expect(typeof a.correct).toBe('function');
});
it('rejects oversized local attachments without replacing text or uploading', async () => {
  const replace = vi.fn(), onError = vi.fn(), send = vi.fn(); vi.stubGlobal('fetch', send);
  const instance = { value: 'Keep this', readOnly: false, selection: () => ({ start: 0, end: 0 }), replace };
  const options = createPreviewEditorOptions(() => ({ editor: instance }) as never, onError);
  await options.onFiles?.([new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })]);
  expect(onError).toHaveBeenCalledWith(expect.stringContaining('4 MB')); expect(replace).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
});
it('inserts a local image as one Markdown edit without network access', async () => {
  const replace = vi.fn(), onError = vi.fn(), send = vi.fn(); vi.stubGlobal('fetch', send);
  const instance = { value: 'Before', readOnly: false, selection: () => ({ start: 6, end: 6 }), replace };
  const options = createPreviewEditorOptions(() => ({ editor: instance }) as never, onError);
  await options.onFiles?.([new File(['image'], 'photo.png', { type: 'image/png' })]);
  expect(replace).toHaveBeenCalledWith(6, 6, expect.stringContaining('![photo.png](data:image/png;base64,'));
  expect(onError).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
});
it('reports non-JSON API failures rather than applying an edit', async () => {
  vi.stubGlobal('fetch', async () => new Response('Service unavailable', { status: 503 }));
  await expect(previewPrompt('Write', { kind: 'writing', text: 'Keep this', signal: new AbortController().signal })).rejects.toThrow();
});
it('passes bounded component replacements to the existing exact-match and undo path', async () => {
  const edits = [{ find: 'original component', replace: 'updated component' }];
  vi.stubGlobal('fetch', async () => Response.json({ edits }));
  expect(await previewPrompt('Change variant', { kind: 'writing', text: '', document: 'original component\n⟦here⟧', signal: new AbortController().signal })).toEqual({ edits });
  vi.stubGlobal('fetch', async () => Response.json({ edits: [{ find: '', replace: 'bad' }] }));
  await expect(previewPrompt('Change variant', { kind: 'writing', text: '', signal: new AbortController().signal })).rejects.toThrow('invalid edit');
});
