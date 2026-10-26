/**
 * Flavo's own places (Produkter, Udlejning, Kunder, Medier; Flavo team and Profil, which the platform no longer lists),
 * Flavo's `places` export taken by Sync 1 into `../sites/flavo/` (never edited here), and its pages under the shared
 * Pages place: the `flavo` page source, its content and project pages, each with its address. Each is given what it
 * reaches Flavo through: its business operations (`api/business`, the platform's allowlist), its address for pictures
 * and pages, and the app's toast. The Design system 1 components they draw with and their styles are registered here,
 * so the copy needs nothing of the app.
 *
 * Only Flavo's places list these ids (the platform's `FLAVO_PLACES`), and only Flavo's Pages place names the `flavo`
 * source, so another site never shows them.
 */
import '../../../../DS1/3-unit/ds-list';
import '../../../../DS1/3-unit/ds-row';
import '../../../../DS1/3-unit/ds-tabs';
import '../../../../DS1/3-unit/ds-select';
import '../../../../DS1/2-core/ds-button';
import '../../../../DS1/2-core/ds-checkbox';
import '../../../../DS1/2-core/ds-empty';
import '../../../../DS1/2-core/ds-input';
import '../../../../DS1/2-core/ds-message';
import '../../../../DS1/2-core/ds-tag';
import '../../../../DS1/2-core/ds-text';
import '../../../../DS1/4-page/ds-overlay';
import type { SiteSummary } from '../site-editing';
import { FLAVO_PAGE_SOURCES, FLAVO_PLACES, type FlavoPlaceContext } from '../sites/flavo/index';
import { siteApi } from './api';
import { PAGE_SOURCES } from './pages';
import { say } from './place';
import './places.css';
import '../sites/flavo/places.css';

/** The site's own address, whose pictures and pages the places show; none when it has no address. */
const originOf = (url: string) => { try { return new URL(url).origin; } catch { return ''; } };

/** What a Flavo place reaches its site through, for one site. */
export function flavoContext(site: SiteSummary): FlavoPlaceContext {
  return {
    async transport(operation, args = {}) {
      const answer = await siteApi<{ value?: unknown }>(site.code, 'business', { method: 'POST', json: { operation, args } });
      return answer?.value ?? null;
    },
    origin: originOf(site.url),
    say,
  };
}

/** Flavo's places, by id, for the app's registry. */
export const flavoPlaces = Object.entries(FLAVO_PLACES).map(([id, make]) => [id, (site: SiteSummary) => make(flavoContext(site))] as const);

// Flavo's pages under Pages, by the source name the platform gives on its Pages place; its editor's save sends Pages'
// `consistency-page-saved` (`tests/places-flavo.mjs` holds that).
for (const [name, source] of Object.entries(FLAVO_PAGE_SOURCES)) PAGE_SOURCES.set(name, site => source(flavoContext(site)));
