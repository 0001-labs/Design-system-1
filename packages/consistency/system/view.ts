import type { C9yComponent, C9yRelation, C9ySite, C9ySystem, Realisation } from './model';
import { KIND_WORDS, LAYERS, relationsOf, renderMap } from './map';
import { renderMatrix } from './matrix';

/**
 * C9Y System's page: three views of one catalogue (the map, the components, the sites) and the focused node's
 * details beside them. What is shown lives in the address, `?view=components&focus=c9y-card`, so a link opens the
 * page where it was. Pressing a node focuses it, pressing it again or Escape lets it go.
 *
 * Design system 1 is the presentation; a C9Y component is what Consistency adds to it. Every component says both:
 * "Presents with" names the DS1 elements it is drawn with, "Adds" the behaviour Consistency gives it.
 */

export type View = 'map' | 'matrix' | 'components' | 'sites';
const VIEWS: { view: View; title: string }[] = [
  { view: 'map', title: 'Map' },
  { view: 'matrix', title: 'Matrix' },
  { view: 'components', title: 'Components' },
  { view: 'sites', title: 'Sites' },
];

const escape = (text: string) => text.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);
const code = (text: string) => `<code>${escape(text)}</code>`;
const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

const REALISED: Record<Realisation['as'], string> = {
  'editor-block': 'Editor block', 'native-block': 'Native block', atom: 'Atom', insertion: 'Insertion',
  place: 'Place', runtime: 'Runtime', engine: 'Engine part',
};
function realised(realisation: Realisation): string {
  const { as, ...rest } = realisation;
  return `${REALISED[as]} ${code(String(Object.values(rest)[0] ?? ''))}`;
}
/** `Repository: path`, the repository in words and the path in the code face. */
function sourceLine(source: string): string {
  const at = source.indexOf(': ');
  return at < 0 ? code(source) : `${escape(source.slice(0, at))} ${code(source.slice(at + 2))}`;
}
const layerWord = (component: C9yComponent) => LAYERS.find(item => item.layer === component.layer)?.one ?? component.layer;

export function readState(search: string): { view: View; focus: string } {
  const params = new URLSearchParams(search);
  const view = VIEWS.some(item => item.view === params.get('view')) ? params.get('view') as View : 'map';
  return { view, focus: params.get('focus') || '' };
}

export function mountC9ySystem(root: HTMLElement, system: C9ySystem): { setView(view: View): void; setFocus(id: string): void } {
  const components = new Map(system.components.map(component => [component.id, component]));
  const sites = new Map(system.sites.map(site => [site.id, site]));
  const state = readState(location.search);
  if (!components.has(state.focus) && !sites.has(state.focus)) state.focus = '';

  const saveUrl = () => {
    const params = new URLSearchParams(location.search);
    if (state.view === 'map') params.delete('view'); else params.set('view', state.view);
    if (state.focus) params.set('focus', state.focus); else params.delete('focus');
    const query = params.toString();
    history.replaceState(history.state, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  };

  root.innerHTML = `<div class="c9y-system">
    <header class="c9y-head">
      <h1 class="ds-text ds-text--display">C9Y System</h1>
      <p class="c9y-count">${plural(system.components.length, 'component')}, ${plural(system.sites.length, 'site')}, ${plural(system.relations.length, 'relation')}. Reviewed ${escape(system.reviewed)}</p>
      <ds-tabs class="c9y-tabs" aria-label="Views">${VIEWS.map(({ view, title }) => `<ds-button role="tab" data-view="${view}">${title}</ds-button>`).join('')}</ds-tabs>
    </header>
    <main class="c9y-main"></main>
    <aside class="c9y-detail" aria-label="Details"></aside>
  </div>`;
  const main = root.querySelector<HTMLElement>('.c9y-main')!;
  const detail = root.querySelector<HTMLElement>('.c9y-detail')!;

  const render = () => {
    // Pressing a node redraws the view: the map keeps its scroll and the keyboard keeps its place.
    const frame = main.querySelector<HTMLElement>('.c9y-map-frame, .c9y-matrix-frame');
    const scroll = frame && main.dataset.view === state.view ? [frame.scrollLeft, frame.scrollTop] : null;
    const active = document.activeElement instanceof HTMLElement && root.contains(document.activeElement) ? document.activeElement : null;
    const area = active?.closest('.c9y-main, .c9y-detail, .c9y-head')?.className.split(' ')[0];
    const again = active?.dataset.focus ? `[data-focus="${active.dataset.focus.replace(/["\\]/g, '\\$&')}"]` : active?.dataset.view ? `[data-view="${active.dataset.view}"]` : '';
    paint();
    const nextFrame = main.querySelector<HTMLElement>('.c9y-map-frame, .c9y-matrix-frame');
    if (scroll && nextFrame) [nextFrame.scrollLeft, nextFrame.scrollTop] = scroll;
    if (area && again) (root.querySelector<HTMLElement>(`.${area} ${again}`) ?? root.querySelector<HTMLElement>(again))?.focus({ preventScroll: true });
  };

  const paint = () => {
    for (const tab of root.querySelectorAll<HTMLElement>('[data-view]')) {
      const on = tab.dataset.view === state.view;
      tab.toggleAttribute('active', on);
      tab.setAttribute('aria-selected', String(on));
    }
    main.dataset.view = state.view;
    main.innerHTML = state.view === 'map' ? `<div class="c9y-map-frame">${renderMap(system, state.focus)}</div>`
      : state.view === 'matrix' ? renderMatrix(system, state.focus)
      : state.view === 'components' ? componentsView() : sitesView();
    detail.innerHTML = state.focus ? details(state.focus) : '';
    detail.hidden = !state.focus;
    saveUrl();
  };

  const using = (componentId: string) => system.relations.filter(relation => relation.target === componentId);
  const siteLabel = (id: string) => sites.get(id)?.label ?? id;
  const componentLabel = (id: string) => components.get(id)?.label ?? id;
  const kindTag = (relation: C9yRelation) => `<span class="c9y-kind" data-kind="${relation.kind}">${KIND_WORDS[relation.kind]}</span>`;
  const focusButton = (id: string, label: string) =>
    `<button type="button" class="c9y-link" data-focus="${escape(id)}" aria-pressed="${state.focus === id}">${escape(label)}</button>`;

  /** DS1 on one side, what Consistency adds on the other. */
  const split = (component: C9yComponent) => `<div class="c9y-split">
      <section class="c9y-presents"><h3>Presents with</h3><p class="c9y-by">Design system 1</p>${component.presents.length
        ? `<ul>${component.presents.map(element => `<li>${code(element)}</li>`).join('')}</ul>` : '<p class="c9y-none">Nothing: it draws nothing</p>'}</section>
      <section class="c9y-adds"><h3>Adds</h3><p class="c9y-by">Consistency</p><ul>${component.adds.map(add => `<li>${escape(add)}</li>`).join('')}</ul></section>
    </div>`;

  const facts = (component: C9yComponent) => {
    const rows: [string, string][] = [];
    if (component.systems.length) rows.push(['Controls', component.systems.map(escape).join(', ')]);
    rows.push(['Realised as', component.realisedAs.map(realised).join('<br>')]);
    rows.push(['Source', component.source.map(sourceLine).join('<br>')]);
    if (component.uses?.length) rows.push(['Uses', component.uses.map(id => focusButton(id, componentLabel(id))).join(', ')]);
    const users = using(component.id);
    rows.push(['Sites', users.length ? users.map(relation => `${focusButton(relation.source, siteLabel(relation.source))} ${kindTag(relation)}`).join('<br>') : '<span class="c9y-none">None yet</span>']);
    return `<dl class="c9y-facts">${rows.map(([term, value]) => `<dt>${term}</dt><dd>${value}</dd>`).join('')}</dl>`;
  };

  const componentsView = () => LAYERS.map(({ layer, title }) => {
    const members = system.components.filter(component => component.layer === layer);
    if (!members.length) return '';
    return `<section class="c9y-group"><h2>${title}</h2>${members.map(component => `<article class="c9y-entry" data-component="${escape(component.id)}"${state.focus === component.id ? ' data-current' : ''}>
        <div class="c9y-entry-head">${focusButton(component.id, component.label)}${code(component.id)}</div>
        <p class="c9y-summary">${escape(component.summary)}</p>
        ${split(component)}${facts(component)}
      </article>`).join('')}</section>`;
  }).join('');

  const addresses = (site: C9ySite) => site.addresses.map(address => `<a href="${escape(address)}" target="_blank" rel="noopener">${escape(address.replace(/^https?:\/\//, ''))}</a>`).join('<br>');
  const siteComponents = (site: C9ySite) => {
    const relations = system.relations.filter(relation => relation.source === site.id);
    return LAYERS.map(({ layer, title }) => {
      const here = relations.filter(relation => components.get(relation.target)?.layer === layer);
      if (!here.length) return '';
      return `<dt>${title}</dt><dd><ul class="c9y-uses">${here.map(relation => `<li data-component="${escape(relation.target)}">${focusButton(relation.target, componentLabel(relation.target))} ${kindTag(relation)}</li>`).join('')}</ul></dd>`;
    }).join('');
  };
  const siteFacts = (site: C9ySite) => `<dl class="c9y-facts">
      <dt>Code</dt><dd>${code(site.code)}${site.codeStatus === 'proposed' ? ' <span class="c9y-none">Proposed</span>' : ''}</dd>
      <dt>Site code</dt><dd>${code(site.siteCode)}</dd>
      <dt>Addresses</dt><dd>${addresses(site)}</dd>
      <dt>Folder</dt><dd>${code(site.folder)}</dd>
      ${siteComponents(site) || '<dt>Components</dt><dd><span class="c9y-none">None yet</span></dd>'}
    </dl>`;

  const sitesView = () => `<section class="c9y-group"><h2>Sites</h2>${system.sites.map(site => `<article class="c9y-entry" data-site="${escape(site.id)}"${state.focus === site.id ? ' data-current' : ''}>
      <div class="c9y-entry-head">${focusButton(site.id, site.label)}${code(site.code)}</div>
      <p class="c9y-summary">${escape(site.summary)}</p>${siteFacts(site)}
    </article>`).join('')}</section>`;

  const evidence = (relation: C9yRelation) => relation.evidence.length
    ? `<ul class="c9y-evidence">${relation.evidence.map(item => `<li>${sourceLine(item)}</li>`).join('')}</ul>` : '';
  const relationNotes = (id: string) => relationsOf(system, id).map(relation => {
    const other = relation.source === id ? relation.target : relation.source;
    return `<li class="c9y-relation" data-kind="${relation.kind}"><p>${focusButton(other, sites.get(other)?.label ?? componentLabel(other))} ${kindTag(relation)}</p><p>${escape(relation.note)}</p>${evidence(relation)}<p class="c9y-none">Reviewed ${escape(relation.reviewed)}</p></li>`;
  }).join('');

  const details = (id: string) => {
    const component = components.get(id);
    const site = sites.get(id);
    const head = component
      ? `<h2>${escape(component.label)}</h2><p>${code(component.id)} <span class="c9y-none">${layerWord(component)}</span></p><p>${escape(component.summary)}</p>${split(component)}${facts(component)}`
      : site ? `<h2>${escape(site.label)}</h2><p>${escape(site.summary)}</p>${siteFacts(site)}<p class="c9y-none">System node ${code(site.systemNode)}</p>` : '';
    const notes = relationNotes(id);
    return `<div class="c9y-detail-body">${head}${notes ? `<h3>Relations</h3><ul class="c9y-relations">${notes}</ul>` : ''}</div>`;
  };

  const setFocus = (id: string) => { state.focus = state.focus === id ? '' : id; render(); };
  const setView = (view: View) => { state.view = view; render(); };

  root.addEventListener('click', event => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-view], [data-focus]');
    if (!target || !root.contains(target)) return;
    if (target.dataset.view) setView(target.dataset.view as View);
    else if (target.dataset.focus) setFocus(target.dataset.focus);
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && state.focus) { state.focus = ''; render(); }
  });

  render();
  return { setView, setFocus };
}
