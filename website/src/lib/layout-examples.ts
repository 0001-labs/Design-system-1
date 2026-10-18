// The standard page layouts, each filled with the core and unit components a
// real page would hold. The preview and the copyable code share one source;
// every sample is local and sends nothing.

export interface LayoutExample {
  name: string;
  /** When to reach for it, in one sentence. */
  use: string;
  html: string;
  script?: string;
  height: number;
}

const sidebarScript = `const sidebar = document.querySelector('ds-sidebar');
let expanded = true;
let selected = 'atlas';
function render() {
  sidebar.items = [
    { id: 'inbox', label: 'Inbox', meta: '4', current: selected === 'inbox' },
    { id: 'projects', label: 'Projects', expanded, meta: '3' },
    ...(expanded ? [
      { id: 'atlas', label: 'Atlas', depth: 1, current: selected === 'atlas' },
      { id: 'harbor', label: 'Harbor', depth: 1, current: selected === 'harbor' },
      { id: 'meadow', label: 'Meadow', depth: 1, current: selected === 'meadow' },
    ] : []),
    { id: 'archive', label: 'Archive', current: selected === 'archive' },
  ];
}
sidebar.addEventListener('sidebar-toggle', event => { expanded = event.detail.expanded; render(); });
sidebar.addEventListener('sidebar-activate', event => { selected = event.detail.id; render(); });
render();`;

const chartScript = `const values = [12, 15, 14, 18, 16, 21, 19, 17, 22, 20, 24, 23, 26, 24];
document.querySelectorAll('ds-chart').forEach(chart => {
  Object.assign(chart, { data: values.map((value, index) => ({ time: index * 86400, value })), format: value => String(Math.round(value)) });
});
document.querySelectorAll('ds-spark').forEach(spark => { spark.values = values; });
const bars = document.querySelector('ds-bars');
bars.items = [
  { label: 'Mon', value: 12 }, { label: 'Tue', value: 20, tone: 'up' }, { label: 'Wed', value: 15 },
  { label: 'Thu', value: 18 }, { label: 'Fri', value: 24, tone: 'up' },
];
document.querySelector('ds-ratio').value = 0.65;
document.querySelector('ds-table').data = [
  { product: 'Atlas', users: 120, retention: '92%' },
  { product: 'Harbor', users: 80, retention: '88%' },
  { product: 'Meadow', users: 64, retention: '79%' },
];`;

export const LAYOUT_EXAMPLES: Record<string, LayoutExample> = {
  sidebar: {
    name: 'Sidebar',
    use: 'An app with places to go: navigation stays on the left while the work changes on the right.',
    height: 420,
    html: `<ds-page layout="sidebar" divided fill>
  <ds-sidebar slot="nav" label="Workspace"></ds-sidebar>
  <ds-row slot="header" fill>
    <ds-text literal strong>Atlas</ds-text>
    <ds-button primary><ds-icon type="plus"></ds-icon> New item</ds-button>
  </ds-row>
  <ds-tabs aria-label="Atlas">
    <ds-button role="tab" active aria-selected="true">Items</ds-button>
    <ds-button role="tab" aria-selected="false">Activity</ds-button>
    <ds-button role="tab" aria-selected="false">Files</ds-button>
  </ds-tabs>
  <ds-gap unit></ds-gap>
  <ds-list>
    <ds-row fill><ds-text literal>Write the brief</ds-text><ds-badge icon="check">Done</ds-badge></ds-row>
    <ds-row fill><ds-text literal>Sketch the home page</ds-text><ds-badge>In progress</ds-badge></ds-row>
    <ds-row fill><ds-text literal>Choose the typeface</ds-text><ds-badge>In progress</ds-badge></ds-row>
    <ds-row fill><ds-text literal>Review with the team</ds-text><ds-badge>Next</ds-badge></ds-row>
    <ds-row fill><ds-text literal>Publish</ds-text><ds-badge>Next</ds-badge></ds-row>
  </ds-list>
</ds-page>`,
    script: sidebarScript,
  },
  split: {
    name: 'List and detail',
    use: 'Many things of one kind: pick one from the list and read it in full beside it.',
    height: 420,
    html: `<ds-page layout="split" divided fill>
  <div slot="nav">
    <ds-input aria-label="Search messages" type="search" placeholder="Search"></ds-input>
    <ds-gap unit></ds-gap>
    <ds-list>
      <ds-row fill><ds-row><ds-avatar initial="M" color="#f5aad1"></ds-avatar><ds-text literal strong>Mika</ds-text></ds-row><ds-text literal tone="muted">09:41</ds-text></ds-row>
      <ds-row fill><ds-row><ds-avatar initial="J" color="#99ff73"></ds-avatar><ds-text literal>Jonas</ds-text></ds-row><ds-text literal tone="muted">Yesterday</ds-text></ds-row>
      <ds-row fill><ds-row><ds-avatar initial="S" color="#fec20d"></ds-avatar><ds-text literal>Sara</ds-text></ds-row><ds-text literal tone="muted">Monday</ds-text></ds-row>
      <ds-row fill><ds-row><ds-avatar initial="A" color="#ccccff"></ds-avatar><ds-text literal>Ari</ds-text></ds-row><ds-text literal tone="muted">2 Oct</ds-text></ds-row>
    </ds-list>
  </div>
  <ds-row slot="header" fill>
    <ds-text literal strong>New photos from the shoot</ds-text>
    <ds-button split actions aria-label="Message" options="reply:Reply,archive:Archive"></ds-button>
  </ds-row>
  <ds-row>
    <ds-avatar-group aria-label="Mika and you">
      <ds-avatar initial="M" color="#f5aad1" outlined></ds-avatar>
      <ds-avatar initial="Y" color="#99ff73" outlined></ds-avatar>
    </ds-avatar-group>
    <ds-text literal tone="muted">Mika to you</ds-text>
  </ds-row>
  <ds-gap unit></ds-gap>
  <ds-text literal wrap>The first selection is in the shared folder. I kept the ones with daylight on the table and dropped the dark corners.</ds-text>
  <ds-gap unit></ds-gap>
  <ds-text literal wrap>Pick your three favourites by Friday and I will send them for retouching.</ds-text>
</ds-page>`,
  },
  inspector: {
    name: 'Inspector',
    use: 'Making something: pages on the left, the work in the middle, its settings on the right.',
    height: 460,
    html: `<ds-page layout="inspector" divided fill>
  <ds-sidebar slot="nav" label="Pages"></ds-sidebar>
  <ds-row slot="header" fill>
    <ds-text literal strong>Home page</ds-text>
    <ds-row end><ds-button secondary>Preview</ds-button><ds-button primary>Publish</ds-button></ds-row>
  </ds-row>
  <ds-text literal size="heading" strong>A small reading room</ds-text>
  <ds-gap unit></ds-gap>
  <ds-text literal wrap>A quiet space starts with a few things: daylight, a place to sit and something worth reading. This page shows what a visitor sees first.</ds-text>
  <ds-gap unit></ds-gap>
  <ds-text literal wrap>Change the words here and the settings beside them. Nothing is saved in this example.</ds-text>
  <ds-form slot="aside">
    <ds-text literal strong>Page</ds-text>
    <ds-input label="Address" name="slug" value="/reading-room"></ds-input>
    <ds-row fill><ds-text literal>Status</ds-text><ds-select><select aria-label="Status"><option>Draft</option><option>Published</option></select></ds-select></ds-row>
    <ds-row fill><ds-text literal>Show in menu</ds-text><ds-switch rounded><button type="button" role="switch" aria-label="Show in menu" aria-checked="true"></button></ds-switch></ds-row>
    <ds-row fill><ds-text literal>Language</ds-text><ds-cycle type="language" compact></ds-cycle></ds-row>
  </ds-form>
</ds-page>`,
    script: `const sidebar = document.querySelector('ds-sidebar');
let selected = 'home';
function render() {
  sidebar.items = ['Home', 'About', 'Visit', 'Events'].map(label => ({ id: label.toLowerCase(), label, current: selected === label.toLowerCase() }));
}
sidebar.addEventListener('sidebar-activate', event => { selected = event.detail.id; render(); });
render();
document.querySelectorAll('ds-switch button').forEach(button => button.addEventListener('click', () => {
  button.setAttribute('aria-checked', String(button.getAttribute('aria-checked') !== 'true'));
}));`,
  },
  column: {
    name: 'Column',
    use: 'Something read or filled in from top to bottom: settings, an article, a long form.',
    height: 500,
    html: `<ds-page layout="column" fill>
  <div slot="header">
    <ds-row><ds-text literal strong>Settings</ds-text></ds-row>
    <ds-row><ds-text literal tone="muted">Changes apply to this device until you save them.</ds-text></ds-row>
  </div>
  <ds-list>
    <ds-row fill><ds-text literal>Notifications</ds-text><ds-switch rounded><button type="button" role="switch" aria-label="Notifications" aria-checked="true"></button></ds-switch></ds-row>
    <ds-row fill><ds-text literal>Weekly summary</ds-text><ds-switch rounded><button type="button" role="switch" aria-label="Weekly summary" aria-checked="false"></button></ds-switch></ds-row>
    <ds-row fill><ds-text literal>Theme</ds-text><ds-cycle type="theme"></ds-cycle></ds-row>
    <ds-row fill><ds-text literal>Language</ds-text><ds-cycle type="language" compact></ds-cycle></ds-row>
    <ds-row fill><ds-text literal>Week starts on</ds-text><ds-select><select aria-label="Week starts on"><option>Monday</option><option>Sunday</option></select></ds-select></ds-row>
  </ds-list>
  <ds-gap unit></ds-gap>
  <ds-accordion summary="Delete your account">
    <div slot="details"><ds-text literal wrap>Your items stay on this device for 30 days, then they are removed.</ds-text></div>
  </ds-accordion>
  <ds-row slot="footer" end>
    <ds-button secondary>Cancel</ds-button>
    <ds-button primary>Save changes</ds-button>
  </ds-row>
</ds-page>`,
    script: `document.querySelectorAll('ds-switch button').forEach(button => button.addEventListener('click', () => {
  button.setAttribute('aria-checked', String(button.getAttribute('aria-checked') !== 'true'));
}));`,
  },
  centered: {
    name: 'Centred',
    use: 'One task and nothing else on the screen: signing in, confirming, a single question.',
    height: 380,
    html: `<ds-page layout="centered" fill>
  <ds-row slot="header"><ds-text literal strong>Sign in</ds-text></ds-row>
  <ds-form>
    <ds-input label="Email" type="email" name="email" autocomplete="email" placeholder="you@example.com" required></ds-input>
    <ds-button primary>Send me a code</ds-button>
  </ds-form>
  <ds-text literal slot="footer" wrap tone="muted">We email you a six-digit code. This example sends nothing.</ds-text>
</ds-page>`,
    script: `const form = document.querySelector('ds-form');
const note = document.querySelector('ds-text[slot="footer"]');
form.querySelector('ds-button').addEventListener('click', () => form.submit());
form.addEventListener('form-submit', event => {
  note.text = 'A code would go to ' + event.detail.data.email + '. Nothing was sent.';
});
form.addEventListener('form-invalid', () => { note.text = 'Enter your email address to get a code.'; });`,
  },
  tiles: {
    name: 'Tiles',
    use: 'An overview of many numbers at once: each tile is twelve squares wide and the row fills up.',
    height: 560,
    html: `<ds-page layout="tiles" fill>
  <ds-row slot="header" fill>
    <ds-text literal strong>This week</ds-text>
    <ds-button split aria-label="Period" options="day:Day,week:Week,month:Month" value="week"></ds-button>
  </ds-row>
  <section data-tile="wide">
    <ds-row fill><ds-text literal>Visitors</ds-text><ds-text literal strong>2,480</ds-text></ds-row>
    <ds-chart kind="area" rows="6" aria-label="Visitors over two weeks, rising from 12 to 24 a day"></ds-chart>
  </section>
  <section>
    <ds-row fill><ds-text literal>Sign-ups</ds-text><ds-text literal strong>124</ds-text></ds-row>
    <ds-spark aria-label="Sign-ups rising over two weeks"></ds-spark>
    <ds-gap unit></ds-gap>
    <ds-row fill><ds-text literal>Returning</ds-text><ds-text literal strong>65%</ds-text></ds-row>
    <ds-ratio aria-label="65 percent returning, 35 percent new"></ds-ratio>
  </section>
  <section>
    <ds-row fill><ds-text literal>By day</ds-text><ds-badge>Sample</ds-badge></ds-row>
    <ds-bars rows="5" aria-label="Monday 12, Tuesday 20, Wednesday 15, Thursday 18, Friday 24"></ds-bars>
  </section>
  <section data-tile="wide">
    <ds-row><ds-text literal>Projects</ds-text></ds-row>
    <ds-table></ds-table>
  </section>
</ds-page>`,
    script: chartScript,
  },
};
