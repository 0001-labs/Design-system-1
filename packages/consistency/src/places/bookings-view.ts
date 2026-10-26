/**
 * The pure parts of the Bookings place: no DOM, so they are tested on their
 * own. The bookings each tab shows and their days, money in the site's
 * language ("1.234,50 kr." for Danish), the refund a person types read back
 * as øre and kept within what was paid, and the history's events in words.
 * The site's days, times and the suggested refund are bookings-shared.ts's,
 * the same functions the Worker decides with.
 */
import { addDays, type BookingEvent, type BookingStatus, type Cancellation, type TeamBookingView, type Weekday } from "./bookings-shared";

export type BookingsView = "upcoming" | "past" | "cancelled";

export const WEEKDAY_NAMES: Record<Weekday, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

const LOCALES: Record<string, string> = { da: "da-DK", en: "en-GB", de: "de-DE", sv: "sv-SE", nb: "nb-NO", fr: "fr-FR" };

/** The locale a language is written in: `da` is `da-DK`. */
export function localeOf(language: string | undefined): string {
  if (!language) return "en-GB";
  return LOCALES[language] ?? language;
}

function formatter(currency: string, locale: string): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase() });
}

/** How many minor units a currency has after its decimal sign: 2 for DKK and EUR, 0 for JPY. */
export function fractionDigits(currency: string): number {
  return formatter(currency, "en-GB").resolvedOptions().maximumFractionDigits ?? 2;
}

/** An amount in øre or cents as the site's language writes money: `90000` in DKK is "900,00 kr." in Danish. */
export function formatMoney(minor: number, currency: string, locale: string): string {
  return formatter(currency, locale).format(minor / 10 ** fractionDigits(currency));
}

/** An amount as it stands in a field, without the currency: "900,00". */
export function amountInput(minor: number, currency: string, locale: string): string {
  const digits = fractionDigits(currency);
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false }).format(minor / 10 ** digits);
}

/**
 * An amount a person typed, in minor units, or null when it is not one. A
 * comma or a point followed by one or two digits at the end is the decimal
 * sign, whichever the language uses; any other point, comma or space groups
 * thousands. Negative amounts are not amounts.
 */
export function parseAmount(typed: string, currency: string): number | null {
  const digits = fractionDigits(currency);
  const cleaned = typed.replace(/[\s  ]/g, "").replace(/(kr\.?|dkk|eur|€|\$|£)/gi, "");
  if (!/^\d+(?:[.,]\d+)*$/.test(cleaned)) return null;
  const decimal = digits > 0 ? cleaned.match(new RegExp(`[.,](\\d{1,${digits}})$`)) : null;
  const whole = (decimal ? cleaned.slice(0, decimal.index) : cleaned).replace(/[.,]/g, "");
  if (!/^\d+$/.test(whole)) return null;
  const fraction = (decimal?.[1] ?? "").padEnd(digits, "0");
  return Number(whole) * 10 ** digits + (digits ? Number(fraction) : 0);
}

/** A refund a person typed, checked against what was paid: at least nothing, at most the amount paid. */
export function checkRefund(typed: string, paidMinor: number, currency: string, locale: string): { minor: number } | { error: string } {
  const minor = parseAmount(typed, currency);
  if (minor === null) return { error: "Write the refund as an amount, such as 900,00." };
  if (minor > paidMinor) return { error: `At most ${formatMoney(paidMinor, currency, locale)}, what was paid.` };
  return { minor };
}

/** Keeps a refund within nothing and what was paid. */
export function clampRefund(minor: number, paidMinor: number): number {
  if (!Number.isFinite(minor)) return 0;
  return Math.min(Math.max(0, Math.round(minor)), Math.max(0, paidMinor));
}

/** What the lists read of a booking. */
type Booking = Pick<TeamBookingView, "code" | "date" | "time" | "nights" | "endDate" | "status">;

const LIVE: BookingStatus[] = ["confirmed", "pending"];

/**
 * The bookings a tab shows, in its order. Upcoming: paid or held bookings
 * that have not ended before today, soonest first (a stay shows until its
 * check-out day). Past: the paid ones that have, the latest first.
 * Cancelled: the cancelled ones, the latest day first. Expired holds (a
 * checkout left unpaid) show in none.
 */
export function chooseBookings<T extends Booking>(bookings: T[], view: BookingsView, today: string): T[] {
  const by = (a: T, b: T) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "") || a.code.localeCompare(b.code);
  if (view === "upcoming") return bookings.filter(each => LIVE.includes(each.status) && each.endDate >= today).sort(by);
  if (view === "past") return bookings.filter(each => each.status === "confirmed" && each.endDate < today).sort((a, b) => by(b, a));
  return bookings.filter(each => each.status === "cancelled").sort((a, b) => by(b, a));
}

/** Bookings in their days, as chosen: each day once, with its bookings in the order they came. */
export function groupByDay<T extends Pick<Booking, "date">>(bookings: T[]): { day: string; bookings: T[] }[] {
  const days = new Map<string, T[]>();
  for (const booking of bookings) {
    const list = days.get(booking.date) ?? [];
    list.push(booking);
    days.set(booking.date, list);
  }
  return [...days].map(([day, list]) => ({ day, bookings: list }));
}

/** A day as a heading: "Thursday 23 October", with the year when it is not this one. */
export function dayName(date: string, today: string): string {
  const at = new Date(`${date}T12:00:00Z`);
  const words = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", ...(date.slice(0, 4) === today.slice(0, 4) ? {} : { year: "numeric" }) }).format(at).replace(",", "");
  if (date === today) return `Today, ${words}`;
  if (date === addDays(today, 1)) return `Tomorrow, ${words}`;
  return words;
}

/** When a booking is on its day: its start time, or a stay's nights. */
export function whenOnDay(booking: Pick<Booking, "time" | "nights">): string {
  if (booking.nights) return `${booking.nights} ${booking.nights === 1 ? "night" : "nights"}`;
  return booking.time ?? "";
}

/** The guests as a count: "1 guest", "4 guests". */
export function guestsName(count: number): string {
  return `${count} ${count === 1 ? "guest" : "guests"}`;
}

/** A status in words, and the tone of its tag. */
export function statusName(status: BookingStatus): { name: string; tone: "success" | "warning" | "danger" | "muted" } {
  if (status === "confirmed") return { name: "Paid", tone: "success" };
  if (status === "pending") return { name: "Awaiting payment", tone: "warning" };
  if (status === "cancelled") return { name: "Cancelled", tone: "danger" };
  return { name: "Expired", tone: "muted" };
}

/** The rule in words: "Full refund less 100,00 kr. up to 24 hours before". */
export function ruleName(rule: Cancellation, currency: string, locale: string): string {
  const fee = rule.feeMinor ? ` less ${formatMoney(rule.feeMinor, currency, locale)}` : "";
  return `Full refund${fee} up to ${rule.fullRefundHours} hours before, nothing after`;
}

/** One event of a booking's history in words: what happened, with its amount or address where it has one. */
export function eventName(event: Pick<BookingEvent, "type" | "detail">, currency: string, locale: string): string {
  const detail = event.detail ?? {};
  const amount = [detail.amount, detail.refund, detail.paid].find(value => typeof value === "number") as number | undefined;
  const money = amount === undefined ? "" : ` ${formatMoney(amount, currency, locale)}`;
  const to = typeof detail.to === "string" ? ` to ${detail.to}` : "";
  switch (event.type) {
    case "created":
      return "Booked, the room held while the guest pays";
    case "paid":
      return `Paid${money}`;
    case "paid-after-cancel":
      return `Paid${money} after it was cancelled: refund it in Stripe`;
    case "expired":
      return "Not paid in time, the room let go";
    case "email-guest":
      return `Confirmation sent${to}`;
    case "email-team":
      return `Announced${to}`;
    case "email-guest-cancelled":
      return `Cancellation sent${to}`;
    case "email-failed":
      return `An email could not be sent${to}`;
    case "stripe-failed":
      return "Stripe did not open a payment page";
    case "cancelled":
      return "Cancelled";
    case "refund":
      return `Refunded${money}`;
    default: {
      const words = event.type.replace(/[-_.]+/g, " ");
      return `${words.charAt(0).toUpperCase()}${words.slice(1)}${money}`;
    }
  }
}

/** A day's start times, cleaned: only HH:MM, each once, in order. */
export function cleanTimes(times: string[]): string[] {
  return [...new Set(times.map(time => time.trim()).filter(time => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)))].sort();
}

/** A whole number a person typed for hours or days, or null when it is not one at least `least`. */
export function wholeNumber(typed: string, least = 0): number | null {
  const value = Number(typed.trim());
  return typed.trim() !== "" && Number.isInteger(value) && value >= least ? value : null;
}

/**
 * Try booking: the site's own booking page on its own address, in a language (`/en`), to open in a tab of its
 * own. The app never frames it: the page books with scripts and goes on to Stripe, which the app's sandboxed
 * document cannot hold. Empty when the site's address cannot be read.
 */
export function bookingPageOf(siteUrl: string, prefix = ""): string {
  try { return new URL(`${prefix}/book/`, new URL(siteUrl).origin).href; } catch { return ""; }
}

/** The locale money is written in, from the site's currency when the answer gives no language: kroner as Danish writes them. */
export function localeOfCurrency(currency: string | undefined): string {
  return ({ dkk: "da-DK", sek: "sv-SE", nok: "nb-NO" } as Record<string, string>)[(currency ?? "").toLowerCase()] ?? "en-GB";
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const steps: [Intl.RelativeTimeFormatUnit, number][] = [["second", 60], ["minute", 60], ["hour", 24], ["day", 7], ["week", 4.35], ["month", 12], ["year", Infinity]];
/** A time as how long ago it was: "now", "3 minutes ago", "yesterday". */
export function when(time: number | string | null | undefined, now = Date.now()): string {
  if (time === null || time === undefined || time === "") return "";
  const at = typeof time === "number" ? time : Date.parse(time);
  if (Number.isNaN(at)) return "";
  let amount = (at - now) / 1000;
  if (Math.abs(amount) < 45) return "now";
  for (const [unit, size] of steps) {
    if (Math.abs(amount) < size) return relative.format(Math.round(amount), unit);
    amount /= size;
  }
  return "";
}
