/** The owner's documentation catalogue. Visibility changes listings, not example URLs. */
export const DOC_EXAMPLES = [
  ['issues', 'Issue tracker'],
  ['settings', 'General settings'], ['shop', 'Shop'], ['planner', 'Planning app'],
  ['finance', 'Finance app'], ['product', 'Product showcase'], ['booking', 'Booking site'],
  ['canvas', 'Design tool'], ['speaker', 'Speaker launch'], ['bike', 'Bike maker'],
  ['festival', 'Festival'], ['platform', 'Developer platform'], ['magazine', 'Travel magazine'],
  ['travel', 'Travel stays'], ['cafe', 'Café'], ['trails', 'Walking log'], ['console', 'Deploy console'],
  ['sidebar', 'Sidebar'], ['split', 'List and detail'], ['inspector', 'Inspector'],
  ['column', 'Column'], ['centered', 'Centred'], ['tiles', 'Tiles'],
  ['financial', 'Financial services'],
  ['html-article', 'HTML · Article'], ['html-form', 'HTML · Form'],
  ['html-report', 'HTML · Report'], ['html-reference', 'HTML · Reference'],
].map(([id, label]) => ({ id: id!, label: label!, defaultEnabled: id !== 'financial',
  href: id!.startsWith('html-') ? `/examples/files/${id!.slice(5)}.html` : `/examples/layouts/${id}/` }));
