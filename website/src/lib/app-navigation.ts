import type { SidebarItem } from '../../../DS1/3-unit/ds-sidebar';

export interface AppComponent { name: string; href: string; layer: number; }

/** Only the authenticated bridge supplies private names; public catalogues stay unchanged. */
export function readAppComponents(detail: unknown): AppComponent[] {
  const data = detail as { authenticated?: boolean; appComponents?: unknown[] } | null;
  if (data?.authenticated !== true || !Array.isArray(data.appComponents)) return [];
  return data.appComponents.filter((value): value is AppComponent => {
    const item = value as Partial<AppComponent> | null;
    return Boolean(item && typeof item.name === 'string' && typeof item.href === 'string'
      && /^\/libraries\/workspace\/\?internal=[a-z-]+$/.test(item.href)
      && Number.isInteger(item.layer) && item.layer! >= 1 && item.layer! <= 4);
  });
}

/** App-owned rows use Sidebar's existing slots, in alphabetical order within each open layer. */
export function placeAppNavigation(root: HTMLElement, rows: SidebarItem[], components: AppComponent[]): SidebarItem[] {
  root.querySelectorAll('[data-private-component-slot]').forEach(slot => slot.remove());
  const items = rows.map(item => ({ ...item }));
  const groups = new Map<number, AppComponent[]>();
  for (const component of [...components].sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const parent = items.findIndex(item => item.id === `/${component.layer}-${['', 'root', 'core', 'unit', 'page'][component.layer]}/overview/`
      || item.id === `library-layer-${component.layer}`);
    if (parent < 0 || items[parent].expanded === false) continue;
    let anchor = parent;
    for (let index = parent + 1; index < items.length && (items[index].depth ?? 0) > 0; index++) {
      if (items[index].label.localeCompare(component.name, 'en') > 0) break;
      anchor = index;
    }
    const group = groups.get(anchor) ?? [];
    group.push(component); groups.set(anchor, group);
  }
  for (const [anchor, components] of groups) {
    const slot = document.createElement('div');
    slot.slot = `private-component-${anchor}`;
    slot.dataset.privateComponentSlot = '';
    slot.className = 'private-component-links';
    for (const component of components) {
      const link = document.createElement('a');
      link.className = 'ds-row ds-row--nav private-component-link';
      link.href = component.href;
      link.textContent = component.name;
      if (location.pathname + location.search === component.href) link.setAttribute('aria-current', 'page');
      slot.append(link);
    }
    items[anchor].afterSlot = slot.slot;
    root.append(slot);
  }
  return items;
}
