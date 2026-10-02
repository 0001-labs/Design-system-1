export function docsThemeFromMessage(data: unknown): 'light' | 'dark' | null {
  if (!data || typeof data !== 'object') return null;
  const message = data as Record<string, unknown>;
  if (message.type !== 'ds1:docs-theme') return null;
  return message.theme === 'light' || message.theme === 'dark' ? message.theme : null;
}

/** Keep the editor chrome in sync with its same-origin documentation host. */
export function initializeDocsEmbed() {
  if (window.parent === window || new URLSearchParams(window.location.search).get('embed') !== 'docs') return;

  const root = document.documentElement;
  root.dataset.docsEmbed = '';
  const applyTheme = (theme: 'light' | 'dark') => {
    root.dataset.docsTheme = theme;
    root.style.colorScheme = theme;
  };

  applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    const theme = docsThemeFromMessage(event.data);
    if (theme) applyTheme(theme);
  });
  window.parent.postMessage({ type: 'ds1:docs-ready' }, window.location.origin);
}
