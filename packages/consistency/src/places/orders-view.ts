/**
 * The pure parts of the Orders place: no DOM, so they are tested on their own. The shapes the site engine's
 * `/team/api/orders…` answers (`orders.ts` in the site engine, its team side), what a site calls its orders and
 * their kinds in the app's language, a status in words with its tone, the steps the engine allows the owner from
 * a status (the engine's `TRANSITIONS`, copied: the engine checks them again and refuses with 409), the step's
 * words for its button, an order's history in words, and the query a list is asked with.
 */
import { formatMoney } from './bookings-view';

export type OrderKind = 'booking' | 'request' | 'sale';
export type OrderStatus = 'requested' | 'held' | 'confirmed' | 'paid' | 'invoiced' | 'cancelled' | 'fulfilled' | 'expired';
export type OrderPayment = 'stripe' | 'invoice' | 'none';
export type OrderAction = 'confirm' | 'cancel' | 'mark-paid' | 'invoice' | 'fulfil';
/** Who may order on the site: the engine's `order_settings.open`, as the booking flag works. */
export type OrderOpen = 'off' | 'owners' | 'everyone';

export interface OrderLabel { one: string; many: string }

export interface OrderLineView {
  id: number;
  position: number;
  item: { kind: 'offer' | 'product'; ref: string };
  label: string;
  quantity: number;
  unitMinor: number;
  totalMinor: number;
  startsAt: number | null;
  endsAt: number | null;
  nights: number | null;
  seats: number | null;
  meta: Record<string, unknown>;
}

/** An order as the team reads it (the engine's `OrderView`). */
export interface OrderView {
  id: string;
  code: string;
  kind: OrderKind;
  status: OrderStatus;
  lang: string;
  currency: string;
  totalMinor: number;
  paidMinor: number;
  refundedMinor: number;
  payment: OrderPayment;
  invoice: { number: string; to: Record<string, string> | null; dueOn: string | null; at: number | null } | null;
  lines: OrderLineView[];
  createdAt: number;
  updatedAt: number;
  heldUntil: number | null;
  testMode: boolean;
  customer: { name: string; email: string; phone: string; note: string };
  stripe: { session: string | null; paymentIntent: string | null };
  note: string;
  meta: Record<string, unknown>;
}

export interface OrderEvent { id: number; order: string; at: number; by: string | null; what: string; detail: Record<string, unknown> | null }

/** What the site says about its orders: its words, kinds, money, zone, payments and test mode. */
export interface OrdersAbout {
  label?: Record<string, OrderLabel>;
  kindLabels?: Partial<Record<OrderKind, Record<string, OrderLabel>>>;
  kinds?: OrderKind[];
  currency?: string;
  timeZone?: string;
  payment?: { stripe?: boolean; invoice?: boolean };
  testMode?: boolean;
}
/** `GET orders`: a page of orders, newest first, and the cursor for the page after. */
export interface OrdersAnswer extends OrdersAbout { orders?: OrderView[]; next?: string | null }
/** `GET orders/config`: the site's words and who may order. */
export interface OrdersConfig extends OrdersAbout { open?: OrderOpen }
/** `GET orders/<id>` and every step's answer. */
export interface OrderDetail { order: OrderView; events?: OrderEvent[]; giftCard?: { code?: string; amount?: number; state?: string } | null; testMode?: boolean }

/** The app's language, in which a site's own words are read. */
export const APP_LANGUAGE = 'en';

const KIND_WORDS: Record<OrderKind, OrderLabel> = {
  booking: { one: 'Booking', many: 'Bookings' }, request: { one: 'Request', many: 'Requests' }, sale: { one: 'Sale', many: 'Sales' },
};

/** What the site calls its orders in the app's language: its word, else "Order" and "Orders". */
export function ordersLabel(about: OrdersAbout | null | undefined, fallback?: string): OrderLabel {
  return about?.label?.[APP_LANGUAGE] ?? (fallback ? { one: fallback, many: fallback } : { one: 'Order', many: 'Orders' });
}

/** What the site calls a kind in the app's language: its word for it, else the kind's own. */
export function kindLabel(about: OrdersAbout | null | undefined, kind: OrderKind): OrderLabel {
  return about?.kindLabels?.[kind]?.[APP_LANGUAGE] ?? KIND_WORDS[kind] ?? { one: kind, many: kind };
}

export const STATUSES: readonly OrderStatus[] = ['requested', 'held', 'confirmed', 'invoiced', 'paid', 'fulfilled', 'cancelled', 'expired'];

/** A status in words, and the tone of its tag. */
export function orderStatusName(status: OrderStatus): { name: string; tone: 'success' | 'warning' | 'danger' | 'muted' | 'accent' } {
  switch (status) {
    case 'requested': return { name: 'Requested', tone: 'accent' };
    case 'held': return { name: 'Awaiting payment', tone: 'warning' };
    case 'confirmed': return { name: 'Confirmed', tone: 'success' };
    case 'invoiced': return { name: 'Invoiced', tone: 'warning' };
    case 'paid': return { name: 'Paid', tone: 'success' };
    case 'fulfilled': return { name: 'Fulfilled', tone: 'muted' };
    case 'cancelled': return { name: 'Cancelled', tone: 'danger' };
    default: return { name: 'Expired', tone: 'muted' };
  }
}

/** The owner's steps and the statuses each starts from: the engine's `TRANSITIONS`, the owner's part. */
export const OWNER_STEPS: Record<OrderAction, readonly OrderStatus[]> = {
  confirm: ['requested'],
  invoice: ['confirmed'],
  'mark-paid': ['confirmed', 'invoiced'],
  fulfil: ['confirmed', 'invoiced', 'paid'],
  cancel: ['requested', 'held', 'confirmed', 'invoiced', 'paid'],
};

/** The steps the owner may take from a status, in the order the drawer shows them: the way on first, cancelling last. */
export function allowedSteps(status: OrderStatus): OrderAction[] {
  return (['confirm', 'invoice', 'mark-paid', 'fulfil', 'cancel'] as const).filter(step => OWNER_STEPS[step].includes(status));
}

/** A step's words for its button: a request is approved and declined; everything else confirmed and cancelled. */
export function stepName(step: OrderAction, order: Pick<OrderView, 'kind' | 'status'>): string {
  switch (step) {
    case 'confirm': return order.kind === 'request' ? 'Approve' : 'Confirm';
    case 'invoice': return 'Send invoice';
    case 'mark-paid': return 'Mark paid';
    case 'fulfil': return 'Mark fulfilled';
    default: return order.status === 'requested' ? 'Decline' : 'Cancel';
  }
}

/** What a step did, for the toast: "Rb42Xq is approved". */
export function stepDone(step: OrderAction, order: Pick<OrderView, 'code' | 'kind' | 'status'>): string {
  const words: Record<OrderAction, string> = {
    confirm: order.kind === 'request' ? 'approved' : 'confirmed', invoice: 'invoiced', 'mark-paid': 'marked paid', fulfil: 'fulfilled',
    cancel: order.status === 'requested' ? 'declined' : 'cancelled',
  };
  return `${order.code} is ${words[step]}`;
}

/** Whether a step tells the customer when asked to: approving, declining and cancelling do; an invoice is always sent. */
export const stepNotifies = (step: OrderAction) => step === 'confirm' || step === 'cancel';

/** The list's filters, as the engine reads them. */
export interface OrdersFilter { kind: OrderKind | null; status: OrderStatus | null; q: string }

/** The query a page of the list is asked with: the filters set, the words trimmed, the cursor after the last page. */
export function ordersQuery(filter: OrdersFilter, after: string | null = null, limit = 50): string {
  const query = new URLSearchParams();
  if (filter.kind) query.set('kind', filter.kind);
  if (filter.status) query.set('status', filter.status);
  const q = filter.q.trim().slice(0, 100);
  if (q) query.set('q', q);
  query.set('limit', String(limit));
  if (after) query.set('after', after);
  return `orders?${query}`;
}

/** When an order happens: its first line's start, else when it was made. */
export const orderAt = (order: Pick<OrderView, 'lines' | 'createdAt'>) => order.lines.find(line => line.startsAt !== null)?.startsAt ?? order.createdAt;

/** An instant as a short day in the site's zone: "23 Oct", with the year when it is not this one; "23 Oct, 10:00" with its time. */
export function dayAt(at: number, timeZone: string, withTime = false, now = Date.now()): string {
  const year = (time: number) => new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric' }).format(time);
  return new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric', month: 'short', ...(year(at) === year(now) ? {} : { year: 'numeric' }), ...(withTime ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : {}) }).format(at);
}

/** A line's span in words: a dated item's days, a booking's start and nights, or nothing. */
export function lineSpan(line: Pick<OrderLineView, 'startsAt' | 'nights' | 'meta'>, timeZone: string): string {
  const from = typeof line.meta.from === 'string' ? line.meta.from : null;
  const to = typeof line.meta.to === 'string' ? line.meta.to : null;
  if (from) return to && to !== from ? `${from} to ${to}` : from;
  if (line.startsAt === null) return '';
  const start = dayAt(line.startsAt, timeZone, !line.nights);
  return line.nights ? `${start}, ${line.nights} ${line.nights === 1 ? 'night' : 'nights'}` : start;
}

/** How an order is paid, in words. */
export function paymentName(order: Pick<OrderView, 'payment' | 'invoice'>): string {
  if (order.payment === 'stripe') return 'Stripe';
  if (order.payment === 'invoice') return order.invoice ? `Invoice ${order.invoice.number}` : 'Invoice';
  return 'No payment';
}

/** One event of an order's history in words, with its amount or address where it has one. */
export function orderEventName(event: Pick<OrderEvent, 'what' | 'detail'>, currency: string, locale: string): string {
  const detail = event.detail ?? {};
  const amount = [detail.amount, detail.refund, detail.paid].find(value => typeof value === 'number') as number | undefined;
  const money = amount === undefined ? '' : ` ${formatMoney(amount, currency, locale)}`;
  const to = typeof detail.to === 'string' ? ` to ${detail.to}` : '';
  switch (event.what) {
    case 'created': return 'Placed';
    case 'confirmed': return 'Confirmed';
    case 'invoiced': return `Invoiced${typeof detail.number === 'string' ? ` as ${detail.number}` : ''}`;
    case 'paid': return `Paid${money}`;
    case 'paid-after-cancel': return `Paid${money} after it was cancelled: refund it in Stripe`;
    case 'fulfilled': return 'Fulfilled';
    case 'cancelled': return 'Cancelled';
    case 'refund': return `Refunded${money}`;
    case 'expired': return 'Not paid in time';
    case 'note': return 'Note changed';
    case 'email-customer': return `Emailed the customer${to}`;
    case 'email-team': return `Announced${to}`;
    case 'email-failed': return `An email could not be sent${to}`;
    case 'stripe-failed': return 'Stripe did not open a payment page';
    case 'gift-card-held': return `Gift card held${money}`;
    case 'gift-card-returned': return `Gift card given back${money}`;
    case 'gift-card-refused': case 'gift-card-short': return 'The gift card could not pay';
    case 'imported': return 'Moved over from the bookings';
    default: {
      const words = event.what.replace(/[-_.]+/g, ' ');
      return `${words.charAt(0).toUpperCase()}${words.slice(1)}${money}`;
    }
  }
}

/** Who may order, in the place's words. */
export const WHO_ORDERS: { open: OrderOpen; name: string; about: string }[] = [
  { open: 'off', name: 'Off', about: 'Visitors cannot order on the site; only its owners can.' },
  { open: 'owners', name: 'Owners only', about: 'Everyone can see prices on the site, and only its owners can place an order.' },
  { open: 'everyone', name: 'Everyone', about: 'Every visitor can order on the site.' },
];
