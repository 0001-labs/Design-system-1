import { describe, expect, it, vi, afterEach } from 'vite-plus/test';
import { docsThemeFromMessage, initializeDocsEmbed } from './docsEmbed';

afterEach(() => vi.unstubAllGlobals());

describe('documentation theme messages', () => {
  it('accepts only explicit light and dark themes', () => {
    expect(docsThemeFromMessage({ type: 'ds1:docs-theme', theme: 'dark' })).toBe('dark');
    expect(docsThemeFromMessage({ type: 'ds1:docs-theme', theme: 'light' })).toBe('light');
    for (const data of [null, 'dark', {}, { type: 'other', theme: 'dark' }, { type: 'ds1:docs-theme', theme: 'auto' }]) {
      expect(docsThemeFromMessage(data)).toBeNull();
    }
  });

  it('synchronizes only with the same-origin parent and retains embedding across app navigation', () => {
    const parent = { postMessage: vi.fn() };
    const root = { dataset: {} as Record<string, string>, style: { colorScheme: '' } };
    const listeners: Record<string, (event: Record<string, unknown>) => void> = {};
    const host = {
      parent,
      location: { search: '?embed=docs', origin: 'https://example.test' },
      matchMedia: () => ({ matches: false }),
      addEventListener: (name: string, listener: (event: Record<string, unknown>) => void) => { listeners[name] = listener; },
    };
    vi.stubGlobal('window', host);
    vi.stubGlobal('document', { documentElement: root });
    initializeDocsEmbed();
    expect(root.dataset.docsEmbed).toBe('');
    expect(parent.postMessage).toHaveBeenCalledWith({ type: 'ds1:docs-ready' }, host.location.origin);
    const data = { type: 'ds1:docs-theme', theme: 'dark' };
    listeners.message({ origin: 'https://other.test', source: parent, data });
    listeners.message({ origin: host.location.origin, source: {}, data });
    expect(root.style.colorScheme).toBe('light');
    host.location.search = '';
    listeners.message({ origin: host.location.origin, source: parent, data });
    expect(root.dataset.docsTheme).toBe('dark');
    expect(root.style.colorScheme).toBe('dark');
  });

  it('leaves a standalone editor unchanged', () => {
    const host: Record<string, unknown> = {};
    host.parent = host;
    vi.stubGlobal('window', host);
    expect(() => initializeDocsEmbed()).not.toThrow();
  });
});
