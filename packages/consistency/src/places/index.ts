/**
 * The places of an open site in Consistency's app: the menus under the site's name in the sidebar (Pages, Emails,
 * Design, Bookings, Gift cards, a site's own), each a Lit element mounted in the work area beside the site's canvas.
 *
 * The platform says which menus a site has (`sitePlaces`); the app shows only those it has an element for, from
 * this registry by place id. A place's element is made once per site and kept, hidden while another is shown.
 */
import type { SiteSummary } from '../site-editing';
import type { SitePlace } from './api';
import { ConsistencyPlaceBookings } from './bookings';
import { ConsistencyPlaceGiftCards } from './giftcards';
import { ConsistencyPlacePages } from './pages';
import { ConsistencyPlaceEmails } from './emails';
import { ConsistencyPlaceDesign } from './design';

export { SiteApiError, siteApi, sitePlaces, type SitePlace } from './api';

/** Makes a place's element for a site; it reads and writes through `siteApi(site.code, …)`. */
export type PlaceFactory = (site: SiteSummary) => HTMLElement;

/** The places the app has an element for, by id. Each place registers itself here. */
export const PLACES = new Map<string, PlaceFactory>();
PLACES.set('pages', site => new ConsistencyPlacePages(site));
PLACES.set('emails', site => new ConsistencyPlaceEmails(site));
PLACES.set('design', site => new ConsistencyPlaceDesign(site));

/** The site's places the app can show, in the site's order. */
export const shownPlaces = (places: readonly SitePlace[]) => places.filter(place => PLACES.has(place.id));

// CPH Raft's places, on the site engine's bookings and gift cards (`/team/api/bookings…`, `/team/api/giftcards…`).
PLACES.set('bookings', site => Object.assign(new ConsistencyPlaceBookings(), { site }));
PLACES.set('giftcards', site => Object.assign(new ConsistencyPlaceGiftCards(), { site }));
