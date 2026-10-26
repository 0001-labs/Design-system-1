/**
 * Bookings, the place of a site that takes bookings (CPH Raft), ported from the site engine's own app (deleted 26
 * October 2026) onto Design system 1's Lit elements. Upcoming, Past and Cancelled as text tabs, each a list of days
 * (`ds-list heading`, a `ds-row` a booking with its time or nights, the guest, the offer, the guests, a status tag
 * and the amount in the site's own money). Pressing one opens it in a non-modal drawer beside the list, read again
 * with its history; while it is paid or held it can be cancelled and refunded, the refund the offer's rule
 * suggests, never above what was paid, confirmed in place before anything is sent. Schedule
 * (`bookings-schedule.ts`) edits the offers, and Who can book says who may book on the site, saved at once. Try
 * booking opens the site's own booking page in a tab of its own (`bookingPageOf`): the app's sandboxed document
 * runs no scripts, and the page books with them and goes on to Stripe. Every amount, capacity and status is the
 * engine's; what is typed is only asked for, and the engine checks it.
 */
import { LitElement, html, nothing } from 'lit';
import '../../../../DS1/3-unit/ds-list';
import '../../../../DS1/3-unit/ds-row';
import '../../../../DS1/3-unit/ds-tabs';
import '../../../../DS1/2-core/ds-button';
import '../../../../DS1/2-core/ds-checkbox';
import '../../../../DS1/2-core/ds-empty';
import '../../../../DS1/2-core/ds-input';
import '../../../../DS1/2-core/ds-message';
import '../../../../DS1/2-core/ds-tag';
import '../../../../DS1/2-core/ds-text';
import '../../../../DS1/4-page/ds-overlay';
import type { SiteSummary } from '../site-editing';
import { siteApi } from './api';
import { addDays, localDate, MAX_NIGHTS, suggestedRefund, wordsIn, type BookingEvent, type BookingOpen, type Cancellation, type ResolvedOffer, type TeamBookingView } from './bookings-shared';
import { amountInput, bookingPageOf, checkRefund, chooseBookings, dayName, eventName, formatMoney, groupByDay, guestsName, localeOfCurrency, ruleName, statusName, when, whenOnDay, type BookingsView } from './bookings-view';
import { failed, KeepCurrent, say, toneStyle } from './place';
import './bookings-schedule';
import type { ConsistencyBookingsSchedule } from './bookings-schedule';
import './places.css';

type Tab = BookingsView | 'schedule';
type Booking = TeamBookingView;

const TABS: { tab: Tab; name: string }[] = [
  { tab: 'upcoming', name: 'Upcoming' }, { tab: 'past', name: 'Past' }, { tab: 'cancelled', name: 'Cancelled' }, { tab: 'schedule', name: 'Schedule' },
];
const EMPTY: Record<BookingsView, string> = { upcoming: 'No bookings ahead', past: 'No past bookings yet', cancelled: 'Nothing cancelled' };

/** Who may book on the site: the engine's `booking_settings.open`. */
export const WHO: { open: BookingOpen; name: string; about: string }[] = [
  { open: 'off', name: 'Off', about: 'Visitors cannot book on the site, and its Book links go where they went before.' },
  { open: 'owners', name: 'Owners only', about: 'Everyone can go through booking on the site up to Pay, which only the site’s owners can press.' },
  { open: 'everyone', name: 'Everyone', about: 'Every visitor can book and pay on the site.' },
];

/** What the engine answers for the list: the bookings, the site's money and zone, and whether Stripe is in test mode. */
interface BookingsAnswer { bookings?: Booking[]; testMode?: boolean; timeZone?: string; currency?: string }
/** One booking with its history and the refund the offer's rule suggests. */
interface BookingDetail { booking?: Booking; events?: BookingEvent[]; history?: BookingEvent[]; suggestedRefund?: number; cancellation?: Cancellation | null }
/** What `booking-settings` answers: who may book, the days closed for every offer, and whether Stripe is in test mode. */
export interface BookingSettings { open: BookingOpen; closed?: string[]; testMode?: boolean }
/** A cancellation being written: the refund as typed, whether the guest is told, and the question once asked. */
interface Cancelling { refund: string; notify: boolean; asking: number | null; busy: boolean; error: string }

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export class ConsistencyPlaceBookings extends LitElement {
  static properties = {
    site: { attribute: false }, tab: { state: true }, lists: { state: true }, error: { state: true }, offers: { state: true },
    settings: { state: true }, opened: { state: true }, cancelling: { state: true }, who: { state: true }, scheduled: { state: true },
  };
  declare site: SiteSummary;
  declare tab: Tab;
  /** Each tab's bookings as last read, so a tab is drawn at once when it is chosen again. */
  declare lists: Partial<Record<BookingsView, BookingsAnswer>>;
  declare error: string;
  declare offers: ResolvedOffer[];
  declare settings: BookingSettings | null;
  /** The booking in the drawer, and its detail once read. */
  declare opened: { booking: Booking; detail: BookingDetail | null } | null;
  declare cancelling: Cancelling | null;
  /** Who can book being changed: what it means once changed, and an error that put it back. */
  declare who: { busy: boolean; about: string; error: string };
  /** Schedule once chosen: it stays in the page, its drafts with it, while another tab is shown. */
  declare scheduled: boolean;
  private readonly current = new KeepCurrent(this, () => this.read());

  constructor() {
    super();
    this.tab = 'upcoming'; this.lists = {}; this.error = ''; this.offers = []; this.settings = null; this.opened = null; this.cancelling = null;
    this.who = { busy: false, about: '', error: '' }; this.scheduled = false;
  }
  protected createRenderRoot() { return this; }

  private get code() { return this.site.code; }

  /** The tab's bookings, the offers (their names and rules) and who may book; the schedule reads its own. */
  private async read(): Promise<boolean> {
    if (this.tab === 'schedule') { await this.querySelector<ConsistencyBookingsSchedule>('consistency-bookings-schedule')?.refresh(); return this.readSettings(); }
    const view = this.tab;
    // Upcoming asks from a stay's length back, so a stay under way shows until its check-out; the tab chooses after.
    const day = localDate(Date.now(), this.lists[view]?.timeZone ?? browserZone());
    const query = view === 'cancelled' ? 'status=cancelled' : view === 'past' ? `to=${day}` : `from=${addDays(day, -MAX_NIGHTS)}`;
    const [list, offers] = await Promise.allSettled([
      siteApi<BookingsAnswer | Booking[]>(this.code, `bookings?${query}`),
      siteApi<{ offers?: ResolvedOffer[] } | ResolvedOffer[]>(this.code, 'booking-offers'),
      this.readSettings(),
    ]);
    if (offers.status === 'fulfilled') this.offers = (Array.isArray(offers.value) ? offers.value : offers.value.offers) ?? [];
    if (list.status === 'rejected') { this.error = failed(list.reason, 'The bookings could not be read'); return false; }
    this.error = '';
    this.lists = { ...this.lists, [view]: Array.isArray(list.value) ? { bookings: list.value } : list.value };
    return true;
  }

  private async readSettings(): Promise<boolean> {
    try {
      const settings = await siteApi<BookingSettings>(this.code, 'booking-settings');
      // A choice being saved keeps its face until the site has answered.
      if (!this.who.busy) this.settings = settings;
      return true;
    } catch { return false; }
  }

  private choose(tab: Tab) {
    if (tab === this.tab) return;
    this.tab = tab;
    if (tab === 'schedule') this.scheduled = true;
    void this.current.run();
  }

  /** Who can book, saved the moment it is chosen; a refusal puts the choice back and says why. */
  private async chooseWho(open: BookingOpen) {
    const before = this.settings;
    if (!before || before.open === open || this.who.busy) return;
    this.settings = { ...before, open };
    this.who = { busy: true, about: WHO.find(each => each.open === open)?.about ?? '', error: '' };
    try {
      await siteApi(this.code, 'booking-settings', { method: 'PUT', json: { open } });
      this.who = { ...this.who, busy: false };
      say(open === 'off' ? 'Booking is off' : open === 'owners' ? 'Only owners can book' : 'Everyone can book');
    } catch (error) {
      this.settings = before;
      this.who = { busy: false, about: '', error: failed(error, 'Who can book was not changed') };
    }
  }

  // The site's money and day, from its answers.
  private get answer(): BookingsAnswer | undefined { return this.tab === 'schedule' ? undefined : this.lists[this.tab]; }
  private currencyOf(booking?: Booking) { return booking?.currency ?? this.answer?.currency ?? Object.values(this.lists).find(each => each?.currency)?.currency ?? 'dkk'; }
  private get locale() { return localeOfCurrency(this.currencyOf()); }
  private money(minor: number, booking?: Booking) { return formatMoney(minor, this.currencyOf(booking), this.locale); }
  private offerOf(booking: Booking) { return this.offers.find(offer => offer.id === booking.offer); }
  private offerName(booking: Booking) { return wordsIn(booking.offerName ?? this.offerOf(booking)?.name ?? {}, 'en') || booking.offer; }
  private get today() { return localDate(Date.now(), this.answer?.timeZone ?? browserZone()); }

  /** Opens a booking in the drawer at once from the list, then reads it again with its history. */
  private async open(listed: Booking) {
    this.opened = { booking: listed, detail: null };
    this.cancelling = null;
    try {
      const detail = await siteApi<BookingDetail & Partial<Booking>>(this.code, `bookings/${encodeURIComponent(listed.id)}`);
      if (this.opened?.booking.id === listed.id) this.opened = { booking: detail.booking ?? { ...listed, ...detail }, detail };
    } catch {
      if (this.opened?.booking.id === listed.id) this.opened = { booking: listed, detail: { history: [] } };
    }
  }
  private close() { this.opened = null; this.cancelling = null; }

  render() {
    const settings = this.settings;
    const testMode = settings?.testMode ?? this.answer?.testMode ?? this.answer?.bookings?.some(each => each.testMode);
    const book = bookingPageOf(this.site.url);
    return html`<section class="place place-bookings" aria-label="Bookings">
      <div class="place-head">
        <ds-text class="place-title" role="heading" aria-level="1" literal size="display" text="Bookings"></ds-text>
        ${testMode ? html`<ds-tag style=${toneStyle('warning')}>Test mode</ds-tag>` : nothing}
      </div>
      <div class="place-tools">
        <ds-tabs text class="place-tabs" aria-label="Bookings">${TABS.map(each => html`<ds-button control="host" role="tab" ?active=${each.tab === this.tab}
          aria-selected=${String(each.tab === this.tab)} tabindex=${each.tab === this.tab ? 0 : -1} @click=${() => this.choose(each.tab)}>${each.name}</ds-button>`)}</ds-tabs>
        ${book ? html`<ds-button secondary class="place-try" href=${book} target="_blank" rel="noopener">Try booking</ds-button>` : nothing}
      </div>
      <div class="place-line place-who">
        <ds-text tone="muted" literal text="Who can book"></ds-text>
        <ds-tabs role="group" aria-label="Who can book">${WHO.map(each => html`<ds-button control="host" ?active=${settings?.open === each.open} aria-pressed=${String(settings?.open === each.open)}
          ?disabled=${!settings || this.who.busy} @click=${() => void this.chooseWho(each.open)}>${each.name}</ds-button>`)}</ds-tabs>
      </div>
      ${this.who.about ? html`<ds-text class="place-about" tone="muted" wrap literal text=${this.who.about} aria-live="polite"></ds-text>` : nothing}
      ${this.who.error ? html`<ds-message role="alert" tone="danger" literal text=${this.who.error}></ds-message>` : nothing}
      ${this.tab === 'schedule' ? nothing : this.list(this.tab)}
      ${this.scheduled ? html`<consistency-bookings-schedule ?hidden=${this.tab !== 'schedule'} .site=${this.site}></consistency-bookings-schedule>` : nothing}
      ${this.drawer()}
    </section>`;
  }

  private list(view: BookingsView) {
    const answer = this.lists[view];
    if (!answer) return this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : html`<ds-text tone="muted" literal text="Reading the bookings…"></ds-text>`;
    const today = this.today;
    const shown = chooseBookings(answer.bookings ?? [], view, today);
    return html`${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : nothing}
      ${shown.length ? groupByDay(shown).map(({ day, bookings }) => html`<ds-list class="place-day" heading=${dayName(day, today)}>${bookings.map(booking => this.row(booking))}</ds-list>`)
        : html`<ds-empty literal heading=${EMPTY[view]}></ds-empty>`}`;
  }

  private row(booking: Booking) {
    const status = statusName(booking.status);
    return html`<ds-row interactive class="place-booking" data-booking=${booking.code} ?open=${this.opened?.booking.id === booking.id} @ds-row-press=${() => void this.open(booking)}>
      <span class="place-booking__when">${whenOnDay(booking)}</span>
      <span class="ds-row__name">${booking.guest?.name || booking.code}</span>
      <span class="place-muted place-booking__offer">${this.offerName(booking)}</span>
      <span class="place-muted place-booking__guests">${guestsName(booking.guests)}</span>
      <ds-tag style=${toneStyle(status.tone)}>${status.name}</ds-tag>
      <span class="ds-row__value">${this.money(booking.paid, booking)}</span>
    </ds-row>`;
  }

  /** The drawer beside the list: one booking, its guest, tickets, payment and history, and Cancel and refund. */
  private drawer() {
    const opened = this.opened;
    const booking = opened?.booking;
    return html`<ds-overlay type="drawer" non-modal .holdScroll=${false} .blockOutside=${false} ?open=${!!booking} @ds-close-request=${() => this.close()}>
      <dialog class="place-drawer" aria-labelledby="place-booking-title">${booking ? this.detail(booking, opened!.detail) : nothing}</dialog>
    </ds-overlay>`;
  }

  private detail(booking: Booking, detail: BookingDetail | null) {
    const offer = this.offerOf(booking);
    const status = statusName(booking.status);
    const currency = this.currencyOf(booking);
    const today = this.today;
    const start = booking.nights ? `${dayName(booking.date, today)}, ${whenOnDay(booking)}` : `${dayName(booking.date, today)} at ${booking.time ?? ''}`;
    const history = detail?.history ?? detail?.events ?? [];
    const rule = detail?.cancellation ?? offer?.cancellation;
    const line = (name: unknown, value?: unknown) => html`<ds-row><span class="ds-row__name">${name}</span>${value === undefined ? nothing : html`<span class="ds-row__value">${value}</span>`}</ds-row>`;
    return html`<div data-ds-overlay="header"><h2 data-ds-overlay="title" id="place-booking-title">${this.offerName(booking)}</h2><p data-ds-overlay="description">${start} · ${booking.code}</p></div>
      <ds-list heading="Guest">
        ${line(booking.guest?.name || 'No name')}
        ${booking.guest?.email ? line(html`<a class="ds-link" href=${`mailto:${booking.guest.email}`}>${booking.guest.email}</a>`) : nothing}
        ${booking.guest?.phone ? line(html`<a class="ds-link" href=${`tel:${booking.guest.phone.replace(/\s/g, '')}`}>${booking.guest.phone}</a>`) : nothing}
      </ds-list>
      ${booking.guest?.note ? html`<ds-text class="place-note" wrap literal text=${booking.guest.note}></ds-text>` : nothing}
      <ds-list heading="Tickets">
        ${(booking.tickets ?? []).map(each => line(html`${wordsIn(each.name, 'en') || each.priceId} <span class="place-muted">× ${each.quantity}${booking.kind === 'nights' ? (each.quantity === 1 ? ' night' : ' nights') : ''}</span>`, this.money(each.unitAmount * each.quantity, booking)))}
        ${line('Guests', String(booking.guests))}
        ${booking.amount !== booking.paid ? line('Total', this.money(booking.amount, booking)) : nothing}
      </ds-list>
      <ds-list heading="Payment">
        ${line('Status', html`<ds-tag style=${toneStyle(status.tone)}>${status.name}</ds-tag>`)}
        ${line('Paid', this.money(booking.paid, booking))}
        ${booking.refunded ? line('Refunded', this.money(booking.refunded, booking)) : nothing}
        ${rule ? line(html`<span class="place-muted">${ruleName(rule, currency, this.locale)}</span>`) : nothing}
        ${booking.stripe?.paymentIntent ? line('Stripe', html`<code class="place-code">${booking.stripe.paymentIntent}</code>`) : nothing}
        ${booking.testMode ? line(html`<ds-tag style=${toneStyle('warning')}>Test mode</ds-tag>`) : nothing}
      </ds-list>
      <ds-list heading="History">
        ${detail === null ? line(html`<span class="place-muted">Reading…</span>`)
          : history.length ? history.map(event => line(eventName(event, currency, this.locale), html`<span class="place-muted">${event.by ? `${event.by}, ` : ''}${when(event.at)}</span>`))
            : line(html`<span class="place-muted">Booked ${when(booking.createdAt)}</span>`)}
      </ds-list>
      ${booking.status === 'confirmed' || booking.status === 'pending' ? this.cancel(booking, detail, offer) : nothing}
      <div data-ds-overlay="footer"><ds-button secondary @click=${() => this.close()}>Close</ds-button></div>`;
  }

  // Cancel and refund: the suggestion filled in, checked against what was paid, confirmed in place before it is sent.
  private cancel(booking: Booking, detail: BookingDetail | null, offer: ResolvedOffer | undefined) {
    const currency = this.currencyOf(booking);
    const paid = Math.max(0, booking.paid - booking.refunded);
    const suggested = Math.min(detail?.suggestedRefund ?? (offer ? suggestedRefund(offer.cancellation, paid, booking.start, Date.now()) : paid), paid);
    const state = this.cancelling ?? { refund: amountInput(suggested, currency, this.locale), notify: true, asking: null, busy: false, error: '' };
    const set = (next: Partial<Cancelling>) => { this.cancelling = { ...state, ...next }; };
    const ask = () => {
      const checked = checkRefund(state.refund, paid, currency, this.locale);
      if ('error' in checked) set({ error: checked.error, asking: null });
      else set({ error: '', asking: checked.minor });
    };
    const confirm = async (refundMinor: number) => {
      set({ busy: true });
      try {
        await siteApi(this.code, `bookings/${encodeURIComponent(booking.id)}/cancel`, { method: 'POST', json: { refundMinor, notify: state.notify } });
        say(refundMinor ? `${booking.code} is cancelled and ${formatMoney(refundMinor, currency, this.locale)} refunded` : `${booking.code} is cancelled`);
        this.close();
        void this.current.run();
      } catch (error) {
        this.cancelling = { ...state, busy: false, asking: null, error: failed(error, 'It was not cancelled') };
      }
    };
    const refundWords = state.asking ? ` and refund ${formatMoney(state.asking, currency, this.locale)}` : ' with no refund';
    return html`<ds-list heading="Cancel and refund" class="place-cancel">
        <ds-row><span class="ds-row__name">Refund</span><span class="ds-row__value"><ds-input class="place-amount" aria-label="Refund" inputmode="decimal" autocomplete="off"
          ?disabled=${paid === 0 || state.busy} .value=${state.refund} @input-change=${(event: CustomEvent<{ value: string }>) => set({ refund: event.detail.value, asking: null, error: '' })}></ds-input></span></ds-row>
        <ds-row><span class="ds-row__name place-muted">${paid ? `At most ${formatMoney(paid, currency, this.locale)}; the rule suggests ${formatMoney(suggested, currency, this.locale)}` : 'Nothing was paid, so nothing is refunded'}</span></ds-row>
        <ds-row><label class="place-check"><ds-checkbox><input type="checkbox" .checked=${state.notify} ?disabled=${state.busy} @change=${(event: Event) => set({ notify: (event.target as HTMLInputElement).checked, asking: null })}></ds-checkbox>Tell the guest by email</label></ds-row>
      </ds-list>
      ${state.error ? html`<ds-message role="alert" tone="danger" literal text=${state.error}></ds-message>` : nothing}
      ${state.asking === null ? html`<div class="place-actions"><ds-button secondary danger ?disabled=${state.busy} @click=${ask}>${paid ? 'Cancel and refund' : 'Cancel'}</ds-button></div>`
        : html`<div class="place-confirm" role="group" aria-label="Confirm the cancellation">
          <ds-text wrap literal text=${`Cancel ${booking.code}${refundWords}${state.notify ? ', telling the guest' : ''}? This cannot be undone.`}></ds-text>
          <div class="place-actions"><ds-button primary danger ?disabled=${state.busy} @click=${() => void confirm(state.asking!)}>Cancel the booking</ds-button>
          <ds-button secondary ?disabled=${state.busy} @click=${() => set({ asking: null })}>Keep it</ds-button></div>
        </div>`}`;
  }
}
if (!customElements.get('consistency-place-bookings')) customElements.define('consistency-place-bookings', ConsistencyPlaceBookings);

