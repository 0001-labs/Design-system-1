import type { LayoutExample } from './layout-examples';
import { icon, image, library, photo, text } from './library-example-parts';

// A design studio's site in the Atelier library, as a study of how far the components reach on a
// calm, mostly white brand page: a header, a hero, cards for the cases, a band that turns over to
// black for the services and the contact form, portraits, quotes, a strip of reasons, and a
// footer. Everything stands on the grid: every line one square, every gap whole squares.

const composition = `<style>
.studio { display:grid; grid-template-columns:minmax(0,1fr); gap:calc(4 * var(--ds-unit)); min-width:0; padding-block:calc(2 * var(--ds-unit)); }
.studio-section { display:grid; grid-template-columns:minmax(0,1fr); gap:calc(2 * var(--ds-unit)); min-width:0; }
.studio-stack { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--ds-unit); min-width:0; align-content:start; }
.studio-tight { display:grid; grid-template-columns:minmax(0,1fr); gap:0; min-width:0; align-content:start; }
.studio-centre { justify-items:center; text-align:center; }
.studio-centre ds-text { text-align:center; }
.studio-actions { display:flex; flex-wrap:wrap; align-items:flex-end; gap:calc(var(--ds-unit) / 2); }
.studio-between { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:var(--ds-unit); }
.studio-two { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:calc(2 * var(--ds-unit)); align-items:start; }
.studio-three { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:calc(2 * var(--ds-unit)); align-items:start; }
.studio-giant { --ds-sf:calc(2 * var(--sf, 1)); --ds-display-text-size:28px; }
.studio-big { --ds-sf:calc(1.5 * var(--sf, 1)); --ds-display-text-size:26px; }
.studio-lead { --ds-sf:calc(1.25 * var(--sf, 1)); }
.studio-copy { max-width:calc(30 * var(--ds-unit)); }
.studio-mono { --ds-typeface-regular:var(--ds-typeface-mono); --ds-typeface-medium:var(--ds-typeface-mono); }
.studio-row { display:flex; align-items:flex-end; gap:calc(4px * var(--ds-sf)); min-height:var(--ds-unit); line-height:calc(16px * var(--sf, 1)); }
.studio-person { display:grid; grid-template-columns:calc(2 * var(--ds-unit)) minmax(0,1fr); gap:0 calc(var(--ds-unit) / 2); align-items:end; }
.studio-person > ds-avatar { grid-row:span 2; }
.studio-quote { display:grid; gap:var(--ds-unit); margin:0; align-content:start; }
.studio-quote blockquote { margin:0; }
.studio-tags { display:flex; flex-wrap:wrap; gap:calc(var(--ds-unit) / 2); }
.studio-wordmark { --ds-sf:calc(4 * var(--sf, 1)); --ds-display-text-size:36px; }
.studio-status:empty { display:none; }
.studio [hidden] { display:none!important; }
.studio ds-card ds-image[slot="media"] { display:block; width:100%; }
.studio form { display:grid; gap:var(--ds-unit); min-width:0; }
.studio form ds-input { width:100%; }
.studio-link { display:block; box-sizing:border-box; min-height:var(--ds-unit); padding-top:calc(4px * var(--sf, 1)); line-height:calc(16px * var(--sf, 1)); color:inherit; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:calc(3px * var(--sf, 1)); }

/* The band: the brand turned over, black with white words (white with black words in the dark
   theme), the section's words and controls reading the band's colours. */
.studio-band { box-sizing:border-box; padding:calc(2 * var(--ds-unit)); border-radius:var(--ds-radius-card); color:var(--brand-band-ink); background:var(--brand-band); --ds-paper:var(--brand-band); --ds-text-color:var(--brand-band-ink); --ds-text-color-muted:color-mix(in srgb, var(--brand-band-ink) 72%, var(--brand-band)); --ds-title-color:color-mix(in srgb, var(--brand-band-ink) 72%, var(--brand-band)); --ds-border-color:color-mix(in srgb, var(--brand-band-ink) 30%, var(--brand-band)); --ds-fill:color-mix(in srgb, var(--brand-band-ink) 10%, var(--brand-band)); --ds-fill-hover:color-mix(in srgb, var(--brand-band-ink) 16%, var(--brand-band)); --ds-accent-color:var(--brand-band-ink); --ds-button-text-color:var(--brand-band-ink); --button-text-color:var(--brand-band-ink); --ds-button-text-color-on-accent:var(--brand-band); --ds-input-background:color-mix(in srgb, var(--brand-band-ink) 8%, var(--brand-band)); --ds-input-color:var(--brand-band-ink); --ds-input-placeholder-color:color-mix(in srgb, var(--brand-band-ink) 60%, var(--brand-band)); }
.studio-band ds-button[data-face="outlined"]::part(control) { color:var(--brand-band-ink); box-shadow:inset 0 0 0 1px var(--ds-border-color); }

@media(max-width:900px) { .studio-three { grid-template-columns:1fr; gap:calc(2 * var(--ds-unit)); } .studio-wordmark { --ds-sf:calc(2.5 * var(--sf, 1)); } }
@media(max-width:600px) {
 .studio { gap:calc(3 * var(--ds-unit)); }
 .studio-giant { --ds-sf:calc(1.5 * var(--sf, 1)); }
 .studio-big { --ds-sf:var(--sf, 1); --ds-display-text-size:28px; }
 .studio-lead { --ds-sf:var(--sf, 1); }
 .studio-wordmark { --ds-sf:calc(1.5 * var(--sf, 1)); }
 .studio-two { grid-template-columns:1fr; gap:var(--ds-unit); }
 .studio-band { padding:var(--ds-unit); }
 /* On a phone a reason is the column's width, twelve squares, so the strip shows one at a time. */
 .studio ds-carousel ds-card { --ds-card-width:calc(12 * var(--ds-unit)) !important; }
}
</style>`;

const giant = (words: string, level = 1) => text(words, `size="display" strong class="studio-giant" wrap role="heading" aria-level="${level}"`);
const big = (words: string, level = 2) => text(words, `size="display" strong class="studio-big" wrap role="heading" aria-level="${level}"`);
const lead = (words: string) => text(words, 'class="studio-lead" wrap');
const eyebrow = (words: string) => text(words, 'class="studio-mono" tone="muted"');
const number = (words: string) => text(words, 'class="studio-mono" size="display" tone="muted"');
const paragraph = (words: string) => text(words, 'wrap');
const media = (name: string, alt: string, ratio = '4 / 3') => photo(name, alt, ratio, 'slot="media"');
const tags = (...labels: string[]) => `<div class="studio-tags">${labels.map(label => `<ds-tag>${label}</ds-tag>`).join('')}</div>`;
const person = (file: string, name: string, role: string) =>
  `<div class="studio-person"><ds-avatar src="${image(file)}" label="${name}" size="large"></ds-avatar>${text(name, 'strong')}${text(role, 'size="small" tone="muted"')}</div>`;
const service = (count: string, type: string, title: string, words: string, more: string, action: string) =>
  `<div class="studio-stack"><div class="studio-between">${icon(type)}${eyebrow(count)}</div><div class="studio-tight">${text(title, 'size="display" strong wrap role="heading" aria-level="3"')}${paragraph(words)}</div>${paragraph(more)}<div class="studio-actions"><ds-button data-size="medium" data-face="outlined" href="#contact"><span>${action}</span>${icon('right')}</ds-button></div></div>`;
const founder = (count: string, file: string, name: string, bio: string, more: string) =>
  `<section class="studio-section studio-two">
    ${photo(file, `A portrait of ${name}`, '4 / 5')}
    <div class="studio-stack">
      <div class="studio-tight">${number(count)}${big(`Meet ${name}`)}${eyebrow('The people behind the studio')}</div>
      <div class="studio-tight">${text(name, 'strong')}${text('Digital designer and co-founder', 'tone="muted"')}</div>
      ${paragraph(bio)}${paragraph(more)}
      <div class="studio-actions"><ds-button data-size="medium" data-face="outlined" href="#linkedin"><span>LinkedIn</span>${icon('up-right')}</ds-button></div>
    </div>
  </section>`;
const quote = (file: string, alt: string, words: string, portrait: string, name: string, role: string) =>
  `<figure class="studio-quote">${photo(file, alt, '4 / 5')}<blockquote>${text(words, 'wrap')}</blockquote>${person(portrait, name, role)}</figure>`;
const reason = (count: string, title: string, words: string) =>
  `<ds-card width="14" height="12"><span slot="label" class="studio-mono">${count}</span><span slot="title">${title}</span>${paragraph(words)}</ds-card>`;

export const STUDIO_EXAMPLE: LayoutExample = {
  name: 'Design studio', use: 'A design studio in the Atelier library: near-white paper, ink buttons, big rounded cards and sections that turn over to black.', height: 900,
  library: library('atelier'),
  html: `${composition}<ds-header brand="Mørk &amp; Lund" href="#top" literal><a href="#cases">Cases</a><a href="#services">Services</a><a href="#about">About</a><ds-button slot="actions" primary href="#contact"><span>Contact us</span>${icon('right')}</ds-button></ds-header>
<ds-page layout="column" measure="56" data-ds-surface>
<div class="studio" id="top">
  <section class="studio-section">
    <div class="studio-stack"><div class="studio-copy studio-tight">${giant('A design studio with a love of detail.')}</div><div class="studio-copy">${lead('We make websites, visual identities and graphic design for brands that care about quality.')}</div>
      <div class="studio-actions"><ds-button primary data-size="large" href="#cases"><span>See our cases</span>${icon('right')}</ds-button></div></div>
    ${photo('atelier-hero.jpg', 'Hands turning the pages of a printed proof beside a tablet', '16 / 9', 'loading="eager"')}
  </section>
  <section id="cases" class="studio-section">
    ${big('Selected projects')}
    <div class="studio-two">
      <ds-card href="#fjord-health" media="bleed"><span slot="label">Fjord Health</span><span slot="title">A website for several markets</span>${tags('Website', 'Development')}${media('atelier-case-health.jpg', 'The Fjord Health website open on a laptop')}</ds-card>
      <ds-card href="#holm-partners" media="bleed"><span slot="label">Holm Partners</span><span slot="title">A new website and visual identity</span>${tags('Website', 'Identity')}${media('atelier-case-partners.jpg', 'A phone showing the Holm Partners website')}</ds-card>
    </div>
  </section>
  <section class="studio-section studio-centre">
    <div class="studio-tight studio-centre">${eyebrow('The craft behind Mørk &amp; Lund')}</div>
    <div class="studio-tight studio-centre">${big('Design is not about being loud.')}${big('It is about refining.')}${big('Cutting to the essence.')}${big('And leaving only what is right.')}</div>
  </section>
  <section id="services" class="studio-section studio-band">
    <div class="studio-between">${eyebrow('What we can help with')}${eyebrow('Services 01 / 03')}</div>
    <div class="studio-three">
      ${service('01', 'window', 'Web design and development', 'We design and build websites with a focus on calm, clarity and good digital craft.', 'From the first sketches to the finished site we work closely with you on something that feels considered and lasts. We build on the platform that makes sense for you, and say which.', 'Read more')}
      ${service('02', 'pen', 'Graphic design', 'Graphic work that makes your visual expression clear and complete.', 'Presentations, print and digital assets that hang together and work in practice. A single job, or a design partner on call.', 'Contact us')}
      ${service('03', 'sparkle', 'Brand and visual identity', 'A direction that feels right, turned into an identity that works on every surface.', 'From the first thoughts to a finished, thorough expression, made with care and an eye for the small details.', 'Contact us')}
    </div>
  </section>
  <section id="about" class="studio-section studio-two">
    <div class="studio-stack">
      <div class="studio-tight">${number('01')}${big('About Mørk &amp; Lund')}${eyebrow('A design studio in Copenhagen')}</div>
      ${lead('Mørk &amp; Lund is a digital design studio built on a love of digital design.')}
      ${paragraph('We work with websites, visual identities and graphic design, with a focus on good craft, a calm process and the small details that make a difference.')}
      <div class="studio-actions"><ds-button primary data-size="large" href="#contact"><span>Contact us</span>${icon('right')}</ds-button></div>
    </div>
    ${photo('atelier-studio.jpg', 'A desk by the studio window, with a plant and a laptop', '4 / 5')}
  </section>
  ${founder('02', 'atelier-ida.jpg', 'Ida Mørk', 'Ida has more than five years of agency experience as a digital designer, specialising in visual identities and websites. She works strategically and as a whole, from the first idea to the finished implementation.', 'With a sharp eye and years of working closely with clients, she turns complex needs into clear, thorough design: digital worlds that are both visually precise and thought through in use.')}
  ${founder('03', 'atelier-anders.jpg', 'Anders Lund', 'Anders has spent many years in digital design, most recently leading marketing design at a software company, where he shaped its visual identity across platforms, website and marketing.', 'He combines design and web development with a sharp eye for structure, detail and the experience of using the thing, and turns design into scalable, finished websites of high quality.')}
  <section class="studio-section studio-two">
    ${quote('atelier-quote-health.jpg', 'Wireframes drawn on a tablet', '“It has been a good and professional collaboration from day one. Mørk &amp; Lund were structured, proactive and open, with an eye for our brand, our audience and ease of use. Having design and development in one place made it easy for us to run the site ourselves afterwards.”', 'atelier-sofie.jpg', 'Sofie Wang', 'Head of brand, Fjord Health')}
    ${quote('atelier-quote-partners.jpg', 'A hand sketching screens on paper', '“I gave them creative freedom and had little idea which direction they would take. The result was thorough and very detailed, the process easy and the prices fair. They have my warmest recommendation.”', 'atelier-mikkel.jpg', 'Mikkel Holm', 'CEO, Holm Partners')}
  </section>
  <section class="studio-section">
    <div class="studio-between"><div class="studio-copy">${big('Why companies choose Mørk &amp; Lund')}</div>${text('Swipe or use the arrows', 'size="small" tone="muted"')}</div>
    <ds-carousel label="Why companies choose us" literal slide-width="auto" no-dots buttons bleed="end">
      ${reason('01', 'Direct contact', 'The people you talk to are the people who design and build your site. No go-betweens, and nothing lost on the way.')}
      ${reason('02', 'Design and development in one place', 'We take the whole process from the first sketch to the finished code, so the site looks exactly as designed.')}
      ${reason('03', 'Experience from both sides', 'We have worked in agencies and in-house, so we know what the designer and the client each need from a collaboration.')}
      ${reason('04', 'Service after the launch', 'We are there after the launch too. Questions, corrections or new ideas for the site: we help you on.')}
    </ds-carousel>
  </section>
  <section id="contact" class="studio-section studio-band studio-two">
    <div class="studio-stack">
      <div class="studio-tight">${big('Ready to talk?')}</div>
      ${paragraph('Tell us a little about your project, your needs and your ambitions. Then we take a no-strings talk about how we can best help.')}
      <form id="studio-form" novalidate>
        <div class="studio-two" style="gap:var(--ds-unit)"><ds-input name="name" label="Name" autocomplete="name"></ds-input><ds-input name="company" label="Company (optional)" autocomplete="organization"></ds-input></div>
        <div class="studio-two" style="gap:var(--ds-unit)"><ds-input name="email" type="email" label="Email" autocomplete="email"></ds-input><ds-input name="phone" type="tel" label="Phone (optional)" autocomplete="tel"></ds-input></div>
        <ds-input name="message" multiline rows="4" label="How can we help?"></ds-input>
        <div class="studio-actions"><ds-button primary data-size="large" type="submit" id="studio-send"><span>Send</span>${icon('right')}</ds-button>${text('We reply within a working day.', 'size="small" tone="muted"')}</div>
        <ds-text id="studio-status" class="studio-status" literal role="status" wrap></ds-text>
      </form>
    </div>
    <div class="studio-stack">
      ${photo('atelier-wall.jpg', 'Printed screens pinned to the studio wall', '4 / 3')}
      <div class="studio-two" style="gap:var(--ds-unit)">
        <div class="studio-tight">${person('atelier-anders.jpg', 'Anders Lund', 'Digital designer and co-founder')}<a class="studio-link" href="tel:+4531123456">+45 31 12 34 56</a><a class="studio-link" href="mailto:anders@morklund.example">anders@morklund.example</a></div>
        <div class="studio-tight">${person('atelier-ida.jpg', 'Ida Mørk', 'Digital designer and co-founder')}<a class="studio-link" href="tel:+4531123457">+45 31 12 34 57</a><a class="studio-link" href="mailto:ida@morklund.example">ida@morklund.example</a></div>
      </div>
    </div>
  </section>
  <section class="studio-section studio-centre"><div class="studio-tight studio-centre">${text('Mørk &amp; Lund', 'size="display" strong class="studio-wordmark" wrap aria-hidden="true"')}</div></section>
</div>
<ds-footer slot="footer" brand="Mørk &amp; Lund" tagline="A design studio in Copenhagen" literal year="2026" preferences="theme" columns='[{"heading":"Studio","links":[{"label":"Cases","href":"#cases"},{"label":"Services","href":"#services"},{"label":"About","href":"#about"}]},{"heading":"Contact","links":[{"label":"hello@morklund.example","href":"mailto:hello@morklund.example"},{"label":"+45 31 12 34 56","href":"tel:+4531123456"},{"label":"Copenhagen"}]}]' policies='[{"label":"Privacy","href":"#privacy"}]'><span slot="legal" style="min-width:0">${text('Fictional demo, drawn by the Atelier library.', 'size="small" tone="muted" wrap')}</span></ds-footer>
</ds-page>`,
  script: `const form = document.querySelector('#studio-form');
const status = document.querySelector('#studio-status');
form.addEventListener('submit', event => {
 event.preventDefault();
 const name = (new FormData(form).get('name') || '').toString().trim();
 status.textContent = (name ? 'Thank you, ' + name + '. ' : 'Thank you. ') + 'We have your message and reply within a working day. Nothing is sent in this demo.';
});`,
};
