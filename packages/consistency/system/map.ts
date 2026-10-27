import type { C9ySystem, ComponentLayer, RelationKind } from './model';

/**
 * The map, drawn as 0001's System map draws it: every node an item eight squares by one, stacks under a coloured
 * head, and the relations one inline SVG of runs along the grid with square turns. The sites stand in the upper
 * left; the four layers stand in columns to the right of them and start below the last site, so a relation leaves
 * its site to the right above every column, turns down in the gap before its layer and enters the component from
 * the left. No run crosses another node.
 *
 * Positions are counted in squares; the SVG's user space is the 20px square at base scale and the page scales the
 * whole drawing with `--ds-unit`, the lines held at 1px by `vector-effect`.
 */

export const LAYERS: { layer: ComponentLayer; title: string; one: string }[] = [
  { layer: 'block', title: 'Blocks', one: 'Block' },
  { layer: 'runtime', title: 'Runtimes', one: 'Runtime' },
  { layer: 'place', title: 'Places', one: 'Place' },
  { layer: 'service', title: 'Services', one: 'Service' },
];

/** System's words for each kind (0001/system/web/modules/pages/system-model.ts). */
export const KIND_WORDS: Record<RelationKind, string> = {
  shared: 'Shares one copy',
  local: 'Built on its own',
  opportunity: 'Planned',
  unverified: 'Not checked',
};
export const KINDS: RelationKind[] = ['shared', 'local', 'opportunity', 'unverified'];

const SQUARE = 20;
const NODE_W = 8;
const GAP = 2;
const COLUMN = NODE_W + GAP;
const ARROW_BACK = 4 * Math.cos((35 * Math.PI) / 180);
const ARROW_SIDE = 4 * Math.sin((35 * Math.PI) / 180);

export type Stack = { key: 'sites' | ComponentLayer; title: string; x: number; y: number; members: { id: string; label: string; aside: string }[] };
export type MapLayout = { stacks: Stack[]; at: Map<string, { x: number; y: number }>; width: number; height: number };

export function mapLayout(system: C9ySystem): MapLayout {
  const at = new Map<string, { x: number; y: number }>();
  const stacks: Stack[] = [];
  const sites: Stack = { key: 'sites', title: 'Sites', x: 0, y: 0, members: system.sites.map(site => ({ id: site.id, label: site.label, aside: site.code })) };
  stacks.push(sites);
  const top = 1 + system.sites.length + GAP;
  LAYERS.forEach(({ layer, title }, index) => {
    const members = system.components.filter(component => component.layer === layer)
      .map(component => ({ id: component.id, label: component.label, aside: String(relationsOf(system, component.id).length) }));
    stacks.push({ key: layer, title, x: COLUMN * (index + 1), y: top, members });
  });
  let height = 0;
  for (const stack of stacks) {
    stack.members.forEach((member, index) => at.set(member.id, { x: stack.x, y: stack.y + 1 + index }));
    height = Math.max(height, stack.y + 1 + stack.members.length);
  }
  return { stacks, at, width: COLUMN * LAYERS.length + NODE_W, height };
}

export const relationsOf = (system: C9ySystem, id: string) =>
  system.relations.filter(relation => relation.source === id || relation.target === id);

/** The node and everything one relation away from it. */
export function neighbourhood(system: C9ySystem, focus: string): Set<string> {
  const near = new Set([focus]);
  for (const relation of relationsOf(system, focus)) { near.add(relation.source); near.add(relation.target); }
  return near;
}

const escape = (text: string) => text.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);

function edges(system: C9ySystem, layout: MapLayout, focus: string): string {
  const touches = (relation: { source: string; target: string }) => Number(!!focus && (relation.source === focus || relation.target === focus));
  let svg = '';
  for (const relation of [...system.relations].sort((a, b) => touches(a) - touches(b))) {
    const from = layout.at.get(relation.source); const to = layout.at.get(relation.target);
    if (!from || !to) continue;
    const x1 = (from.x + NODE_W) * SQUARE; const y1 = (from.y + 0.5) * SQUARE;
    const x2 = to.x * SQUARE; const y2 = (to.y + 0.5) * SQUARE;
    const channel = (to.x - GAP / 2) * SQUARE;
    const d = `M${x1},${y1} L${channel},${y1} L${channel},${y2} L${x2},${y2}`;
    const tip = `${x2 - ARROW_BACK},${y2 - ARROW_SIDE} ${x2},${y2} ${x2 - ARROW_BACK},${y2 + ARROW_SIDE}`;
    const state = focus ? (touches(relation) ? ' is-on' : ' is-off') : '';
    svg += `<g class="c9y-edge${state}" data-relation="${escape(relation.id)}" data-kind="${relation.kind}"><path d="${d}"/><polyline points="${tip}"/></g>`;
  }
  return svg;
}

/** The map's HTML: the stacks of nodes over one SVG of relations, and the key under the sites. */
export function renderMap(system: C9ySystem, focus: string): string {
  const layout = mapLayout(system);
  const near = focus ? neighbourhood(system, focus) : null;
  const size = (squares: number) => `calc(${squares} * var(--ds-unit))`;
  let html = `<div class="c9y-map" data-focused="${focus ? 'true' : 'false'}" style="width:${size(layout.width)};height:${size(Math.max(layout.height, keyBottom(system)))}">`;
  html += `<svg class="c9y-edges" viewBox="0 0 ${layout.width * SQUARE} ${layout.height * SQUARE}" style="width:${size(layout.width)};height:${size(layout.height)}" aria-hidden="true">${edges(system, layout, focus)}</svg>`;
  for (const stack of layout.stacks) {
    if (!stack.members.length) continue;
    html += `<div class="c9y-stack" data-stack="${stack.key}" style="left:${size(stack.x)};top:${size(stack.y)}"><div class="c9y-stack-head"><span>${stack.title}</span><small>${stack.members.length}</small></div>`;
    for (const member of stack.members) {
      const faded = near && !near.has(member.id) ? ' data-faded' : '';
      html += `<button type="button" class="c9y-node" data-focus="${escape(member.id)}" aria-pressed="${focus === member.id}"${faded}><b>${escape(member.label)}</b><small>${escape(member.aside)}</small></button>`;
    }
    html += '</div>';
  }
  html += `<div class="c9y-key" style="left:0;top:${size(1 + system.sites.length + GAP)}" aria-label="Relations">`;
  for (const kind of KINDS) {
    html += `<p><svg viewBox="0 0 40 20" aria-hidden="true"><g class="c9y-edge" data-kind="${kind}"><path d="M0,10 L40,10"/></g></svg>${KIND_WORDS[kind]}</p>`;
  }
  return html + '</div></div>';
}

const keyBottom = (system: C9ySystem) => 1 + system.sites.length + GAP + KINDS.length;
