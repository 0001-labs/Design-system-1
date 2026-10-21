import type { LayoutExample } from './layout-examples';
import { choices, choose, icon, library, photo, text } from './library-example-parts';

// Five sites, each drawn by a published design library (library-example-parts.ts): a product
// launch, a bike maker, a festival, a developer platform and a magazine, made of headers, banners,
// big cards in a bento, strips and slides of carousels, and footers.

const composition = `<style>
.site { display:grid; grid-template-columns:minmax(0,1fr); gap:calc(4 * var(--ds-unit)); min-width:0; padding-block:calc(2 * var(--ds-unit)); }
.site-section { display:grid; grid-template-columns:minmax(0,1fr); gap:calc(2 * var(--ds-unit)); min-width:0; }
.site-stack { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--ds-unit); min-width:0; align-content:start; }
.site-tight { display:grid; grid-template-columns:minmax(0,1fr); gap:calc(var(--ds-unit) / 2); min-width:0; align-content:start; }
.site-centre { justify-items:center; text-align:center; }
.site-actions { display:flex; flex-wrap:wrap; align-items:flex-end; gap:calc(var(--ds-unit) / 2); }
.site-centre .site-actions { justify-content:center; }
.site-centre ds-text { text-align:center; }
.site-between { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:var(--ds-unit); }
.site-two { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:calc(2 * var(--ds-unit)); align-items:start; }
.site-three { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--ds-unit); }
.site-rule { border-top:1px solid var(--ds-border-color); padding-top:calc(2 * var(--ds-unit)); }
.site-giant { --ds-sf:calc(2.5 * var(--sf, 1)); --ds-display-text-size:32px; }
.site-big { --ds-sf:calc(1.5 * var(--sf, 1)); --ds-display-text-size:32px; }
.site-lead { --ds-sf:calc(2 * var(--sf, 1)); }
.site-copy { max-width:calc(28 * var(--ds-unit)); }
.site-slide { display:grid; gap:calc(var(--ds-unit) / 2); margin:0; }
.site-quote { display:grid; gap:var(--ds-unit); margin:0; min-height:calc(6 * var(--ds-unit)); align-content:start; }
.site-swatch { display:inline-flex; align-items:flex-end; gap:calc(4px * var(--ds-sf)); }
.site-price { display:grid; gap:var(--ds-unit); align-content:start; }
.site-list { display:grid; gap:0; }
.site-list > * { display:flex; align-items:flex-end; gap:calc(4px * var(--ds-sf)); min-height:var(--ds-unit); line-height:calc(16px * var(--sf, 1)); }
.site-status:empty { display:none; }
.site [hidden] { display:none!important; }
.site ds-card ds-image[slot="media"] { display:block; width:100%; }
.site pre { margin:0; }
@media(max-width:900px) { .site-giant { --ds-sf:calc(2 * var(--sf, 1)); } .site-lead { --ds-sf:calc(1.5 * var(--sf, 1)); } }
@media(max-width:600px) {
 .site { gap:calc(3 * var(--ds-unit)); }
 .site-giant { --ds-sf:calc(1.5 * var(--sf, 1)); }
 .site-big { --ds-sf:var(--sf, 1); --ds-display-text-size:30px; }
 .site-lead { --ds-sf:var(--sf, 1); }
 .site-two, .site-three { grid-template-columns:1fr; gap:var(--ds-unit); }
}
</style>`;

const giant = (words: string, level = 1) => text(words, `size="display" strong class="site-giant" wrap role="heading" aria-level="${level}"`);
const big = (words: string, level = 2) => text(words, `size="display" strong class="site-big" wrap role="heading" aria-level="${level}"`);
const lead = (words: string) => text(words, 'class="site-lead" wrap');
const card = (attrs: string, parts: { label?: string; title?: string; body?: string; media?: string }) =>
  `<ds-card ${attrs}>${parts.label ? `<span slot="label">${parts.label}</span>` : ''}${parts.title ? `<span slot="title">${parts.title}</span>` : ''}${parts.body ?? ''}${parts.media ?? ''}</ds-card>`;
const media = (name: string, alt: string, ratio = '4 / 3', extra = '') => photo(name, alt, ratio, `slot="media" ${extra}`);
const footer = (brand: string, tagline: string, name: string, columns: Array<[string, string[]]>) =>
  `<ds-footer slot="footer" brand="${brand}" tagline="${tagline}" literal year="2026" preferences="theme" columns='${JSON.stringify(columns.map(([heading, links]) => ({ heading, links: links.map(label => ({ label, href: `#${label.toLowerCase().replace(/[^a-z]+/g, '-')}` })) })))}'><span slot="legal" style="min-width:0">${text(`Fictional demo, drawn by the ${name} library.`, 'size="small" tone="muted" wrap')}</span></ds-footer>`;
const check = (words: string) => `<div>${icon('check')}${text(words)}</div>`;

export const LIBRARY_SITES: Record<string, LayoutExample> = {
  speaker: {
    name: 'Speaker launch', use: 'A product launch in the Graphite library: white paper, Sharp blue, pill buttons and big rounded tiles.', height: 900,
    library: library('graphite'),
    html: `${composition}<ds-header brand="Halo" href="#top" literal><a href="#overview">Overview</a><a href="#sound">Sound</a><a href="#colours">Colours</a><a href="#compare">Compare</a><ds-button slot="actions" primary href="#buy">Buy</ds-button></ds-header>
<ds-page layout="column" measure="56" data-ds-surface>
<div class="site" id="top">
  <section id="overview" class="site-section site-centre">
    <div class="site-tight site-centre"><ds-tag>New</ds-tag>${giant('Halo')}${lead('Room-filling sound. Pocket-sized.')}</div>
    <div class="site-actions"><ds-button secondary href="#sound">Learn more</ds-button><ds-button primary href="#buy">Buy from €199</ds-button></div>
    ${photo('halo-hero.jpg', 'Halo, a small round fabric speaker, on a pale stone surface', '16 / 9', 'loading="eager"')}
  </section>
  <section class="site-section">
    <div class="site-between">${big('Get the highlights.')}${text('Swipe or use the arrows', 'size="small" tone="muted"')}</div>
    <ds-carousel label="Highlights" literal slide-width="auto" no-dots buttons bleed="end">
      ${card('tone="ink" width="14" height="22" media="bleed"', { label: 'Battery', title: 'Twelve hours, then some.', media: media('halo-outdoors.jpg', 'Halo on a picnic blanket in the grass', '1') })}
      ${card('tone="sharp-blue" width="20" height="22" media="bleed"', { label: 'Sound', title: 'Fills a room from the bookshelf.', media: media('halo-shelf.jpg', 'Halo on a bookshelf in a sunlit living room', '3 / 2') })}
      ${card('tone="hysteric-blue" width="14" height="22" media="center"', { label: 'Outdoors', title: 'Rain, sand and the odd splash.', media: media('halo-fabric.jpg', 'Water drops on the woven fabric of Halo', '1') })}
      ${card('tone="pink" width="14" height="22" media="center"', { label: 'Pairs', title: 'Two make stereo.', media: media('halo-colours.jpg', 'Halo speakers in four colours', '4 / 3') })}
    </ds-carousel>
  </section>
  <section id="sound" class="site-section">
    <div class="site-tight site-centre">${big('Sound you can almost see.')}<div class="site-copy">${text('A ring of five drivers sends music every way at once, so every seat in the room is the good seat.', 'wrap tone="muted"')}</div></div>
    <ds-bento>
      ${card('tone="ink" data-span="2" data-rows="2" media="bleed"', { label: 'All around', title: '360° sound from a speaker the size of a grapefruit.', media: media('halo-fabric.jpg', 'The woven fabric and the control ring on top of Halo', '16 / 9') })}
      ${card('', { label: 'Battery', body: '<ds-stat figure="12 h" label="of music on one charge" caption="Fast charge: 2 h in 10 min" literal></ds-stat>' })}
      ${card('tone="hysteric-blue"', { label: 'Tough', title: 'IP67.', body: text('Half an hour under a metre of water, and still playing.', 'wrap') })}
      ${card('tone="pink" data-span="3" media="bleed"', { label: 'Pairs in a tap', title: 'Hold two together. Now they are left and right.', media: media('halo-shelf.jpg', 'Two Halo speakers on a shelf', '3 / 1') })}
    </ds-bento>
  </section>
  <section id="colours" class="site-section site-rule">
    <div class="site-two">
      <div class="site-stack">${big('Pick a colour. Any colour.')}<ds-text id="colour-words" literal wrap tone="muted">Snow: bright, quiet, at home on any shelf.</ds-text>
        <div class="site-actions" role="group" aria-label="Colour"><ds-button control="host" data-colour="Snow" active aria-pressed="true"><span class="site-swatch"><ds-swatch value="#f4f4f4"></ds-swatch>Snow</span></ds-button><ds-button control="host" data-colour="Midnight" aria-pressed="false"><span class="site-swatch"><ds-swatch value="#1e1e1e"></ds-swatch>Midnight</span></ds-button><ds-button control="host" data-colour="Sky" aria-pressed="false"><span class="site-swatch"><ds-swatch value="#69d8fb"></ds-swatch>Sky</span></ds-button><ds-button control="host" data-colour="Coral" aria-pressed="false"><span class="site-swatch"><ds-swatch value="#ff5f5f"></ds-swatch>Coral</span></ds-button></div>
      </div>
      ${photo('halo-colours.jpg', 'Halo in Snow, Midnight, Sky and Coral', '4 / 3')}
    </div>
  </section>
  <section class="site-section">
    ${big('Take it anywhere.')}
    <ds-carousel label="Where Halo goes" literal buttons>
      <figure class="site-slide">${photo('halo-outdoors.jpg', 'Halo on a picnic blanket by the water', '16 / 9')}${text('To the park, on a strap.', 'size="small" tone="muted"')}</figure>
      <figure class="site-slide">${photo('halo-shelf.jpg', 'Halo on the living room shelf', '16 / 9')}${text('Back on the shelf by dinner.', 'size="small" tone="muted"')}</figure>
      <figure class="site-slide">${photo('halo-hero.jpg', 'Halo on a bathroom counter', '16 / 9')}${text('Into the shower, if you like.', 'size="small" tone="muted"')}</figure>
    </ds-carousel>
  </section>
  <section id="compare" class="site-section site-rule">
    <div class="site-between">${big('Which Halo is yours?')}<ds-button href="#buy" secondary>Compare all ${icon('right')}</ds-button></div>
    <ds-table id="compare-table" label="Compare Halo speakers"></ds-table>
  </section>
  <section id="buy" class="site-section site-two">
    <div class="site-stack">${big('Questions, answered.')}</div>
    <div class="site-stack"><ds-accordion literal summary="Does it work with my phone?" open>Any phone or computer with Bluetooth. Hold it near an iPhone to pair in one step.</ds-accordion><ds-accordion literal summary="How long does delivery take?">Two to four working days, free, with a month to change your mind.</ds-accordion><ds-accordion literal summary="Can I replace the battery?">Yes. The base unscrews, and a new battery costs €29.</ds-accordion>
      <div class="site-actions"><ds-button primary id="buy-button">Buy Halo in Snow · €199</ds-button></div><ds-text id="speaker-status" class="site-status" literal role="status" wrap></ds-text></div>
  </section>
</div>
${footer('Halo', 'A small speaker for a big room', 'Graphite', [['Shop', ['Halo', 'Halo mini', 'Accessories']], ['Support', ['Set up', 'Warranty', 'Contact']]])}
</ds-page>`,
    script: `${choose}
const words = { Snow: 'Snow: bright, quiet, at home on any shelf.', Midnight: 'Midnight: disappears into the evening.', Sky: 'Sky: a little summer, all year.', Coral: 'Coral: the one people ask about.' };
let colour = 'Snow';
document.querySelectorAll('[data-colour]').forEach(button => button.addEventListener('click', () => {
 choose('[data-colour]', button); colour = button.dataset.colour;
 document.querySelector('#colour-words').textContent = words[colour];
 document.querySelector('#buy-button').textContent = 'Buy Halo in ' + colour + ' · €199';
}));
document.querySelector('#buy-button').addEventListener('click', () => { document.querySelector('#speaker-status').textContent = 'Halo in ' + colour + ' is in your bag. Nothing is paid in this demo.'; });
const table = document.querySelector('#compare-table');
table.columns = [{ key: 'feature', label: '' }, { key: 'mini', label: 'Halo mini' }, { key: 'halo', label: 'Halo' }, { key: 'max', label: 'Halo max' }];
table.data = [
 { feature: 'Price', mini: '€129', halo: '€199', max: '€349' },
 { feature: 'Battery', mini: '8 h', halo: '12 h', max: '20 h' },
 { feature: 'Drivers', mini: '3', halo: '5', max: '7' },
 { feature: 'Water', mini: 'IP54', halo: 'IP67', max: 'IP67' },
 { feature: 'Weight', mini: '310 g', halo: '540 g', max: '1.2 kg' },
];`,
  },
  bike: {
    name: 'Bike maker', use: 'An electric bike site in the Grove library: Comfortable green paper, Metal green and square corners.', height: 900,
    library: library('grove'),
    html: `${composition}<ds-message form="banner" text="Free test rides every Saturday in October." literal><ds-button slot="actions" href="#ride">Book a ride</ds-button></ds-message>
<ds-header brand="Tern" href="#top" literal><a href="#bikes">Bikes</a><a href="#rides">Rides</a><a href="#specs">Specs</a><ds-button slot="actions" primary href="#ride">Test ride</ds-button></ds-header>
<ds-page layout="column" measure="56" data-ds-surface>
<div class="site" id="top">
  <section class="site-section">
    <div class="site-two"><div class="site-tight">${text('Tern City · electric', 'tone="muted"')}${giant('Hills, flattened.')}</div><div class="site-stack">${lead('A light electric bike that makes the long way home the nice way home.')}<div class="site-actions"><ds-button primary href="#ride">Book a test ride</ds-button><ds-button secondary href="#bikes">See the bikes ${icon('down')}</ds-button></div></div></div>
    ${photo('bike-hero.jpg', 'A green step-through electric bike, seen from the side', '16 / 9', 'loading="eager"')}
    <div class="site-three"><ds-stat id="range" figure="120 km" label="Range" caption="On one charge" literal></ds-stat><ds-stat id="weight" figure="19 kg" label="Weight" caption="Battery included" literal></ds-stat><ds-stat id="price" value="2490" format="money" currency="EUR" whole label="From" caption="Or €104 a month" literal></ds-stat></div>
  </section>
  <section id="bikes" class="site-section site-rule">
    <div class="site-between">${big('Three bikes. One way of riding.')}${choices('Bike', 'bike', ['City', 'Gravel', 'Cargo'])}</div>
    <ds-bento>
      ${card('tone="metal-green" data-span="2" data-rows="2" media="bleed"', { label: 'Motor', title: 'Help that feels like your own legs.', body: text('The motor reads how hard you push, a thousand times a second, and adds just enough.', 'wrap'), media: media('bike-city.jpg', 'A rider on a quiet city street at dawn', '3 / 2') })}
      ${card('tone="chartreuse"', { label: 'Battery', title: 'Out in one click.', body: text('Charge it at your desk; it weighs what a laptop does.', 'wrap') })}
      ${card('tone="ink" media="center"', { label: 'Display', title: 'Only what you need.', media: media('bike-display.jpg', 'The small round display on the handlebar', '1') })}
      ${card('data-span="3"', { label: 'Lights', title: 'On when it is dark. Off when it is not.', body: text('Front and rear lights wired to the battery, with a sensor that switches them for you.', 'wrap tone="muted"') })}
    </ds-bento>
  </section>
  <section id="rides" class="site-section">
    ${big('Where it takes people.')}
    <ds-carousel label="Rides" literal slide-width="16" buttons>
      <figure class="site-slide">${photo('bike-gravel.jpg', 'A gravel road through pine trees at dusk', '4 / 5')}${text('Sixty kilometres of gravel, before dinner.', 'wrap')}${text('Ines, Gravel', 'size="small" tone="muted"')}</figure>
      <figure class="site-slide">${photo('bike-city.jpg', 'A city street with a cycle lane', '4 / 5')}${text('Across town in twelve minutes, not sweating.', 'wrap')}${text('Tom, City', 'size="small" tone="muted"')}</figure>
      <figure class="site-slide">${photo('bike-hero.jpg', 'The bike parked by a garden fence', '4 / 5')}${text('Two children and the shopping, uphill.', 'wrap')}${text('Mette, Cargo', 'size="small" tone="muted"')}</figure>
      <figure class="site-slide">${photo('bike-display.jpg', 'The handlebar on a morning ride', '4 / 5')}${text('The car stays in the drive most days now.', 'wrap')}${text('Sam, City', 'size="small" tone="muted"')}</figure>
    </ds-carousel>
  </section>
  <section id="ride" class="site-section site-two site-rule">
    <div class="site-stack">${big('Ride one this week.')}${text('Half an hour on your own, with a helmet and a route we like. No one will sell you anything.', 'wrap tone="muted"')}</div>
    <div class="site-stack"><div class="site-actions"><ds-calendar picker id="ride-day" label="Day" literal placeholder="Choose a day" min="2026-10-21"></ds-calendar><ds-select><select id="ride-shop" aria-label="Shop"><option>Copenhagen</option><option>Aarhus</option><option>Odense</option></select></ds-select><ds-button primary id="ride-book">Book</ds-button></div><ds-text id="ride-status" class="site-status" literal role="status" wrap></ds-text></div>
  </section>
  <section id="specs" class="site-section">
    ${big('Specifications')}
    <ds-table id="bike-specs" label="Specifications"></ds-table>
  </section>
</div>
${footer('Tern', 'Electric bikes, made to be ridden', 'Grove', [['Bikes', ['City', 'Gravel', 'Cargo']], ['Owners', ['Service', 'Insurance', 'Parts']]])}
</ds-page>`,
    script: `${choose}
const bikes = {
 city: { range: '120 km', weight: '19 kg', price: 2490, motor: '250 W hub', gears: '5, in the hub', tyres: '42 mm city' },
 gravel: { range: '140 km', weight: '17 kg', price: 2990, motor: '250 W mid-drive', gears: '11', tyres: '45 mm gravel' },
 cargo: { range: '90 km', weight: '34 kg', price: 3990, motor: '250 W mid-drive', gears: 'Stepless', tyres: '55 mm' },
};
const table = document.querySelector('#bike-specs');
table.columns = [{ key: 'part', label: 'Part' }, { key: 'value', label: 'Tern' }];
function show(name) {
 const bike = bikes[name];
 document.querySelector('#range').figure = bike.range; document.querySelector('#weight').figure = bike.weight; document.querySelector('#price').value = bike.price;
 document.querySelector('#price').caption = 'Or €' + Math.round(bike.price / 24) + ' a month';
 table.columns = [{ key: 'part', label: 'Part' }, { key: 'value', label: 'Tern ' + name[0].toUpperCase() + name.slice(1) }];
 table.data = [{ part: 'Motor', value: bike.motor }, { part: 'Range', value: bike.range }, { part: 'Gears', value: bike.gears }, { part: 'Tyres', value: bike.tyres }, { part: 'Weight', value: bike.weight }];
}
document.querySelectorAll('[data-bike]').forEach(button => button.addEventListener('click', () => { choose('[data-bike]', button); show(button.dataset.bike); }));
document.querySelector('#ride-book').addEventListener('click', () => {
 const day = document.querySelector('#ride-day').value.split('/')[0];
 document.querySelector('#ride-status').textContent = day ? 'Booked: ' + day + ' in ' + document.querySelector('#ride-shop').value + '. Nothing is sent in this demo.' : 'Choose a day first.';
});
show('city');`,
  },
  festival: {
    name: 'Festival', use: 'A music festival in the Bloom library: Pink paper, Tuned red and round cards.', height: 900,
    library: library('bloom'),
    html: `${composition}<ds-message form="banner" text="Early tickets are gone. Weekend tickets from €149." literal></ds-message>
<ds-header brand="Low Tide" href="#top" literal><a href="#line-up">Line-up</a><a href="#schedule">Schedule</a><a href="#tickets">Tickets</a><ds-button slot="actions" primary href="#tickets">Tickets</ds-button></ds-header>
<ds-page layout="column" measure="56" data-ds-surface>
<div class="site" id="top">
  <section class="site-section site-centre">
    <div class="site-tight site-centre">${text('14–16 August 2027 · On the beach at Skagen', 'tone="muted"')}${giant('Three days by the sea.')}</div>
    ${photo('tide-stage.jpg', 'A small stage on the beach at sunset, the crowd in silhouette', '16 / 9', 'loading="eager"')}
  </section>
  <section id="line-up" class="site-section">
    <div class="site-between">${big('The line-up')}${text('Forty acts on three stages', 'size="small" tone="muted"')}</div>
    <ds-carousel label="Line-up" literal slide-width="auto" no-dots buttons bleed="end">
      ${card('tone="tuned-red" width="12" height="20" media="bleed" href="#schedule"', { label: 'Friday', title: 'Mira Sol', media: media('tide-sax.jpg', 'A saxophone on a stand under pink stage light', '4 / 5') })}
      ${card('tone="ink" width="12" height="20" media="bleed" href="#schedule"', { label: 'Friday', title: 'Night Ferry', media: media('tide-decks.jpg', 'Record decks lit by a single lamp', '4 / 5') })}
      ${card('tone="orange" width="12" height="20" media="bleed" href="#schedule"', { label: 'Saturday', title: 'The Harbour Choir', media: media('tide-choir.jpg', 'Rows of empty chairs before a choir performance in a tent', '4 / 5') })}
      ${card('tone="purple" width="12" height="20" media="bleed" href="#schedule"', { label: 'Sunday', title: 'Salt Strings', media: media('tide-strings.jpg', 'A cello leaning against a wooden beach hut', '4 / 5') })}
    </ds-carousel>
  </section>
  <section id="schedule" class="site-section site-rule">
    <div class="site-between">${big('Schedule')}${choices('Day', 'day', ['Friday', 'Saturday', 'Sunday'])}</div>
    <ds-list id="sets"></ds-list>
  </section>
  <section id="tickets" class="site-section">
    ${big('Tickets')}
    <div class="site-three">
      ${card('variant="outlined"', { label: 'One day', title: '€69', body: `<div class="site-price"><div class="site-list">${check('Any one day')}${check('All three stages')}</div><ds-button secondary data-ticket="One day" data-price="69">Choose</ds-button></div>` })}
      ${card('tone="tuned-red"', { label: 'Weekend', title: '€149', body: `<div class="site-price"><div class="site-list">${check('Friday to Sunday')}${check('Re-entry all weekend')}</div><ds-button primary data-ticket="Weekend" data-price="149">Choose</ds-button></div>` })}
      ${card('tone="ink"', { label: 'Weekend and tent', title: '€219', body: `<div class="site-price"><div class="site-list">${check('Weekend ticket')}${check('A pitch in the dunes')}</div><ds-button secondary data-ticket="Weekend and tent" data-price="219">Choose</ds-button></div>` })}
    </div>
    <div class="site-between"><ds-stat id="ticket-total" value="298" format="money" currency="EUR" whole label="2 × Weekend" literal></ds-stat><div class="site-actions"><ds-select><select id="ticket-count" aria-label="How many"><option value="1">1 ticket</option><option value="2" selected>2 tickets</option><option value="4">4 tickets</option></select></ds-select><ds-button primary id="ticket-buy">Buy tickets</ds-button></div></div>
    <ds-text id="ticket-status" class="site-status" literal role="status" wrap></ds-text>
  </section>
  <section class="site-section site-two site-rule">
    ${photo('tide-map.jpg', 'A drawn map of the festival on the beach, with the three stages and the dunes', '4 / 3')}
    <div class="site-stack">${big('Getting there')}<ds-accordion literal summary="By train" open>Trains run from Copenhagen to Skagen every hour; the beach is a twenty-minute walk.</ds-accordion><ds-accordion literal summary="By bike">Racks for two thousand bikes by the north gate, watched all night.</ds-accordion><ds-accordion literal summary="By car">Park in town and take the free shuttle; there is no parking at the beach.</ds-accordion></div>
  </section>
</div>
${footer('Low Tide', 'Music on the beach at Skagen', 'Bloom', [['Festival', ['Line-up', 'Tickets', 'Map']], ['Help', ['Access', 'Lost and found', 'Contact']]])}
</ds-page>`,
    script: `${choose}
const sets = {
 friday: [['17:00', 'Sea Glass', 'Dune'], ['19:30', 'Mira Sol', 'Beach'], ['22:00', 'Night Ferry', 'Beach']],
 saturday: [['14:00', 'The Harbour Choir', 'Tent'], ['18:00', 'Low Sun', 'Dune'], ['21:30', 'Big Wave Club', 'Beach']],
 sunday: [['12:00', 'Morning Swim', 'Dune'], ['16:00', 'Salt Strings', 'Tent'], ['20:00', 'Last Light', 'Beach']],
};
function showDay(day) {
 const list = document.querySelector('#sets'); list.replaceChildren();
 for (const [time, name, stage] of sets[day]) {
  const row = document.createElement('ds-row'); row.setAttribute('fill', '');
  const when = document.createElement('ds-text'); when.setAttribute('literal', ''); when.setAttribute('tone', 'muted'); when.textContent = time; when.style.width = 'calc(3 * var(--ds-unit))';
  const who = document.createElement('ds-text'); who.setAttribute('literal', ''); who.setAttribute('strong', ''); who.textContent = name; who.style.flex = '1';
  const where = document.createElement('ds-tag'); where.textContent = stage;
  row.append(when, who, where); list.append(row);
 }
}
let ticket = 'Weekend', price = 149;
function total() { const count = Number(document.querySelector('#ticket-count').value); const stat = document.querySelector('#ticket-total'); stat.value = price * count; stat.label = count + ' × ' + ticket; }
document.querySelectorAll('[data-day]').forEach(button => button.addEventListener('click', () => { choose('[data-day]', button); showDay(button.dataset.day); }));
document.querySelectorAll('[data-ticket]').forEach(button => button.addEventListener('click', () => { ticket = button.dataset.ticket; price = Number(button.dataset.price); total(); }));
document.querySelector('#ticket-count').addEventListener('change', total);
document.querySelector('#ticket-buy').addEventListener('click', () => { document.querySelector('#ticket-status').textContent = document.querySelector('#ticket-total').label + ' in your basket. Nothing is paid in this demo.'; });
showDay('friday'); total();`,
  },
  platform: {
    name: 'Developer platform', use: 'A developer platform in the Signal library: code type throughout, Egg paper and Drip yellow.', height: 900,
    library: library('signal'),
    html: `${composition}<ds-header brand="relay" href="#top" literal><a href="#features">Product</a><a href="#pricing">Pricing</a><a href="#changelog">Changelog</a><ds-button slot="actions" href="#pricing">Sign in</ds-button><ds-button slot="actions" primary href="#pricing">Start free</ds-button></ds-header>
<ds-page layout="column" measure="56" data-ds-surface>
<div class="site" id="top">
  <section class="site-section site-two">
    <div class="site-stack">${giant('Ship on every merge.')}${lead('Push to main. Relay builds, tests and puts it live in forty regions before the review tab closes.')}<div class="site-actions"><ds-button primary href="#pricing">Start free</ds-button><ds-button secondary href="#features">How it works</ds-button></div></div>
    <div class="site-stack"><div data-ds-prose><pre><code>$ npx relay deploy
✓ Built in 2.1 s
✓ 214 tests passed
✓ Live in 40 regions
  https://north.relay.run</code></pre></div>${photo('relay-waves.jpg', 'Bright lines of light fanning out across a dark field', '16 / 9', 'loading="eager"')}</div>
  </section>
  <div class="site-three site-rule"><ds-stat figure="3.1 s" label="Median deploy" caption="From push to live" literal></ds-stat><ds-stat value="0.9999" format="percent" digits="2" label="Uptime" caption="Over the last year" literal></ds-stat><ds-stat value="40" format="number" label="Regions" caption="And every one of them is close" literal></ds-stat></div>
  <section id="features" class="site-section">
    ${big('Everything after git push.')}
    <ds-bento>
      ${card('tone="ink" data-span="2"', { label: 'Previews', title: 'Every branch gets an address.', body: text('Share a link with the people who need to see it. It goes away when the branch does.', 'wrap') })}
      ${card('tone="drip-yellow"', { label: 'Rollbacks', title: 'One click back.', body: text('Every deploy is kept. Go back to any of them in a second.', 'wrap') })}
      ${card('', { label: 'Logs', title: 'Search a week of logs.', body: text('Across every region, as you type.', 'wrap tone="muted"') })}
      ${card('tone="every-green" data-span="2"', { label: 'Health', title: 'We look before you have to.', body: '<ds-chart id="health" kind="area" rows="6" grid="none" aria-label="Requests over a week, steady with a midweek peak"></ds-chart>' })}
    </ds-bento>
  </section>
  <section id="changelog" class="site-section">
    <div class="site-between">${big('Changelog')}${text('A new thing most weeks', 'size="small" tone="muted"')}</div>
    <ds-carousel label="Changelog" literal slide-width="auto" no-dots buttons>
      ${card('variant="outlined" width="16" height="10"', { label: '20 Oct', title: 'Deploys from pull requests', body: text('Comment /deploy and the branch goes live.', 'wrap tone="muted"') })}
      ${card('variant="outlined" width="16" height="10"', { label: '13 Oct', title: 'Logs you can share', body: text('Copy a link to the exact lines.', 'wrap tone="muted"') })}
      ${card('variant="outlined" width="16" height="10"', { label: '6 Oct', title: 'Three new regions', body: text('Lagos, Santiago and Osaka.', 'wrap tone="muted"') })}
      ${card('variant="outlined" width="16" height="10"', { label: '29 Sep', title: 'Faster cold starts', body: text('A third quicker, with nothing to change.', 'wrap tone="muted"') })}
    </ds-carousel>
  </section>
  <section id="pricing" class="site-section site-rule">
    <div class="site-between">${big('Pricing')}${choices('Billing', 'billing', ['Monthly', 'Yearly'])}</div>
    <div class="site-three">
      ${card('variant="outlined"', { label: 'Hobby', title: '<span data-price="0">€0</span>', body: `<div class="site-price"><div class="site-list">${check('One project')}${check('Previews')}${check('Community help')}</div><ds-button secondary>Start free</ds-button></div>` })}
      ${card('tone="drip-yellow"', { label: 'Team', title: '<span data-price="20">€20</span>', body: `<div class="site-price"><div class="site-list">${check('Unlimited projects')}${check('Rollbacks and logs')}${check('Help in a day')}</div><ds-button primary>Try it for 14 days</ds-button></div>` })}
      ${card('tone="ink"', { label: 'Company', title: '<span data-price="90">€90</span>', body: `<div class="site-price"><div class="site-list">${check('Single sign-on')}${check('Audit trail')}${check('A person to call')}</div><ds-button secondary>Talk to us</ds-button></div>` })}
    </div>
    <ds-text id="billing-note" literal size="small" tone="muted">Per person, per month, billed monthly.</ds-text>
  </section>
  <section class="site-section">
    <ds-carousel label="What teams say" literal buttons>
      <blockquote class="site-quote">${lead('“We stopped talking about deploys. They just happen now.”')}${text('Ana, North Studio', 'size="small" tone="muted"')}</blockquote>
      <blockquote class="site-quote">${lead('“The preview links did more for our reviews than any tool we tried.”')}${text('Kofi, Field Notes', 'size="small" tone="muted"')}</blockquote>
      <blockquote class="site-quote">${lead('“Rolled back on a Friday night in one click and went back to dinner.”')}${text('Lea, Harbour', 'size="small" tone="muted"')}</blockquote>
    </ds-carousel>
  </section>
</div>
${footer('relay', 'Deploys you stop thinking about', 'Signal', [['Product', ['Docs', 'Pricing', 'Changelog']], ['Company', ['About', 'Status', 'Security']]])}
</ds-page>`,
    script: `${choose}
document.querySelector('#health').data = Array.from({ length: 28 }, (_, index) => ({ time: index * 21600, value: 40 + 30 * Math.sin(Math.PI * index / 27) + 6 * Math.sin(index * 2.1) }));
document.querySelectorAll('[data-billing]').forEach(button => button.addEventListener('click', () => {
 choose('[data-billing]', button);
 const yearly = button.dataset.billing === 'yearly';
 document.querySelectorAll('[data-price]').forEach(price => { const monthly = Number(price.dataset.price); price.textContent = '€' + (yearly ? Math.round(monthly * 0.8) : monthly); });
 document.querySelector('#billing-note').textContent = yearly ? 'Per person, per month, billed yearly: two and a half months free.' : 'Per person, per month, billed monthly.';
}));`,
  },
  magazine: {
    name: 'Travel magazine', use: 'A travel magazine in the Lagoon library: Hysteric blue paper, Sharp blue and soft pictures.', height: 900,
    library: library('lagoon'),
    html: `${composition}<ds-header brand="Atlas" href="#top" literal><a href="#stories">Stories</a><a href="#essay">Photo essay</a><a href="#letter">Letter</a><ds-button slot="actions" primary href="#letter">Subscribe</ds-button></ds-header>
<ds-page layout="column" measure="56" data-ds-surface>
<div class="site" id="top">
  <section class="site-section">
    ${card('tone="ink" href="#essay" media="bleed"', { label: 'Issue 12 · Winter', title: 'The slow way north: nine days by train, ferry and foot to the edge of the map.', media: media('atlas-cover.jpg', 'A coastline seen from above, a road along the cliffs', '21 / 9', 'loading="eager"') })}
  </section>
  <section id="stories" class="site-section">
    <div class="site-between">${big('In this issue')}${text('Seven stories, four countries', 'size="small" tone="muted"')}</div>
    <ds-carousel label="Stories" literal slide-width="auto" no-dots buttons bleed="end">
      ${card('tone="hysteric-blue" width="14" height="22" media="bleed" href="#stories"', { label: 'Alps', title: 'A village that closes its road for winter', media: media('atlas-alps.jpg', 'Snow on the roofs of a small alpine village', '4 / 5') })}
      ${card('tone="orange" width="14" height="22" media="bleed" href="#stories"', { label: 'Desert', title: 'Six hundred kilometres of empty road', media: media('atlas-desert.jpg', 'A straight road into the desert at noon', '4 / 5') })}
      ${card('tone="pink" width="14" height="22" media="bleed" href="#stories"', { label: 'Coast', title: 'The harbour that paints its boats every spring', media: media('atlas-harbour.jpg', 'Bright painted fishing boats in a small harbour', '4 / 5') })}
      ${card('tone="sharp-blue" width="14" height="22" media="bleed" href="#stories"', { label: 'Rail', title: 'Sleeping on the night train, and why it is back', media: media('atlas-train.jpg', 'A night train compartment with a window onto snow', '4 / 5') })}
    </ds-carousel>
  </section>
  <section id="essay" class="site-section site-rule">
    <div class="site-tight site-centre">${big('Nine days north')}${text('A photo essay by Ines Holm', 'tone="muted"')}</div>
    <ds-carousel id="essay-slides" label="Nine days north" literal buttons end>
      <figure class="site-slide">${photo('atlas-cover.jpg', 'The coast road on the first morning', '16 / 9')}${text('Day one. The road along the cliffs, before anyone else is up.', 'wrap tone="muted"')}</figure>
      <figure class="site-slide">${photo('atlas-train.jpg', 'Snow passing the window of the night train', '16 / 9')}${text('Day four. The night train, somewhere past the border.', 'wrap tone="muted"')}</figure>
      <figure class="site-slide">${photo('atlas-alps.jpg', 'A village under snow at dusk', '16 / 9')}${text('Day seven. The last village with a shop.', 'wrap tone="muted"')}</figure>
      <figure class="site-slide">${photo('atlas-harbour.jpg', 'Boats in the harbour at the end of the line', '16 / 9')}${text('Day nine. The end of the line, and the boats.', 'wrap tone="muted"')}</figure>
    </ds-carousel>
    <div class="site-two"><div>${big('Getting there is the point.', 3)}</div><div data-ds-prose><p>The fast way north takes three hours and two airports. We took nine days, and on most of them we did not know where we would sleep.</p><p>This issue is about the long way round: the night trains coming back, the roads that close for winter, and the people who live at the end of them.</p></div></div>
  </section>
  <section id="letter" class="site-section site-two site-rule">
    <div class="site-stack">${big('A letter from somewhere, every Sunday.')}${text('One place, one story, a few photographs. No more than that.', 'wrap tone="muted"')}</div>
    <div class="site-stack"><ds-input id="letter-email" type="email" label="Email" placeholder="you@example.com"></ds-input><div class="site-actions"><ds-button primary id="letter-join">Subscribe</ds-button>${text('Free. Leave any time.', 'size="small" tone="muted"')}</div><ds-text id="letter-status" class="site-status" literal role="status" wrap></ds-text></div>
  </section>
</div>
${footer('Atlas', 'A magazine for the long way round', 'Lagoon', [['Read', ['Stories', 'Photo essays', 'Archive']], ['Atlas', ['About', 'Contributors', 'Contact']]])}
</ds-page>`,
    script: `document.querySelector('#letter-join').addEventListener('click', () => {
 const email = document.querySelector('#letter-email').value.trim();
 document.querySelector('#letter-status').textContent = /.+@.+\\..+/.test(email) ? 'Thank you. The first letter arrives on Sunday. Nothing is sent in this demo.' : 'Write an email address first.';
});`,
  },
};
