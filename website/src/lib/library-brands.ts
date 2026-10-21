import type { LayoutExample } from './layout-examples';
import { icon, library, photo, text } from './library-example-parts';

// Two brand sites in libraries that carry a brand of their own (library-example-parts.ts): a
// travel booking site under a deep blue band, and a design tool's home page in black and white.
// Both use the libraries' button sizes: data-size="medium" (two squares) and "large" (three).

const composition = `<style>
.brand-stack { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--ds-unit); min-width:0; align-content:start; }
.brand-tight { display:grid; grid-template-columns:minmax(0,1fr); gap:calc(var(--ds-unit) / 2); min-width:0; align-content:start; }
.brand-row { display:flex; flex-wrap:wrap; align-items:flex-end; gap:calc(var(--ds-unit) / 2); min-width:0; }
.brand-between { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:var(--ds-unit); }
.brand-grow { flex:1; min-width:0; }
.brand-giant { --ds-sf:calc(2 * var(--sf, 1)); --ds-display-text-size:36px; }
.brand-big { --ds-sf:calc(1.5 * var(--sf, 1)); --ds-display-text-size:24px; }
.brand-lead { --ds-sf:calc(1.5 * var(--sf, 1)); }
.brand-status:empty { display:none; }
[hidden] { display:none!important; }

/* The band: the brand's colour behind the header, the places and the opening, ending two squares
   under the search so the search stands across its edge. */
.trip-band { color:var(--brand-band-ink); background:linear-gradient(var(--brand-band) calc(100% - 3 * var(--ds-unit)), transparent 0); --ds-text-color:var(--brand-band-ink); --ds-text-color-muted:color-mix(in srgb, var(--brand-band-ink) 80%, var(--brand-band)); --ds-border-color:color-mix(in srgb, var(--brand-band-ink) 55%, var(--brand-band)); --ds-fill:color-mix(in srgb, var(--brand-band-ink) 12%, var(--brand-band)); --ds-button-text-color:var(--brand-band-ink); --button-text-color:var(--brand-band-ink); }
.trip-band .trip-search { --ds-text-color:var(--brand-band-ink); }
.trip-top { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:var(--ds-unit); }
.trip-places { display:flex; flex-wrap:wrap; gap:calc(var(--ds-unit) / 2); }
.trip-hero { display:grid; gap:var(--ds-unit); padding-block:calc(3 * var(--ds-unit)) calc(4 * var(--ds-unit)); }
.trip-account { display:flex; align-items:flex-end; gap:calc(var(--ds-unit) / 2); }
.trip-level { color:var(--brand-highlight); }
.trip-search { display:grid; grid-template-columns:minmax(0,4fr) minmax(0,3fr) minmax(0,3fr) auto; gap:4px; margin:-4px; padding:4px; background:var(--brand-highlight); border-radius:var(--ds-radius-card); }
.trip-field { box-sizing:border-box; display:flex; align-items:flex-end; gap:calc(var(--ds-unit) / 2); min-height:calc(56px * var(--sf, 1)); padding:0 calc(var(--ds-unit) / 2) calc(4px * var(--sf, 1)); background:var(--ds-paper); color:var(--ds-text-color); border-radius:calc(var(--ds-radius-card) - 4px); --ds-text-color:light-dark(#1a1a1a, #f2f5fa); --ds-text-color-muted:light-dark(#595959, #a8b3c4); --ds-border-color:light-dark(#e0e4ea, #2f3a49); --ds-fill:light-dark(#f2f4f7, #1f2733); }
.trip-field > ds-icon { flex:none; }
.trip-field-words { display:grid; grid-template-columns:minmax(0,1fr); flex:1; min-width:0; justify-items:start; }
.trip-field-words > ds-text { line-height:calc(16px * var(--sf, 1)); padding-top:calc(4px * var(--sf, 1)); }
.trip-field ds-input { width:100%; }
.trip-search > ds-button { align-self:stretch; }
.trip-search > ds-button { --ds-control-size:56px; }
.trip-options { display:flex; flex-wrap:wrap; gap:var(--ds-unit); padding-block:var(--ds-unit); }
.trip-options label { display:flex; align-items:flex-end; gap:calc(var(--ds-unit) / 2); min-height:var(--ds-unit); }
.trip-recent { display:grid; grid-template-columns:calc(6 * var(--ds-unit)) minmax(0,1fr); min-height:calc(8 * var(--ds-unit)); }
.trip-recent ds-image { align-self:stretch; }
.trip-recent-words { display:grid; align-content:center; gap:0; padding:0 var(--ds-unit); }
.trip-recent-words > div { display:flex; align-items:flex-end; gap:calc(var(--ds-unit) / 2); min-height:var(--ds-unit); line-height:calc(16px * var(--sf, 1)); }
.trip-review { display:grid; grid-template-columns:calc(5 * var(--ds-unit)) minmax(0,1fr); gap:var(--ds-unit); align-items:start; }
.trip-review a { color:var(--ds-accent-color); }

/* The design tool's page. */
.easel-bar { display:flex; align-items:flex-end; gap:var(--ds-unit); padding:var(--ds-unit); border-bottom:1px solid var(--ds-border-color); }
.easel-mark { display:inline-grid; grid-template-columns:repeat(2, calc(8px * var(--sf, 1))); gap:calc(2px * var(--sf, 1)); padding-bottom:calc(2px * var(--sf, 1)); }
.easel-mark span { width:calc(8px * var(--sf, 1)); height:calc(8px * var(--sf, 1)); border-radius:50%; }
.easel-nav { display:flex; align-items:flex-end; gap:calc(4px * var(--sf, 1)); }
.easel-hero { display:grid; grid-template-columns:minmax(0,3fr) minmax(0,4fr) minmax(0,3fr); gap:calc(2 * var(--ds-unit)); align-items:center; padding:calc(4 * var(--ds-unit)) var(--ds-unit); }
.easel-hero > :last-child { justify-self:center; }
.easel-section { display:grid; gap:calc(2 * var(--ds-unit)); padding:calc(2 * var(--ds-unit)) var(--ds-unit); }
.easel-promo { position:sticky; bottom:0; display:flex; align-items:flex-end; gap:calc(2 * var(--ds-unit)); padding:var(--ds-unit); background:var(--brand-band); color:var(--brand-band-ink); }
.easel-promo .brand-giant { --ds-typeface-medium:var(--ds-typeface-compressed); --ds-typeface-regular:var(--ds-typeface-compressed); }
.easel-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--ds-unit); }

@media(max-width:900px) {
 .trip-search { grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
 .trip-search > :first-child { grid-column:1 / -1; }
 .easel-hero { grid-template-columns:1fr 1fr; }
 .easel-hero > :nth-child(2) { grid-row:span 2; }
 .easel-nav, .easel-secondary { display:none; }
}
@media(max-width:600px) {
 .brand-giant { --ds-sf:var(--sf, 1); --ds-display-text-size:30px; }
 .brand-big, .brand-lead { --ds-sf:var(--sf, 1); }
 .trip-search { grid-template-columns:minmax(0,1fr); }
 .trip-account ds-text, .trip-secondary { display:none; }
 .trip-recent { grid-template-columns:calc(4 * var(--ds-unit)) minmax(0,1fr); }
 .easel-hero { grid-template-columns:1fr; padding-block:calc(2 * var(--ds-unit)); }
 .easel-hero > :nth-child(2) { grid-row:auto; }
 .easel-stats { grid-template-columns:1fr; }
 .easel-promo { gap:var(--ds-unit); }
 .easel-promo > .brand-giant { display:none; }
 .trip-recent { min-height:calc(6 * var(--ds-unit)); }
}
</style>`;

const giant = (words: string, level = 1) => text(words, `size="display" strong class="brand-giant" wrap role="heading" aria-level="${level}"`);
const big = (words: string, level = 2) => text(words, `size="display" strong class="brand-big" wrap role="heading" aria-level="${level}"`);
const lead = (words: string) => text(words, 'class="brand-lead" wrap');
const media = (name: string, alt: string, ratio: string) => photo(name, alt, ratio, 'slot="media"');
const place = (label: string, type: string, current = false) => `<ds-button data-size="medium" href="#${label.toLowerCase().replace(/[^a-z]+/g, '-')}"${current ? ' data-face="outlined" aria-current="page"' : ''}>${icon(type)}<span>${label}</span></ds-button>`;
const destination = (name: string, country: string, file: string, span: number) =>
  `<ds-card href="#${name.toLowerCase()}" data-span="${span}" media="bleed" padding="small"><span slot="label">${country}</span><span slot="title">${name}</span>${photo(file, `${name}, ${country}`, span === 3 ? '16 / 9' : '4 / 3', 'slot="media"')}</ds-card>`;
const menu = (id: string, label: string, entries: string[]) =>
  `<ds-button id="${id}" data-size="medium">${label}${icon('chevron-down')}</ds-button><ds-select for="${id}" aria-label="${label}">${entries.map(entry => `<ds-button menu-item role="menuitem">${entry}</ds-button>`).join('')}</ds-select>`;
const legal = (name: string) => `<span slot="legal" style="min-width:0">${text(`Fictional demo, drawn by the ${name} library.`, 'size="small" tone="muted" wrap')}</span>`;

export const LIBRARY_BRANDS: Record<string, LayoutExample> = {
  booking: {
    name: 'Booking site', use: 'A travel booking home page in the Voyage library: a deep blue band, a yellow-framed search across its edge and bright blue buttons in three sizes.', height: 900,
    library: library('voyage'),
    html: `${composition}<div class="trip-band">
<ds-page layout="column" measure="56" data-ds-surface>
  <div class="brand-stack">
    <div class="trip-top">${text('Staywise', 'size="display" strong')}
      <div class="brand-row"><ds-button data-size="medium" class="trip-secondary">EUR</ds-button><ds-button data-size="medium" icon label="Language">${icon('globe')}</ds-button><ds-button data-size="medium" icon label="Help">${icon('help')}</ds-button><ds-button data-size="medium" class="trip-secondary">Open a work account</ds-button>
        <div class="trip-account"><ds-avatar initial="A" color="var(--brand-highlight)" size="large"></ds-avatar><div class="brand-tight" style="gap:0">${text('Alex Rivera', 'strong')}${text('Traveller level 3', 'size="small" class="trip-level"')}</div></div></div>
    </div>
    <nav class="trip-places" aria-label="What to book">${place('Stays', 'building', true)}${place('Flights', 'plane')}${place('Flight + stay', 'bag')}${place('Car hire', 'car')}${place('Things to do', 'ticket')}${place('Airport taxis', 'map')}</nav>
    <section class="trip-hero">${giant('Get more from every work trip')}<div style="max-width:calc(36 * var(--ds-unit))">${lead('It is easier with Staywise for work. Book, manage and track the team’s travel in one place.')}</div><div><ds-button primary data-size="large" href="#work">Open a free work account</ds-button></div></section>
    <form class="trip-search" id="trip-search" role="search" aria-label="Find a stay">
      <div class="trip-field">${icon('building')}<div class="trip-field-words">${text('Destination', 'size="small" tone="muted" id="trip-where-label"')}<ds-input id="trip-where" aria-labelledby="trip-where-label" placeholder="Where are you going?"></ds-input></div></div>
      <div class="trip-field">${icon('calendar')}<div class="trip-field-words">${text('Dates', 'size="small" tone="muted"')}<ds-calendar picker id="trip-when" label="Dates" literal placeholder="Check-in — check-out" min="2026-10-21"></ds-calendar></div></div>
      <div class="trip-field">${icon('people')}<div class="trip-field-words">${text('Guests and rooms', 'size="small" tone="muted"')}<ds-select><select id="trip-who" aria-label="Guests and rooms"><option>1 adult · 1 room</option><option selected>2 adults · 0 children · 1 room</option><option>2 adults · 2 children · 1 room</option><option>4 adults · 2 rooms</option></select></ds-select></div></div>
      <ds-button primary data-size="large" id="trip-go">Search</ds-button>
    </form>
  </div>
</ds-page>
</div>
<ds-page layout="column" measure="56" data-ds-surface>
  <div class="brand-stack">
    <div class="trip-options"><label><ds-checkbox><input type="checkbox" id="trip-work"></ds-checkbox>${text('I’m travelling for work')}</label><label><ds-checkbox><input type="checkbox"></ds-checkbox>${text('Add flights to my search')}</label></div>
    <ds-text id="trip-status" class="brand-status" literal role="status" wrap></ds-text>
    <section class="brand-stack">${big('Your recent searches')}
      <div style="max-width:calc(26 * var(--ds-unit))"><ds-card interactive padding="none" id="recent"><div class="trip-recent">${photo('trip-wing.jpg', 'A plane’s wing over the sea', '3 / 4')}<div class="trip-recent-words"><div>${text('Tokyo', 'size="small" tone="muted"')}<span style="width:var(--ds-unit)"></span>${text('Copenhagen', 'size="small" tone="muted"')}</div><div>${text('TYO', 'strong')}${icon('right')}${text('CPH', 'strong')}</div><div>${icon('calendar')}${text('Thu, 29 Oct')}</div><div>${icon('avatar')}${text('1 traveller')}</div></div></div></ds-card></div>
    </section>
    <ds-card variant="outlined"><div class="trip-review">${photo('trip-room.jpg', 'A bright hotel room with two beds', '1')}<div class="brand-tight">${text('How was the Harbour Hotel in Hakodate?', 'strong wrap')}${text('Don’t forget to leave a review: you have 31 days left.', 'wrap')}<a class="ds-link" href="#review">Rate your stay</a></div></div></ds-card>
    <section class="brand-stack" id="trending">
      <div class="brand-tight">${big('Trending destinations')}${text('Most popular with travellers from Denmark', 'tone="muted"')}</div>
      <ds-bento columns="6">${destination('Lisbon', 'Portugal', 'city-lisbon.jpg', 3)}${destination('Kyoto', 'Japan', 'city-kyoto.jpg', 3)}${destination('Oslo', 'Norway', 'city-oslo.jpg', 2)}${destination('Tokyo', 'Japan', 'city-tokyo.jpg', 2)}${destination('Copenhagen', 'Denmark', 'city-copenhagen.jpg', 2)}</ds-bento>
    </section>
    <section class="brand-stack" id="work">
      <div class="brand-between">${big('Deals for the weekend')}<ds-button data-size="medium" data-face="outlined">See all deals</ds-button></div>
      <ds-carousel label="Weekend deals" literal slide-width="auto" no-dots buttons>
        ${[['Harbour Hotel', 'Hakodate', 'trip-room.jpg', '8.9', '€96'], ['Old Town Rooms', 'Lisbon', 'city-lisbon.jpg', '9.2', '€74'], ['Fjord House', 'Oslo', 'city-oslo.jpg', '8.7', '€128'], ['Canal Loft', 'Copenhagen', 'city-copenhagen.jpg', '9.0', '€142']].map(([name, city, file, score, price]) => `<ds-card href="#deal" width="14" padding="small" media="bleed"><span slot="label">${city}</span><span slot="title">${name}</span><div class="brand-row"><ds-tag>${score}</ds-tag>${text(`From ${price} a night`, 'tone="muted"')}</div>${media(file, `${name} in ${city}`, '4 / 3')}</ds-card>`).join('')}
      </ds-carousel>
    </section>
  </div>
  <ds-footer slot="footer" brand="Staywise" tagline="Stays, flights and everything between" literal year="2026" preferences="theme" columns='[{"heading":"Support","links":[{"label":"Your trips","href":"#trips"},{"label":"Help centre","href":"#help"}]},{"heading":"Discover","links":[{"label":"Work travel","href":"#work"},{"label":"Deals","href":"#work"}]}]'>${legal('Voyage')}</ds-footer>
</ds-page>`,
    script: `const status = document.querySelector('#trip-status');
document.querySelector('#trip-search').addEventListener('submit', event => event.preventDefault());
document.querySelector('#trip-go').addEventListener('click', () => {
 const where = document.querySelector('#trip-where').value.trim();
 const [start, end] = (document.querySelector('#trip-when').value || '').split('/');
 if (!where) { status.textContent = 'Enter a destination to start searching.'; document.querySelector('#trip-where').focus(); return; }
 const nights = start && end ? Math.round((Date.parse(end) - Date.parse(start)) / 86400000) : 0;
 status.textContent = 'Stays in ' + where + (nights ? ' for ' + nights + (nights === 1 ? ' night' : ' nights') : '') + ', ' + document.querySelector('#trip-who').value + (document.querySelector('#trip-work').checked ? ', for work' : '') + '. Nothing is searched in this demo.';
});
document.querySelector('#recent').addEventListener('ds-card-press', () => { document.querySelector('#trip-where').value = 'Copenhagen'; status.textContent = 'Copenhagen is in the search again.'; });`,
  },
  canvas: {
    name: 'Design tool', use: 'A design tool’s home page in the Studio library: black on white, menus in the bar, outlined and ink buttons in three sizes and a strip held at the foot.', height: 900,
    library: library('studio'),
    html: `${composition}<header class="easel-bar">
  <span class="easel-mark" aria-label="Easel" role="img"><span style="background:var(--one-tuned-red)"></span><span style="background:var(--one-orange)"></span><span style="background:var(--one-sharp-blue)"></span><span style="background:var(--one-apple-green)"></span></span>
  <nav class="easel-nav" aria-label="Easel">${menu('menu-products', 'Products', ['Design', 'Prototype', 'Slides', 'Sites', 'Whiteboard'])}${menu('menu-solutions', 'Solutions', ['For teams', 'For schools', 'For agencies'])}${menu('menu-community', 'Community', ['Files', 'Plugins', 'Events'])}${menu('menu-resources', 'Resources', ['Help', 'Courses', 'Blog'])}<ds-button data-size="medium" href="#pricing">Pricing</ds-button></nav>
  <span class="brand-grow"></span>
  <ds-button data-size="medium" href="#sign-in" class="easel-secondary">Sign in</ds-button><ds-button data-size="medium" data-face="outlined" href="#sales" class="easel-secondary">Talk to sales</ds-button><ds-button data-size="medium" primary href="#start">Start for free</ds-button>
</header>
<main>
  <section class="easel-hero">
    ${text('The whole studio on one canvas', 'size="display" class="brand-giant" wrap role="heading" aria-level="1"')}
    ${photo('easel-collage.jpg', 'A collage of app screens, posters and swatches laid over one another on a canvas', '1', 'loading="eager"')}
    <ds-button primary data-size="large" href="#start">Get started</ds-button>
  </section>
  <section class="easel-section" id="products">
    <div class="brand-between">${big('From the first sketch to the shipped thing.')}<ds-button data-size="medium" data-face="outlined" href="#products">See all products</ds-button></div>
    <ds-bento>
      <ds-card tone="tuned-red" data-span="2" media="bleed"><span slot="label">Design</span><span slot="title">Every screen, every state, side by side.</span>${media('easel-file-app.jpg', 'App screens laid out on a canvas', '16 / 9')}</ds-card>
      <ds-card tone="sharp-blue"><span slot="label">Prototype</span><span slot="title">Press play on a design.</span>${text('Link the screens, then try it on your phone before anything is built.', 'wrap')}</ds-card>
      <ds-card tone="orange"><span slot="label">Slides</span><span slot="title">Decks in the same file.</span>${text('Present the work where it lives.', 'wrap')}</ds-card>
      <ds-card tone="ink" data-span="2" media="bleed"><span slot="label">Sites</span><span slot="title">Publish the design as it is.</span>${media('easel-file-poster.jpg', 'A website page designed on the canvas', '16 / 9')}</ds-card>
    </ds-bento>
  </section>
  <section class="easel-section">
    ${big('Made by the community')}
    <ds-carousel label="Community files" literal slide-width="auto" no-dots buttons>
      ${[['Poster kit', 'Ines Holm', 'easel-file-poster.jpg'], ['Mobile app screens', 'Kofi Mensah', 'easel-file-app.jpg'], ['Type specimens', 'Lea Park', 'easel-file-type.jpg'], ['Brand toolkit', 'Ana Ruiz', 'easel-file-brand.jpg']].map(([name, maker, file]) => `<ds-card href="#file" width="16" padding="small" media="bleed"><span slot="label">${maker}</span><span slot="title">${name}</span>${media(file, name, '4 / 3')}</ds-card>`).join('')}
    </ds-carousel>
  </section>
  <section class="easel-section" id="pricing">
    <div class="easel-stats"><ds-stat figure="13 million" label="People designing each month" literal></ds-stat><ds-stat figure="4 in 5" label="Teams that ship from the same file" literal></ds-stat><ds-stat value="0" format="money" currency="EUR" whole label="To start" caption="Three files, forever" literal></ds-stat></div>
    <div class="brand-row"><ds-button data-size="large" primary href="#start">Get started</ds-button><ds-button data-size="large" data-face="outlined" href="#sales">Talk to sales</ds-button></div>
    <div class="brand-row">${text('One control, two squares and three:', 'tone="muted"')}<ds-button primary href="#start">Small</ds-button><ds-button primary data-size="medium" href="#start">Medium</ds-button><ds-button primary data-size="large" href="#start">Large</ds-button></div>
  </section>
  <ds-footer brand="Easel" tagline="Make it, together" literal year="2026" preferences="theme" columns='[{"heading":"Product","links":[{"label":"Design","href":"#products"},{"label":"Prototype","href":"#products"},{"label":"Pricing","href":"#pricing"}]},{"heading":"Company","links":[{"label":"Careers","href":"#careers"},{"label":"Press","href":"#press"}]}]'>${legal('Studio')}</ds-footer>
</main>
<aside class="easel-promo" id="promo" aria-label="Easel days">
  ${text('Easel days', 'size="display" strong class="brand-giant"')}
  <span class="brand-grow">${text('See everything we launched at Easel days.', 'wrap')}</span>
  <ds-button primary data-size="medium" href="#news">Read more</ds-button>
  <ds-button icon id="promo-close" label="Close">${icon('close')}</ds-button>
</aside>`,
    script: `document.querySelector('#promo-close').addEventListener('click', () => { document.querySelector('#promo').hidden = true; });`,
  },
};
