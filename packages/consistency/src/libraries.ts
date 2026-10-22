/** Local presets of DS1's public library token roles, not saved account libraries.
 * Geometry and component implementations stay DS1's; the selected map also travels
 * to authored atom previews that render outside the composition. */
export type LibraryId = 'original' | 'blue' | 'ink';
export interface LibraryPreset { id: LibraryId; label: string; tokens: Record<string, string> }
export const LIBRARY_PRESETS: readonly LibraryPreset[] = [
  { id: 'original', label: 'Original preset', tokens: {} },
  { id: 'blue', label: 'Blue preset', tokens: {
    '--ds-accent-color': 'var(--ds-sharp-blue)', '--accent-color': 'var(--ds-sharp-blue)',
    '--ds-button-background-color-primary': 'var(--ds-sharp-blue)', '--button-background-color-primary': 'var(--ds-sharp-blue)',
    '--ds-button-text-color-on-accent': 'var(--ds-white)', '--button-text-color-on-light': 'var(--ds-white)',
    '--ds-paper': 'var(--ds-white)', '--ds-text-color': 'var(--ds-black)', '--ds-text-color-muted': '#5f5f5f',
    '--ds-fill': 'var(--ds-zenith-blue)', '--ds-fill-hover': 'var(--ds-slate-light)',
    '--ds-button-background-color-secondary': 'var(--ds-zenith-blue)', '--button-background-color-secondary': 'var(--ds-zenith-blue)',
    '--ds-button-text-color': 'var(--ds-black)', '--button-text-color': 'var(--ds-black)',
    '--ds-input-background': 'var(--ds-zenith-blue)', '--ds-input-color': 'var(--ds-black)',
    '--ds-border-color': 'var(--ds-sharp-blue)', '--ds-focus-ring': 'var(--ds-sharp-blue)',
  } },
  { id: 'ink', label: 'Ink preset', tokens: {
    '--ds-accent-color': 'var(--ds-yellow)', '--accent-color': 'var(--ds-yellow)',
    '--ds-button-background-color-primary': 'var(--ds-yellow)', '--button-background-color-primary': 'var(--ds-yellow)',
    '--ds-button-text-color-on-accent': 'var(--ds-black)', '--button-text-color-on-light': 'var(--ds-black)',
    '--ds-paper': 'var(--ds-slate)', '--ds-text-color': 'var(--ds-white)', '--ds-text-color-muted': 'var(--ds-slate-light)',
    '--ds-fill': 'var(--ds-slate-dark)', '--ds-fill-hover': 'var(--ds-grey)',
    '--ds-button-background-color-secondary': 'var(--ds-slate-dark)', '--button-background-color-secondary': 'var(--ds-slate-dark)',
    '--ds-button-text-color': 'var(--ds-white)', '--button-text-color': 'var(--ds-white)',
    '--ds-input-background': 'var(--ds-slate-dark)', '--ds-input-color': 'var(--ds-white)',
    '--ds-border-color': 'var(--ds-grey)', '--ds-focus-ring': 'var(--ds-yellow)',
  } },
];
export function libraryTokens(id: string): Record<string, string> {
  return { ...(LIBRARY_PRESETS.find(preset => preset.id === id) ?? LIBRARY_PRESETS[0]).tokens };
}
/** Switching back to Original clears every previously applied role. */
export function applyLibraryTokens(element: HTMLElement, id: string): void {
  const keys = new Set(LIBRARY_PRESETS.flatMap(preset => Object.keys(preset.tokens)));
  for (const key of keys) element.style.removeProperty(key);
  for (const [key, value] of Object.entries(libraryTokens(id))) element.style.setProperty(key, value);
  element.style.colorScheme = id === 'ink' ? 'dark' : id === 'blue' ? 'light' : '';
  element.dataset.consistencyLibrary = LIBRARY_PRESETS.find(preset => preset.id === id)?.id ?? 'original';
}
