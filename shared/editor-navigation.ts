/**
 * Design system 1's component editor (`/app/base`) inside the documentation's frame
 * (`/libraries/design-system-1/`): the frame says which components it edits and which one is
 * open (`ds1:editor-navigation`), the docs sidebar lists them in place of its own groups, and a
 * choice there goes back as `ds1:editor-open`. The editor draws no sidebar of its own there.
 */
export type EditorView = 'history' | 'tokens' | null;
export interface EditorNavigation { components: { id: string; name: string }[]; component: string; view: EditorView }
export interface EditorSidebarItem { id: string; label: string; depth?: number; href?: string; current?: boolean; expanded?: boolean }

export const EDITOR_COMPONENTS_ID = 'editor:components';
const COMPONENT_PREFIX = 'editor:component:';
const ID = /^[a-z0-9-]{1,40}$/;

export const readEditorView = (value: unknown): EditorView => value === 'history' || value === 'tokens' ? value : null;

/** What a frame reported, or null when it is not an editor's navigation. */
export function readEditorNavigation(value: unknown): EditorNavigation | null {
  if (!value || typeof value !== 'object') return null;
  const { components, component } = value as Record<string, unknown>;
  if (!Array.isArray(components) || typeof component !== 'string' || !ID.test(component)) return null;
  const list = components.flatMap(entry => {
    const { id, name } = (entry ?? {}) as Record<string, unknown>;
    return typeof id === 'string' && ID.test(id) && typeof name === 'string' && name.trim() ? [{ id, name: name.slice(0, 80) }] : [];
  });
  return list.length ? { components: list, component, view: readEditorView((value as Record<string, unknown>).view) } : null;
}

/** The editor's address for a component or a view, as the frame and the docs page both write it. */
export function editorSearch(component: string | null, chosen: EditorView, from: URLSearchParams = new URLSearchParams()): URLSearchParams {
  const search = new URLSearchParams(from);
  search.delete('component'); search.delete('view');
  if (chosen) search.set('view', chosen);
  else if (component) search.set('component', component);
  return search;
}

/** The docs sidebar's rows for the editor: its components, then History and All tokens. */
export function editorSidebarItems(navigation: EditorNavigation, expanded: boolean, pathname: string): EditorSidebarItem[] {
  const link = (component: string | null, chosen: EditorView) => `${pathname}?${editorSearch(component, chosen)}`;
  return [
    { id: EDITOR_COMPONENTS_ID, label: 'Components', expanded },
    ...(expanded ? navigation.components.map(entry => ({
      id: `${COMPONENT_PREFIX}${entry.id}`, label: entry.name, depth: 1, href: link(entry.id, null), current: !navigation.view && entry.id === navigation.component,
    })) : []),
    { id: 'editor:history', label: 'History', href: link(null, 'history'), current: navigation.view === 'history' },
    { id: 'editor:tokens', label: 'All tokens', href: link(null, 'tokens'), current: navigation.view === 'tokens' },
  ];
}

/** What a docs sidebar row asks the frame to open, or null when the row is not the editor's. */
export function editorChoice(id: string): { component: string | null; view: EditorView } | null {
  if (id === 'editor:history') return { component: null, view: 'history' };
  if (id === 'editor:tokens') return { component: null, view: 'tokens' };
  if (id.startsWith(COMPONENT_PREFIX) && ID.test(id.slice(COMPONENT_PREFIX.length))) return { component: id.slice(COMPONENT_PREFIX.length), view: null };
  return null;
}
