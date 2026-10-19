type Entry = { label: string; href?: string; entries?: Entry[] };
const libraryDestination = (href?: string) => !!href && /^\/(?:libraries(?:\/(?:api|workspace))?|app\/libraries)\/?$/.test(href.split(/[?#]/)[0]);
/** Match destinations as well as the display name, so translated groups stay hidden. */
export function hideSignedInLibraryEntry(entry: Entry): boolean {
  return entry.label.trim().toLowerCase() === 'my libraries' || libraryDestination(entry.href) ||
    Boolean(entry.entries?.some(child => libraryDestination(child.href)));
}
