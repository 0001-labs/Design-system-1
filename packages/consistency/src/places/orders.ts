/**
 * Orders, the one place of a site that takes requests or sales, on the site engine's orders
 * (`/team/api/orders…`), under the site's own word for them (`orders/config`'s `label` in the app's language, else
 * Orders). The list is newest first, a page at a time with Show more; its kinds are text tabs (labelled by the
 * site's `kindLabels`) when the site takes more than one, its status a Select, and a search reads the code, the
 * customer and the invoice number. Each order is a `ds-row`: its code in the code face, the customer, a kind tag, a
 * status tag, the total in the site's own money and when it happens. Pressing one opens it in a non-modal drawer
 * beside the list: its lines, customer, payment (Stripe, the invoice's number and due day, paid and refunded),
 * history and the team's note, edited in place and saved on leaving it. The steps the engine allows from its
 * status are buttons; cancelling (declining a request) is confirmed in place before anything is sent. Who can
 * order says who may place one on the site, saved at once. Every amount, status and step is the engine's: it checks
 * each step again and refuses one the status no longer allows.
 */
import { LitElement, html, nothing } from 'lit';
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
import { siteApi } from './api';
import { amountInput, checkRefund, formatMoney, localeOfCurrency, when } from './bookings-view';
import {
  allowedSteps, dayAt, kindLabel, lineSpan, orderAt, orderEventName, ordersLabel, ordersQuery, orderStatusName, paymentName, STATUSES, stepDone, stepName, stepNotifies, WHO_ORDERS,
  type OrderAction, type OrderDetail, type OrderKind, type OrderOpen, type OrdersAnswer, type OrdersConfig, type OrdersFilter, type OrderStatus, type OrderView,
} from './orders-view';
import { failed, KeepCurrent, say, toneStyle } from './place';
import './places.css';

/** A page of the list. */
const PAGE = 50;
/** The most a fresh read asks for at once, so the pages shown so far stay. */
const MOST = 200;
/** How long the search waits after the last key before it asks. */
const SEARCH_WAIT = 300;

/** A step being taken, or cancelling being asked about: the refund as typed and whether the customer is told. */
interface Acting { step: OrderAction | null; asking: boolean; refund: string; notify: boolean; busy: boolean; error: string }
/** The team's note being written: as typed, as last saved, and whether it is being saved. */
interface Noting { text: string; saved: string; busy: boolean; error: string }

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export class ConsistencyPlaceOrders extends LitElement {
  static properties = {
    site: { attribute: false }, config: { state: true }, filter: { state: true }, answer: { state: true }, error: { state: true }, more: { state: true },
    opened: { state: true }, acting: { state: true }, noting: { state: true }, who: { state: true },
  };
  declare site: SiteSummary;
  /** The site's words for its orders, its kinds and who may order. */
  declare config: OrdersConfig | null;
  declare filter: OrdersFilter;
  /** The orders shown, the pages read so far, and the cursor for the next. */
  declare answer: OrdersAnswer | null;
  declare error: string;
  /** Show more being read. */
  declare more: boolean;
  /** The order in the drawer, and its detail once read. */
  declare opened: { order: OrderView; detail: OrderDetail | null } | null;
  declare acting: Acting;
  declare noting: Noting;
  /** Who can order being changed: what it means once changed, and an error that put it back. */
  declare who: { busy: boolean; about: string; error: string };
  private readonly current = new KeepCurrent(this, () => this.read());
  private searching: ReturnType<typeof setTimeout> | undefined;
  /** Each read's turn, so an older answer never draws over a newer filter's. */
  private turn = 0;

  constructor() {
    super();
    this.config = null; this.filter = { kind: null, status: null, q: '' }; this.answer = null; this.error = ''; this.more = false; this.opened = null;
    this.acting = this.fresh(); this.noting = { text: '', saved: '', busy: false, error: '' }; this.who = { busy: false, about: '', error: '' };
  }
  protected createRenderRoot() { return this; }
  disconnectedCallback() { super.disconnectedCallback(); clearTimeout(this.searching); }
  private get code() { return this.site.code; }
  private fresh(): Acting { return { step: null, asking: false, refund: '', notify: true, busy: false, error: '' }; }

  /** The site's words and who may order, and the list as far as it was read; the drawer's order follows it. */
  private async read(): Promise<boolean> {
    const turn = ++this.turn;
    const shown = this.answer?.orders?.length ?? 0;
    const [config, list] = await Promise.allSettled([
      siteApi<OrdersConfig>(this.code, 'orders/config'),
      siteApi<OrdersAnswer>(this.code, ordersQuery(this.filter, null, Math.min(MOST, Math.max(PAGE, shown)))),
    ]);
    if (config.status === 'fulfilled' && !this.who.busy) this.config = config.value;
    if (turn !== this.turn) return true;
    if (list.status === 'rejected') { this.error = failed(list.reason, `The ${this.label.many.toLowerCase()} could not be read`); return false; }
    this.error = '';
    this.answer = list.value;
    const open = this.opened && list.value.orders?.find(order => order.id === this.opened!.order.id);
    if (open && this.opened) this.opened = { ...this.opened, order: open };
    return true;
  }

  /** The next page after the last one shown. */
  private async showMore() {
    const after = this.answer?.next;
    if (!after || this.more) return;
    this.more = true;
    const turn = this.turn;
    try {
      const page = await siteApi<OrdersAnswer>(this.code, ordersQuery(this.filter, after, PAGE));
      if (turn === this.turn && this.answer) this.answer = { ...this.answer, orders: [...(this.answer.orders ?? []), ...(page.orders ?? [])], next: page.next ?? null };
    } catch (error) {
      this.error = failed(error, 'The next orders could not be read');
    } finally { this.more = false; }
  }

  /** A filter changed: the list from its first page. */
  private refilter(next: Partial<OrdersFilter>) {
    this.filter = { ...this.filter, ...next };
    this.answer = null;
    void this.current.run();
  }
  private search(q: string) {
    clearTimeout(this.searching);
    this.searching = setTimeout(() => { if (q.trim() !== this.filter.q.trim()) this.refilter({ q }); }, SEARCH_WAIT);
  }

  /** Who can order, saved the moment it is chosen; a refusal puts the choice back and says why. */
  private async chooseWho(open: OrderOpen) {
    const before = this.config;
    if (!before || before.open === open || this.who.busy) return;
    this.config = { ...before, open };
    this.who = { busy: true, about: WHO_ORDERS.find(each => each.open === open)?.about ?? '', error: '' };
    try {
      await siteApi(this.code, 'order-settings', { method: 'PUT', json: { open } });
      this.who = { ...this.who, busy: false };
      say(open === 'off' ? 'Ordering is off' : open === 'owners' ? 'Only owners can order' : 'Everyone can order');
    } catch (error) {
      this.config = before;
      this.who = { busy: false, about: '', error: failed(error, 'Who can order was not changed') };
    }
  }

  // The site's words, money and zone.
  private get label() { return ordersLabel(this.config ?? this.answer); }
  private get about() { return this.config ?? this.answer; }
  private get kinds(): OrderKind[] { return this.about?.kinds ?? []; }
  private get zone() { return this.about?.timeZone ?? browserZone(); }
  private currencyOf(order?: OrderView) { return order?.currency ?? this.about?.currency ?? 'dkk'; }
  private money(minor: number, order?: OrderView) { const currency = this.currencyOf(order); return formatMoney(minor, currency, localeOfCurrency(currency)); }

  /** Opens an order in the drawer at once from the list, then reads it again with its history. */
  private async open(listed: OrderView) {
    this.opened = { order: listed, detail: null };
    this.acting = this.fresh();
    this.noting = { text: listed.note, saved: listed.note, busy: false, error: '' };
    try {
      const detail = await siteApi<OrderDetail>(this.code, `orders/${encodeURIComponent(listed.id)}`);
      if (this.opened?.order.id === listed.id) this.take(detail);
    } catch {
      if (this.opened?.order.id === listed.id) this.opened = { order: listed, detail: { order: listed, events: [] } };
    }
  }
  /** An order's answer: into the drawer and the list; the note being written stays. */
  private take(detail: OrderDetail) {
    this.opened = { order: detail.order, detail };
    if (this.noting.text === this.noting.saved) this.noting = { ...this.noting, text: detail.order.note, saved: detail.order.note };
    else this.noting = { ...this.noting, saved: detail.order.note };
    if (this.answer?.orders) this.answer = { ...this.answer, orders: this.answer.orders.map(each => each.id === detail.order.id ? detail.order : each) };
  }
  private close() { this.opened = null; this.acting = this.fresh(); }

  /** A step, as the engine takes it; it answers the order as it is now, or refuses a step its status no longer allows. */
  private async step(order: OrderView, step: OrderAction, body: Record<string, unknown> = {}) {
    this.acting = { ...this.acting, step, busy: true, error: '' };
    try {
      const detail = await siteApi<OrderDetail>(this.code, `orders/${encodeURIComponent(order.id)}/${step}`, { method: 'POST', json: { ...(stepNotifies(step) ? { notify: this.acting.notify } : {}), ...body } });
      say(stepDone(step, order));
      if (this.opened?.order.id === order.id) this.take(detail);
      this.acting = { ...this.fresh(), notify: this.acting.notify };
      void this.current.run();
    } catch (error) {
      this.acting = { ...this.acting, busy: false, asking: false, error: failed(error, `${stepName(step, order)} did not go through`) };
    }
  }

  /** The note, saved on leaving it when it changed; a refusal puts the saved one back and says why. */
  private async saveNote(order: OrderView) {
    const { text, saved } = this.noting;
    if (text === saved || this.noting.busy) return;
    this.noting = { ...this.noting, busy: true, error: '' };
    try {
      const detail = await siteApi<OrderDetail>(this.code, `orders/${encodeURIComponent(order.id)}/note`, { method: 'PUT', json: { note: text } });
      this.noting = { text: detail.order.note, saved: detail.order.note, busy: false, error: '' };
      if (this.opened?.order.id === order.id) this.take(detail);
      say('The note is saved');
    } catch (error) {
      this.noting = { text: saved, saved, busy: false, error: failed(error, 'The note was not saved') };
    }
  }

  render() {
    const label = this.label;
    const testMode = this.about?.testMode;
    const open = this.config?.open;
    return html`<section class="place place-orders" aria-label=${label.many}>
      <div class="place-head">
        <ds-text class="place-title" role="heading" aria-level="1" literal size="display" text=${label.many}></ds-text>
        ${testMode ? html`<ds-tag style=${toneStyle('warning')}>Test mode</ds-tag>` : nothing}
      </div>
      <div class="place-tools">
        ${this.kinds.length > 1 ? html`<ds-tabs text class="place-tabs" aria-label="Kinds">${[null, ...this.kinds].map(kind => {
          const chosen = this.filter.kind === kind;
          return html`<ds-button control="host" role="tab" ?active=${chosen} aria-selected=${String(chosen)} tabindex=${chosen ? 0 : -1}
            @click=${() => { if (!chosen) this.refilter({ kind }); }}>${kind ? kindLabel(this.about, kind).many : 'All'}</ds-button>`;
        })}</ds-tabs>` : nothing}
        <span class="place-filters">
          <ds-select class="place-status"><select aria-label="Status" .value=${this.filter.status ?? ''} @change=${(event: Event) => this.refilter({ status: ((event.target as HTMLSelectElement).value || null) as OrderStatus | null })}>
            <option value="" ?selected=${!this.filter.status}>Every status</option>
            ${STATUSES.map(status => html`<option value=${status} ?selected=${this.filter.status === status}>${orderStatusName(status).name}</option>`)}
          </select></ds-select>
          <ds-input class="place-search" type="search" aria-label="Search" placeholder="Search" autocomplete="off" .value=${this.filter.q}
            @input-change=${(event: CustomEvent<{ value: string }>) => this.search(event.detail.value)}></ds-input>
        </span>
      </div>
      <div class="place-line place-who">
        <ds-text tone="muted" literal text="Who can order"></ds-text>
        <ds-tabs role="group" aria-label="Who can order">${WHO_ORDERS.map(each => html`<ds-button control="host" ?active=${open === each.open} aria-pressed=${String(open === each.open)}
          ?disabled=${!this.config || this.who.busy} @click=${() => void this.chooseWho(each.open)}>${each.name}</ds-button>`)}</ds-tabs>
      </div>
      ${this.who.about ? html`<ds-text class="place-about" tone="muted" wrap literal text=${this.who.about} aria-live="polite"></ds-text>` : nothing}
      ${this.who.error ? html`<ds-message role="alert" tone="danger" literal text=${this.who.error}></ds-message>` : nothing}
      ${this.list()}
      ${this.drawer()}
    </section>`;
  }

  private list() {
    const answer = this.answer;
    const error = this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : nothing;
    if (!answer) return this.error ? error : html`<ds-text tone="muted" literal text=${`Reading the ${this.label.many.toLowerCase()}…`}></ds-text>`;
    const orders = answer.orders ?? [];
    const filtered = this.filter.kind || this.filter.status || this.filter.q.trim();
    return html`${error}
      ${orders.length ? html`<ds-list class="place-orders__list">${orders.map(order => this.row(order))}</ds-list>`
        : html`<ds-empty literal heading=${filtered ? `No ${this.label.many.toLowerCase()} match` : `No ${this.label.many.toLowerCase()} yet`}></ds-empty>`}
      ${answer.next ? html`<div class="place-actions"><ds-button secondary ?disabled=${this.more} @click=${() => void this.showMore()}>Show more</ds-button></div>` : nothing}`;
  }

  private row(order: OrderView) {
    const status = orderStatusName(order.status);
    return html`<ds-row interactive class="place-order" data-order=${order.code} ?open=${this.opened?.order.id === order.id} @ds-row-press=${() => void this.open(order)}>
      <code class="place-code place-order__code">${order.code}</code>
      <span class="ds-row__name">${order.customer?.name || order.customer?.email || order.code}</span>
      ${this.kinds.length > 1 ? html`<ds-tag class="place-order__kind">${kindLabel(this.about, order.kind).one}</ds-tag>` : nothing}
      <ds-tag class="place-order__status" style=${toneStyle(status.tone)}>${status.name}</ds-tag>
      <span class="place-muted place-order__when">${dayAt(orderAt(order), this.zone)}</span>
      <span class="ds-row__value">${this.money(order.totalMinor, order)}</span>
    </ds-row>`;
  }

  /** The drawer beside the list: one order, its lines, customer, payment, history and note, and its steps. */
  private drawer() {
    const opened = this.opened;
    return html`<ds-overlay type="drawer" non-modal .holdScroll=${false} .blockOutside=${false} ?open=${!!opened} @ds-close-request=${() => this.close()}>
      <dialog class="place-drawer" aria-labelledby="place-order-title">${opened ? this.detail(opened.order, opened.detail) : nothing}</dialog>
    </ds-overlay>`;
  }

  private detail(order: OrderView, detail: OrderDetail | null) {
    const status = orderStatusName(order.status);
    const currency = this.currencyOf(order);
    const locale = localeOfCurrency(currency);
    const zone = this.zone;
    const line = (name: unknown, value?: unknown) => html`<ds-row><span class="ds-row__name">${name}</span>${value === undefined ? nothing : html`<span class="ds-row__value">${value}</span>`}</ds-row>`;
    const to = order.invoice?.to ?? null;
    const history = detail?.events ?? [];
    const card = detail?.giftCard;
    return html`<div data-ds-overlay="header"><h2 data-ds-overlay="title" id="place-order-title">${order.customer?.name || order.code}</h2>
        <p data-ds-overlay="description">${kindLabel(this.about, order.kind).one} · <code class="place-code">${order.code}</code> · ${dayAt(order.createdAt, zone, true)}</p></div>
      <ds-list heading="Lines">
        ${order.lines.map(each => {
          const span = lineSpan(each, zone);
          return line(html`${each.label} <span class="place-muted">× ${each.quantity}${span ? `, ${span}` : ''}</span>`, this.money(each.totalMinor, order));
        })}
        ${line('Total', this.money(order.totalMinor, order))}
      </ds-list>
      <ds-list heading="Customer">
        ${line(order.customer?.name || 'No name')}
        ${order.customer?.email ? line(html`<a class="ds-link" href=${`mailto:${order.customer.email}`}>${order.customer.email}</a>`) : nothing}
        ${order.customer?.phone ? line(html`<a class="ds-link" href=${`tel:${order.customer.phone.replace(/\s/g, '')}`}>${order.customer.phone}</a>`) : nothing}
        ${to?.company ? line(to.company) : nothing}
        ${to?.address ? line(html`<span class="place-muted">${to.address}</span>`) : nothing}
        ${to?.vat ? line('VAT', to.vat) : nothing}
      </ds-list>
      ${order.customer?.note ? html`<ds-text class="place-note" wrap literal text=${order.customer.note}></ds-text>` : nothing}
      <ds-list heading="Payment">
        ${line('Status', html`<ds-tag style=${toneStyle(status.tone)}>${status.name}</ds-tag>`)}
        ${line('Paid by', paymentName(order))}
        ${order.invoice?.dueOn ? line('Due', order.invoice.dueOn) : nothing}
        ${line('Paid', this.money(order.paidMinor, order))}
        ${order.refundedMinor ? line('Refunded', this.money(order.refundedMinor, order)) : nothing}
        ${card ? line(`Gift card${card.code ? ` ${card.code}` : ''}`, typeof card.amount === 'number' ? this.money(card.amount, order) : undefined) : nothing}
        ${order.stripe?.paymentIntent ? line('Stripe', html`<code class="place-code">${order.stripe.paymentIntent}</code>`) : nothing}
        ${order.testMode ? line(html`<ds-tag style=${toneStyle('warning')}>Test mode</ds-tag>`) : nothing}
      </ds-list>
      <div class="place-field" role="group" aria-label="Note">
        <ds-text tone="muted" literal text="Note"></ds-text>
        <ds-input class="place-order__note" multiline rows="3" aria-label="Note" maxlength="4000" ?disabled=${this.noting.busy} .value=${this.noting.text}
          @input-change=${(event: CustomEvent<{ value: string }>) => { this.noting = { ...this.noting, text: event.detail.value, error: '' }; }}
          @focusout=${() => void this.saveNote(order)}></ds-input>
      </div>
      ${this.noting.error ? html`<ds-message role="alert" tone="danger" literal text=${this.noting.error}></ds-message>` : nothing}
      <ds-list heading="History">
        ${detail === null ? line(html`<span class="place-muted">Reading…</span>`)
          : history.length ? history.map(event => line(orderEventName(event, currency, locale), html`<span class="place-muted">${event.by ? `${event.by}, ` : ''}${when(event.at)}</span>`))
            : line(html`<span class="place-muted">Placed ${when(order.createdAt)}</span>`)}
      </ds-list>
      ${this.steps(order)}
      <div data-ds-overlay="footer"><ds-button secondary @click=${() => this.close()}>Close</ds-button></div>`;
  }

  /** The steps its status allows, as buttons; cancelling asks first, in place, with the refund and the email. */
  private steps(order: OrderView) {
    const steps = allowedSteps(order.status);
    if (!steps.length) return nothing;
    const acting = this.acting;
    const currency = this.currencyOf(order);
    const locale = localeOfCurrency(currency);
    const paid = Math.max(0, order.paidMinor - order.refundedMinor);
    const set = (next: Partial<Acting>) => { this.acting = { ...this.acting, ...next }; };
    const cancelName = stepName('cancel', order);
    const ask = () => {
      if (acting.refund.trim()) {
        const checked = checkRefund(acting.refund, paid, currency, locale);
        if ('error' in checked) { set({ error: checked.error, asking: false }); return; }
      }
      set({ asking: true, error: '' });
    };
    const cancel = () => {
      const refund = acting.refund.trim() ? checkRefund(acting.refund, paid, currency, locale) : null;
      void this.step(order, 'cancel', refund && 'minor' in refund ? { refundMinor: refund.minor } : {});
    };
    const refundWords = acting.refund.trim() ? (() => { const checked = checkRefund(acting.refund, paid, currency, locale); return 'minor' in checked && checked.minor ? ` and refund ${formatMoney(checked.minor, currency, locale)}` : ' with no refund'; })() : '';
    const other = steps.filter(step => step !== 'cancel');
    return html`<ds-list heading="Steps" class="place-steps">
        ${steps.some(stepNotifies) ? html`<ds-row><label class="place-check"><ds-checkbox><input type="checkbox" .checked=${acting.notify} ?disabled=${acting.busy}
          @change=${(event: Event) => set({ notify: (event.target as HTMLInputElement).checked, asking: false })}></ds-checkbox>Tell the customer by email</label></ds-row>` : nothing}
        ${steps.includes('cancel') && paid ? html`<ds-row><span class="ds-row__name">Refund</span><span class="ds-row__value"><ds-input class="place-amount" aria-label="Refund" inputmode="decimal" autocomplete="off"
          placeholder=${amountInput(0, currency, locale)} ?disabled=${acting.busy} .value=${acting.refund} @input-change=${(event: CustomEvent<{ value: string }>) => set({ refund: event.detail.value, asking: false, error: '' })}></ds-input></span></ds-row>
          <ds-row><span class="ds-row__name place-muted">${`At most ${formatMoney(paid, currency, locale)}; left empty, the site's own rule`}</span></ds-row>` : nothing}
      </ds-list>
      ${acting.error ? html`<ds-message role="alert" tone="danger" literal text=${acting.error}></ds-message>` : nothing}
      ${acting.asking ? html`<div class="place-confirm" role="group" aria-label=${`Confirm: ${cancelName}`}>
          <ds-text wrap literal text=${`${cancelName} ${order.code}${refundWords}${acting.notify ? ', telling the customer' : ''}? This cannot be undone.`}></ds-text>
          <div class="place-actions"><ds-button primary danger ?disabled=${acting.busy} @click=${cancel}>${`${cancelName} the ${kindLabel(this.about, order.kind).one.toLowerCase()}`}</ds-button>
          <ds-button secondary ?disabled=${acting.busy} @click=${() => set({ asking: false })}>Keep it</ds-button></div>
        </div>`
        : html`<div class="place-actions">
          ${other.map((step, index) => html`<ds-button ?primary=${index === 0} ?secondary=${index > 0} data-step=${step} ?disabled=${acting.busy} @click=${() => void this.step(order, step)}>${stepName(step, order)}</ds-button>`)}
          ${steps.includes('cancel') ? html`<ds-button secondary danger data-step="cancel" ?disabled=${acting.busy} @click=${ask}>${cancelName}</ds-button>` : nothing}
        </div>`}`;
  }
}
if (!customElements.get('consistency-place-orders')) customElements.define('consistency-place-orders', ConsistencyPlaceOrders);
