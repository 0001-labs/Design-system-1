export interface ComponentExample {
  title: string;
  hint: string;
  html: string;
  script?: string;
  height?: number;
}

export const TABLE_DATA = [
  { product: "Ezo", users: "120", retention: "92%", status: "Active" },
  { product: "Link", users: "80", retention: "88%", status: "Active" },
];

// The preview and the copyable code use the same source. These are local
// examples only; no sample sends a request to a product's backend.
export const EXAMPLES: Record<string, ComponentExample> = {
  'split': {
    title: 'Choices and repeated actions', hint: 'Choose a view or step through the date.',
    html: '<ds-split aria-label="View" options="day:Day,week:Week,month:Month" value="week"></ds-split>\n<ds-split actions aria-label="Date" options="back:@left:Back,today:Today,next:@right:Next"></ds-split>',
  },
  'avatar': {
    title: 'People, always round', hint: 'Link fills an avatar with a colour; Ezo letters it in an ink.',
    html: '<ds-avatar-group aria-label="People">\n  <ds-avatar initial="A" color="#99ff73" outlined></ds-avatar>\n  <ds-avatar initial="J" color="#f5aad1" outlined></ds-avatar>\n  <ds-avatar initial="M" color="#fec20d" outlined></ds-avatar>\n</ds-avatar-group>\n<ds-avatar-group aria-label="People">\n  <ds-avatar initial="E" ink="light-dark(#2e9e1f, #99ff73)" outlined></ds-avatar>\n  <ds-avatar initial="高橋" ink="light-dark(#4b44e6, #b3aeff)" outlined></ds-avatar>\n  <ds-avatar initial="S" pending></ds-avatar>\n</ds-avatar-group>',
  },
  'button': {
    title: 'Button styles', hint: 'Click a button. The event appears below.',
    html: '<ds-button primary>Save changes</ds-button>\n<ds-button secondary>Cancel</ds-button>\n<ds-button>Text button</ds-button>\n<ds-button primary disabled>Disabled</ds-button>',
  },
  'button-icon': {
    title: 'An icon and an action', hint: 'Icons follow the button’s text colour.',
    html: '<ds-button primary>\n  <ds-icon type="check"></ds-icon> Save\n</ds-button>',
  },
  'tooltip': {
    title: 'Hover or focus', hint: 'The label starts visible. Hover over the button, or focus it with Tab to try it.',
    html: '<ds-tooltip text="Save your changes">\n  <ds-button secondary>Hover or focus me</ds-button>\n</ds-tooltip>',
  },
  'tooltip-fallback': {
    title: 'A translated label with a fallback', hint: 'Hover or focus to see the fallback when the key has no translation.',
    html: '<ds-tooltip text="actions.save.help" default-value="Keep your changes">\n  <ds-button primary>Save</ds-button>\n</ds-tooltip>',
  },
  'icon': {
    title: 'Real library icons', hint: 'Each drawing is selected with the type attribute.',
    html: '<ds-icon type="check"></ds-icon>\n<ds-icon type="star"></ds-icon>\n<ds-icon type="search"></ds-icon>\n<ds-icon type="close"></ds-icon>\n<ds-icon type="plus"></ds-icon>',
  },
  'icon-variants': {
    title: 'Glyph, primary and secondary', hint: 'The same drawing in three treatments.',
    html: '<ds-icon type="star"></ds-icon>\n<ds-icon type="star" variant="primary"></ds-icon>\n<ds-icon type="star" variant="secondary"></ds-icon>',
  },
  'input': {
    title: 'Type something', hint: 'The input-change event shows the current value below.',
    html: '<ds-input label="Your name" name="name" placeholder="Enter your name"></ds-input>',
    height: 180,
  },
  'input-states': {
    title: 'Error and disabled states', hint: 'Error messages belong to the field they explain.',
    html: '<ds-input label="Email" type="email" name="email" value="hello" error="Enter a valid email address"></ds-input>\n<ds-input label="Unavailable" value="Read only" disabled></ds-input>',
    height: 240,
  },
  'text': {
    title: 'Text and translation keys', hint: 'Slot text is the translation key and the fallback.',
    html: '<ds-text>Welcome to the app</ds-text>\n<ds-text text="Save"></ds-text>',
  },
  'date': {
    title: 'The current year', hint: 'The year comes from the browser’s clock.',
    html: '<span>Copyright <ds-date></ds-date> 0001</span>',
  },
  'banner': {
    title: 'A message with an action', hint: 'The banner sits at the top of this isolated preview.',
    html: '<ds-banner text="Your changes are saved" variant="success" action="Browse icons" href="/icons/" ></ds-banner>',
  },
  'card': {
    title: 'A container for content', hint: 'Card is an optional component. Ordinary writing sits directly on the paper.',
    html: '<ds-card variant="outlined" padding="small">\n  <ds-text>A little content</ds-text>\n  <ds-button primary>Continue</ds-button>\n</ds-card>',
    height: 200,
  },
  'cycle': {
    title: 'Cycle through a setting', hint: 'Click to switch light and dark inside this preview.',
    html: '<ds-cycle type="theme"></ds-cycle>',
  },
  'language': {
    title: 'Choose a language', hint: 'Click to cycle through the configured languages in this preview.',
    html: '<ds-language></ds-language>\n<ds-language chip primary></ds-language>\n<ds-text>Save</ds-text>',
  },
  'gap': {
    title: 'One square of space', hint: 'The gap separates two lines by one 20px square.',
    html: '<div>First line</div>\n<ds-gap unit></ds-gap>\n<div>Second line</div>',
    height: 200,
  },
  'row': {
    title: 'Label and value', hint: 'Fill places content at opposite ends of the row.',
    html: '<ds-row fill>\n  <ds-text>Language</ds-text>\n  <ds-text>English</ds-text>\n</ds-row>',
  },
  'row-centered': {
    title: 'A centred group', hint: 'An icon and its label share one row.',
    html: '<ds-row centered>\n  <ds-icon type="check"></ds-icon>\n  <ds-text>Completed</ds-text>\n</ds-row>',
  },
  'list': {
    title: 'Rows in a list', hint: 'Use actual rows; there is no ds-list-item element.',
    html: '<ds-list>\n  <ds-row fill><ds-text>Design</ds-text><ds-text>Ready</ds-text></ds-row>\n  <ds-row fill><ds-text>Build</ds-text><ds-text>In progress</ds-text></ds-row>\n  <ds-row fill><ds-text>Review</ds-text><ds-text>Next</ds-text></ds-row>\n</ds-list>',
    height: 200,
  },
  'accordion': {
    title: 'Open the details', hint: 'Click the summary or focus it and press Enter.',
    html: '<ds-accordion summary="How does this work?">\n  <div slot="details">The summary opens and closes this content.</div>\n</ds-accordion>',
    height: 200,
  },
  'form': {
    title: 'A local form', hint: 'Type a name and submit. The result stays in this preview.',
    html: '<ds-form>\n  <ds-input label="Your name" name="name" required></ds-input>\n  <button type="submit">Try submission</button>\n</ds-form>',
    height: 240,
  },
  'table': {
    title: 'A table with data', hint: 'Rows are assigned to the data property in JavaScript.',
    html: '<ds-table></ds-table>',
    script: `const table = document.querySelector("ds-table");\ntable.data = ${JSON.stringify(TABLE_DATA, null, 2)};`,
    height: 240,
  },
  'container': {
    title: 'A responsive container', hint: 'The container follows the available width and stacks its content.',
    html: '<ds-container>\n  <ds-text>First line</ds-text>\n  <ds-text>Second line</ds-text>\n  <ds-button primary>Continue</ds-button>\n</ds-container>',
    height: 200,
  },
  'grid': {
    title: 'The page grid', hint: 'A fixed alignment overlay. It does not lay out content.',
    html: '<ds-grid align="left"></ds-grid>\n<ds-text>Each square is 20px: a 19px track and a 1px line.</ds-text>',
    height: 240,
  },
  'layout': {
    title: 'Named page areas', hint: 'The company layout places content in named CSS grid areas.',
    html: '<ds-layout mode="company" view>\n  <ds-text style="grid-area: header">Page header</ds-text>\n  <ds-text style="grid-area: content">Content on the grid</ds-text>\n  <ds-text style="grid-area: footer">Page footer</ds-text>\n</ds-layout>',
    height: 460,
  },
};

export const PAGE_EXAMPLES: Record<string, string[]> = {
  '2-core/avatar': ['avatar'],
  '2-core/button': ['button', 'button-icon'],
  '2-core/tooltip': ['tooltip', 'tooltip-fallback'],
  '2-core/icon': ['icon', 'icon-variants'],
  '2-core/input': ['input', 'input-states'],
  '2-core/text': ['text'], '2-core/date': ['date'],
  '2-core/banner': ['banner'], '2-core/card': ['card'],
  '2-core/cycle': ['cycle'], '2-core/language': ['language'],
  '2-core/gap': ['gap'],
  '3-unit/row': ['row', 'row-centered'], '3-unit/list': ['list'],
  '3-unit/accordion': ['accordion'], '3-unit/form': ['form'],
  '3-unit/table': ['table'],
  '4-page/container': ['container'], '4-page/grid': ['grid'],
  '4-page/layout': ['layout'],
};
