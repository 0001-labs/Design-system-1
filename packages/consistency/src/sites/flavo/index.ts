/**
 * Flavo's own places in Consistency's app, by the id the platform's `places` gives each (`FLAVO_PLACES` in
 * `Consistency/platform/worker/owner-api.ts`): Produkter, Udlejning, Kunder and Medier, and Flavo team and Profil,
 * which the platform no longer lists. Rental requests and sales are the app's Orders place (Ordrer), on the site
 * engine's orders. Flavo's content and project pages are rows of the app's shared Pages place (`flavoPageSource`,
 * the source the platform names `flavo`), not menus of their own.
 *
 * Sync 1 copies this folder into the app (`places` in `sync.exports.mjs`, taken into
 * `Design system 1/packages/consistency/src/sites/flavo/`); the app gives each place its context and draws it with
 * its own Design system 1 components. Nothing here imports Flavo's site or the app.
 */
import type { FlavoPlaceContext } from "./core";
import { FlavoPlaceProducts } from "./products";
import { FlavoPlaceMembers } from "./members";
import { FlavoPageEditor, flavoPageSource, PAGE_SAVED, type FlavoPageSource } from "./pages";
import { FlavoPlaceMedia } from "./media";
import { FlavoPlaceProfile } from "./profile";

export type { FlavoPlaceContext, Transport, FlavoPageRow } from "./core";
export type { FlavoPageSource };
export { FlavoPlaceProducts, FlavoPlaceMembers, FlavoPageEditor, FlavoPlaceMedia, FlavoPlaceProfile, flavoPageSource, PAGE_SAVED };

/** Makes a place's element with what it reaches Flavo through. */
export type FlavoPlaceFactory = (context: FlavoPlaceContext) => HTMLElement;

export const FLAVO_PLACES: Record<string, FlavoPlaceFactory> = {
  products: context => Object.assign(new FlavoPlaceProducts(), { context }),
  rentals: context => Object.assign(new FlavoPlaceProducts(), { context, rentals: true }),
  clients: context => Object.assign(new FlavoPlaceMembers(), { context }),
  media: context => Object.assign(new FlavoPlaceMedia(), { context }),
  team: context => Object.assign(new FlavoPlaceMembers(), { context, team: true }),
  profile: context => Object.assign(new FlavoPlaceProfile(), { context }),
};

/** Flavo's pages under the app's Pages place, by the source name the platform gives it. */
export const FLAVO_PAGE_SOURCES: Record<string, (context: FlavoPlaceContext) => FlavoPageSource> = { flavo: flavoPageSource };
