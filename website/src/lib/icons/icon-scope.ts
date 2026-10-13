/** Repeated drawings resolve to the original shared icon; runtime keys stay compatible. */
export const interfaceIconAliases: Record<string, string> = {
  'check-alt': 'check',
  'lock-filled': 'lock',
  'open-alt': 'open',
  'page-alt': 'page',
  'rewind-30': 'rewind',
  'see-30': 'see',
  'star-alt': 'star',
  'star-alt-2': 'star',
  titlestyle: 'title',
};

/** Product artwork and repeated drawings remain available to existing consumers. */
export function isSharedInterfaceIcon(key: string): boolean {
  return key !== 'status-alt' && key !== 'image' && key !== 'warning' && !Object.hasOwn(interfaceIconAliases, key) && !/^(ezo-|aa-|badge-|block-|pattern-|arrange-|navigation-)/.test(key);
}

/** One semantic word on the sheet; technical keys stay stable for consumers. */
export function sharedIconName(key: string): string {
  const word = ({
    '1x': 'Single', '2x': 'Double', '4x4': 'Matrix',
    '1xdots': 'Dots', '2xdots': 'Dots',
    '1xgrid': 'Grid', '2xgrid': 'Grid',
    '1xlines': 'Lines', '2xlines': 'Lines',
    '2xgrid-alt': 'Grid', '2xgrid-alt-2': 'Grid', '2xgrid-alt-3': 'Grid',
    'code-block': 'Code', 'list-line': 'List', 'logo-marquee': 'Marquee',
    'note-page': 'Note', 'note-lines': 'Note', 'page-note': 'Note',
    'title-text': 'Title', 'open-source': 'Source', 'up-right': 'Outbound',
  } as Record<string, string>)[key] ?? key.split('-')[0];
  return word.charAt(0).toUpperCase() + word.slice(1);
}
