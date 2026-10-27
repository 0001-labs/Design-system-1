// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test } from 'vite-plus/test';
import { FIXTURE } from './fixture';
import { mountC9ySystem, readState } from './view';

let root: HTMLElement;
beforeEach(() => {
  history.replaceState(null, '', '/private-c9y-system/');
  root = document.createElement('div');
  document.body.append(root);
});
afterEach(() => root.remove());

const press = (selector: string) => root.querySelector<HTMLElement>(selector)!.click();

test('the map draws one path per relation', () => {
  mountC9ySystem(root, FIXTURE);
  const edges = root.querySelectorAll('.c9y-edges .c9y-edge');
  expect(edges).toHaveLength(FIXTURE.relations.length);
  expect(root.querySelectorAll('.c9y-edges path')).toHaveLength(FIXTURE.relations.length);
  expect([...edges].map(edge => edge.getAttribute('data-kind')).sort()).toEqual(FIXTURE.relations.map(relation => relation.kind).sort());
  // Every site and component is a node, the sites in their own stack and the components under their layer.
  expect(root.querySelectorAll('.c9y-node')).toHaveLength(FIXTURE.sites.length + FIXTURE.components.length);
  expect(root.querySelector('[data-stack="sites"] [data-focus="flavo"]')).not.toBeNull();
  expect(root.querySelector('[data-stack="runtime"] [data-focus="c9y-booking"]')).not.toBeNull();
  expect(root.querySelector('.c9y-key')!.textContent).toContain('Shares one copy');
});

test('focusing a node dims the unrelated ones, shows its relations and writes ?focus=', () => {
  mountC9ySystem(root, FIXTURE);
  press('.c9y-node[data-focus="flavo"]');
  expect(new URLSearchParams(location.search).get('focus')).toBe('flavo');
  const faded = [...root.querySelectorAll<HTMLElement>('.c9y-node[data-faded]')].map(node => node.dataset.focus).sort();
  expect(faded).toEqual(['c9y-booking', 'c9y-card', 'cph-raft']);
  expect(root.querySelector('.c9y-node[data-focus="flavo"]')!.getAttribute('aria-pressed')).toBe('true');
  const on = [...root.querySelectorAll<SVGElement>('.c9y-edge.is-on')].map(edge => edge.dataset.relation).sort();
  expect(on).toEqual(['flavo-c9y-button', 'flavo-c9y-orders', 'flavo-c9y-publishing']);
  expect(root.querySelectorAll('.c9y-edges .c9y-edge.is-off')).toHaveLength(3);
  // The details name the site's relations; pressing it again lets it go.
  expect(root.querySelector('.c9y-detail')!.textContent).toContain('Built on its own');
  press('.c9y-node[data-focus="flavo"]');
  expect(location.search).toBe('');
  expect(root.querySelector('.c9y-node[data-faded]')).toBeNull();
});

test('the address opens the view and the focus it names', () => {
  history.replaceState(null, '', '/private-c9y-system/?view=sites&focus=c9y-card');
  expect(readState(location.search)).toEqual({ view: 'sites', focus: 'c9y-card' });
  mountC9ySystem(root, FIXTURE);
  expect(root.querySelector('.c9y-main')!.getAttribute('data-view')).toBe('sites');
  expect(root.querySelector('.c9y-detail h2')!.textContent).toBe('Card');
});

test('the components view tells what Design system 1 presents from what Consistency adds', () => {
  mountC9ySystem(root, FIXTURE);
  press('[data-view="components"]');
  expect(new URLSearchParams(location.search).get('view')).toBe('components');
  const button = root.querySelector('.c9y-entry[data-component="c9y-button"]')!;
  expect(button.querySelector('.c9y-presents')!.textContent).toContain('Presents with');
  expect([...button.querySelectorAll('.c9y-presents li')].map(item => item.textContent)).toEqual(['ds-button']);
  expect(button.querySelector('.c9y-adds')!.textContent).toContain('Adds');
  expect([...button.querySelectorAll('.c9y-adds li')].map(item => item.textContent)).toEqual(['links to a page of the site', 'starts a Stripe Checkout']);
  expect(button.querySelector('.c9y-facts')!.textContent).toContain('Stripe');
  expect(button.textContent).toContain('CPH Raft');
  // A service draws nothing of its own.
  expect(root.querySelector('.c9y-entry[data-component="c9y-publishing"] .c9y-presents li')).toBeNull();
});

test('the sites view lists each site’s components by layer', () => {
  mountC9ySystem(root, FIXTURE);
  press('[data-view="sites"]');
  const raft = root.querySelector('.c9y-entry[data-site="cph-raft"]')!;
  expect([...raft.querySelectorAll<HTMLElement>('[data-component]')].map(item => item.dataset.component)).toEqual(['c9y-button', 'c9y-card', 'c9y-booking']);
  expect([...raft.querySelectorAll('dt')].map(term => term.textContent)).toEqual(expect.arrayContaining(['Blocks', 'Runtimes']));
  expect(raft.textContent).toContain('Planned');
  expect(raft.querySelector('a[href="https://cphraft.example"]')).not.toBeNull();
  press('.c9y-entry[data-site="cph-raft"] [data-focus="c9y-booking"]');
  expect(new URLSearchParams(location.search).get('focus')).toBe('c9y-booking');
  expect(root.querySelector('.c9y-detail h2')!.textContent).toBe('Booking');
});

test('the matrix draws a mark for each relation and says how much of each site is on C9Y', async () => {
  const { renderMatrix, onC9y } = await import('./matrix');
  const { C9Y_SYSTEM } = await import('./catalogue');
  const host = document.createElement('div');
  host.innerHTML = renderMatrix(C9Y_SYSTEM, '');
  const used = C9Y_SYSTEM.relations;
  expect(host.querySelectorAll('tbody td[data-kind]').length).toBe(used.length);
  expect(host.querySelectorAll('tbody tr').length).toBe(C9Y_SYSTEM.sites.length);
  expect(host.querySelectorAll('.c9y-matrix-column').length).toBe(C9Y_SYSTEM.components.length);
  for (const site of C9Y_SYSTEM.sites) {
    const { shared, of } = onC9y(C9Y_SYSTEM, site.id);
    expect(host.querySelector(`tbody tr:nth-child(${C9Y_SYSTEM.sites.indexOf(site) + 1}) .c9y-matrix-score`)?.textContent).toBe(`${shared} of ${of}`);
  }
});
