// C9Y System: the model behind system.consistency.site. Consistency's components and the sites built on
// them, as nodes and relations in the shape of 0001's System map (0001/system/server/system-inventory.json),
// so the two read alike. Design system 1 is the presentation layer; a C9Y component is what Consistency
// adds on top of it: bindings to media and backend systems, actions and logic. A c9y-button presents with
// ds-button and can link to a page, start a checkout or open a booking; ds-button only draws itself.

/** What a component is in Consistency. */
export type ComponentLayer =
  /** Edited on a page: text, image, card, button, columns… */
  | 'block'
  /** Site logic that runs for visitors: a booking flow, gift cards, a cart. */
  | 'runtime'
  /** A back-office screen in the owner's app: Orders, Bookings, Pages… */
  | 'place'
  /** Platform or engine machinery a site relies on: publishing, email, domains. */
  | 'service';

/** How the editor or platform realises a component, so a catalogue entry can be traced to code. */
export type Realisation =
  | { as: 'editor-block'; kind: string }          // BlockKind in src/c9y-constraints.ts
  | { as: 'native-block'; kind: string }          // NativeBlock kind in shared/consistency-native-page.ts
  | { as: 'atom'; tag: string }                   // fenced Markdown atom stored in site data, e.g. c9y-card
  | { as: 'insertion'; kind: string }             // SiteInsertion kind
  | { as: 'place'; id: string }                   // PLACES id in src/places/index.ts or placesOf in the platform
  | { as: 'runtime'; name: string }               // a platform runtime or a NativeRuntime name
  | { as: 'engine'; part: string };               // a Site engine module

export type C9yComponent = {
  /** `c9y-<name>`, lower case, never changed once given. */
  id: string;
  label: string;
  layer: ComponentLayer;
  /** What it does, one sentence, said of the thing. */
  summary: string;
  /** The DS1 elements it presents with; empty for a service. */
  presents: string[];
  /** What it adds beyond presentation: each a short phrase ("links to a page of the site", "Stripe Checkout"). */
  adds: string[];
  /** Media, data or backend systems it controls: "Site engine bookings", "Stripe", "Notion", "Resend". */
  systems: string[];
  realisedAs: Realisation[];
  /** Where it is implemented: `<Repository label>: <path>`, e.g. `Design system 1: packages/consistency/src/carousel.ts`. */
  source: string[];
  /** Other components it is made of or needs (ids). */
  uses?: string[];
};

export type C9ySite = {
  /** The platform registry id: `flavo`, `cph-raft`, `soendergaarden`. */
  id: string;
  label: string;
  /** Its agreed product code, and whether it is agreed or proposed. */
  code?: string;
  codeStatus?: 'agreed' | 'proposed';
  /** Its IDv1 site code on the platform. */
  siteCode: string;
  /** Live addresses, first the one people use. */
  addresses: string[];
  /** Its folder in the studio, absolute. */
  folder: string;
  /** Its node in 0001's System map. */
  systemNode?: string;
  summary: string;
};

/** How a site takes a component, in System's words (system-model.ts labels). */
export type RelationKind =
  /** Shares one copy: the site uses Consistency's own component. */
  | 'shared'
  /** Built on its own: the site has its own version beside the engine. */
  | 'local'
  /** Planned. */
  | 'opportunity'
  /** Not checked. */
  | 'unverified';

export type C9yRelation = {
  /** `<site>-<component>`. */
  id: string;
  source: string;
  target: string;
  kind: RelationKind;
  /** What the component does for this site, one or two sentences. */
  note: string;
  /** Files actually opened: `<Repository label>: <path>`; empty only for `unverified`. */
  evidence: string[];
  /** ISO date of review. */
  reviewed: string;
};

export type C9ySystem = {
  version: 1;
  reviewed: string;
  components: C9yComponent[];
  sites: C9ySite[];
  relations: C9yRelation[];
};

/** Repository labels used in `source` and `evidence`, and their folders. */
export const REPOSITORIES: Record<string, string> = {
  'Design system 1': '/Users/joachim/0001/Design system 1',
  'Consistency': '/Users/joachim/0001/Consistency',
  'Site engine': '/Users/joachim/0001/0001/system/parts/site-engine',
  'Flavo': '/Users/joachim/0001/Clients/Flavo/website',
  'CPH Raft': '/Users/joachim/0001/Clients/CPH Raft',
  'Søndergården': '/Users/joachim/0001/Clients/Soendergaarden',
};
