/**
 * Bookings' shared half: the shapes of an offer and a booking, and every
 * decision that is the same in the Worker and the browser. The Worker decides
 * with these; the guest's page and the team's app use the same functions to
 * show what the Worker will decide, so a total or a free time never differs.
 *
 * - Times are worked out in the site's time zone. A booking keeps its local
 *   date and time as written ("2026-07-01", "10:00") and the instants it
 *   starts and ends (milliseconds since 1970, UTC), which capacity compares.
 * - Amounts are whole øre or cents.
 * - Nothing here touches the network, the database or the clock: the time
 *   now is always passed in.
 */

export type OfferKind = "slot" | "seats" | "nights";
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired";
export type BookingOpen = "off" | "owners" | "everyone";

/** Words per language: `{ da, en, de }`. */
export type Words = Record<string, string>;

export interface BookingLanguage {
  code: string;
  /** The page's address prefix: `""` for the first language, `/en`, `/de`. */
  prefix: string;
}

/** Danish at `/`, English at `/en` and German at `/de`, when a site does not say. */
export const DEFAULT_LANGUAGES: BookingLanguage[] = [
  { code: "da", prefix: "" },
  { code: "en", prefix: "/en" },
  { code: "de", prefix: "/de" },
];

export const WEEKDAYS: readonly Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const BOOKING_STATUSES: readonly BookingStatus[] = ["pending", "confirmed", "cancelled", "expired"];
export const BOOKING_OPEN: readonly BookingOpen[] = ["off", "owners", "everyone"];

export const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;
/** How long a pending booking holds its room while the guest pays. */
export const HOLD_MINUTES = 30;
export const DEFAULT_HORIZON_DAYS = 180;
export const DEFAULT_NOTICE_HOURS: Record<OfferKind, number> = { slot: 2, seats: 2, nights: 24 };
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

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Whether the text is a real day, `YYYY-MM-DD`. */
export function isDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE.exec(value);
  if (!match) return false;
  const day = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return day.toISOString().slice(0, 10) === value;
}

export const isTime = (value: unknown): value is string => typeof value === "string" && TIME.test(value);

/** The day `days` after `date` (before, when negative). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10);
}

/** How many days from one day to another. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

export function weekdayOf(date: string): Weekday {
  return WEEKDAYS[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7]!;
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

/** How far the zone's clock is ahead of UTC at an instant. */
const offsetAt = (ms: number, timeZone: string) => wallClock(Math.floor(ms / 1000) * 1000, timeZone) - Math.floor(ms / 1000) * 1000;

/**
 * The instant a local date and time happen in the zone. A time the clocks
 * skip in spring is read with the offset before the change; a time that comes
 * twice in autumn is its first.
 */
export function zonedInstant(date: string, time: string, timeZone: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const local = Date.UTC(y!, m! - 1, d!, h!, mi!);
  const before = local - offsetAt(local - 12 * HOUR_MS, timeZone);
  const after = local - offsetAt(local + 12 * HOUR_MS, timeZone);
  const real = [before, after].filter(candidate => wallClock(candidate, timeZone) === local);
  return real.length ? Math.min(...real) : before;
}

/** The day it is in the zone at an instant. */
export const localDate = (ms: number, timeZone: string) => new Date(wallClock(ms, timeZone)).toISOString().slice(0, 10);

// Offers

/** The words in the language, else English, else any. */
export function wordsIn(words: Words, lang: string): string {
  return words[lang] ?? words.en ?? Object.values(words)[0] ?? "";
}

/** The site's offer with the team's changes over it and every default filled in. */
export function resolveOffer(offer: Offer, override?: OfferOverride | null): ResolvedOffer {
  const pick = <K extends keyof OfferOverride>(key: K) => (override && override[key] !== undefined ? override[key] : undefined);
  return {
    ...offer,
    prices: pick("prices") ?? offer.prices,
    open: pick("open") ?? offer.open ?? true,
    season: pick("season") !== undefined ? pick("season")! : offer.season ?? null,
    weekly: pick("weekly") ?? offer.weekly ?? {},
    closed: pick("closed") ?? offer.closed ?? [],
    noticeHours: pick("noticeHours") ?? offer.noticeHours ?? DEFAULT_NOTICE_HOURS[offer.kind],
    horizonDays: pick("horizonDays") ?? offer.horizonDays ?? DEFAULT_HORIZON_DAYS,
    pool: offer.pool ?? offer.id,
  };
}

/** Whether an offer can be booked at all: open, and with a price. */
export const isBookable = (offer: ResolvedOffer) => offer.open && offer.prices.length > 0;

// Prices

export type PriceResult = { ok: true; amount: number; guests: number; units: number; lines: PriceLine[] } | { ok: false; error: string };

/**
 * What a booking costs, worked out from the offer alone:
 * - slot: the one price chosen, once per booking, its count the guests on board;
 * - seats: every ticket type's price times its count;
 * - nights: the one price chosen, once per night, its count the guests.
 * Guests must be within the offer's bounds.
 */
export function priceOf(offer: ResolvedOffer, tickets: unknown, nights = 1): PriceResult {
  if (!tickets || typeof tickets !== "object" || Array.isArray(tickets)) return { ok: false, error: "bad-tickets" };
  const chosen: { price: Price; count: number }[] = [];
  for (const [id, count] of Object.entries(tickets as Record<string, unknown>)) {
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0 || count > 1000) return { ok: false, error: "bad-tickets" };
    if (count === 0) continue;
    const price = offer.prices.find(candidate => candidate.id === id);
    if (!price) return { ok: false, error: "unknown-price" };
    chosen.push({ price, count });
  }
  if (!chosen.length) return { ok: false, error: "no-guests" };
  const guests = chosen.reduce((sum, item) => sum + item.count, 0);
  if (guests < offer.minGuests || guests > offer.maxGuests) return { ok: false, error: "guests-out-of-bounds" };
  let lines: PriceLine[];
  if (offer.kind === "seats") {
    lines = chosen.map(({ price, count }) => ({ priceId: price.id, name: price.name, unitAmount: price.amount, quantity: count }));
  } else {
    if (chosen.length !== 1) return { ok: false, error: "one-price-only" };
    const { price } = chosen[0]!;
    if (offer.kind === "nights" && (!Number.isInteger(nights) || nights < 1 || nights > MAX_NIGHTS)) return { ok: false, error: "bad-nights" };
    lines = [{ priceId: price.id, name: price.name, unitAmount: price.amount, quantity: offer.kind === "nights" ? nights : 1 }];
  }
  const amount = lines.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0);
  if (amount <= 0) return { ok: false, error: "no-price" };
  return { ok: true, amount, guests, units: offer.kind === "seats" ? guests : 1, lines };
}

// The schedule

export interface ScheduleContext {
  now: number;
  timeZone: string;
  /** Days closed for everything. */
  closed?: string[];
}

/** Whether the offer is open on the day: within its season and not closed. */
export function openOn(offer: ResolvedOffer, date: string, closed: string[] = []): boolean {
  if (offer.season && (date < offer.season.from || date > offer.season.to)) return false;
  return !offer.closed.includes(date) && !closed.includes(date);
}

/** Whether a start may still be booked: far enough ahead for the notice and not past the horizon. */
export function withinWindow(offer: ResolvedOffer, date: string, start: number, context: ScheduleContext): boolean {
  if (start < context.now + offer.noticeHours * HOUR_MS) return false;
  return date <= addDays(localDate(context.now, context.timeZone), offer.horizonDays);
}

export interface Departure {
  time: string;
  start: number;
  end: number;
}

/** A slot or seats offer's departures on a day that can still be booked. */
export function departuresOn(offer: ResolvedOffer, date: string, context: ScheduleContext): Departure[] {
  if (offer.kind === "nights" || !isDate(date) || !openOn(offer, date, context.closed)) return [];
  const minutes = offer.durationMinutes ?? 60;
  const times = [...new Set(offer.weekly[weekdayOf(date)] ?? [])].filter(isTime).sort();
  return times
    .map(time => {
      const start = zonedInstant(date, time, context.timeZone);
      return { time, start, end: start + minutes * 60_000 };
    })
    .filter(departure => withinWindow(offer, date, departure.start, context));
}

/** When a stay starts and ends: check-in on its first day, check-out the day after its last night. */
export function stayOf(offer: ResolvedOffer, date: string, nights: number, timeZone: string): { start: number; end: number; endDate: string } {
  const endDate = addDays(date, nights);
  return { start: zonedInstant(date, offer.checkIn ?? "15:00", timeZone), end: zonedInstant(endDate, offer.checkOut ?? "11:00", timeZone), endDate };
}

/** Whether a nights offer's night can be booked: open, and its check-in within the window. */
export function nightOpen(offer: ResolvedOffer, date: string, context: ScheduleContext): boolean {
  if (offer.kind !== "nights" || !isDate(date) || !openOn(offer, date, context.closed)) return false;
  return withinWindow(offer, date, zonedInstant(date, offer.checkIn ?? "15:00", context.timeZone), context);
}

// Capacity

/** A booking's hold on its pool: from when to when, and how many units or seats. */
export interface Claim {
  start: number;
  end: number;
  units: number;
}

/**
 * The most units in use at any one moment between `start` and `end`. Use only
 * rises where a claim starts, so it is enough to count at the start and at
 * every claim's start inside the span.
 */
export function peakUse(claims: Claim[], start: number, end: number): number {
  const inside = claims.filter(claim => claim.start < end && claim.end > start);
  const points = [start, ...inside.map(claim => claim.start).filter(point => point > start)];
  let peak = 0;
  for (const point of points) {
    const used = inside.reduce((sum, claim) => (claim.start <= point && claim.end > point ? sum + claim.units : sum), 0);
    if (used > peak) peak = used;
  }
  return peak;
}

export const roomLeft = (capacity: number, claims: Claim[], start: number, end: number) => Math.max(0, capacity - peakUse(claims, start, end));

export interface DayTimes {
  date: string;
  times: { time: string; left: number }[];
}

export interface OpenNight {
  date: string;
  left: number;
}

/** Every day in the range with its departures and the room left at each; days with none are left out. */
export function tripAvailability(offer: ResolvedOffer, from: string, to: string, claims: Claim[], context: ScheduleContext): DayTimes[] {
  const days: DayTimes[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const times = departuresOn(offer, date, context).map(departure => ({ time: departure.time, left: roomLeft(offer.capacity, claims, departure.start, departure.end) }));
    if (times.length) days.push({ date, times });
  }
  return days;
}

/** Every open night in the range with the units left that night. */
export function nightAvailability(offer: ResolvedOffer, from: string, to: string, claims: Claim[], context: ScheduleContext): OpenNight[] {
  const nights: OpenNight[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    if (!nightOpen(offer, date, context)) continue;
    const stay = stayOf(offer, date, 1, context.timeZone);
    nights.push({ date, left: roomLeft(offer.capacity, claims, stay.start, stay.end) });
  }
  return nights;
}

// Cancelling

/** The refund the offer's rule suggests: what was paid less the fee when far enough ahead, else nothing. */
export function suggestedRefund(cancellation: Cancellation, paid: number, start: number, now: number): number {
  if (paid <= 0) return 0;
  if (start - now < cancellation.fullRefundHours * HOUR_MS) return 0;
  return Math.max(0, paid - cancellation.feeMinor);
}

// Who may book

/** Whether the flag lets this viewer pay for a booking or a gift card: the team's owners always (so they can try it, Off included), and everyone else only with Everyone. */
export function bookingAllowed(open: BookingOpen, role: "owner" | "editor" | null): boolean {
  return open === "everyone" || role === "owner";
}

/** Whether the viewer sees booking: its pages, the site's Book links going to them and every step up to Pay. Everyone with Owners and Everyone; with Off, the owners alone. */
export function bookingShown(open: BookingOpen, role: "owner" | "editor" | null): boolean {
  return open !== "off" || role === "owner";
}

// Money

const MONEY_LOCALES: Record<string, string> = { da: "da-DK", en: "en-GB", de: "de-DE" };

/** An amount in øre or cents as the language writes it; whole amounts without decimals when `whole` is set. */
export function money(minor: number, currency: string, lang: string, whole = false): string {
  const digits = whole && minor % 100 === 0 ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {};
  return new Intl.NumberFormat(MONEY_LOCALES[lang] ?? lang, { style: "currency", currency: currency.toUpperCase(), ...digits }).format(minor / 100);
}

/** A day as the language writes it in full: "21. oktober 2026", "21 October 2026". */
export const longDate = (date: string, lang: string) => new Intl.DateTimeFormat(MONEY_LOCALES[lang] ?? lang, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

// Gift cards

export type GiftCardStatus = "pending" | "active" | "used" | "expired" | "void";
export type GiftCardSendTo = "buyer" | "recipient";

export const GIFT_CARD_STATUSES: readonly GiftCardStatus[] = ["pending", "active", "used", "expired", "void"];
/** The longest message on a card. */
export const GIFT_MESSAGE_LIMIT = 300;
/** A card's code: 32 letters and digits, without 0, O, 1 and I, so none is read as another. */
export const GIFT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const GIFT_CODE_LENGTH = 12;

/** How the card looks: the logo and photo are addresses of the site's own assets. */
export interface GiftCardDesign {
  /** An SVG of paths, drawn as vectors in the PDF. */
  logo: string;
  /** A JPEG. */
  photo: string;
  /** The photo's focus as a CSS `object-position`, such as `"50% 30%"`; the middle when not given. */
  focus?: string;
  paper: string;
  ink: string;
  accent: string;
}

/** The words of the card, its PDF and its emails, per language; `{name}`-style places are filled in. */
export interface GiftCardWords {
  title: string;
  to: string;
  validUntil: string;
  redeem: string;
  cardSubject: string;
  cardIntro: string;
  receiptSubject: string;
  receiptIntro: string;
  receiptAttached: string;
  receiptSentTo: string;
  receiptSendOn: string;
  code: string;
  amount: string;
}

export interface GiftCardOptions {
  /** The amounts offered, in øre or cents, such as 50000, 100000, 290000 and 560000. */
  amounts: number[];
  /** A custom amount's bounds, in øre or cents; it must be whole kroner or euros. */
  min: number;
  max: number;
  /** How long a card is valid, in months from the day it is paid. */
  validMonths: number;
  design: GiftCardDesign;
  /** Four letters or digits from the code's alphabet that start every code (`RAFT`); all twelve are random without. */
  prefix?: string;
  /** The site's address for booking, as written on the card (`cphraft.0001.dev/book`); the site's host when not given. */
  address?: string;
  words?: Record<string, Partial<GiftCardWords>>;
}

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

/** A random code, `XXXX-XXXX-XXXX`, its first group the prefix when given. */
export function giftCardCode(prefix = "", random: (count: number) => Uint8Array = count => crypto.getRandomValues(new Uint8Array(count))): string {
  const fixed = isGiftPrefix(prefix) ? prefix.toUpperCase() : "";
  const bytes = random(GIFT_CODE_LENGTH - fixed.length);
  // 256 is a multiple of 32, so every character is equally likely.
  const characters = fixed + [...bytes].map(byte => GIFT_CODE_ALPHABET[byte % GIFT_CODE_ALPHABET.length]).join("");
  return characters.match(/.{4}/g)!.join("-");
}

export const isGiftPrefix = (prefix: unknown): prefix is string => typeof prefix === "string" && prefix.length === 4 && [...prefix.toUpperCase()].every(character => GIFT_CODE_ALPHABET.includes(character));

/** A code as a guest may type it (any case, spaces or dashes anywhere), written as it is stored; null when it cannot be one. */
export function normalizeGiftCode(input: unknown): string | null {
  if (typeof input !== "string" || input.length > 40) return null;
  const characters = input.toUpperCase().replace(/[\s-]+/g, "");
  if (characters.length !== GIFT_CODE_LENGTH || ![...characters].every(character => GIFT_CODE_ALPHABET.includes(character))) return null;
  return characters.match(/.{4}/g)!.join("-");
}

export const isGiftCode = (code: unknown): code is string => typeof code === "string" && normalizeGiftCode(code) === code;

/** The amount a buyer chose, if it may be bought: one of the presets, or whole kroner within the bounds. */
export function giftAmount(input: unknown, options: Pick<GiftCardOptions, "amounts" | "min" | "max">): number | null {
  if (typeof input !== "number" || !Number.isInteger(input)) return null;
  if (options.amounts.includes(input)) return input;
  return input % 100 === 0 && input >= options.min && input <= options.max ? input : null;
}

/** What a card pays of a total: all of it, or the balance when that is less. */
export const giftCover = (balance: number, total: number) => Math.max(0, Math.min(balance, total));

/** The last day a card bought on `date` is valid: the same day `months` later, or that month's last day when it is shorter. */
export function giftExpiry(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y!, m! - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d!, last));
  return target.toISOString().slice(0, 10);
}
