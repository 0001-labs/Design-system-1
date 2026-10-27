import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { BLOCKS } from '../src/c9y-constraints';
import { C9Y_SYSTEM } from './catalogue';
import { REPOSITORIES } from './model';

// The package folder, whether the run starts at the repository root or in the package.
const packageDir = existsSync(resolve('packages/consistency/src')) ? resolve('packages/consistency') : resolve('.');
const read = (path: string) => readFileSync(join(packageDir, path), 'utf8');

/** PLACES ids, read from the registry's text: importing it pulls in Lit elements a node run cannot define. */
function placeIds(): string[] {
  const registry = read('src/places/index.ts');
  const own = [...registry.matchAll(/PLACES\.set\('([a-z-]+)'/g)].map(match => match[1]);
  const flavo = read('src/sites/flavo/index.ts');
  const body = /FLAVO_PLACES[^=]*=\s*\{([^]*?)\n\};/.exec(flavo)?.[1] ?? '';
  const flavoIds = [...body.matchAll(/^\s*([a-z-]+):/gm)].map(match => match[1]);
  return [...own, ...flavoIds];
}

const { components, sites, relations } = C9Y_SYSTEM;
const componentIds = new Set(components.map(component => component.id));
const siteIds = new Set(sites.map(site => site.id));

/** `<Repository label>: <path>` to an absolute path, or null for an unknown label. */
function onDisk(reference: string): string | null {
  const at = reference.indexOf(': ');
  if (at < 0) return null;
  const root = REPOSITORIES[reference.slice(0, at)];
  return root ? join(root, reference.slice(at + 2)) : null;
}

test('component ids are unique and c9y- prefixed', () => {
  expect(componentIds.size).toBe(components.length);
  for (const { id } of components) expect(id).toMatch(/^c9y-[a-z0-9-]+$/);
  expect(siteIds.size).toBe(sites.length);
});

test('every component says what it presents with and what it adds', () => {
  for (const component of components) {
    if (component.layer !== 'service' && !['c9y-region', 'c9y-runtime-view', 'c9y-site-runtime', 'c9y-site-extension'].includes(component.id))
      expect(component.presents.length, component.id).toBeGreaterThan(0);
    expect(component.adds.length, component.id).toBeGreaterThan(0);
    expect(component.adds.every(Boolean), component.id).toBe(true);
    expect(component.realisedAs.length, component.id).toBeGreaterThan(0);
    expect(component.source.length, component.id).toBeGreaterThan(0);
  }
});

test('every block kind is realised by a component', () => {
  const realised = new Set(components.flatMap(component => component.realisedAs.flatMap(each => each.as === 'editor-block' ? [each.kind] : [])));
  for (const kind of Object.keys(BLOCKS)) expect(realised.has(kind), kind).toBe(true);
});

test('every place the app registers is realised by a component', () => {
  const ids = placeIds();
  expect(ids).toEqual(expect.arrayContaining(['pages', 'emails', 'design', 'bookings', 'giftcards', 'orders', 'products']));
  const realised = new Set(components.flatMap(component => component.realisedAs.flatMap(each => each.as === 'place' ? [each.id] : [])));
  for (const id of ids) expect(realised.has(id), id).toBe(true);
});

test('stored atom tags are the catalogue ids', () => {
  for (const component of components)
    for (const each of component.realisedAs) if (each.as === 'atom') expect(each.tag).toBe(component.id);
});

test('relations join a site to a component, under the site-component id', () => {
  const ids = new Set<string>();
  for (const relation of relations) {
    expect(siteIds.has(relation.source), relation.id).toBe(true);
    expect(componentIds.has(relation.target), relation.id).toBe(true);
    expect(relation.id).toBe(`${relation.source}-${relation.target}`);
    expect(ids.has(relation.id), relation.id).toBe(false);
    ids.add(relation.id);
    expect(relation.reviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    if (relation.kind === 'unverified') expect(relation.evidence, relation.id).toEqual([]);
    else expect(relation.evidence.length, relation.id).toBeGreaterThan(0);
  }
});

test('every source and evidence path exists in its repository', () => {
  const references = [...components.flatMap(component => component.source), ...relations.flatMap(relation => relation.evidence)];
  const missing = references.filter(reference => { const path = onDisk(reference); return !path || !existsSync(path); });
  expect(missing).toEqual([]);
  for (const site of sites) expect(existsSync(site.folder), site.folder).toBe(true);
});

test('uses names components that exist', () => {
  for (const component of components)
    for (const id of component.uses ?? []) expect(componentIds.has(id), `${component.id} uses ${id}`).toBe(true);
});
