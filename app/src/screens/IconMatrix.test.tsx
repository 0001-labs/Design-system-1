// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { AdoptionReport } from '../../../shared/component-adoption';
import { IconMatrix } from './IconAdoption';

const report: AdoptionReport = {
  schema: 1, generatedAt: new Date().toISOString(), sourceCommit: '0123456789abcdef', sourceDirty: false, method: [], columns: [],
  icons: { names: ['close', 'star'] },
  apps: [{
    id: 'fixture', name: 'Fixture', status: 'scanned', commit: 'abcdef0123', dirty: false, files: 1, scope: ['src'], snapshotCommit: null, otherCustomElements: {}, cells: {},
    icons: {
      copy: null, dynamic: [],
      inline: [{ file: 'src/draw.ts', line: 3, name: 'createElementNS', kind: 'script', status: 'local' }, { file: 'src/a.tsx', line: 9, name: 'svg', kind: 'inline', status: 'local' }],
      fonts: [{ file: 'src/index.html', line: 1, name: 'phosphor: /icons/regular/style.css', kind: 'font', status: 'local' }],
      cells: {
        close: { uses: 3, status: 'differs', copy: 'none', sites: [
          { file: 'src/a.tsx', line: 1, name: 'close', kind: 'element', status: 'shared' },
          { file: 'src/a.css', line: 2, name: 'close.svg', kind: 'mask', status: 'shared', drawing: 'src/icons/close.svg' },
          { file: 'src/b.ts', line: 4, name: '×', kind: 'glyph', status: 'differs' },
        ] },
        // A site from a snapshot made before kinds were recorded.
        star: { uses: 1, status: 'shared', copy: 'none', sites: [{ file: 'src/a.tsx', line: 5, name: 'star' }] },
        Trash2: { uses: 1, status: 'local', copy: 'none', ds1: 'close', sites: [{ file: 'src/a.tsx', line: 7, name: 'Trash2', kind: 'component', status: 'local' }] },
      },
    },
  }],
};
let root: Root;
let host: HTMLDivElement;
beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

it('filters the icon matrix by kind, groups local icons by the DS1 icon they stand for and drills into sites', async () => {
  await act(async () => root.render(createElement(IconMatrix, { report })));
  const groups = () => [...host.querySelectorAll('.adoption-app-group th')].map(th => th.textContent);
  const rows = () => [...host.querySelectorAll('tbody tr:not(.adoption-app-group)')].map(row => `${row.querySelector('.adoption-icon-name > span')!.textContent}:${row.querySelector('td')!.textContent}:${row.querySelector('td')!.className}`);
  expect(groups()).toEqual(['In DS1', 'Local, DS1 has the icon']);
  expect(rows()).toEqual(['close:3:unverified', 'star:1:shared', 'Trash2:1:local']);
  expect([...host.querySelectorAll('tfoot th')].map(th => th.textContent)).toEqual(['Inline SVG', 'Script SVG', 'Icon font sheets']);
  const kind = (name: string) => [...host.querySelectorAll<HTMLElement>('[aria-label="How the icon is drawn"] ds-button')].find(button => button.textContent === name)!;
  expect([...host.querySelectorAll('[aria-label="How the icon is drawn"] ds-button')].map(button => button.textContent)).toEqual(['Every kind', 'ds-icon', 'Components', 'CSS masks', 'Icon fonts', 'Glyphs', 'Inline SVG', 'Script SVG']);
  await act(async () => kind('CSS masks').click());
  expect(rows()).toEqual(['close:1:shared']);
  await act(async () => kind('Glyphs').click());
  expect(rows()).toEqual(['close:1:unverified']);
  await act(async () => host.querySelector<HTMLButtonElement>('tbody td button')!.click());
  const detail = host.querySelector('.adoption-detail')!;
  expect([...detail.querySelectorAll('tbody tr')].map(row => [...row.querySelectorAll('td')].map(td => td.textContent).join(' | '))).toEqual(['src/b.ts:4 | Glyphs | × | – | Needs the DS1 drawing']);
  await act(async () => kind('Every kind').click());
  await act(async () => host.querySelector<HTMLButtonElement>('tfoot td button')!.click());
  expect(host.querySelector('.adoption-detail h2')!.textContent).toBe('Fixture · Inline SVG');
});
