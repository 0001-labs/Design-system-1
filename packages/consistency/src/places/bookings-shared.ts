/**
 * The part of the site engine's `bookings-shared.ts` the Bookings and Gift cards places read: the shapes of an
 * offer, a booking and a gift card as `/team/api` answers them, and the few decisions the places show before the
 * engine makes them (a site's day, the refund an offer's rule suggests). Copied from
 * `0001/system/parts/site-engine/bookings-shared.ts`, which stays the source: the engine decides with those, and
 * checks everything sent from here again. Until the engine's `workspace` export carries it through Sync 1, a change
 * there is copied here by hand.
 */

export type OfferKind = "slot" | "seats" | "nights";
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired";
export type BookingOpen = "off" | "owners" | "everyone";

/** Words per language: `{ da, en, de }`. */
export type Words = Record<string, string>;

export const WEEKDAYS: readonly Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const HOUR_MS = 3_600_000;
/** The longest stay one booking takes. */
export const MAX_NIGHTS = 30;

export interface Price {
  id: string;
  name: Words;
  /** Øre or cents. */
  amount: number;
}

export interface Cancellation {
  /** A cancellation at least this many hours ahead gets the amount paid back, less the fee. */
  fullRefundHours: number;
  feeMinor: number;
}

/** The days an offer is open, both included. */
export interface Season {
  from: string;
  to: string;
}

/** Start times per weekday, `{ mon: ["10:00", "12:00"], … }`. */
export type Weekly = Partial<Record<Weekday, string[]>>;

/** What the team may change in `/team`, kept in D1 by offer id; anything left out is the site's. */
export interface OfferSchedule {
  open?: boolean;
  /** Null: open every day within the horizon. */
  season?: Season | null;
  weekly?: Weekly;
  closed?: string[];
  noticeHours?: number;
  horizonDays?: number;
}

/** An offer as the site writes it, with its defaults. */
export interface Offer extends OfferSchedule {
  id: string;
  name: Words;
  kind: OfferKind;
  /** Slot and seats offers. */
  durationMinutes?: number;
  /** Nights offers: `"13:00"` and `"10:00"`. */
  checkIn?: string;
  checkOut?: string;
  /** Units at once (slot), seats per departure (seats) or units per night (nights). */
  capacity: number;
  /** Offers with the same pool share its units; an offer without one is its own. */
  pool?: string;
  maxGuests: number;
  minGuests: number;
  prices: Price[];
  cancellation: Cancellation;
  /** How the site's booking page shows it among the experiences, as the site's own list does: a photo on the site (its address, words and object-position), a line about it and its length. */
  show?: OfferShow;
}

/** An experience as the booking page's cards show it. */
export interface OfferShow {
  /** The tab the booking page shows it under ("Green Raft"); offers without one share the last tab, the page's `otherOffers`. */
  group?: Words;
  photo?: { src: string; alt: Words; position?: string };
  summary?: Words;
  duration?: Words;
}

/** The team's changes to one offer. */
export interface OfferOverride extends OfferSchedule {
  id: string;
  prices?: Price[];
}

/** An offer with the team's changes and every default filled in: what is booked against. */
export interface ResolvedOffer extends Offer {
  open: boolean;
  season: Season | null;
  weekly: Weekly;
  closed: string[];
  noticeHours: number;
  horizonDays: number;
  pool: string;
}

/** One line of what a booking pays for: Stripe's line and the booking's tickets. */
export interface PriceLine {
  priceId: string;
  name: Words;
  unitAmount: number;
  quantity: number;
}

/** A booking as the team's API and the thanks page read it. */
export interface BookingView {
  id: string;
  code: string;
  offer: string;
  offerName: Words;
  kind: OfferKind;
  date: string;
  time: string | null;
  nights: number | null;
  /** The day the booking ends: the check-out day for nights, else its own day. */
  endDate: string;
  start: number;
  end: number;
  guests: number;
  tickets: PriceLine[];
  amount: number;
  paid: number;
  refunded: number;
  currency: string;
  status: BookingStatus;
  lang: string;
  createdAt: number;
  testMode: boolean;
}

export interface TeamBookingView extends BookingView {
  guest: { name: string; email: string; phone: string; note: string };
  holdUntil: number;
  stripe: { session: string | null; paymentIntent: string | null };
}

export interface BookingEvent {
  id: number;
  booking: string;
  at: number;
  type: string;
  by: string | null;
  detail: Record<string, unknown> | null;
}

// Dates and times

/** The day `days` after `date` (before, when negative). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10);
}

const formats = new Map<string, Intl.DateTimeFormat>();

function zoneFormat(timeZone: string): Intl.DateTimeFormat {
  let format = formats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    formats.set(timeZone, format);
  }
  return format;
}

/** The wall clock in the zone at an instant, as if it were UTC. */
function wallClock(ms: number, timeZone: string): number {
  const parts: Record<string, number> = {};
  for (const part of zoneFormat(timeZone).formatToParts(new Date(ms))) if (part.type !== "literal") parts[part.type] = Number(part.value);
  return Date.UTC(parts.year!, parts.month! - 1, parts.day!, parts.hour! % 24, parts.minute!, parts.second!);
}

/** The day it is in the zone at an instant. */
export const localDate = (ms: number, timeZone: string) => new Date(wallClock(ms, timeZone)).toISOString().slice(0, 10);

/** The words in the language, else English, else any. */
export function wordsIn(words: Words, lang: string): string {
  return words[lang] ?? words.en ?? Object.values(words)[0] ?? "";
}

/** The refund the offer's rule suggests: what was paid less the fee when far enough ahead, else nothing. */
export function suggestedRefund(cancellation: Cancellation, paid: number, start: number, now: number): number {
  if (paid <= 0) return 0;
  if (start - now < cancellation.fullRefundHours * HOUR_MS) return 0;
  return Math.max(0, paid - cancellation.feeMinor);
}

export type GiftCardStatus = "pending" | "active" | "used" | "expired" | "void";
export type GiftCardSendTo = "buyer" | "recipient";

/** The longest message on a card. */
export const GIFT_MESSAGE_LIMIT = 300;

/** A card as the thanks page reads it. */
export interface GiftCardView {
  id: string;
  code: string | null;
  amount: number;
  balance: number;
  currency: string;
  status: GiftCardStatus;
  expires: string | null;
  recipient: string;
  sendTo: GiftCardSendTo;
  sendOn: string | null;
  sent: boolean;
  lang: string;
  testMode: boolean;
}

export interface GiftCardUse {
  booking: string;
  bookingCode: string | null;
  amount: number;
  state: "held" | "drawn" | "released" | "returned" | "short";
  at: number;
}

export interface TeamGiftCardView extends GiftCardView {
  /** What live holds keep back from the balance. */
  held: number;
  buyer: { name: string; email: string };
  recipientEmail: string | null;
  message: string;
  paid: number;
  issuedBy: string | null;
  createdAt: number;
  uses: GiftCardUse[];
}

