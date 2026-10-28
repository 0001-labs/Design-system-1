import type { C9yRelation, C9ySystem } from './model';
import { KIND_WORDS, LAYERS } from './map';

/**
 * The matrix, as 0001's System matrix draws it: a row for each site, a column for each component under its layer's
 * coloured head, and one mark where a site takes a component. The last column says how much of what a site uses
 * runs on Consistency's own components: every relation that shares one copy, of every relation it has. A site is
 * on C9Y when the two are equal; what is built on its own or not checked is what is left to move.
 */

const escape = (text: string) => text.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);

/** A site's place on C9Y: what shares one copy, of everything it uses, and what is left to move. */
export function onC9y(system: C9ySystem, site: string) {
  const relations = system.relations.filter(relation => relation.source === site && relation.kind !== 'opportunity');
  const shared = relations.filter(relation => relation.kind === 'shared').length;
  return { shared, of: relations.length, left: relations.filter(relation => relation.kind !== 'shared') };
}

export function renderMatrix(system: C9ySystem, focus: string): string {
  const pairs = new Map(system.relations.map(relation => [`${relation.source}.${relation.target}`, relation]));
  const groups = LAYERS.map(layer => ({ ...layer, members: system.components.filter(component => component.layer === layer.layer) })).filter(group => group.members.length);
  const columns = groups.flatMap(group => group.members.map(component => ({ component, layer: group.layer })));
  const focused = (id: string) => focus === id ? ' data-current' : '';
  const button = (id: string, label: string) =>
    `<button type="button" class="c9y-link" data-focus="${escape(id)}" aria-pressed="${focus === id}">${escape(label)}</button>`;
  const cell = (relation: C9yRelation | undefined, site: string, component: { id: string; label: string }, layer: string) => {
    const words = relation ? `${KIND_WORDS[relation.kind]}: ${relation.note}` : 'Not used';
    const lit = focus && (focus === site || focus === component.id) ? ' data-lit' : '';
    return `<td data-layer="${layer}"${lit}${relation ? ` data-kind="${relation.kind}"` : ''} title="${escape(`${component.label}. ${words}`)}">${relation
      ? `<button type="button" class="c9y-mark" data-focus="${escape(component.id)}" aria-label="${escape(`${component.label}: ${KIND_WORDS[relation.kind]}`)}"></button>` : ''}</td>`;
  };

  const head = `<thead><tr><th class="c9y-matrix-corner" rowspan="2" scope="col">Site</th>${groups.map(group =>
    `<th class="c9y-matrix-group" data-layer="${group.layer}" colspan="${group.members.length}" scope="colgroup">${group.title}</th>`).join('')}<th class="c9y-matrix-score" rowspan="2" scope="col">On C9Y</th></tr>
    <tr>${columns.map(({ component, layer }) => `<th class="c9y-matrix-column" data-layer="${layer}" scope="col"${focused(component.id)}>${button(component.id, component.label)}</th>`).join('')}</tr></thead>`;

  const rows = system.sites.map(site => {
    const { shared, of } = onC9y(system, site.id);
    return `<tr${focused(site.id)}><th scope="row" class="c9y-matrix-row">${button(site.id, site.label)}<span class="c9y-none">${escape(site.code ?? site.siteCode)}</span></th>${columns
      .map(({ component, layer }) => cell(pairs.get(`${site.id}.${component.id}`), site.id, component, layer)).join('')}<td class="c9y-matrix-score"${shared === of ? ' data-whole' : ''}>${shared} of ${of}</td></tr>`;
  }).join('');

  const used = system.components.map(component => system.relations.filter(relation => relation.target === component.id && relation.kind !== 'opportunity').length);
  const foot = `<tfoot><tr><th scope="row" class="c9y-matrix-row">Sites using it</th>${columns.map(({ component, layer }) =>
    `<td data-layer="${layer}" class="c9y-matrix-count${used[system.components.indexOf(component)] ? '' : ' c9y-none'}">${used[system.components.indexOf(component)]}</td>`).join('')}<td></td></tr></tfoot>`;

  const key = `<ul class="c9y-matrix-key">${(['shared', 'local', 'opportunity', 'unverified'] as const).map(kind =>
    `<li data-kind="${kind}"><i class="c9y-mark" aria-hidden="true"></i>${KIND_WORDS[kind]}</li>`).join('')}</ul>`;

  return `<div class="c9y-matrix-frame"><table class="c9y-matrix">${head}<tbody>${rows}</tbody>${foot}</table></div>${key}`;
}
