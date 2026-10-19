import { libraryTokenValues } from './libraryTokens';

/** Resolve colour references without installing a library's stylesheet in the app. */
export function previewColours(css: string, defaults: string): Record<string, string> {
  const base = libraryTokenValues(defaults);
  const values = new Map([...base, ...libraryTokenValues(css)]);
  const resolve = (name: string, seen = new Set<string>()): string => {
    if (seen.has(name) || seen.size > 20) return '';
    const next = new Set(seen).add(name);
    return (values.get(name) ?? '').replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g,
      (_, key: string, fallback: string) => resolve(key, next) || fallback?.trim() || '');
  };
  const aliases: Record<string, string> = {
    accent: '--ds-accent-color', paper: '--ds-paper', ink: '--ds-text-color', surface: '--ds-fill',
  };
  const legacy: Record<string, string> = { accent: '--one-accent-color', paper: '--one-background', ink: '--one-text' };
  const authored = libraryTokenValues(css);
  return Object.fromEntries(Object.entries(aliases).map(([role, name]) => [role,
    resolve(!authored.has(name) && authored.has(legacy[role]!) ? legacy[role]! : name),
  ]));
}
