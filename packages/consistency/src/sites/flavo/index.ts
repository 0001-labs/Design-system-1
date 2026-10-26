/**
 * Flavo's own places in Consistency's app, by the id the platform's `places` gives each (`FLAVO_PLACES` in
 * `Consistency/platform/worker/owner-api.ts`): Produkter, Udlejning, Kunder, Projekter, Indhold, Medier, Flavo team,
 * Profil and Designretning. Rental requests and sales are the app's Orders place (Ordrer), on the site engine's orders.
 *
 * Sync 1 copies this folder into the app (`places` in `sync.exports.mjs`, taken into
 * `Design system 1/packages/consistency/src/sites/flavo/`); the app gives each place its context and draws it with
 * its own Design system 1 components. Nothing here imports Flavo's site or the app.
 */
import type { FlavoPlaceContext } from "./core";
import { FlavoPlaceProducts } from "./products";
import { FlavoPlaceMembers } from "./members";
import { FlavoPlacePages } from "./pages";
import { FlavoPlaceMedia } from "./media";
import { FlavoPlaceProfile } from "./profile";
import { FlavoPlaceDesign } from "./design";

export type { FlavoPlaceContext, Transport, SiteRoute } from "./core";
export { FlavoPlaceProducts, FlavoPlaceMembers, FlavoPlacePages, FlavoPlaceMedia, FlavoPlaceProfile, FlavoPlaceDesign };

/** Makes a place's element with what it reaches Flavo through. */
export type FlavoPlaceFactory = (context: FlavoPlaceContext) => HTMLElement;

export const FLAVO_PLACES: Record<string, FlavoPlaceFactory> = {
  products: context => Object.assign(new FlavoPlaceProducts(), { context }),
  rentals: context => Object.assign(new FlavoPlaceProducts(), { context, rentals: true }),
  clients: context => Object.assign(new FlavoPlaceMembers(), { context }),
  projects: context => Object.assign(new FlavoPlacePages(), { context, projects: true }),
  content: context => Object.assign(new FlavoPlacePages(), { context }),
  media: context => Object.assign(new FlavoPlaceMedia(), { context }),
  team: context => Object.assign(new FlavoPlaceMembers(), { context, team: true }),
  profile: context => Object.assign(new FlavoPlaceProfile(), { context }),
  layout: context => Object.assign(new FlavoPlaceDesign(), { context }),
};
