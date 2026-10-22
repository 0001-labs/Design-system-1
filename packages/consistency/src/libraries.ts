/** Local presets of DS1's public library token roles, not saved account libraries.
 * Geometry and component implementations stay DS1's; the selected map also travels
 * to authored atom previews that render outside the composition. */
export type LibraryId = 'original' | 'blue' | 'ink' | 'soft' | 'bold' | 'editorial';
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
  { id: 'soft', label: 'Soft preset', tokens: {
    '--ds-accent-color': 'var(--ds-pink)', '--accent-color': 'var(--ds-pink)',
    '--ds-paper': 'color-mix(in srgb, var(--ds-pink) 8%, var(--ds-white))',
    '--ds-text-color': 'var(--ds-black)', '--ds-text-color-muted': '#66585f',
    '--ds-fill': 'color-mix(in srgb, var(--ds-pink) 18%, var(--ds-white))',
    '--ds-fill-hover': 'color-mix(in srgb, var(--ds-pink) 30%, var(--ds-white))',
    '--ds-button-background-color-primary': 'var(--ds-pink)', '--button-background-color-primary': 'var(--ds-pink)',
    '--ds-button-text-color-on-accent': 'var(--ds-black)', '--button-text-color-on-light': 'var(--ds-black)',
    '--ds-button-background-color-secondary': 'color-mix(in srgb, var(--ds-pink) 18%, var(--ds-white))', '--button-background-color-secondary': 'color-mix(in srgb, var(--ds-pink) 18%, var(--ds-white))',
    '--ds-button-text-color': 'var(--ds-black)', '--button-text-color': 'var(--ds-black)',
    '--ds-border-color': 'color-mix(in srgb, var(--ds-pink) 45%, var(--ds-white))',
    '--ds-corner-size': '10px', '--ds-card-corner-size': '20px', '--ds-button-inset': '10px',
  } },
  { id: 'bold', label: 'Bold preset', tokens: {
    '--ds-accent-color': 'var(--ds-orange)', '--accent-color': 'var(--ds-orange)',
    '--ds-paper': 'var(--ds-white)', '--ds-text-color': 'var(--ds-black)', '--ds-text-color-muted': '#555555',
    '--ds-fill': 'var(--ds-yellow)', '--ds-fill-hover': 'var(--ds-orange)',
    '--ds-button-background-color-primary': 'var(--ds-orange)', '--button-background-color-primary': 'var(--ds-orange)',
    '--ds-button-background-color-secondary': 'var(--ds-yellow)', '--button-background-color-secondary': 'var(--ds-yellow)',
    '--ds-button-text-color-on-accent': 'var(--ds-black)', '--button-text-color-on-light': 'var(--ds-black)',
    '--ds-button-text-color': 'var(--ds-black)', '--button-text-color': 'var(--ds-black)',
    '--ds-border-color': 'var(--ds-black)', '--ds-control-size': '40px', '--ds-text-size': '16px',
    '--ds-display-text-size': '30px', '--ds-corner-size': '0px', '--ds-card-corner-size': '0px', '--ds-button-inset': '20px',
  } },
  { id: 'editorial', label: 'Editorial preset', tokens: {
    '--ds-accent-color': 'var(--ds-black)', '--accent-color': 'var(--ds-black)',
    '--ds-paper': 'color-mix(in srgb, var(--ds-sand) 12%, var(--ds-white))',
    '--ds-text-color': 'var(--ds-black)', '--ds-text-color-muted': '#686156',
    '--ds-fill': 'color-mix(in srgb, var(--ds-sand) 30%, var(--ds-white))',
    '--ds-fill-hover': 'color-mix(in srgb, var(--ds-sand) 45%, var(--ds-white))',
    '--ds-button-background-color-primary': 'var(--ds-black)', '--button-background-color-primary': 'var(--ds-black)',
    '--ds-button-text-color-on-accent': 'var(--ds-white)', '--button-text-color-on-light': 'var(--ds-white)',
    '--ds-button-background-color-secondary': 'color-mix(in srgb, var(--ds-sand) 30%, var(--ds-white))', '--button-background-color-secondary': 'color-mix(in srgb, var(--ds-sand) 30%, var(--ds-white))',
    '--ds-button-text-color': 'var(--ds-black)', '--button-text-color': 'var(--ds-black)',
    '--ds-typeface-regular': 'var(--typeface-canon)', '--ds-typeface-medium': 'var(--typeface-canon)',
    '--ds-border-color': 'color-mix(in srgb, var(--ds-black) 30%, var(--ds-white))', '--ds-corner-size': '0px', '--ds-card-corner-size': '0px',
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
  element.style.colorScheme = id === 'ink' ? 'dark' : ['blue', 'soft', 'bold', 'editorial'].includes(id) ? 'light' : '';
  element.dataset.consistencyLibrary = LIBRARY_PRESETS.find(preset => preset.id === id)?.id ?? 'original';
}
