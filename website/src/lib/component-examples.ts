import { mountChartExample } from './chart-example';
export interface ComponentExample {
  title: string;
  hint: string;
  html: string;
  script?: string;
  height?: number;
}

export const TABLE_DATA = [
  { product: "Atlas", users: 120, retention: "92%", status: "Active" },
  { product: "Harbor", users: 80, retention: "88%", status: "Active" },
  { product: "Meadow", users: 64, retention: "79%", status: "Paused" },
];
export const TABLE_FOOTER = { product: "Total", users: 264 };

/** The matrix example's items: two headed columns and an item further down. */
export const MATRIX_ITEMS = [
  { id: 'fruit', title: 'Fruit', column: 0, row: 0, header: true },
  { id: 'apples', title: 'Apples', column: 0, row: 1, starred: true },
  { id: 'pears', title: 'Pears', column: 0, row: 2 },
  { id: 'plums', title: 'Plums', column: 0, row: 3, completed: true },
  { id: 'bakery', title: 'Bakery', column: 1, row: 0, header: true, color: 'var(--ds-zenith-blue)' },
  { id: 'rye', title: 'Rye bread', column: 1, row: 1 },
  { id: 'buns', title: 'Cinnamon buns for Sunday', column: 1, row: 2 },
  { id: 'later', title: 'Later', column: 2, row: 4 },
];

/** The examples' events, in the month being read so a calendar always has some. */
export function calendarEvents(kind: 'month' | 'large') {
  const now = new Date();
  const month = (offset: number) => {
    const at = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}`;
  };
  const m = month(0);
  if (kind === 'large') return [
    { title: 'Identity', start: `${month(-1)}-08`, end: `${m}-06`, color: 'var(--ds-zenith-blue)' },
    { title: 'Website', start: `${m}-02`, end: `${month(1)}-13`, color: 'var(--ds-apple-green)' },
    { title: 'Campaign', start: `${month(1)}-09`, end: `${month(2)}-04`, color: 'var(--ds-pink)' },
    { title: 'Print run', start: `${month(2)}-16`, end: `${month(2)}-20`, color: 'var(--ds-orange)' },
  ];
  return [
    { title: 'Design review', start: `${m}-03`, time: '10:00', color: 'var(--ds-zenith-blue)' },
    { title: 'Launch', start: `${m}-12`, end: `${m}-14`, color: 'var(--ds-apple-green)' },
    { title: 'Dentist', start: `${m}-12`, time: '08:30' },
    { title: 'Dinner', start: `${m}-12`, time: '19:00', color: 'var(--ds-pink)' },
    { title: 'Retreat', start: `${m}-21`, end: `${m}-24`, color: 'var(--ds-orange)' },
    { title: 'Invoices', start: `${m}-27` },
  ];
}

// The preview and the copyable code use the same source. These are local
// examples only; no sample sends a request to a product's backend.
export const EXAMPLES: Record<string, ComponentExample> = {
  toggle: {
    title: 'Turn a setting on or off',
    hint: 'Click or press Space to change the local setting. No settings are saved.',
    height: 180,
    html: `<label style="display:flex;align-items:center;gap:20px">Notifications <ds-toggle><button type="button" role="switch" aria-label="Notifications" aria-checked="true"></button></ds-toggle></label>
<label style="display:flex;align-items:center;gap:20px">Unavailable <ds-toggle><button type="button" role="switch" aria-label="Unavailable" aria-checked="false" disabled></button></ds-toggle></label>`,
    script: `document.querySelectorAll('ds-toggle button').forEach(button => {
  button.addEventListener('click', () => {
    button.setAttribute('aria-checked', String(button.getAttribute('aria-checked') !== 'true'));
  });
});`,
  },
  toast: {
    title: 'Toasts, as in Sonner',
    hint: 'Each button calls toast(). Hover the stack to spread it out and pause it; swipe one down to dismiss it.',
    height: 260,
    html: `<ds-toast position="bottom-right" close-button></ds-toast>
<ds-row>
  <ds-button secondary data-toast="default">Default</ds-button>
  <ds-button secondary data-toast="success">Success</ds-button>
  <ds-button secondary data-toast="error">Error</ds-button>
  <ds-button secondary data-toast="action">Action</ds-button>
  <ds-button secondary data-toast="promise">Promise</ds-button>
</ds-row>`,
    script: `import { toast } from "@0001-labs/design-system-1";

toast("Event created", { description: "Monday at 9:00" });
toast.success("Changes saved");
toast.error("Could not save");
toast("Item archived", { action: { label: "Undo", onClick: () => restore() } });
toast.promise(save(), { loading: "Saving", success: "Saved", error: "Could not save" });`,
  },
  chart: {
    title: 'Chart types on the grid',
    hint: 'The cycle moves through the seven chart types by itself; click it to choose one. Sample values only; move over a series to inspect a point. No live data is loaded.',
    height: 340,
    html: `<style>
  .chart-stage { --ds-grid-color: color-mix(in srgb, var(--text-color) 12%, transparent); position: relative; isolation: isolate; box-sizing: border-box; width: 100%; width: round(down, 100%, 20px); padding: 20px; box-shadow: inset -1px -1px 0 var(--ds-grid-color); }
  .chart-stage > :not(ds-grid) { position: relative; }
  .chart-head { display: flex; justify-content: space-between; align-items: center; height: 20px; }
  .chart-views { height: 160px; margin-block: 20px; }
  .chart-views > [hidden] { display: none; }
  .chart-views > :not([hidden]) { animation: chart-in 240ms cubic-bezier(.2, 0, 0, 1); }
  .chart-views .compact { width: min(100%, 240px); margin-top: 60px; }
  .chart-stage output { display: block; height: 20px; font-size: 10px; color: var(--text-color); }
  @keyframes chart-in { from { opacity: 0; transform: translateY(4px); } }
  @media (prefers-reduced-motion: reduce) { .chart-views > :not([hidden]) { animation: none; } }
</style>
<section class="chart-stage" data-chart-stage aria-label="Chart types">
  <ds-grid contained></ds-grid>
  <div class="chart-head">
    <ds-cycle values='["Line","Area","Baseline","Sparkline","Bars","Ratio","Range"]'></ds-cycle>
    <span data-chart-count aria-hidden="true">1 of 7</span>
  </div>
  <div class="chart-views">
    <div data-chart-view="Line"><ds-chart kind="line" rows="8" grid="none" aria-label="Line: sample values rising from 12 to 27"></ds-chart></div>
    <div data-chart-view="Area" hidden><ds-chart kind="area" rows="8" grid="none" aria-label="Area: sample values rising from 12 to 27"></ds-chart></div>
    <div data-chart-view="Baseline" hidden><ds-chart kind="baseline" rows="8" grid="none" aria-label="Baseline: sample values against a reference of 18"></ds-chart></div>
    <div data-chart-view="Sparkline" hidden><ds-spark class="compact" cols="12" aria-label="Sparkline: a trend from 12 to 27"></ds-spark></div>
    <div data-chart-view="Bars" hidden><ds-bars rows="6" span="2" aria-label="Bars: A 12 against 16 expected, B 20, C 15, D 18, E 24"></ds-bars></div>
    <div data-chart-view="Ratio" hidden><ds-ratio class="compact" aria-label="Ratio: 65 percent to 35 percent"></ds-ratio></div>
    <div data-chart-view="Range" hidden><ds-range class="compact" aria-label="Range: 20 to 80 out of 100, midpoint 50"></ds-range></div>
  </div>
  <output data-chart-status aria-live="polite"></output>
</section>`,
    script: `(${mountChartExample.toString()})(document);`,
  },
  'sidebar': {
    title: 'Compact document navigation', hint: 'Open a section, choose a document, or navigate with the arrow keys.', height: 240,
    html: '<ds-sidebar label="Library"></ds-sidebar>',
    script: `const sidebar = document.querySelector('ds-sidebar');
let expanded = true;
let selected = 'overview';
function render() {
  sidebar.items = [
    { id: 'overview', label: 'Overview', current: selected === 'overview' },
    { id: 'projects', label: 'Projects', expanded, meta: '3' },
    ...(expanded ? [
      { id: 'atlas', label: 'Atlas', depth: 1, current: selected === 'atlas' },
      { id: 'harbor', label: 'Harbor', depth: 1, current: selected === 'harbor' },
      { id: 'studio', label: 'Studio', depth: 1, disabled: true, meta: 'Unavailable' },
    ] : []),
    { id: 'guidelines', label: 'Guidelines', current: selected === 'guidelines' },
  ];
}
sidebar.addEventListener('sidebar-toggle', event => { expanded = event.detail.expanded; render(); });
sidebar.addEventListener('sidebar-activate', event => { selected = event.detail.id; render(); });
render();`,
  },
  'split': {
    title: 'Choices and repeated actions', hint: 'Choose a view or step through the date.',
    html: '<ds-button split aria-label="View" options="day:Day,week:Week,month:Month" value="week"></ds-button>\n<ds-button split actions aria-label="Date" options="back:@left:Back,today:Today,next:@right:Next"></ds-button>',
  },
  'avatar-borderless': {
    title: 'Colour without an outline',
    hint: 'A solid colour, one initial, and no outline. Names sit beside each avatar.',
    html: "<div>\n  <ds-row><ds-avatar initial=\"M\" color=\"#f5aad1\"></ds-avatar><ds-text literal>Mika</ds-text></ds-row>\n  <ds-row><ds-avatar initial=\"J\" color=\"#99ff73\"></ds-avatar><ds-text literal>Jonas</ds-text></ds-row>\n  <ds-row><ds-avatar initial=\"S\" color=\"#fec20d\"></ds-avatar><ds-text literal>Sara</ds-text></ds-row>\n  <ds-row><ds-avatar initial=\"A\" color=\"#ccccff\"></ds-avatar><ds-text literal>Ari</ds-text></ds-row>\n</div>",
  },
  'avatar': {
    title: 'People and workspaces', hint: 'Fill an avatar with a colour, or letter it in an ink on the neutral fill. A square one takes a picture’s corners.',
    html: '<ds-avatar-group aria-label="People">\n  <ds-avatar initial="A" color="#99ff73" outlined></ds-avatar>\n  <ds-avatar initial="J" color="#f5aad1" outlined></ds-avatar>\n  <ds-avatar initial="M" color="#fec20d" outlined></ds-avatar>\n</ds-avatar-group>\n<ds-avatar-group aria-label="People">\n  <ds-avatar initial="E" ink="light-dark(#2e9e1f, #99ff73)" outlined></ds-avatar>\n  <ds-avatar initial="高橋" ink="light-dark(#4b44e6, #b3aeff)" outlined></ds-avatar>\n  <ds-avatar initial="S" pending></ds-avatar>\n</ds-avatar-group>\n<ds-avatar shape="square" initial="S" color="#ccccff" label="Studio"></ds-avatar>\n<ds-avatar shape="square" size="large" initial="S" color="#ccccff" label="Studio"></ds-avatar>',
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
    html: '<ds-text>Welcome to the app</ds-text>\n<ds-text text="Save" strong></ds-text>\n<ds-text tone="danger" wrap>Could not save your changes</ds-text>',
  },
  'date': {
    title: 'The current year', hint: 'The year comes from the browser’s clock.',
    html: '<span>Copyright <ds-date></ds-date> 0001</span>',
  },
  'banner': {
    title: 'A message with an action', hint: 'The banner sits at the top of this isolated preview.',
    html: '<ds-banner text="Your changes are saved" variant="success" action="Browse icons" href="/icons/" ></ds-banner>',
  },
  'banner-dismiss': {
    title: 'An action and a dismiss', hint: 'The action fires ds-banner-action; the close button fires ds-banner-dismiss and hides the banner.',
    html: '<ds-banner text="A new version is ready" variant="info" action="Reload" dismissible></ds-banner>',
  },
  'empty': {
    title: 'Nothing here yet', hint: 'Without a heading, the title is the shared words in the current language.',
    html: '<ds-empty icon="lists" text="Lists you make or are given appear here.">\n  <ds-button slot="actions" primary>New list</ds-button>\n</ds-empty>',
    height: 200,
  },
  'empty-search': {
    title: 'No results, centred', hint: 'A heading and text of the page\'s own, centred in the space they stand in.',
    html: '<ds-empty icon="search" heading="No results" text="Try another word, or clear the search." literal centered>\n  <ds-button slot="actions" secondary>Clear the search</ds-button>\n</ds-empty>',
    height: 200,
  },
  'kbd': {
    title: 'Shortcut hints', hint: 'Written as your platform writes them: symbols on a Mac, iPhone or iPad, words elsewhere.',
    html: '<p class="ds-text"><ds-kbd shortcut="mod+k"></ds-kbd> Search</p>\n<p class="ds-text"><ds-kbd shortcut="mod+shift+d"></ds-kbd> Duplicate</p>\n<p class="ds-text"><ds-kbd shortcut="alt+arrowup"></ds-kbd> Move up</p>\n<p class="ds-text">Close <ds-kbd shortcut="escape" plain></ds-kbd></p>',
    height: 120,
  },
  'header': {
    title: 'A site header', hint: 'Make the preview narrower than thirty squares to fold the links into the drawer: Escape, the close button or a link closes it.',
    height: 140,
    html: `<ds-header brand="Studio" literal style="flex-basis:100%">
  <a href="#work" aria-current="page">Work</a>
  <a href="#about">About</a>
  <a href="#contact">Contact</a>
  <ds-button slot="actions" primary>Get in touch</ds-button>
</ds-header>`,
  },
  'footer': {
    title: 'A site footer', hint: 'The cycles change this preview\'s language and theme. Columns that do not fit go under the brand.',
    height: 260,
    html: `<ds-footer brand="Studio" tagline="Tools for working on the grid" literal preferences year="2026" style="flex-basis:100%"
  columns='[{"heading":"Product","links":[{"label":"Download","href":"#download"},{"label":"Help","href":"#help"}]},{"heading":"Company","links":[{"label":"About","href":"#about"},{"label":"Terms","href":"#terms"}]}]'>
</ds-footer>`,
  },
  'document': {
    title: 'A legal notice', hint: 'The contents are built from the headings; the section in view is marked as you scroll.',
    height: 420,
    html: `<ds-document style="flex-basis:100%">
  <h1>Terms</h1>
  <p>These terms apply when you use the service.</p>
  <h2>Using the service</h2>
  <p>Keep your account to yourself, and tell us if someone else uses it.</p>
  <h2>特定商取引法に基づく表記</h2>
  <dl class="ds-definitions" lang="ja">
    <dt>販売業者</dt><dd>Studio</dd>
    <dt>販売価格</dt><dd>各商品ページに表示します。</dd>
    <dt>お問い合わせ</dt><dd><a href="mailto:hello@example.com">hello@example.com</a></dd>
  </dl>
  <h2>Changes</h2>
  <p>When these terms change, the new ones apply from the date at the top.</p>
</ds-document>`,
  },
  'notice': {
    title: 'Four tones', hint: 'Danger is an alert, the others a status. The close button fires ds-notice-dismiss and hides the notice.',
    html: `<ds-notice text="Changes from an earlier session are stored on this device." literal></ds-notice>
<ds-notice tone="success" text="Your changes are saved." literal></ds-notice>
<ds-notice tone="warning" heading="This list was edited somewhere else" text="Your changes are safe on this device." literal>
  <ds-button slot="actions" secondary>Keep mine</ds-button>
  <ds-button slot="actions" secondary>Load theirs</ds-button>
</ds-notice>
<ds-notice tone="danger" heading="Couldn't save" text="Check your connection and try again." literal dismissible>
  <ds-button slot="actions" secondary>Try again</ds-button>
</ds-notice>`,
    height: 340,
  },
  'pagedots': {
    title: 'Where you are, and where you can go', hint: 'Click a dot, or focus one and use the arrow keys, Home and End. Each pick fires select.',
    html: `<ds-pagedots count="6" active="2"></ds-pagedots>
<ds-pagedots count="4" active="0" end></ds-pagedots>`,
    height: 140,
  },
  'calendar': {
    title: 'A month, four squares a day', hint: 'Press a day to select it, or move with the arrow keys and Page Up and Page Down. The third event on a day folds into +2; press it to unfold them.',
    html: `<ds-calendar selectable week-numbers></ds-calendar>`,
    script: `const calendar = document.querySelector('ds-calendar');
calendar.events = [
  { title: 'Design review', start: '2026-10-03', time: '10:00', color: 'var(--ds-zenith-blue)' },
  { title: 'Launch', start: '2026-10-12', end: '2026-10-14', color: 'var(--ds-apple-green)' },
  { title: 'Dentist', start: '2026-10-12', time: '08:30' },
  { title: 'Dinner', start: '2026-10-12', time: '19:00', color: 'var(--ds-pink)' },
];
calendar.addEventListener('change', event => console.log(event.detail.value));`,
    height: 620,
  },
  'calendar-compact': {
    title: 'A small month, one square a day', hint: 'compact draws the month a date picker opens. With events, the days that have one keep the ink.',
    html: `<ds-calendar compact selectable fixed></ds-calendar>`,
    height: 280,
  },
  'calendar-large': {
    title: 'Months in squares', hint: 'Weeks run sideways and the days down them. Scroll, or use the arrows and Today; a day several things share is split into bands.',
    html: `<ds-calendar-large months="6" selectable></ds-calendar-large>`,
    script: `const calendar = document.querySelector('ds-calendar-large');
calendar.events = [
  { title: 'Identity', start: '2026-09-08', end: '2026-10-06', color: 'var(--ds-zenith-blue)' },
  { title: 'Website', start: '2026-10-02', end: '2026-11-13', color: 'var(--ds-apple-green)' },
  { title: 'Campaign', start: '2026-11-09', end: '2026-12-04', color: 'var(--ds-pink)' },
];`,
    height: 420,
  },
  'date-picker': {
    title: 'Pick a date from a drop-down', hint: 'Open it with a click, Enter or the down arrow; the arrow keys move between days, Enter chooses one and Escape closes it.',
    html: `<div style="display:flex;flex-wrap:wrap;gap:var(--ds-unit)">
  <ds-date-picker label="Due" literal name="due"></ds-date-picker>
  <ds-date-picker label="Starts" literal name="starts" value="2026-10-18" length="long"></ds-date-picker>
</div>`,
    height: 420,
  },
  'matrix': {
    title: 'Items on whole squares', hint: 'Drag an item to another square, or focus one and press Alt with an arrow; it swaps with what is there. Shift-click selects several. Pressing a free square fires cell-press.',
    html: `<ds-matrix label="Groceries" literal rows="6"></ds-matrix>`,
    script: `const matrix = document.querySelector('ds-matrix');
matrix.items = [
  { id: 'fruit', title: 'Fruit', column: 0, row: 0, header: true },
  { id: 'apples', title: 'Apples', column: 0, row: 1, starred: true },
  { id: 'pears', title: 'Pears', column: 0, row: 2 },
  { id: 'plums', title: 'Plums', column: 0, row: 3, completed: true },
  { id: 'bakery', title: 'Bakery', column: 1, row: 0, header: true, color: 'var(--ds-zenith-blue)' },
  { id: 'rye', title: 'Rye bread', column: 1, row: 1 },
];
matrix.addEventListener('move', event => console.log(event.detail.moves));`,
    height: 260,
  },
  'carousel': {
    title: 'Slides twelve squares wide', hint: 'Swipe or scroll sideways, or use the buttons and the dots. Moving to another slide fires change.',
    html: `<ds-carousel label="Colours" literal slide-width="12" buttons>
  <figure style="margin:0;height:calc(var(--ds-unit) * 8);background:var(--ds-apple-green)"></figure>
  <figure style="margin:0;height:calc(var(--ds-unit) * 8);background:var(--ds-zenith-blue)"></figure>
  <figure style="margin:0;height:calc(var(--ds-unit) * 8);background:var(--ds-pink)"></figure>
  <figure style="margin:0;height:calc(var(--ds-unit) * 8);background:var(--ds-orange)"></figure>
</ds-carousel>`,
    height: 300,
  },
  'carousel-full': {
    title: 'One slide at a time', hint: 'Without a slide width each slide is the carousel\'s own width. The last dot marks an end.',
    html: `<ds-carousel label="What people say" literal end>
  <blockquote style="margin:0;height:calc(var(--ds-unit) * 4)">It reads the way I think.</blockquote>
  <blockquote style="margin:0;height:calc(var(--ds-unit) * 4)">Everything lines up, on every screen.</blockquote>
  <blockquote style="margin:0;height:calc(var(--ds-unit) * 4)">The keyboard reaches every slide.</blockquote>
</ds-carousel>`,
    height: 200,
  },
  'stat': {
    title: 'Figures in the language', hint: 'Money, a change with its sign and a meter between figure and caption. The group stands on columns of eight squares.',
    html: `<div class="ds-stats">
  <ds-stat label="Members" value="12840" literal></ds-stat>
  <ds-stat label="Revenue" value="1234.5" format="money" currency="EUR" change="0.12" change-format="percent" caption="Since last month" literal></ds-stat>
  <ds-stat label="Over budget" value="18200" format="money" currency="JPY" tone="danger" literal>
    <ds-meter label="Spent" value="118200" max="100000" format="money" currency="JPY" literal></ds-meter>
    <span slot="caption">Of ¥100,000 planned</span>
  </ds-stat>
</div>`,
    height: 220,
  },
  'meter': {
    title: 'A bar, squares and over', hint: 'The words say the value and when it is past the end: 12 of 10, over by 2.',
    html: `<ds-meter label="Spent" value="7400" max="10000" literal></ds-meter>
<ds-meter label="Seats" value="7" max="10" squares="10" literal></ds-meter>
<ds-meter label="Tickets" value="12" max="10" squares="10" literal></ds-meter>`,
    height: 120,
  },
  'steps': {
    title: 'Where someone is', hint: 'The current step is aria-current="step"; done steps say so in hidden words. The vertical sequence has room under each step.',
    html: `<ds-steps current="2" label="Getting started" steps='["Apply", "Approval", "Connect payouts", "Start earning"]' literal></ds-steps>
<ds-steps vertical current="3" steps='["Apply", "Approval", "Connect payouts", "Start earning"]' literal>
  <ds-text slot="step-3" literal tone="muted">Connect a payout account to get paid.</ds-text>
</ds-steps>`,
    height: 200,
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
  'row-pressable': {
    title: 'Rows a person presses', hint: 'Press a row, or its own action at the end. The event appears below.', height: 220,
    html: `<ds-list style="width:calc(12 * var(--ds-unit))">
  <ds-row href="#atlas"><ds-text literal>Atlas</ds-text><ds-text tone="muted" literal style="margin-inline-start:auto">12 items</ds-text></ds-row>
  <ds-row interactive><ds-text literal>Harbor</ds-text><ds-text tone="muted" literal style="margin-inline-start:auto">4 items</ds-text>
    <ds-button slot="end" label="Add to Harbor"><ds-icon type="plus"></ds-icon></ds-button></ds-row>
  <ds-row interactive disabled><ds-text literal>Meadow</ds-text></ds-row>
</ds-list>
<ds-row interactive stacked style="width:calc(4 * var(--ds-unit))"><ds-text size="small" tone="muted" literal>Cash</ds-text><ds-text literal>¥1,200</ds-text></ds-row>`,
    script: `document.addEventListener('ds-row-press', event => {
  event.preventDefault();
  document.querySelector('#event-output').textContent = 'Pressed: ' + event.target.querySelector('ds-text').textContent;
});`,
  },
  'row-nav': {
    title: 'Navigation rows', hint: 'The page being shown is the current row. Choose another.', height: 160,
    html: `<nav aria-label="Account" style="width:calc(12 * var(--ds-unit))">
  <ds-row href="#profile" nav current><ds-text literal>Profile</ds-text></ds-row>
  <ds-row href="#billing" nav><ds-text literal>Billing</ds-text></ds-row>
  <ds-row href="#members" nav><ds-text literal>Members</ds-text></ds-row>
</nav>`,
    script: `const rows = document.querySelectorAll('nav ds-row');
document.addEventListener('ds-row-press', event => {
  event.preventDefault();
  rows.forEach(row => { row.current = row === event.target ? 'page' : null; });
});`,
  },
  'tree': {
    title: 'Folders and files', hint: 'Open a folder, choose a file, or move with the arrow keys. Enter or a double click opens a file.', height: 220,
    html: '<ds-tree label="Files" style="width:calc(12 * var(--ds-unit))"></ds-tree>',
    script: `const tree = document.querySelector('ds-tree');
const files = [
  { id: 'projects', label: 'Projects', icon: 'folder', children: [
    { id: 'atlas', label: 'Atlas', icon: 'folder', children: [{ id: 'intro', label: 'intro.mp4', icon: 'video', meta: '12 MB' }, { id: 'notes', label: 'notes.md', icon: 'page', meta: '2 KB' }] },
    { id: 'harbor', label: 'Harbor', icon: 'folder', children: [{ id: 'plan', label: 'plan.pdf', icon: 'pdf', meta: '340 KB' }] },
  ] },
  { id: 'trash', label: 'Trash', icon: 'delete', children: [] },
];
const open = new Set(['projects', 'atlas']);
let selected = 'notes';
function rows(nodes, depth = 0) {
  return nodes.flatMap(node => [
    { id: node.id, label: node.label, icon: node.icon, meta: node.meta, depth, selected: node.id === selected,
      expanded: node.children ? open.has(node.id) : undefined },
    ...(node.children && open.has(node.id) ? rows(node.children, depth + 1) : []),
  ]);
}
function render() { tree.items = rows(files); }
tree.addEventListener('ds-tree-toggle', event => { event.detail.expanded ? open.add(event.detail.id) : open.delete(event.detail.id); render(); });
tree.addEventListener('ds-tree-select', event => { selected = event.detail.id; render(); });
tree.addEventListener('ds-tree-activate', event => { document.querySelector('#event-output').textContent = 'Opened ' + event.detail.id; });
render();`,
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
    title: 'A table with data', hint: 'Rows and the totals are assigned in JavaScript; the headers come from the keys.',
    html: '<ds-table label="Products"></ds-table>',
    script: `const table = document.querySelector("ds-table");\ntable.data = ${JSON.stringify(TABLE_DATA, null, 2)};\ntable.footer = ${JSON.stringify(TABLE_FOOTER)};`,
    height: 240,
  },
  'container': {
    title: 'A responsive container', hint: 'The container follows the available width and stacks its content.',
    html: '<ds-container>\n  <ds-text>First line</ds-text>\n  <ds-text>Second line</ds-text>\n  <ds-button primary>Continue</ds-button>\n</ds-container>',
    height: 200,
  },
  'grid': {
    title: 'Patterns and paper', hint: 'Change the ruling, spacing, ink and paper. The content stays in place.',
    html: `<div class="grid-controls">
  <label>Pattern <ds-select><select data-grid-option="pattern"><option value="grid">Squares</option><option value="lines">Lines</option><option value="columns">Columns</option><option value="dots">Dots</option><option value="none">Plain</option></select></ds-select></label>
  <label>Spacing <ds-select><select data-grid-option="size"><option value="10">10px</option><option value="20" selected>20px</option><option value="40">40px</option></select></ds-select></label>
  <label>Rows <ds-select><select data-grid-option="row-size"><option value="">Square</option><option value="30">30px</option><option value="40">40px</option></select></ds-select></label>
  <label>Ink <ds-select><select data-grid-option="color"><option value="">Neutral</option><option value="var(--ds-sharp-blue)">Blue</option><option value="var(--ds-apple-green)">Green</option><option value="var(--ds-pink)">Pink</option></select></ds-select></label>
  <label>Paper <ds-select><select data-grid-option="paper"><option value="">Clear</option><option value="color-mix(in srgb, var(--ds-sharp-blue) 12%, var(--background))">Blue</option><option value="color-mix(in srgb, var(--ds-apple-green) 12%, var(--background))">Green</option><option value="color-mix(in srgb, var(--ds-pink) 12%, var(--background))">Pink</option></select></ds-select></label>
</div>
<div style="position: relative; isolation: isolate; width: 100%; min-height: calc(160px * var(--ds-sf, 1));">
  <ds-grid contained></ds-grid>
  <div style="position: relative; padding: calc(20px * var(--ds-sf, 1));"><ds-text>Words stay on the paper.</ds-text></div>
</div>`,
    script: `const grid = document.querySelector('ds-grid');
document.querySelectorAll('[data-grid-option]').forEach(control => {
  control.addEventListener('change', () => {
    const attribute = control.dataset.gridOption;
    if (control.value) grid.setAttribute(attribute, control.value);
    else grid.removeAttribute(attribute);
  });
});`,
    height: 360,
  },
  'layout': {
    title: 'Named page areas', hint: 'The company layout places content in named CSS grid areas.',
    html: '<ds-layout mode="company" view>\n  <ds-text style="grid-area: header">Page header</ds-text>\n  <ds-text style="grid-area: content">Content on the grid</ds-text>\n  <ds-text style="grid-area: footer">Page footer</ds-text>\n</ds-layout>',
    height: 460,
  },
  'page': {
    title: 'A standard page', hint: 'The sidebar layout: navigation on the left, a header and the work on the right. Every area is named.',
    html: '<ds-page layout="sidebar" divided view>\n  <ds-list slot="nav">\n    <ds-row><ds-text>Inbox</ds-text></ds-row>\n    <ds-row><ds-text>Projects</ds-text></ds-row>\n  </ds-list>\n  <ds-row slot="header" fill>\n    <ds-text literal strong>Projects</ds-text>\n    <ds-button primary>New item</ds-button>\n  </ds-row>\n  <ds-list>\n    <ds-row fill><ds-text>Write the brief</ds-text><ds-badge>Done</ds-badge></ds-row>\n    <ds-row fill><ds-text>Sketch the home page</ds-text><ds-badge>Next</ds-badge></ds-row>\n  </ds-list>\n</ds-page>',
    height: 200,
  },
};

export const PAGE_EXAMPLES: Record<string, string[]> = {
  '2-core/toggle': ['toggle'],
  '2-core/toast': ['toast'],
  '2-core/chart': ['chart'],
  '2-core/avatar': ['avatar-borderless', 'avatar'],
  '2-core/button': ['button', 'button-icon', 'split'],
  '2-core/tooltip': ['tooltip', 'tooltip-fallback'],
  '2-core/icon': ['icon', 'icon-variants'],
  '2-core/input': ['input', 'input-states'],
  '2-core/text': ['text'], '2-core/date': ['date'],
  '2-core/banner': ['banner', 'banner-dismiss'], '2-core/card': ['card'],
  '2-core/empty': ['empty', 'empty-search'], '2-core/notice': ['notice'], '2-core/kbd': ['kbd'], '2-core/pagedots': ['pagedots'],
  '2-core/stat': ['stat'], '2-core/meter': ['meter'], '2-core/steps': ['steps'],
  '2-core/cycle': ['cycle'], '2-core/language': ['language'],
  '2-core/gap': ['gap'],
  '3-unit/row': ['row', 'row-centered'], '3-unit/list': ['list'],
  '3-unit/accordion': ['accordion'], '3-unit/form': ['form'], '3-unit/carousel': ['carousel', 'carousel-full'],
  '3-unit/calendar': ['calendar', 'calendar-compact', 'calendar-large'], '3-unit/date-picker': ['date-picker'], '3-unit/matrix': ['matrix'],
  '3-unit/table': ['table'],
  '4-page/container': ['container'], '4-page/grid': ['grid'],
  '4-page/layout': ['layout', 'page'], '4-page/layouts': ['page'],
  '4-page/header': ['header'], '4-page/footer': ['footer'], '4-page/document': ['document'],
};
