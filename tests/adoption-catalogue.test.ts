import { describe, expect, it } from 'vite-plus/test';
import { ALL_LAYERS } from '../shared/component-directory';
import { COMPONENT_COLUMNS, IMPLEMENTATION_COLUMNS, catalogueApp, type AdoptionApp, type ComponentCell } from '../shared/component-adoption';
import { sourceSites } from '../scripts/component-adoption';
const cell = (tag: string, count = 1): ComponentCell => ({ shared: count, styled: 0, local: 0, unverified: 0, sites: [{ file: 'view.ts', line: 1, tag, kind: 'shared' }], snapshot: 'verified', current: true, issues: [] });
describe('canonical adoption catalogue', () => {
  it('uses the exact catalogue names and layer names for matching components', () => {
    for (const layer of ALL_LAYERS.filter(l => l.number > 1)) for (const entry of layer.entries.filter(e => e.tag)) {
      const column = COMPONENT_COLUMNS.find(c => c.id === entry.tag!.slice(3));
      expect(column).toMatchObject({ name: entry.name, group: layer.name });
    }
    expect(COMPONENT_COLUMNS.some(c => ['Composites', 'Layout'].includes(c.group))).toBe(false);
    expect(COMPONENT_COLUMNS.some(c => c.id === 'split' || c.id === 'switch')).toBe(false);
  });
  it('combines compatibility modes without losing counts or original evidence', () => {
    const cells = Object.fromEntries(IMPLEMENTATION_COLUMNS.map(c => [c.id, { ...cell('unused', 0), sites: [] }]));
    cells.button = cell('ds-button', 2); cells.split = cell('ds-split', 3); cells.switch = cell('ds-switch', 4); cells.toggle = cell('ds-toggle', 5);
    const result = catalogueApp({ id: 'example', name: 'Example', status: 'scanned', commit: null, dirty: false, files: 1, scope: ['src'], snapshotCommit: null, cells, otherCustomElements: {}, migration: 'deferred' } as AdoptionApp);
    expect(result.cells.button.shared).toBe(5); expect(result.cells.toggle.shared).toBe(9);
    expect(result.cells.button.sites.map(s => s.tag)).toEqual(['ds-button', 'ds-split']);
    expect(result.migration).toBe('deferred');
    expect(Object.values(result.cells).reduce((n,c) => n+c.shared,0)).toBe(14);
  });
  it('recognises imported static DOM helpers without treating arbitrary function names as elements', () => {
    const sites = sourceSites('view.ts', `import { h as element } from './dom'; element('button', { class: 'ds-button' }); element('input', { type: 'file' }); element(dynamic); h('input');`);
    expect(sites).toHaveLength(2); expect(sites[0]).toMatchObject({tag:'button',nativeStyle:'ds-button'}); expect(sites[1]).toMatchObject({tag:'input',controlKind:'file-picker'});
  });
});
