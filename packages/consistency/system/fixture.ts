import type { C9ySystem } from './model';

/** A small C9Y System for the page's own tests: two sites, one component in each layer and one of each relation kind. */
export const FIXTURE: C9ySystem = {
  version: 1,
  reviewed: '2026-10-27',
  components: [
    {
      id: 'c9y-button', label: 'Button', layer: 'block', summary: 'A button that does something on the site.',
      presents: ['ds-button'], adds: ['links to a page of the site', 'starts a Stripe Checkout'], systems: ['Stripe'],
      realisedAs: [{ as: 'editor-block', kind: 'button' }], source: ['Design system 1: packages/consistency/src/button.ts'],
    },
    {
      id: 'c9y-card', label: 'Card', layer: 'block', summary: 'A card with a picture and a link.',
      presents: ['ds-card', 'ds-text'], adds: ['picture from the media library'], systems: ['Site engine media'],
      realisedAs: [{ as: 'atom', tag: 'c9y-card' }], source: ['Design system 1: packages/consistency/src/card.ts'],
    },
    {
      id: 'c9y-booking', label: 'Booking', layer: 'runtime', summary: 'Visitors book a trip and pay for it.',
      presents: ['ds-calendar', 'ds-button'], adds: ['availability', 'payment'], systems: ['Site engine bookings', 'Stripe'],
      realisedAs: [{ as: 'runtime', name: 'booking' }], source: ['Site engine: src/booking.ts'], uses: ['c9y-button'],
    },
    {
      id: 'c9y-orders', label: 'Orders', layer: 'place', summary: 'The owner sees and refunds orders.',
      presents: ['ds-table'], adds: ['refunds'], systems: ['Stripe'],
      realisedAs: [{ as: 'place', id: 'orders' }], source: ['Design system 1: packages/consistency/src/places/orders.ts'],
    },
    {
      id: 'c9y-publishing', label: 'Publishing', layer: 'service', summary: 'Publishes a site to its addresses.',
      presents: [], adds: ['builds and uploads the site'], systems: ['Cloudflare'],
      realisedAs: [{ as: 'engine', part: 'publish' }], source: ['Site engine: src/publish.ts'],
    },
  ],
  sites: [
    {
      id: 'flavo', label: 'Flavo', code: 'FLV', codeStatus: 'agreed', siteCode: '12ABCD',
      addresses: ['https://flavo.example', 'https://www.flavo.example'], folder: '/Users/joachim/0001/Clients/Flavo/website',
      systemNode: 'flavo', summary: 'A flavour shop.',
    },
    {
      id: 'cph-raft', label: 'CPH Raft', code: 'CPR', codeStatus: 'proposed', siteCode: '34EFGH',
      addresses: ['https://cphraft.example'], folder: '/Users/joachim/0001/Clients/CPH Raft',
      systemNode: 'cph-raft', summary: 'Raft trips in Copenhagen.',
    },
  ],
  relations: [
    { id: 'flavo-c9y-button', source: 'flavo', target: 'c9y-button', kind: 'shared', note: 'Buttons on every page.', evidence: ['Flavo: src/pages/index.ts'], reviewed: '2026-10-27' },
    { id: 'flavo-c9y-orders', source: 'flavo', target: 'c9y-orders', kind: 'local', note: 'Its own orders screen.', evidence: ['Flavo: src/orders.ts'], reviewed: '2026-10-27' },
    { id: 'flavo-c9y-publishing', source: 'flavo', target: 'c9y-publishing', kind: 'shared', note: 'Published by the engine.', evidence: ['Site engine: src/publish.ts'], reviewed: '2026-10-27' },
    { id: 'cph-raft-c9y-button', source: 'cph-raft', target: 'c9y-button', kind: 'shared', note: 'Book now buttons.', evidence: ['CPH Raft: src/index.ts'], reviewed: '2026-10-27' },
    { id: 'cph-raft-c9y-booking', source: 'cph-raft', target: 'c9y-booking', kind: 'opportunity', note: 'Moving its booking flow onto the engine.', evidence: ['CPH Raft: src/booking.ts'], reviewed: '2026-10-27' },
    { id: 'cph-raft-c9y-card', source: 'cph-raft', target: 'c9y-card', kind: 'unverified', note: 'Cards on the trips page, not yet checked.', evidence: [], reviewed: '2026-10-27' },
  ],
};
