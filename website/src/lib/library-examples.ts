import type { LayoutExample } from './layout-examples';
import { choices, choose, heading, icon, library, photo, text } from './library-example-parts';

// Four apps, each drawn by a published design library (library-example-parts.ts).

// Composition only: every colour, face, corner and measure comes from DS1 and the library.
const composition = `<style>
.lib-stack { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--ds-unit); min-width:0; align-content:start; }
.lib-tight { display:grid; grid-template-columns:minmax(0,1fr); gap:calc(var(--ds-unit) / 2); min-width:0; align-content:start; }
.lib-actions { display:flex; flex-wrap:wrap; align-items:flex-end; gap:calc(var(--ds-unit) / 2); }
.lib-between { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:var(--ds-unit); }
.lib-grow { flex:1; min-width:0; }
.lib-rule { border-top:1px solid var(--ds-border-color); padding-top:var(--ds-unit); }
.lib-three { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--ds-unit); }
.lib-two { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:calc(2 * var(--ds-unit)); align-items:start; }
.lib-hero { display:grid; grid-template-columns:1fr 1fr; gap:calc(2 * var(--ds-unit)); align-items:stretch; }
.lib-hero-copy { display:flex; flex-direction:column; justify-content:space-between; gap:calc(2 * var(--ds-unit)); padding-block:var(--ds-unit); }
.lib-title { --ds-sf:calc(1.5 * var(--sf, 1)); --ds-display-text-size:32px; }
.lib-copy { max-width:calc(24 * var(--ds-unit)); }
.lib-caption { display:flex; justify-content:space-between; gap:var(--ds-unit); }
.lib-caption > * { min-width:0; }
.lib-nav { display:flex; justify-content:space-between; align-items:flex-end; gap:var(--ds-unit); }
.lib-workspace { --ds-page-nav:calc(10 * var(--ds-unit)); --ds-page-gap:calc(2 * var(--ds-unit)); }
.lib-workspace-nav { display:grid; grid-template-columns:minmax(0,1fr); gap:calc(2 * var(--ds-unit)); align-content:start; min-width:0; }
.lib-booking { display:flex; flex-wrap:wrap; align-items:flex-end; gap:calc(var(--ds-unit) / 2); }
.lib-stay { display:grid; grid-template-columns:minmax(0,1fr); gap:calc(var(--ds-unit) / 2); min-width:0; }
.lib-menu { display:grid; grid-template-columns:minmax(0,3fr) minmax(0,2fr); gap:calc(2 * var(--ds-unit)); align-items:start; }
.lib-dish { box-sizing:border-box; display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:var(--ds-unit); align-items:end; min-height:calc(2 * var(--ds-unit)); padding-bottom:calc(var(--ds-unit) / 2 - 1px); border-bottom:1px solid var(--ds-border-color); }
.lib-order { --ds-progress-track:var(--ds-paper); display:grid; gap:var(--ds-unit); padding:var(--ds-unit); background:var(--ds-fill); border-radius:var(--ds-radius-card); }
.lib-line { display:flex; justify-content:space-between; align-items:flex-end; gap:var(--ds-unit); min-height:var(--ds-unit); line-height:calc(16px * var(--sf, 1)); }
.lib-status:empty { display:none; }
.lib-week { display:grid; grid-template-columns:minmax(0,2fr) minmax(calc(14 * var(--ds-unit)),1fr); gap:calc(2 * var(--ds-unit)); align-items:start; }
.lib-services { display:grid; gap:0; }
.lib-service { display:grid; grid-template-columns:minmax(0,1fr) calc(6 * var(--ds-unit)) auto; gap:var(--ds-unit); align-items:end; min-height:var(--ds-unit); padding-block:calc(var(--ds-unit) / 2) calc(var(--ds-unit) / 2 - 1px); border-bottom:1px solid var(--ds-border-color); line-height:calc(16px * var(--sf, 1)); }
.lib-service ds-spark { height:var(--ds-unit); }
.lib-stack [hidden], .lib-three [hidden], .lib-tight [hidden] { display:none!important; }
@media(max-width:900px) { .lib-title { --ds-sf:var(--sf, 1); --ds-display-text-size:30px; } .lib-menu, .lib-week { grid-template-columns:minmax(0,1fr); } }
@media(max-width:600px) {
 .lib-hero, .lib-two { grid-template-columns:1fr; gap:var(--ds-unit); }
 .lib-hero-copy { padding-block:0; gap:var(--ds-unit); }
 .lib-three { grid-template-columns:repeat(2,minmax(0,1fr)); }
 .lib-three > :first-child { grid-column:1 / -1; }
 .lib-nav .lib-nav-secondary { display:none; }
 .lib-service { grid-template-columns:minmax(0,1fr) auto; }
 .lib-service ds-spark { display:none; }
}
</style>`;
const title = (words: string) => text(words, 'size="display" class="lib-title" wrap role="heading" aria-level="1"');
const footer = (name: string) => `<div slot="footer" class="lib-rule">${text(`Fictional demo, drawn by the ${name} library. Your changes stay here.`, 'size="small" tone="muted" wrap')}</div>`;

export const LIBRARY_EXAMPLES: Record<string, LayoutExample> = {
  travel: {
    name: 'Travel stays', use: 'A lakeside booking site in the Lagoon library: Hysteric blue water, Sharp blue and pill-shaped controls.', height: 860,
    library: library('lagoon'),
    html: `${composition}<ds-page layout="column" measure="52" data-ds-surface>
      <div slot="header" class="lib-nav">${text('Stillwater', 'strong size="display"')}<div class="lib-actions"><ds-button href="#stays" class="lib-nav-secondary">Stays</ds-button><ds-button href="#how" class="lib-nav-secondary">How it works</ds-button><ds-button id="saved" secondary>${icon('star')} Saved · 0</ds-button></div></div>
      <div class="lib-stack">
        <section class="lib-hero">
          <div class="lib-hero-copy"><div class="lib-tight">${text('Cabins on the water, open all year', 'size="small" tone="muted" wrap')}${title('Slow mornings by still water.')}</div>
            <div class="lib-stack lib-copy"><div data-ds-prose><p>Twelve small cabins on three quiet lakes. A boat at the jetty, a stove for the evening, nowhere to be.</p></div>
              <div class="lib-booking"><ds-calendar picker id="trip-dates" label="Dates" literal placeholder="Choose dates" value="2026-11-13/2026-11-16" min="2026-10-20"></ds-calendar><ds-select><select id="guests" aria-label="Guests"><option value="1">1 guest</option><option value="2" selected>2 guests</option><option value="4">4 guests</option></select></ds-select><ds-button id="search" primary>Find a cabin ${icon('right')}</ds-button></div>
              <ds-text id="trip-status" class="lib-status" literal role="status" wrap></ds-text></div></div>
          ${photo('lake.jpg', 'Mountains mirrored in a still lake at dawn', '1', 'loading="eager"')}
        </section>
        <div class="lib-three"><ds-stat figure="12 cabins" label="On three lakes" caption="Each with its own jetty" literal></ds-stat><ds-stat value="140" format="money" currency="EUR" whole label="From, a night" caption="Breakfast basket included" literal></ds-stat><ds-stat figure="4.9 of 5" label="Guests say" caption="From 2,300 stays" literal></ds-stat></div>
        <section id="stays" class="lib-stack lib-rule">
          <div class="lib-between">${heading('Stays for your dates')}${choices('Kind of stay', 'kind', ['All', 'Cabins', 'Boathouses'])}</div>
          <div class="lib-three">
            <article class="lib-stay" data-stay="cabins">${photo('forest.webp', 'A path through pine forest to the cabin', '1')}<div class="lib-caption">${text('Pine cabin', 'strong')}${text('€140')}</div>${text('Sleeps 2 · Wood stove', 'size="small" tone="muted"')}<div class="lib-actions"><ds-tag>Lake view</ds-tag><ds-button secondary data-save="Pine cabin">${icon('star')} Save</ds-button></div></article>
            <article class="lib-stay" data-stay="boathouses">${photo('lake.jpg', 'The boathouse jetty over clear water', '1', 'position="50% 80%"')}<div class="lib-caption">${text('The boathouse', 'strong')}${text('€190')}</div>${text('Sleeps 4 · Rowing boat', 'size="small" tone="muted"')}<div class="lib-actions"><ds-tag>On the water</ds-tag><ds-button secondary data-save="The boathouse">${icon('star')} Save</ds-button></div></article>
            <article class="lib-stay" data-stay="cabins">${photo('room.jpg', 'A cane chair by the cabin window', '1', 'position="50% 75%"')}<div class="lib-caption">${text('Reading cabin', 'strong')}${text('€160')}</div>${text('Sleeps 2 · A shelf of books', 'size="small" tone="muted"')}<div class="lib-actions"><ds-tag>Quiet</ds-tag><ds-button secondary data-save="Reading cabin">${icon('star')} Save</ds-button></div></article>
          </div>
        </section>
        <section id="how" class="lib-two lib-rule"><div>${heading('Arrive, and the lake does the rest.')}</div><div class="lib-stack"><ds-accordion literal summary="How do I get the key?" open>A code arrives the morning you travel. The door opens with it until you leave.</ds-accordion><ds-accordion literal summary="Is there a boat?">Every cabin has a rowing boat, life jackets and a map of the swimming spots.</ds-accordion><ds-accordion literal summary="Can I bring a dog?">Yes, in the pine cabins. Bring its bed; we leave a bowl by the door.</ds-accordion></div></section>
      </div>${footer('Lagoon')}</ds-page>`,
    script: `${choose}
const saved = new Set();
const status = document.querySelector('#trip-status');
document.querySelectorAll('[data-kind]').forEach(button => button.addEventListener('click', () => {
 choose('[data-kind]', button);
 document.querySelectorAll('[data-stay]').forEach(stay => { stay.hidden = button.dataset.kind !== 'all' && stay.dataset.stay !== button.dataset.kind; });
}));
document.querySelectorAll('[data-save]').forEach(button => button.addEventListener('click', () => {
 const name = button.dataset.save;
 if (saved.has(name)) saved.delete(name); else saved.add(name);
 button.toggleAttribute('active', saved.has(name));
 document.querySelector('#saved').lastChild.textContent = ' Saved · ' + saved.size;
 status.textContent = name + (saved.has(name) ? ' saved.' : ' removed from saved.');
}));
document.querySelector('#search').addEventListener('click', () => {
 const [start, end] = (document.querySelector('#trip-dates').value || '').split('/');
 const guests = document.querySelector('#guests').value;
 if (!start) { status.textContent = 'Choose your dates first.'; return; }
 const nights = end ? Math.round((Date.parse(end) - Date.parse(start)) / 86400000) : 1;
 status.textContent = nights + (nights === 1 ? ' night' : ' nights') + ' for ' + guests + (guests === '1' ? ' guest' : ' guests') + ': 3 cabins are free. Nothing is booked in this demo.';
 document.querySelector('#stays').scrollIntoView({ block: 'nearest' });
});`,
  },
  cafe: {
    name: 'Café', use: 'A café\'s order page in the Bloom library: Pink paper, Tuned red and soft corners.', height: 820,
    library: library('bloom'),
    html: `${composition}<ds-page layout="column" measure="48" data-ds-surface>
      <div slot="header" class="lib-nav">${text('Petal', 'strong size="display"')}<div class="lib-actions"><ds-tag class="lib-nav-secondary">Open until 18:00</ds-tag><ds-button id="order-count" secondary>Order · 0</ds-button></div></div>
      <div class="lib-stack">
        <section class="lib-hero">
          <div class="lib-hero-copy"><div class="lib-tight">${text('Coffee, tea and things from the oven', 'size="small" tone="muted" wrap')}${title('Something warm, something sweet.')}</div><div class="lib-stack lib-copy"><div data-ds-prose><p>Order ahead and it waits for you on the counter, still warm, with your name on the cup.</p></div><div><ds-button href="#menu" primary>See today's menu ${icon('down')}</ds-button></div></div></div>
          ${photo('cup.jpg', 'A speckled ceramic cup of coffee', '1', 'loading="eager"')}
        </section>
        <section id="menu" class="lib-menu lib-rule">
          <div class="lib-stack">
            <div class="lib-between">${heading('Today\'s menu')}${choices('Menu', 'course', ['Coffee', 'Tea', 'Baking'])}</div>
            <div id="dishes"></div>
          </div>
          <aside class="lib-order" aria-label="Your order">
            <div class="lib-between">${text('Your order', 'strong')}<ds-button id="clear-order" disabled>Clear</ds-button></div>
            <ds-list id="order-lines"></ds-list>
            <ds-text id="order-empty" literal tone="muted" wrap>Nothing yet. Add something from the menu.</ds-text>
            <div class="lib-line">${text('Total', 'strong')}<ds-text id="order-total" literal strong>€0.00</ds-text></div>
            <ds-button id="place-order" primary disabled>Order for pickup</ds-button>
            <div class="lib-tight lib-rule"><ds-stat id="stamps" figure="7 of 10" label="Stamps" caption="Three more for a free cup" literal></ds-stat><ds-progress id="stamp-progress" value="0.7" label="7 of 10 stamps"></ds-progress></div>
            <ds-text id="cafe-status" class="lib-status" literal role="status" wrap></ds-text>
          </aside>
        </section>
      </div>${footer('Bloom')}</ds-page>`,
    script: `${choose}
const menu = {
 coffee: [['Flat white', 'Double shot, whole milk', 3.6, 'Popular'], ['Filter of the week', 'Washed, from Huila', 3.2], ['Cortado', 'Equal parts', 3.4]],
 tea: [['Rose and hibiscus', 'Caffeine free', 3.4, 'New'], ['Morning black', 'With oat milk', 3.0], ['Mint', 'Fresh leaves', 2.8]],
 baking: [['Cardamom bun', 'Baked at seven', 3.9, 'Warm'], ['Lemon slice', 'Shortbread base', 3.5], ['Rye cookie', 'Brown butter', 2.6]],
};
let course = 'coffee', stamps = 7;
const order = new Map();
const money = value => '€' + value.toFixed(2);
function renderMenu() {
 const list = document.querySelector('#dishes'); list.replaceChildren();
 for (const [name, details, price, tag] of menu[course]) {
  const row = document.createElement('div'); row.className = 'lib-dish';
  const words = document.createElement('div'); words.className = 'lib-tight';
  const label = document.createElement('ds-text'); label.setAttribute('literal', ''); label.setAttribute('strong', ''); label.textContent = name;
  const more = document.createElement('ds-text'); more.setAttribute('literal', ''); more.setAttribute('size', 'small'); more.setAttribute('tone', 'muted'); more.textContent = details;
  const line = document.createElement('div'); line.className = 'lib-actions'; line.append(label);
  if (tag) { const badge = document.createElement('ds-tag'); badge.textContent = tag; line.append(badge); }
  words.append(line, more);
  const cost = document.createElement('ds-text'); cost.setAttribute('literal', ''); cost.textContent = money(price);
  const add = document.createElement('ds-button'); add.setAttribute('secondary', ''); add.setAttribute('label', 'Add ' + name);
  add.innerHTML = '<ds-icon type="plus" aria-hidden="true"></ds-icon> Add';
  add.addEventListener('click', () => { const line = order.get(name) || { price, quantity: 0 }; line.quantity++; order.set(name, line); renderOrder(); document.querySelector('#cafe-status').textContent = name + ' added.'; });
  row.append(words, cost, add); list.append(row);
 }
}
function renderOrder() {
 const list = document.querySelector('#order-lines'); list.replaceChildren();
 let total = 0, count = 0;
 for (const [name, line] of order) {
  total += line.price * line.quantity; count += line.quantity;
  const row = document.createElement('ds-row'); row.setAttribute('fill', '');
  const words = document.createElement('ds-text'); words.setAttribute('literal', ''); words.textContent = line.quantity + ' × ' + name;
  const remove = document.createElement('ds-button'); remove.textContent = 'Remove'; remove.setAttribute('label', 'Remove ' + name);
  remove.addEventListener('click', () => { if (--line.quantity === 0) order.delete(name); renderOrder(); });
  row.append(words, remove); list.append(row);
 }
 document.querySelector('#order-total').textContent = money(total);
 document.querySelector('#order-count').textContent = 'Order · ' + count;
 document.querySelector('#order-empty').hidden = count > 0;
 document.querySelector('#place-order').toggleAttribute('disabled', count === 0);
 document.querySelector('#clear-order').toggleAttribute('disabled', count === 0);
}
document.querySelectorAll('[data-course]').forEach(button => button.addEventListener('click', () => { choose('[data-course]', button); course = button.dataset.course; renderMenu(); }));
document.querySelector('#clear-order').addEventListener('click', () => { order.clear(); renderOrder(); });
document.querySelector('#place-order').addEventListener('click', () => {
 stamps = Math.min(10, stamps + 1);
 document.querySelector('#stamps').figure = stamps + ' of 10';
 document.querySelector('#stamps').caption = stamps === 10 ? 'Your next cup is on us' : (10 - stamps) + ' more for a free cup';
 document.querySelector('#stamp-progress').value = stamps / 10;
 document.querySelector('#cafe-status').textContent = 'Ordered. It will be ready in about eight minutes. Nothing is paid in this demo.';
 order.clear(); renderOrder();
});
renderMenu(); renderOrder();`,
  },
  trails: {
    name: 'Walking log', use: 'A walker\'s week in the Grove library: Comfortable green paper, Metal green and square corners.', height: 820,
    library: library('grove'),
    html: `${composition}<ds-page layout="sidebar" drawer divided fill class="lib-workspace" data-ds-surface>
      <div slot="nav" class="lib-workspace-nav"><ds-row><ds-avatar initial="T" color="var(--one-metal-green-pastel)"></ds-avatar>${text('Trailhead', 'strong')}</ds-row><ds-sidebar label="Walks" id="trail-nav"></ds-sidebar><div class="lib-tight">${text('Next weekend', 'size="small" tone="muted"')}${photo('forest.webp', 'A sunlit trail through a green forest', '4 / 3')}${text('Pine ridge loop', 'strong')}${text('14 km · 420 m of climb', 'size="small" tone="muted"')}</div></div>
      <div slot="header" class="lib-between"><ds-text id="trail-heading" literal strong>This week</ds-text><ds-button id="log-walk" primary>${icon('plus')} Log a walk</ds-button></div>
      <div class="lib-stack">
        <div class="lib-tight">${heading('Good legs this week.', 1)}<ds-text id="trail-summary" literal tone="muted" wrap>Four walks, and your longest climb since the spring.</ds-text></div>
        <div class="lib-three"><ds-stat id="distance" value="42.6" format="number" digits="1" label="Distance, km" caption="7 km more than last week" literal></ds-stat><ds-stat id="climb" value="1180" format="number" label="Climb, m" caption="Mostly on Saturday" literal></ds-stat><ds-stat id="walks" value="4" format="number" label="Walks" caption="Goal: 4 a week" literal></ds-stat></div>
        <section class="lib-week lib-rule">
          <div class="lib-stack"><div class="lib-between">${text('Kilometres a day', 'strong')}${text('13–19 October', 'size="small" tone="muted"')}</div><ds-bars id="days" rows="6" aria-label="Kilometres walked each day this week"></ds-bars></div>
          <div class="lib-stack">${text('Days out in October', 'strong')}<ds-calendar id="heat" compact heat fixed day-width="2" month="2026-10" label="Walks in October" literal></ds-calendar></div>
        </section>
        <section class="lib-stack lib-rule"><div class="lib-between">${heading('Recent walks')}<ds-tag id="walk-count">4 walks</ds-tag></div><ds-table id="walk-table" label="Recent walks"></ds-table></section>
      </div>${footer('Grove')}</ds-page>`,
    script: `const nav = document.querySelector('#trail-nav');
let view = 'week';
const walks = [
 { date: '19 Oct', name: 'River path', km: 8.4, climb: 120, time: '1 h 50', day: 19 },
 { date: '18 Oct', name: 'Pine ridge', km: 16.2, climb: 640, time: '4 h 10', day: 18 },
 { date: '16 Oct', name: 'Birch hollow', km: 9.6, climb: 230, time: '2 h 15', day: 16 },
 { date: '14 Oct', name: 'Lakeshore', km: 8.4, climb: 190, time: '1 h 55', day: 14 },
];
const earlier = [3, 4, 6, 8, 9, 11];
const table = document.querySelector('#walk-table');
table.columns = [{ key: 'date', label: 'Date' }, { key: 'name', label: 'Walk' }, { key: 'km', label: 'km', numeric: true }, { key: 'climb', label: 'Climb, m', numeric: true }, { key: 'time', label: 'Time', numeric: true }];
function render() {
 nav.items = [{ id: 'week', label: 'This week', current: view === 'week' }, { id: 'all', label: 'All walks', meta: String(walks.length + earlier.length), current: view === 'all' }, { id: 'saved', label: 'Saved trails', meta: '3', current: view === 'saved' }];
 document.querySelector('#trail-heading').textContent = view === 'week' ? 'This week' : view === 'all' ? 'All walks' : 'Saved trails';
 table.data = walks.map(walk => ({ ...walk, km: walk.km.toFixed(1) }));
 const km = walks.reduce((sum, walk) => sum + walk.km, 0), climb = walks.reduce((sum, walk) => sum + walk.climb, 0);
 document.querySelector('#distance').value = km; document.querySelector('#climb').value = climb; document.querySelector('#walks').value = walks.length;
 document.querySelector('#walk-count').textContent = walks.length + ' walks';
 const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
 document.querySelector('#days').items = days.map((label, index) => { const value = walks.filter(walk => walk.day === 13 + index).reduce((sum, walk) => sum + walk.km, 0); return { label, value, tone: value >= 10 ? 'up' : undefined }; });
 document.querySelector('#heat').events = [...earlier.map(day => ({ title: 'Walk', start: '2026-10-' + String(day).padStart(2, '0'), count: 1 + (day % 3) })), ...walks.map(walk => ({ title: walk.name, start: '2026-10-' + String(walk.day).padStart(2, '0'), count: Math.ceil(walk.km / 4) }))];
}
nav.addEventListener('sidebar-activate', event => { view = event.detail.id; render(); document.querySelector('ds-page').closeDrawer(); });
document.querySelector('#log-walk').addEventListener('click', () => {
 if (walks.some(walk => walk.day === 20)) return;
 walks.unshift({ date: '20 Oct', name: 'Evening loop', km: 5.2, climb: 80, time: '1 h 05', day: 20 });
 document.querySelector('#trail-summary').textContent = 'Five walks. One more than your goal.';
 render();
});
render();`,
  },
  console: {
    name: 'Deploy console', use: 'A service dashboard in the Signal library: code type throughout, Egg paper and Drip yellow.', height: 820,
    library: library('signal'),
    html: `${composition}<ds-page layout="sidebar" drawer divided fill class="lib-workspace" data-ds-surface>
      <div slot="nav" class="lib-workspace-nav"><ds-row><ds-avatar initial="r" color="var(--one-drip-yellow)"></ds-avatar>${text('relay', 'strong')}</ds-row><ds-sidebar label="Console" id="console-nav"></ds-sidebar><div class="lib-tight">${text('Environment', 'size="small" tone="muted"')}<ds-select><select id="environment" aria-label="Environment"><option value="production">production</option><option value="staging">staging</option></select></ds-select><ds-row fill>${text('Deploy on merge')}<ds-switch><button type="button" role="switch" id="auto-deploy" aria-label="Deploy on merge" aria-checked="true"></button></ds-switch></ds-row></div></div>
      <div slot="header" class="lib-between"><div class="lib-actions">${text('Overview', 'strong')}<ds-tag id="env-tag">production</ds-tag></div><ds-button id="deploy" primary>${icon('up')} Deploy main</ds-button></div>
      <div class="lib-stack">
        <div class="lib-three"><ds-stat value="0.9998" format="percent" digits="2" label="Uptime, 30 days" caption="One short blip on 2 Oct" literal></ds-stat><ds-stat figure="182 ms" label="p95 latency" change="-0.08" change-format="percent" caption="Since last deploy" literal></ds-stat><ds-stat id="error-rate" value="0.0002" format="percent" digits="2" label="Errors" caption="Below the 0.1% budget" literal></ds-stat></div>
        <section class="lib-stack lib-rule"><div class="lib-between">${text('Requests a minute', 'strong')}${text('Last 24 hours', 'size="small" tone="muted"')}</div><ds-chart id="requests" kind="area" rows="8" labels aria-label="Requests a minute over the last day, peaking at midday"></ds-chart></section>
        <section class="lib-two lib-rule">
          <div class="lib-stack">${text('Services', 'strong')}<div class="lib-services" id="services"></div></div>
          <div class="lib-stack"><div class="lib-between">${text('Deploys', 'strong')}<ds-text id="deploy-status" class="lib-status" literal size="small" tone="muted" role="status"></ds-text></div><ds-table id="deploys" label="Recent deploys"></ds-table></div>
        </section>
      </div>${footer('Signal')}</ds-page>`,
    script: `const nav = document.querySelector('#console-nav');
let view = 'overview';
function renderNav() { nav.items = [{ id: 'overview', label: 'Overview', current: view === 'overview' }, { id: 'deploys', label: 'Deploys', meta: '24', current: view === 'deploys' }, { id: 'logs', label: 'Logs', current: view === 'logs' }, { id: 'settings', label: 'Settings', current: view === 'settings' }]; }
nav.addEventListener('sidebar-activate', event => { view = event.detail.id; renderNav(); document.querySelector('ds-page').closeDrawer(); });
renderNav();
const chart = document.querySelector('#requests');
chart.format = value => Math.round(value).toLocaleString('en-GB');
chart.data = Array.from({ length: 48 }, (_, index) => ({ time: index * 1800, value: 900 + 1400 * Math.sin(Math.PI * index / 47) ** 2 + 120 * Math.sin(index * 1.7) }));
const services = [['api', 'healthy', [4, 5, 4, 6, 5, 7, 6, 8]], ['web', 'healthy', [6, 6, 7, 6, 8, 7, 9, 8]], ['worker', 'busy', [3, 5, 8, 6, 9, 11, 10, 12]], ['search', 'healthy', [5, 4, 5, 5, 4, 5, 6, 5]]];
const list = document.querySelector('#services');
for (const [name, state, values] of services) {
 const row = document.createElement('div'); row.className = 'lib-service';
 const label = document.createElement('ds-text'); label.setAttribute('literal', ''); label.textContent = name;
 const spark = document.createElement('ds-spark'); spark.values = values; spark.setAttribute('aria-label', name + ' load over the last hour');
 const tag = document.createElement('ds-tag'); tag.textContent = state;
 row.append(label, spark, tag); list.append(row);
}
const table = document.querySelector('#deploys');
table.columns = [{ key: 'commit', label: 'Commit' }, { key: 'author', label: 'By' }, { key: 'when', label: 'When', numeric: true }];
const deploys = [{ commit: 'a41f9c2', author: 'mika', when: '2 h' }, { commit: '7be03d1', author: 'ren', when: '1 d' }, { commit: 'c9d2e88', author: 'alex', when: '2 d' }];
table.data = deploys;
document.querySelector('#environment').addEventListener('change', event => { document.querySelector('#env-tag').textContent = event.target.value; });
document.querySelector('#auto-deploy').addEventListener('click', event => { const on = event.currentTarget.getAttribute('aria-checked') !== 'true'; event.currentTarget.setAttribute('aria-checked', String(on)); });
const deploy = document.querySelector('#deploy');
deploy.addEventListener('click', () => {
 const status = document.querySelector('#deploy-status');
 deploy.setAttribute('disabled', '');
 status.textContent = 'Building e17a0b4…';
 setTimeout(() => { deploys.unshift({ commit: 'e17a0b4', author: 'you', when: 'now' }); table.data = [...deploys]; status.textContent = 'e17a0b4 is live on ' + document.querySelector('#environment').value + '.'; deploy.removeAttribute('disabled'); }, 1200);
});`,
  },
};
