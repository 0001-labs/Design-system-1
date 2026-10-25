import { defaultLibraryComponent, libraryWorkspaceHref } from '../../../shared/library-navigation';

/** A library as the signed-in navigation summary lists it. */
export type OwnerLibrary = { id: string; name: string; publishedVersion: number | null };
export type OwnerLibraryItem = { id: string; label: string; href: string; depth: 0 | 1; current: boolean; expanded?: boolean };
type Here = { pathname: string; search?: string };

export const MY_LIBRARIES_ID = 'my-libraries';
export const BASE_LIBRARY_ID = 'base-library';
export const MY_LIBRARIES_HREF = '/libraries/workspace/';
/** The base system is a library too: Design system 1 itself, opened in the component editor. */
export const BASE_LIBRARY_HREF = '/libraries/design-system-1/';

const trim = (path: string) => path.replace(/\/$/, '');

/** Only well-formed entries from the navigation summary become links. */
export function readOwnerLibraries(value: unknown): OwnerLibrary[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(entry => {
    if (!entry || typeof entry !== 'object') return [];
    const { id, name, publishedVersion } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || !id || typeof name !== 'string' || !name.trim()) return [];
    return [{ id, name, publishedVersion: typeof publishedVersion === 'number' && Number.isInteger(publishedVersion) && publishedVersion > 0 ? publishedVersion : null }];
  });
}

export function ownerLibraryHref(library: OwnerLibrary): string {
  return libraryWorkspaceHref({ ...library, component: defaultLibraryComponent });
}

/**
 * The owner's last navigation group: My libraries, then Design system 1 (the base system),
 * then each of the owner's libraries. Collapsed, only the group row remains.
 */
export function ownerLibraryItems(libraries: OwnerLibrary[], here: Here, expanded = true): OwnerLibraryItem[] {
  const path = trim(here.pathname);
  const query = new URLSearchParams(here.search ?? '');
  const selected = query.get('library');
  const workspace = path === trim(MY_LIBRARIES_HREF);
  // The workspace also hosts private component guides (`?internal=`); those are not the list.
  const group: OwnerLibraryItem = { id: MY_LIBRARIES_ID, label: 'My libraries', href: MY_LIBRARIES_HREF, depth: 0, current: workspace && !selected && !query.has('internal'), expanded };
  if (!expanded) return [group];
  return [
    group,
    { id: BASE_LIBRARY_ID, label: 'Design system 1', href: BASE_LIBRARY_HREF, depth: 1, current: path === trim(BASE_LIBRARY_HREF) },
    ...libraries.map(library => ({
      id: `owner-library-${library.id}`, label: library.name, href: ownerLibraryHref(library), depth: 1 as const, current: workspace && selected === library.id,
    })),
  ];
}
