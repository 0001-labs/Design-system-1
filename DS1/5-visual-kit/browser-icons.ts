import { svg } from 'lit';
import { chromiumIcons, edgeIcons } from './native-icon-paths';

/** Presentation glyphs drawn in each browser's native icon vocabulary, not DS1 UI icons. */
export function browserIcon(name: string, kind: string) {
  const native = (kind === 'chrome' ? chromiumIcons : kind === 'edge' ? edgeIcons : {}) as Record<string, {size:number;path:string}>;
  if (native[name]) { const glyph=native[name]; return svg`<svg viewBox=${`0 0 ${glyph.size} ${glyph.size}`} aria-hidden="true" style="fill:currentColor;stroke:none"><path d=${glyph.path}/></svg>`; }
  const apple = kind === 'safari' || kind === 'safari-ios' || kind === 'macos';
  const paths: Record<string, string> = {
    back: apple ? 'M12 4 6 10l6 6' : 'M16 10H4m6-6-6 6 6 6',
    forward: apple ? 'm8 4 6 6-6 6' : 'M4 10h12m-6-6 6 6-6 6',
    reload: 'M16 7a6.5 6.5 0 1 0 .4 5M16 3v4h-4',
    share: 'M7 6H4v11h12V6h-3M10 12V1m-3 3 3-3 3 3',
    tabs: 'M6 6H2v12h12v-4M6 2h12v12H6Z',
    sidebar: 'M3 3h14v14H3ZM8 3v14M5 6h1m-1 3h1m-1 3h1',
    plus: 'M10 4v12M4 10h12',
    close: 'm5 5 10 10M15 5 5 15',
    'close-tab': 'm6 6 8 8m0-8-8 8',
    minimize: 'M4 10h12', zoom: 'M4 8V4h4m4 12h4v-4M4 4l12 12',
    'chevron-down': 'm6 8 4 4 4-4',
    'page-menu': 'M3 5h14M3 10h10M3 15h6',
    lock: 'M6 9V6a4 4 0 0 1 8 0v3M5 9h10v8H5Z',
    tune: 'M3 6h7m4 0h3M3 14h3m4 0h7M10 4h4v4h-4ZM6 12h4v4H6Z',
    star: 'm10 2 2.4 5 5.6.8-4 3.9.9 5.6-4.9-2.6-4.9 2.6.9-5.6-4-3.9L7.6 7Z',
    extensions: 'M4 4h4V2a2 2 0 0 1 4 0v2h4v5h2a2 2 0 0 1 0 4h-2v5h-5v-2a2 2 0 0 0-4 0v2H2V4Z',
    reading: 'M10 5Q6 2 2 4v12q4-2 8 1 4-3 8-1V4q-4-2-8 1v12',
    favorites: 'm7 2 1.6 3.3 3.7.5-2.7 2.6.6 3.6L7 10.3 3.8 12l.6-3.6L1.7 5.8l3.7-.5ZM14 5h4m-4 5h4M3 16h15',
    globe: 'M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM2 10h16M10 2c-5 4-5 12 0 16 5-4 5-12 0-16Z',
    profile: 'M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM6 16v-1a4 4 0 0 1 8 0v1M12.5 7a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  };
  if(name==='more'||name==='more-horizontal') return svg`<svg viewBox="0 0 20 20" aria-hidden="true" style="fill:currentColor;stroke:none">${name==='more'?svg`<circle cx="10" cy="4" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="16" r="1.5"/>`:svg`<circle cx="4" cy="10" r="1.2"/><circle cx="10" cy="10" r="1.2"/><circle cx="16" cy="10" r="1.2"/>`}</svg>`;
  return svg`<svg viewBox="0 0 20 20" aria-hidden="true"><path d=${paths[name] || paths['globe']}/></svg>`;
}
