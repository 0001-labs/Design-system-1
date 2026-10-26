/**
 * Schedule, the owners' tab of Bookings, drawn as a matrix rather than a form; ported from the site engine's own app.
 *
 * - **The offers' groups** are text tabs above the matrix (`bookings-matrix.ts`): offers sharing a pool together,
 *   the rest by kind, named from the offers.
 * - **The matrix** is Design system 1's sheet on a native table: a row per offer, for trips its start times on each
 *   weekday ("10 12 14"), its price and an Open switch; for stays its price a night, its season and the switch.
 *   Pressing a cell edits it in place as one text field, read on Enter or when it is left; what cannot be read
 *   stays in the danger colour and is not kept. Each row's ⋯ is a Select: another row's week ("Same times as …"),
 *   its own season and limits in a non-modal drawer, or the group's again.
 * - **One line under it** holds the group's season (one range picker), notice, horizon and closed days, put on
 *   every offer of the group without limits of its own.
 * - **Save** sends the group's changed offers with `PUT booking-offers`; Discard takes them back. A save that fails
 *   keeps the drafts and says why. Unsaved cells are marked.
 * - **Closed for everything**, the days no offer can be booked, is saved with `PUT booking-settings` at once, and
 *   put back when the site refuses it.
 *
 * Read again whenever Bookings is, a group with unsaved changes keeping its drafts. The engine checks everything
 * again: an offer without a price cannot be booked, whatever is written here.
 */
import { LitElement, html, nothing } from 'lit';
import '../../../../DS1/3-unit/ds-calendar';
import '../../../../DS1/3-unit/ds-select';
import '../../../../DS1/3-unit/ds-tabs';
import '../../../../DS1/3-unit/ds-list';
import '../../../../DS1/3-unit/ds-row';
import '../../../../DS1/2-core/ds-button';
import '../../../../DS1/2-core/ds-icon';
import '../../../../DS1/2-core/ds-input';
import '../../../../DS1/2-core/ds-message';
import '../../../../DS1/2-core/ds-switch';
import '../../../../DS1/2-core/ds-tag';
import '../../../../DS1/2-core/ds-text';
import '../../../../DS1/4-page/ds-overlay';
import type { SiteSummary } from '../site-editing';
import { siteApi } from './api';
import { WEEKDAYS, wordsIn, type ResolvedOffer, type Weekday } from './bookings-shared';
import {
  applyLimits, changesOf, closedDayName, formatTimes, groupLimits, groupOffers, limitsOf, overrideOf, ownLimits, parsePrices, parseTimes,
  priceNames, pricesText, sameTimesAs, seasonText, shortName, timesInput, type Limits, type OfferGroup,
} from './bookings-matrix';
import { localeOfCurrency, WEEKDAY_NAMES, wholeNumber } from './bookings-view';
import { daysOf, rangeOf, seasonValue } from './calendar-value';
import { failed, say } from './place';
import type { BookingSettings } from './bookings';

interface OffersAnswer { offers?: ResolvedOffer[]; currency?: string; testMode?: boolean }

/** One tab: its offers as saved and as drafted, its shared limits, which offers keep their own, and cells that could not be read. */
export interface GroupState {
  group: OfferGroup;
  saved: Map<string, ResolvedOffer>;
  drafts: Map<string, ResolvedOffer>;
  limits: Limits;
  savedLimits: Limits;
  own: Set<string>;
  savedOwn: Set<string>;
  invalid: Set<string>;
}

const clone = <T>(value: T): T => structuredClone(value);
const filled = (offer: ResolvedOffer): ResolvedOffer => ({ ...offer, weekly: offer.weekly ?? {}, closed: offer.closed ?? [] });

function stateOf(group: OfferGroup): GroupState {
  const limits = groupLimits(group.offers)!;
  const own = ownLimits(group.offers, limits);
  return {
    group, saved: new Map(group.offers.map(offer => [offer.id, clone(offer)])), drafts: new Map(group.offers.map(offer => [offer.id, clone(offer)])),
    limits: clone(limits), savedLimits: clone(limits), own, savedOwn: new Set(own), invalid: new Set(),
  };
}
/** The group's offers whose drafts differ from what was saved. */
export const changedOffers = (state: GroupState) => state.group.offers.map(offer => offer.id).filter(id => changesOf(state.saved.get(id)!, state.drafts.get(id)!).size > 0);
/** Whether a group has anything unsaved: a changed offer, its limits, or words that could not be read. */
export const unsaved = (state: GroupState) => changedOffers(state).length > 0 || state.invalid.size > 0 || JSON.stringify(state.limits) !== JSON.stringify(state.savedLimits);

/** A cell being edited in place: its key, the words in it, and why they could not be read. */
interface Editing { key: string; value: string; error: string }
/** An offer's own season and limits being written in the drawer. */
interface OwnLimits { id: string; season: string; notice: string; horizon: string; closed: string[]; error: string }

export class ConsistencyBookingsSchedule extends LitElement {
  static properties = {
    site: { attribute: false }, states: { state: true }, current: { state: true }, error: { state: true }, currency: { state: true },
    editing: { state: true }, limitsError: { state: true }, saving: { state: true }, saveError: { state: true }, everything: { state: true },
    everythingError: { state: true }, ownLimits: { state: true },
  };
  declare site: SiteSummary;
  declare states: GroupState[] | null;
  declare current: number;
  declare error: string;
  declare currency: string;
  declare editing: Editing | null;
  declare limitsError: string;
  declare saving: boolean;
  declare saveError: string;
  /** The days closed for every offer, as saved or being saved. */
  declare everything: string[];
  declare everythingError: string;
  declare ownLimits: OwnLimits | null;
  private everythingBusy = false;

  constructor() {
    super();
    this.states = null; this.current = 0; this.error = ''; this.currency = 'dkk'; this.editing = null; this.limitsError = ''; this.saving = false;
    this.saveError = ''; this.everything = []; this.everythingError = ''; this.ownLimits = null;
  }
  protected createRenderRoot() { return this; }
  connectedCallback() { super.connectedCallback(); if (!this.states) this.refresh().catch(() => { /* said inline; read again with Bookings */ }); }

  private get locale() { return localeOfCurrency(this.currency); }
  private get symbol() {
    return new Intl.NumberFormat(this.locale, { style: 'currency', currency: this.currency.toUpperCase() }).formatToParts(0).find(part => part.type === 'currency')?.value ?? this.currency.toUpperCase();
  }
  private nameOf(offer: ResolvedOffer) { return wordsIn(offer.name, 'en') || offer.id; }

  /** The offers and the closed days, read again; a group with unsaved changes keeps its drafts. */
  async refresh(): Promise<void> {
    try {
      const [answer, settings] = await Promise.all([
        siteApi<OffersAnswer | ResolvedOffer[]>(this.site.code, 'booking-offers'),
        siteApi<BookingSettings>(this.site.code, 'booking-settings'),
      ]);
      const offers = ((Array.isArray(answer) ? answer : answer.offers) ?? []).map(filled);
      if (!Array.isArray(answer) && answer.currency) this.currency = answer.currency;
      const before = new Map((this.states ?? []).map(state => [state.group.id, state]));
      this.states = groupOffers(offers, 'en').map(group => {
        const kept = before.get(group.id);
        return kept && unsaved(kept) ? kept : stateOf(group);
      });
      this.current = Math.min(this.current, Math.max(0, this.states.length - 1));
      if (!this.everythingBusy) this.everything = [...(settings.closed ?? [])].sort();
      this.error = '';
    } catch (error) {
      this.error = failed(error, 'The schedule could not be read');
      throw error;
    }
  }

  render() {
    if (!this.states) return this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : html`<ds-text tone="muted" literal text="Reading the schedule…"></ds-text>`;
    if (!this.states.length) return html`<ds-empty literal heading="No offers"></ds-empty>`;
    const state = this.states[this.current]!;
    return html`<section class="place-schedule" aria-label="Schedule">
      ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : nothing}
      ${this.states.length > 1 ? html`<ds-tabs text class="place-tabs" aria-label="Offers">${this.states.map((each, index) => html`<ds-button control="host" role="tab"
        ?active=${index === this.current} aria-selected=${String(index === this.current)} tabindex=${index === this.current ? 0 : -1}
        @click=${() => { this.editing = null; this.saveError = ''; this.current = index; }}>${each.group.name}${unsaved(each) ? ' •' : ''}</ds-button>`)}</ds-tabs>` : nothing}
      ${this.matrix(state)}
      ${this.editing?.error ? html`<ds-message role="alert" tone="danger" literal text=${this.editing.error}></ds-message>` : nothing}
      ${this.limitsLine(state)}
      ${this.limitsError ? html`<ds-message role="alert" tone="danger" literal text=${this.limitsError}></ds-message>` : nothing}
      ${this.saveLine(state)}
      <div class="place-line place-limits">
        <ds-text tone="muted" literal text="Closed for everything"></ds-text>
        ${this.chips(this.everything, days => void this.closeEverything(days), 'Closed for everything')}
      </div>
      ${this.everythingError ? html`<ds-message role="alert" tone="danger" literal text=${this.everythingError}></ds-message>` : nothing}
      ${this.ownDrawer(state)}
    </section>`;
  }

  private draft(state: GroupState, id: string) { return state.drafts.get(id)!; }
  private changes(state: GroupState, id: string) { return changesOf(state.saved.get(id)!, this.draft(state, id)); }
  private put(state: GroupState, offer: ResolvedOffer) { state.drafts.set(offer.id, offer); this.requestUpdate(); }

  /** A cell pressed to edit in place: one text field, read on Enter or when left; Escape keeps what was there. */
  private cell(state: GroupState, key: string, label: string, shown: string, value: string, commit: (typed: string) => string | null, changed: boolean, numeric = false) {
    const editing = this.editing?.key === key ? this.editing : null;
    const close = (keep: boolean, input: HTMLInputElement) => {
      if (this.editing?.key !== key) return;
      if (keep) {
        const problem = commit(input.value);
        if (problem) { state.invalid.add(key); this.editing = { key, value: input.value, error: problem }; return; }
      }
      state.invalid.delete(key);
      this.editing = null;
    };
    return html`<td class="place-cell" ?data-numeric=${numeric} ?data-changed=${changed} ?data-invalid=${state.invalid.has(key)}>${editing
      ? html`<input class="place-cell__input" data-key=${key} aria-label=${label} autocomplete="off" spellcheck="false" .value=${editing.value} aria-invalid=${editing.error ? 'true' : 'false'}
          @keydown=${(event: KeyboardEvent) => {
            const input = event.currentTarget as HTMLInputElement;
            if (event.key === 'Enter') { event.preventDefault(); close(true, input); }
            else if (event.key === 'Escape') { event.preventDefault(); state.invalid.delete(key); this.editing = null; }
          }}
          @blur=${(event: FocusEvent) => close(true, event.currentTarget as HTMLInputElement)}>`
      : html`<button class="place-cell__press" type="button" data-key=${key} aria-label=${`${label}: ${shown || 'none'}`} @click=${() => { this.editing = { key, value, error: '' }; }}><span class="ds-table__words">${shown}</span></button>`}</td>`;
  }

  protected updated() {
    const input = this.editing ? this.querySelector<HTMLInputElement>(`.place-cell__input[data-key="${CSS.escape(this.editing.key)}"]`) : null;
    if (input && document.activeElement !== input) { input.focus(); input.select(); }
  }

  private matrix(state: GroupState) {
    const { group } = state;
    const trips = group.kind !== 'nights';
    // The offer two cells, a cell each weekday (trips) or the season (stays), the price and Open; the ⋯ a square after.
    const columns = trips ? 2 + 7 + 1 + 1 : 2 + 1 + 1 + 1;
    const symbol = this.symbol;
    return html`<div class="ds-table-scroll place-matrix-scroll"><table class="ds-table place-matrix" data-sheet data-fit style=${`--place-matrix-cells: ${columns}`} aria-label=${`${group.name}: schedule`}>
      <thead><tr>
        <th scope="col" class="place-matrix__offer">Offer</th>
        ${trips ? WEEKDAYS.map(day => html`<th scope="col" aria-label=${WEEKDAY_NAMES[day]}>${WEEKDAY_NAMES[day].slice(0, 3)}</th>`) : nothing}
        <th scope="col" data-numeric>${trips ? `Price, ${symbol}` : 'Per night'}</th>
        ${trips ? nothing : html`<th scope="col">Season</th>`}
        <th scope="col">Open</th>
        <th scope="col" class="place-matrix__more"><span class="place-hidden">More</span></th>
      </tr></thead>
      <tbody>${group.offers.map(offer => this.matrixRow(state, offer, trips))}</tbody>
    </table></div>`;
  }

  private matrixRow(state: GroupState, offer: ResolvedOffer, trips: boolean) {
    const draft = this.draft(state, offer.id);
    const changes = this.changes(state, offer.id);
    const name = this.nameOf(offer);
    const short = shortName(name, state.group.name);
    const limitsChanged = (['season', 'closed', 'noticeHours', 'horizonDays'] as const).some(change => changes.has(change));
    const weekday = (day: Weekday) => this.cell(state, `${offer.id}:${day}`, `${WEEKDAY_NAMES[day]}, ${name}, start times`, formatTimes(draft.weekly[day]), timesInput(draft.weekly[day]), typed => {
      const read = parseTimes(typed);
      if ('error' in read) return read.error;
      const next = this.draft(state, offer.id);
      this.put(state, { ...next, weekly: { ...next.weekly, [day]: read.times } });
      return null;
    }, changes.has(day));
    const price = offer.prices.length ? this.cell(state, `${offer.id}:prices`, `${name}, ${priceNames(offer.prices, 'en')}${offer.kind === 'nights' ? ' a night' : ''}, in ${this.symbol}`,
      pricesText(draft.prices, this.currency, this.locale), pricesText(draft.prices, this.currency, this.locale), typed => {
        const read = parsePrices(typed, offer.prices.length, this.currency);
        if ('error' in read) return read.error;
        const next = this.draft(state, offer.id);
        this.put(state, { ...next, prices: next.prices.map((each, index) => ({ ...each, amount: read.amounts[index]! })) });
        return null;
      }, changes.has('prices'), true) : html`<td data-numeric><span class="ds-table__words place-muted">No price</span></td>`;
    const others = state.group.offers.filter(other => other.id !== offer.id);
    const more = `place-more-${state.group.id}-${offer.id}`.replace(/[^\w-]/g, '-');
    return html`<tr data-offer=${offer.id}>
      <th scope="row" class="place-matrix__offer" aria-label=${name} ?data-changed=${limitsChanged}><span class="place-matrix__name"><span class="ds-table__words">${short}</span>${state.own.has(offer.id) ? html`<ds-tag>Own limits</ds-tag>` : nothing}</span></th>
      ${trips ? WEEKDAYS.map(weekday) : nothing}
      ${price}
      ${trips ? nothing : html`<td class="place-cell" ?data-changed=${changes.has('season')}><button class="place-cell__press" type="button" aria-label=${`${name}, season: ${seasonText(draft.season)}. Change its season and limits`} @click=${() => this.openOwn(state, offer)}><span class="ds-table__words">${seasonText(draft.season)}</span></button></td>`}
      <td class="place-matrix__open" ?data-changed=${changes.has('open')}><ds-switch><button type="button" role="switch" aria-checked=${String(draft.open)} aria-label=${`${name} is open for booking`}
        @click=${() => this.put(state, { ...this.draft(state, offer.id), open: !this.draft(state, offer.id).open })}></button></ds-switch></td>
      <td class="place-matrix__more">
        <ds-button id=${more} icon label=${`More for ${name}`}><ds-icon type="more"></ds-icon></ds-button>
        <ds-select for=${more} aria-label=${`More for ${name}`}>
          ${trips && others.length ? html`<ds-text data-ds-menu-label tone="muted" literal text="Same times as"></ds-text>
            ${others.map(other => html`<ds-button menu-item @click=${() => { this.put(state, sameTimesAs(this.draft(state, offer.id), this.draft(state, other.id))); say(`${short} has the times of ${shortName(this.nameOf(other), state.group.name)}`); }}>${shortName(this.nameOf(other), state.group.name)}</ds-button>`)}<hr>` : nothing}
          <ds-button menu-item @click=${() => this.openOwn(state, offer)}>Season and limits…</ds-button>
          ${state.own.has(offer.id) ? html`<ds-button menu-item @click=${() => this.useGroupLimits(state, offer.id)}>Use the group's limits</ds-button>` : nothing}
        </ds-select>
      </td>
    </tr>`;
  }

  /** The group's limits, put on every offer without its own. */
  private putLimits(state: GroupState, limits: Limits) {
    state.limits = limits;
    for (const offer of applyLimits([...state.drafts.values()], limits, state.own)) state.drafts.set(offer.id, offer);
    this.requestUpdate();
  }

  private limitsLine(state: GroupState) {
    const read = (patch: Partial<{ season: string; notice: string; horizon: string }>) => {
      const hours = patch.notice === undefined ? state.limits.noticeHours : wholeNumber(patch.notice, 0);
      const days = patch.horizon === undefined ? state.limits.horizonDays : wholeNumber(patch.horizon, 1);
      if (hours === null || days === null) { state.invalid.add('limits'); this.limitsError = hours === null ? 'Notice is whole hours.' : 'The horizon is at least one day.'; return; }
      state.invalid.delete('limits'); this.limitsError = '';
      this.putLimits(state, { ...state.limits, season: patch.season === undefined ? state.limits.season : rangeOf(patch.season), noticeHours: hours, horizonDays: days });
    };
    const own = state.group.offers.filter(offer => state.own.has(offer.id)).length;
    return html`<div class="place-line place-limits" role="group" aria-label=${`${state.group.name}: season and limits`}>
      <span class="place-limit"><ds-text tone="muted" literal text="Season"></ds-text><ds-calendar picker label="Season" placeholder="All year" value=${seasonValue(state.limits.season)}
        ?data-changed=${seasonValue(state.limits.season) !== seasonValue(state.savedLimits.season)} @change=${(event: CustomEvent<{ value: string }>) => read({ season: event.detail?.value ?? (event.currentTarget as HTMLInputElement).value })}></ds-calendar></span>
      <span class="place-limit"><ds-text tone="muted" literal text="Notice"></ds-text><ds-input class="place-number" aria-label="Notice, in hours" inputmode="numeric" .value=${String(state.limits.noticeHours)}
        ?data-changed=${state.limits.noticeHours !== state.savedLimits.noticeHours} @input-blur=${(event: Event) => read({ notice: (event.currentTarget as HTMLInputElement).value })}></ds-input><ds-text tone="muted" literal text="hours"></ds-text></span>
      <span class="place-limit"><ds-text tone="muted" literal text="Horizon"></ds-text><ds-input class="place-number" aria-label="Horizon, in days" inputmode="numeric" .value=${String(state.limits.horizonDays)}
        ?data-changed=${state.limits.horizonDays !== state.savedLimits.horizonDays} @input-blur=${(event: Event) => read({ horizon: (event.currentTarget as HTMLInputElement).value })}></ds-input><ds-text tone="muted" literal text="days"></ds-text></span>
      <span class="place-limit"><ds-text tone="muted" literal text="Closed"></ds-text>${this.chips(state.limits.closed, days => this.putLimits(state, { ...state.limits, closed: days }), 'Closed days',
        state.limits.closed.join() !== state.savedLimits.closed.join())}</span>
      ${own ? html`<ds-text tone="muted" literal text=${`${own} of ${state.group.offers.length} ${own === 1 ? 'has its' : 'have their'} own`}></ds-text>` : nothing}
    </div>`;
  }

  /** Closed days as tags, each with its close, then a picker and Add, which adds the day chosen or every day of the range. */
  private chips(days: readonly string[], change: (days: string[]) => void, label: string, changed = false) {
    let picker: (HTMLElement & { value: string; clear(): void }) | null = null;
    const add = (event: Event) => {
      picker = (event.currentTarget as HTMLElement).parentElement!.querySelector('ds-calendar');
      const added = daysOf(picker?.value ?? '').filter(each => !days.includes(each));
      if (added.length) change([...days, ...added].sort());
      picker?.clear();
    };
    return html`<span class="place-chips" ?data-changed=${changed}>
      <span class="place-chips__list" role="list" aria-label=${label}>${days.length ? days.map(day => html`<span class="place-chip" role="listitem">${closedDayName(day)}<ds-button icon label=${`Open ${closedDayName(day)} again`}
        @click=${() => change(days.filter(other => other !== day))}><ds-icon type="close"></ds-icon></ds-button></span>`) : html`<span class="place-muted" role="listitem">None</span>`}</span>
      <ds-calendar picker label=${`Add days to ${label.toLowerCase()}`} placeholder="Choose days"></ds-calendar>
      <ds-button secondary @click=${add}>Add</ds-button>
    </span>`;
  }

  /** Closed for everything: saved at once, put back when the site refuses it. */
  private async closeEverything(days: string[]) {
    const before = this.everything;
    this.everything = days; this.everythingBusy = true; this.everythingError = '';
    try {
      await siteApi(this.site.code, 'booking-settings', { method: 'PUT', json: { closed: days } });
      say('Closed days saved');
    } catch (error) {
      this.everything = before;
      this.everythingError = failed(error, 'The closed days were not saved');
    } finally { this.everythingBusy = false; }
  }

  private saveLine(state: GroupState) {
    const count = changedOffers(state).length;
    const invalid = state.invalid.size > 0;
    const words = invalid ? 'Put right what is in red before saving' : count ? `${count} ${count === 1 ? 'offer' : 'offers'} changed` : '';
    return html`<div class="place-line place-save">
        <ds-button primary ?disabled=${!count || invalid || this.saving} @click=${() => void this.save(state)}>Save</ds-button>
        <ds-button secondary ?disabled=${(!count && !invalid && !unsaved(state)) || this.saving} @click=${() => this.discard(state)}>Discard</ds-button>
        ${words ? html`<ds-text tone=${invalid ? 'danger' : 'muted'} literal text=${words}></ds-text>` : nothing}
      </div>
      ${this.saveError ? html`<ds-message role="alert" tone="danger" literal text=${this.saveError}></ds-message>` : nothing}`;
  }

  /** Sends the group's changed offers; what the site answers becomes what was saved. A failure keeps the drafts. */
  private async save(state: GroupState) {
    const send = changedOffers(state);
    if (!send.length || state.invalid.size || this.saving) return;
    this.saving = true; this.saveError = '';
    try {
      const answer = await siteApi<OffersAnswer | ResolvedOffer[]>(this.site.code, 'booking-offers', { method: 'PUT', json: { offers: send.map(id => overrideOf(this.draft(state, id))) } });
      const fresh = new Map(((Array.isArray(answer) ? answer : answer?.offers) ?? []).map(offer => [offer.id, filled(offer)]));
      for (const offer of state.group.offers) {
        const saved = fresh.get(offer.id) ?? this.draft(state, offer.id);
        state.saved.set(offer.id, clone(saved)); state.drafts.set(offer.id, clone(saved));
      }
      state.savedLimits = clone(state.limits); state.savedOwn = new Set(state.own);
      say(`${state.group.name} saved`);
    } catch (error) {
      this.saveError = failed(error, 'Not saved');
    } finally { this.saving = false; this.requestUpdate(); }
  }

  private discard(state: GroupState) {
    for (const offer of state.group.offers) state.drafts.set(offer.id, clone(state.saved.get(offer.id)!));
    state.limits = clone(state.savedLimits); state.own = new Set(state.savedOwn); state.invalid.clear();
    this.editing = null; this.limitsError = ''; this.saveError = '';
    this.requestUpdate();
  }

  private useGroupLimits(state: GroupState, id: string) {
    state.own.delete(id);
    this.put(state, { ...this.draft(state, id), ...limitsOf(state.limits) });
  }

  private openOwn(state: GroupState, offer: ResolvedOffer) {
    const mine = limitsOf(this.draft(state, offer.id));
    this.ownLimits = { id: offer.id, season: seasonValue(mine.season), notice: String(mine.noticeHours), horizon: String(mine.horizonDays), closed: [...mine.closed], error: '' };
  }

  /** An offer's own season and limits, in a non-modal drawer beside the matrix. */
  private ownDrawer(state: GroupState) {
    const own = this.ownLimits;
    const offer = own ? state.group.offers.find(each => each.id === own.id) : undefined;
    const set = (patch: Partial<OwnLimits>) => { this.ownLimits = { ...own!, ...patch }; };
    const done = () => {
      const hours = wholeNumber(own!.notice, 0);
      const horizonDays = wholeNumber(own!.horizon, 1);
      if (hours === null || horizonDays === null) { set({ error: 'Notice is whole hours, the horizon at least one day.' }); return; }
      state.own.add(own!.id);
      this.put(state, { ...this.draft(state, own!.id), season: rangeOf(own!.season), closed: own!.closed, noticeHours: hours, horizonDays });
      this.ownLimits = null;
    };
    return html`<ds-overlay type="drawer" non-modal .holdScroll=${false} .blockOutside=${false} ?open=${!!offer} @ds-close-request=${() => { this.ownLimits = null; }}>
      <dialog class="place-drawer" aria-labelledby="place-limits-title">${offer && own ? html`
        <div data-ds-overlay="header"><h2 data-ds-overlay="title" id="place-limits-title">${this.nameOf(offer)}</h2><p data-ds-overlay="description">Its own season and limits, in place of ${state.group.name}'s.</p></div>
        <ds-list heading="Season"><ds-row><ds-calendar picker label="Season" placeholder="All year" value=${own.season} @change=${(event: CustomEvent<{ value: string }>) => set({ season: event.detail?.value ?? '' })}></ds-calendar></ds-row></ds-list>
        <ds-list heading="When it can be booked">
          <ds-row><span class="ds-row__name">Notice, in hours</span><span class="ds-row__value"><ds-input class="place-number" aria-label="Notice, in hours" inputmode="numeric" .value=${own.notice} @input-change=${(event: CustomEvent<{ value: string }>) => set({ notice: event.detail.value })}></ds-input></span></ds-row>
          <ds-row><span class="ds-row__name">Horizon, in days</span><span class="ds-row__value"><ds-input class="place-number" aria-label="Horizon, in days" inputmode="numeric" .value=${own.horizon} @input-change=${(event: CustomEvent<{ value: string }>) => set({ horizon: event.detail.value })}></ds-input></span></ds-row>
        </ds-list>
        <ds-list heading="Closed days"><ds-row auto>${this.chips(own.closed, closed => set({ closed }), 'Closed days')}</ds-row></ds-list>
        ${own.error ? html`<ds-message role="alert" tone="danger" literal text=${own.error}></ds-message>` : nothing}
        <div data-ds-overlay="footer">
          ${state.own.has(own.id) ? html`<ds-button secondary @click=${() => { this.useGroupLimits(state, own.id); this.ownLimits = null; }}>Use the group's</ds-button>` : nothing}
          <ds-button secondary @click=${() => { this.ownLimits = null; }}>Cancel</ds-button>
          <ds-button primary @click=${done}>Done</ds-button>
        </div>` : nothing}</dialog>
    </ds-overlay>`;
  }
}
if (!customElements.get('consistency-bookings-schedule')) customElements.define('consistency-bookings-schedule', ConsistencyBookingsSchedule);
