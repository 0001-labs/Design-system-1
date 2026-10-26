/**
 * Gift cards, the place of a site that sells them (CPH Raft), ported from the site engine's own app onto Design
 * system 1's Lit elements. Active, Used and All as text tabs, each a list of cards (a `ds-row` a card with its
 * code in the code face, the recipient, a status tag, the day it runs out, the amount and what is left in the
 * site's own money). Pressing one opens it in a non-modal drawer with its amounts, buyer and recipient, message,
 * uses (the bookings it paid) and history, and its actions: the PDF to look at, Resend to an address, and Void,
 * both confirmed in place before anything is sent. Issue a card gives one without payment, in the same drawer.
 * Every amount, balance, code and status is the engine's; what is typed is only asked for, and the engine checks it.
 */
import { LitElement, html, nothing } from 'lit';
import '../../../../DS1/3-unit/ds-list';
import '../../../../DS1/3-unit/ds-row';
import '../../../../DS1/3-unit/ds-tabs';
import '../../../../DS1/2-core/ds-button';
import '../../../../DS1/2-core/ds-empty';
import '../../../../DS1/2-core/ds-input';
import '../../../../DS1/2-core/ds-message';
import '../../../../DS1/2-core/ds-tag';
import '../../../../DS1/2-core/ds-text';
import '../../../../DS1/4-page/ds-overlay';
import type { SiteSummary } from '../site-editing';
import { siteApi } from './api';
import { GIFT_MESSAGE_LIMIT, type TeamGiftCardView } from '../vendor/site-engine/bookings-shared';
import { formatMoney, localeOfCurrency, when } from './bookings-view';
import { checkIssueAmount, chooseCards, dateName, giftEventName, giftStatusName, messageCount, momentName, sentTo, useName, type GiftCardEvent, type GiftCardsView } from './giftcards-view';
import { failed, KeepCurrent, say, toneStyle } from './place';
import './places.css';

type Card = TeamGiftCardView;

const TABS: { view: GiftCardsView; name: string }[] = [{ view: 'active', name: 'Active' }, { view: 'used', name: 'Used' }, { view: 'all', name: 'All' }];
const EMPTY: Record<GiftCardsView, string> = { active: 'No active gift cards', used: 'No used gift cards', all: 'No gift cards yet' };

interface CardsAnswer { cards?: Card[]; currency?: string; testMode?: boolean }
interface CardDetail { card?: Card; events?: GiftCardEvent[]; testMode?: boolean }

/** A question asked in the drawer before anything is sent: resending to an address, or voiding. */
interface Asking { kind: 'resend' | 'void'; to?: string }
/** A card being issued: the amount, the recipient, the message, and what went wrong. */
interface Issuing { amount: string; name: string; email: string; message: string; busy: boolean; error: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ConsistencyPlaceGiftCards extends LitElement {
  static properties = {
    site: { attribute: false }, view: { state: true }, answer: { state: true }, error: { state: true }, opened: { state: true },
    resendTo: { state: true }, asking: { state: true }, acting: { state: true }, actionError: { state: true }, issuing: { state: true },
  };
  declare site: SiteSummary;
  declare view: GiftCardsView;
  declare answer: CardsAnswer | null;
  declare error: string;
  /** The card in the drawer, and its history once read. */
  declare opened: { card: Card; events: GiftCardEvent[] | null } | null;
  declare resendTo: string;
  declare asking: Asking | null;
  declare acting: boolean;
  declare actionError: string;
  declare issuing: Issuing | null;
  private readonly current = new KeepCurrent(this, () => this.read());

  constructor() {
    super();
    this.view = 'active'; this.answer = null; this.error = ''; this.opened = null; this.resendTo = ''; this.asking = null; this.acting = false; this.actionError = ''; this.issuing = null;
  }
  protected createRenderRoot() { return this; }
  private get code() { return this.site.code; }

  private async read(): Promise<boolean> {
    try {
      const list = await siteApi<CardsAnswer | Card[]>(this.code, 'giftcards');
      this.answer = Array.isArray(list) ? { cards: list } : list;
      this.error = '';
      // The card in the drawer follows the list; what is being written there stays.
      const open = this.opened && this.answer.cards?.find(card => card.id === this.opened!.card.id);
      if (open && this.opened) this.opened = { ...this.opened, card: open };
      return true;
    } catch (error) {
      this.error = failed(error, 'The gift cards could not be read');
      return false;
    }
  }

  private currencyOf(card?: Card) { return card?.currency ?? this.answer?.currency ?? 'dkk'; }
  private get locale() { return localeOfCurrency(this.currencyOf()); }
  private money(minor: number, card?: Card) { return formatMoney(minor, this.currencyOf(card), this.locale); }

  private async open(listed: Card) {
    this.issuing = null; this.asking = null; this.actionError = '';
    this.opened = { card: listed, events: null };
    this.resendTo = sentTo(listed, []);
    try {
      const detail = await siteApi<CardDetail>(this.code, `giftcards/${encodeURIComponent(listed.id)}`);
      if (this.opened?.card.id === listed.id && detail.card) { this.opened = { card: detail.card, events: detail.events ?? [] }; this.resendTo = sentTo(detail.card, detail.events ?? []); }
    } catch {
      if (this.opened?.card.id === listed.id) this.opened = { card: listed, events: [] };
    }
  }
  private close() { this.opened = null; this.issuing = null; this.asking = null; this.actionError = ''; }

  render() {
    const cards = this.answer?.cards ?? [];
    const testMode = this.answer?.testMode ?? cards.some(card => card.testMode);
    return html`<section class="place place-giftcards" aria-label="Gift cards">
      <div class="place-head">
        <ds-text class="place-title" role="heading" aria-level="1" literal size="display" text="Gift cards"></ds-text>
        ${testMode ? html`<ds-tag style=${toneStyle('warning')}>Test mode</ds-tag>` : nothing}
      </div>
      <div class="place-tools">
        <ds-tabs text class="place-tabs" aria-label="Gift cards">${TABS.map(each => html`<ds-button control="host" role="tab" ?active=${each.view === this.view}
          aria-selected=${String(each.view === this.view)} tabindex=${each.view === this.view ? 0 : -1} @click=${() => { this.view = each.view; }}>${each.name}</ds-button>`)}</ds-tabs>
        <ds-button primary @click=${() => this.startIssuing()}>Issue a card</ds-button>
      </div>
      ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : nothing}
      ${this.answer ? this.list(cards) : this.error ? nothing : html`<ds-text tone="muted" literal text="Reading the gift cards…"></ds-text>`}
      <ds-overlay type="drawer" non-modal .holdScroll=${false} .blockOutside=${false} ?open=${!!(this.opened || this.issuing)} @ds-close-request=${() => this.close()}>
        <dialog class="place-drawer" aria-labelledby="place-card-title">${this.issuing ? this.issueForm(this.issuing) : this.opened ? this.detail(this.opened.card, this.opened.events) : nothing}</dialog>
      </ds-overlay>
    </section>`;
  }

  private list(cards: Card[]) {
    const shown = chooseCards(cards, this.view);
    if (!shown.length) return html`<ds-empty literal heading=${cards.length ? EMPTY[this.view] : EMPTY.all}></ds-empty>`;
    return html`<ds-list class="place-cards" aria-label=${TABS.find(each => each.view === this.view)!.name}>${shown.map(card => {
      const status = giftStatusName(card.status);
      return html`<ds-row interactive class="place-card" data-card=${card.code ?? card.id} ?open=${this.opened?.card.id === card.id} @ds-row-press=${() => void this.open(card)}>
        <code class="place-code">${card.code ?? 'Unpaid'}</code>
        <span class="ds-row__name">${card.recipient || card.buyer.name}</span>
        <ds-tag style=${toneStyle(status.tone)}>${status.name}</ds-tag>
        <span class="place-muted place-card__expires">${card.expires ? dateName(card.expires, true) : ''}</span>
        <span class="ds-row__value">${card.balance === card.amount || card.status !== 'active' ? this.money(card.amount, card) : html`<span class="place-muted">${this.money(card.balance, card)} of </span>${this.money(card.amount, card)}`}</span>
      </ds-row>`;
    })}</ds-list>`;
  }

  private detail(card: Card, events: GiftCardEvent[] | null) {
    const status = giftStatusName(card.status);
    const issued = Boolean(card.issuedBy);
    const line = (name: unknown, value?: unknown) => html`<ds-row><span class="ds-row__name">${name}</span>${value === undefined ? nothing : html`<span class="ds-row__value">${value}</span>`}</ds-row>`;
    const mail = (address: string | null | undefined) => address ? html`<a class="ds-link" href=${`mailto:${address}`}>${address}</a>` : html`<span class="place-muted">No address</span>`;
    const sendWords = card.sent ? null : card.sendOn ? `Goes to ${card.recipientEmail ?? card.buyer.email} on ${dateName(card.sendOn)}` : card.status === 'active' ? 'Not sent yet' : null;
    const pdf = card.code ? `/api/consistency/sites/${encodeURIComponent(this.code)}/api/giftcards/${encodeURIComponent(card.id)}/pdf` : '';
    return html`<div data-ds-overlay="header"><h2 data-ds-overlay="title" id="place-card-title"><code class="place-code">${card.code ?? 'Awaiting payment'}</code></h2>
        <p data-ds-overlay="description">${this.money(card.amount, card)} · ${status.name}${card.expires ? ` · valid until ${dateName(card.expires)}` : ''}</p></div>
      <ds-list heading="Card">
        ${line('Status', html`<ds-tag style=${toneStyle(status.tone)}>${status.name}</ds-tag>`)}
        ${line('Amount', this.money(card.amount, card))}
        ${line('Balance', this.money(card.balance, card))}
        ${card.held ? line(html`<span class="place-muted">Held by a booking awaiting payment</span>`, this.money(card.held, card)) : nothing}
        ${line('Valid until', card.expires ? dateName(card.expires) : html`<span class="place-muted">From the day it is paid</span>`)}
        ${issued ? nothing : line('Paid', this.money(card.paid, card))}
        ${card.testMode ? line(html`<ds-tag style=${toneStyle('warning')}>Test mode</ds-tag>`) : nothing}
      </ds-list>
      <ds-list heading=${issued ? 'Issued by' : 'Buyer'}>${line(issued ? card.issuedBy : card.buyer.name || 'No name')}${issued ? nothing : line(mail(card.buyer.email))}</ds-list>
      <ds-list heading="Recipient">${line(card.recipient || 'No name')}${line(mail(card.recipientEmail))}</ds-list>
      ${card.message ? html`<ds-list heading="Message"><ds-text class="place-note" wrap literal text=${card.message}></ds-text></ds-list>` : nothing}
      <ds-list heading="Sent">
        ${line(issued ? 'Issued' : 'Bought', momentName(card.createdAt))}
        ${card.sent && events ? line('To', sentTo(card, events)) : nothing}
        ${sendWords ? line(html`<span class="place-muted">${sendWords}</span>`) : nothing}
      </ds-list>
      <ds-list heading="Uses">${card.uses.length ? card.uses.map(use => line(html`${use.bookingCode ?? 'A booking'} <span class="place-muted">${dateName(new Date(use.at).toISOString().slice(0, 10), true)}${use.state === 'drawn' ? '' : `, ${useName(use.state).toLowerCase()}`}</span>`, this.money(use.amount, card)))
        : line(html`<span class="place-muted">Not used yet</span>`)}</ds-list>
      <ds-list heading="History">${events === null ? line(html`<span class="place-muted">Reading…</span>`)
        : events.length ? events.map(event => line(giftEventName(event, this.currencyOf(card), this.locale), html`<span class="place-muted">${event.by ? `${event.by}, ` : ''}${when(event.at)}</span>`))
          : line(html`<span class="place-muted">${issued ? 'Issued' : 'Bought'} ${when(card.createdAt)}</span>`)}</ds-list>
      ${card.status === 'active' && card.code ? this.resend(card) : nothing}
      ${card.status === 'active' || card.status === 'pending' ? this.voiding(card) : nothing}
      ${this.actionError ? html`<ds-message role="alert" tone="danger" literal text=${this.actionError}></ds-message>` : nothing}
      <div data-ds-overlay="footer">${pdf ? html`<ds-button secondary href=${pdf} target="_blank" rel="noopener">View the PDF</ds-button>` : nothing}<ds-button secondary @click=${() => this.close()}>Close</ds-button></div>`;
  }

  // Resend: to the address it last went to, or another, confirmed in place before it is sent.
  private resend(card: Card) {
    const asking = this.asking?.kind === 'resend' ? this.asking : null;
    const ask = () => {
      const to = this.resendTo.trim();
      if (!EMAIL.test(to)) { this.actionError = 'Write the address to send it to.'; return; }
      this.actionError = ''; this.asking = { kind: 'resend', to };
    };
    const confirm = async (to: string) => {
      this.acting = true;
      try {
        const detail = await siteApi<CardDetail>(this.code, `giftcards/${encodeURIComponent(card.id)}/resend`, { method: 'POST', json: { to } });
        say(`${card.code} is sent to ${to}`);
        this.asking = null;
        if (this.opened?.card.id === card.id && detail?.card) this.opened = { card: detail.card, events: detail.events ?? this.opened.events };
        void this.current.run();
      } catch (error) {
        this.asking = null; this.actionError = failed(error, 'It was not sent');
      } finally { this.acting = false; }
    };
    return html`<ds-list heading="Resend">
        <ds-row><span class="ds-row__name">Send it to</span><span class="ds-row__value"><ds-input class="place-recipient" type="email" aria-label="Send it to" autocomplete="off" ?disabled=${this.acting}
          .value=${this.resendTo} @input-change=${(event: CustomEvent<{ value: string }>) => { this.resendTo = event.detail.value; this.asking = null; }}></ds-input></span></ds-row>
      </ds-list>
      ${asking ? html`<div class="place-confirm" role="group" aria-label="Confirm sending">
          <ds-text wrap literal text=${`Send ${card.code} to ${asking.to} again, with the PDF?`}></ds-text>
          <div class="place-actions"><ds-button primary ?disabled=${this.acting} @click=${() => void confirm(asking.to!)}>Send it</ds-button><ds-button secondary ?disabled=${this.acting} @click=${() => { this.asking = null; }}>Not now</ds-button></div>
        </div>` : html`<div class="place-actions"><ds-button secondary ?disabled=${this.acting} @click=${ask}>Resend</ds-button></div>`}`;
  }

  // Void: the card can no longer pay; nothing is refunded.
  private voiding(card: Card) {
    const name = card.code ?? 'this card';
    const confirm = async () => {
      this.acting = true;
      try {
        await siteApi(this.code, `giftcards/${encodeURIComponent(card.id)}/void`, { method: 'POST', json: {} });
        say(`${name} is void`);
        this.close();
        void this.current.run();
      } catch (error) {
        this.asking = null; this.actionError = failed(error, 'It was not voided');
      } finally { this.acting = false; }
    };
    return html`<ds-list heading="Void"><ds-row><span class="ds-row__name place-muted">A void card pays for nothing more. It refunds nothing.</span></ds-row></ds-list>
      ${this.asking?.kind === 'void' ? html`<div class="place-confirm" role="group" aria-label="Confirm voiding">
          <ds-text wrap literal text=${`Void ${name}? ${card.balance ? `Its balance of ${this.money(card.balance, card)} can no longer be used. ` : ''}This refunds nothing: a refund is made in Stripe. It cannot be undone.`}></ds-text>
          <div class="place-actions"><ds-button primary danger ?disabled=${this.acting} @click=${() => void confirm()}>Void the card</ds-button><ds-button secondary ?disabled=${this.acting} @click=${() => { this.asking = null; }}>Keep it</ds-button></div>
        </div>` : html`<div class="place-actions"><ds-button secondary danger ?disabled=${this.acting} @click=${() => { this.actionError = ''; this.asking = { kind: 'void' }; }}>Void</ds-button></div>`}`;
  }

  private startIssuing() {
    this.opened = null; this.asking = null; this.actionError = '';
    this.issuing = { amount: '', name: '', email: '', message: '', busy: false, error: '' };
  }

  // Issue a card: an amount in whole kroner, the recipient, a message; sent to the recipient at once.
  private issueForm(issuing: Issuing) {
    const currency = this.currencyOf();
    const set = (patch: Partial<Issuing>) => { this.issuing = { ...this.issuing!, ...patch }; };
    const send = async () => {
      const checked = checkIssueAmount(issuing.amount, currency, this.locale, null);
      if ('error' in checked) { set({ error: checked.error }); return; }
      if (!issuing.name.trim()) { set({ error: 'Write the recipient’s name.' }); return; }
      if (!EMAIL.test(issuing.email.trim())) { set({ error: 'Write the address the card is sent to.' }); return; }
      set({ busy: true, error: '' });
      try {
        const email = issuing.email.trim();
        const issued = await siteApi<{ card?: Card }>(this.code, 'giftcards', { method: 'POST', json: { amount: checked.minor, recipient: { name: issuing.name.trim(), email }, sendTo: email, message: issuing.message.trim() } });
        say(issued.card?.code ? `${issued.card.code} is issued and sent to ${email}` : 'The card is issued');
        this.issuing = null;
        await this.current.run();
        if (issued.card) void this.open(this.answer?.cards?.find(card => card.id === issued.card!.id) ?? issued.card);
      } catch (error) {
        set({ busy: false, error: failed(error, 'It was not issued') });
      }
    };
    const field = (label: string, control: unknown) => html`<ds-row><span class="ds-row__name">${label}</span><span class="ds-row__value">${control}</span></ds-row>`;
    return html`<div data-ds-overlay="header"><h2 data-ds-overlay="title" id="place-card-title">Issue a card</h2><p data-ds-overlay="description">A card given without payment, sent to the recipient at once and marked as issued by you.</p></div>
      <ds-list heading="Card">
        ${field(`Amount in ${currency.toUpperCase()}`, html`<ds-input class="place-amount" aria-label=${`Amount in ${currency.toUpperCase()}`} inputmode="numeric" placeholder="500" autocomplete="off" ?disabled=${issuing.busy} .value=${issuing.amount} @input-change=${(event: CustomEvent<{ value: string }>) => set({ amount: event.detail.value })}></ds-input>`)}
        ${field('Recipient’s name', html`<ds-input class="place-recipient" aria-label="Recipient’s name" autocomplete="off" maxlength="120" ?disabled=${issuing.busy} .value=${issuing.name} @input-change=${(event: CustomEvent<{ value: string }>) => set({ name: event.detail.value })}></ds-input>`)}
        ${field('Recipient’s email', html`<ds-input class="place-recipient" type="email" aria-label="Recipient’s email" autocomplete="off" placeholder="name@example.com" ?disabled=${issuing.busy} .value=${issuing.email} @input-change=${(event: CustomEvent<{ value: string }>) => set({ email: event.detail.value })}></ds-input>`)}
      </ds-list>
      <ds-list heading="Message">
        <ds-input multiline rows="4" aria-label="Message" maxlength=${GIFT_MESSAGE_LIMIT} ?disabled=${issuing.busy} .value=${issuing.message} @input-change=${(event: CustomEvent<{ value: string }>) => set({ message: event.detail.value })}></ds-input>
        <ds-row><span class="ds-row__name place-muted">${messageCount(issuing.message, GIFT_MESSAGE_LIMIT)}</span></ds-row>
      </ds-list>
      ${issuing.error ? html`<ds-message role="alert" tone="danger" literal text=${issuing.error}></ds-message>` : nothing}
      <div data-ds-overlay="footer"><ds-button primary ?disabled=${issuing.busy} @click=${() => void send()}>Issue</ds-button><ds-button secondary ?disabled=${issuing.busy} @click=${() => this.close()}>Close</ds-button></div>`;
  }
}
if (!customElements.get('consistency-place-giftcards')) customElements.define('consistency-place-giftcards', ConsistencyPlaceGiftCards);
