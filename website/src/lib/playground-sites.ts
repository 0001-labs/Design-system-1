// The sites the playground can open: the Garden club, three pages and a stylesheet, then each
// example the Examples page draws with a library, as one complete page in that library. Every page
// loads Design system 1 and its library from designsystem1.com, so it works as it stands when
// downloaded, and the playground's library picker restyles it by changing that one line.
import type { LayoutExample } from './layout-examples';
import { LIBRARY_BRANDS } from './library-brands';
import { LIBRARY_EXAMPLES } from './library-examples';
import { LIBRARY_SITES } from './library-sites';
import { PLAYGROUND_FILES, type PlaygroundFile } from './playground-example';

export interface PlaygroundSite { id: string; name: string; library: string; files: PlaygroundFile[] }

const SITE = 'https://designsystem1.com';

/** An example as a page of its own: its addresses made whole, its script run once its components are defined. */
export function examplePage(example: LayoutExample): string {
  const library = example.library ? example.library.name.toLowerCase() : '';
  const html = example.html.replace(/(src|href)="\/(?!\/)/g, `$1="${SITE}/`).trim();
  const script = example.script
    ? `\n\n  <script type="module">\n    // Wait for the components on the page, then wire them up.\n    await Promise.all([...new Set([...document.querySelectorAll('*')].map(element => element.localName).filter(name => name.startsWith('ds-')))].map(name => customElements.whenDefined(name)));\n${example.script.split('\n').map(line => `    ${line}`).join('\n')}\n  </script>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${example.name}</title>

  <!-- Design system 1: the stylesheet, then the components. -->
  <link rel="stylesheet" href="${SITE}/resources/design-system-1.css">${library ? `\n  <link rel="stylesheet" href="${SITE}/examples/libraries/${library}.css">` : ''}
  <script type="module" src="${SITE}/resources/design-system-1.js"></script>
</head>
<body>
  ${html}${script}
</body>
</html>
`;
}

const libraryExamples = { ...LIBRARY_SITES, ...LIBRARY_BRANDS, ...LIBRARY_EXAMPLES };

export const PLAYGROUND_SITES: PlaygroundSite[] = [
  { id: 'garden', name: 'Garden club', library: '', files: PLAYGROUND_FILES },
  ...Object.entries(libraryExamples).map(([id, example]) => ({
    id,
    name: `${example.name} · ${example.library!.name}`,
    library: example.library!.name.toLowerCase(),
    files: [{ name: 'index.html', content: examplePage(example) }],
  })),
];
