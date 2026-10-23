/** Approved page content only. Aa owns the native writing structures and their editing. */
export const PAGE_INSERTIONS = [
  { id: 'list', label: 'List', icon: 'bullet', source: '- List item' },
  { id: 'tabs', label: 'Tabs', icon: 'tabs', source: '<tabs>\n<tab name="Tab 1">\n</tab>\n<tab name="Tab 2">\n</tab>\n</tabs>' },
  { id: 'table', label: 'Table', icon: 'table', source: '| Column 1 | Column 2 |\n| --- | --- |\n|  |  |' },
  { id: 'carousel', label: 'Carousel', icon: 'image', source: '```c9y-carousel\n{"slides":[],"height":280}\n```' },
  { id: 'image', label: 'Image', icon: 'image', source: '```c9y-image\n{}\n```' },
  { id: 'link', label: 'Link', icon: 'link', source: '[Link](#)' },
  { id: 'icon', label: 'Icon', icon: 'star', source: ':icon[star]' },
] as const;
