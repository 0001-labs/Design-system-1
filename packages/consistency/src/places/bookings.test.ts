import { describe, expect, it } from "vite-plus/test";
import { addDays, localDate, type ResolvedOffer, type TeamBookingView } from "./bookings-shared";
import {
  applyLimits,
  changesOf,
  closedDayName,
  commonName,
  formatTimes,
  groupLimits,
  groupOffers,
  limitsOf,
  overrideOf,
  ownLimits,
  parsePrices,
  parseTime,
  parseTimes,
  priceText,
  pricesText,
  sameLimits,
  sameTimesAs,
  seasonText,
  shortName,
  shortTime,
  timesInput,
} from "./bookings-matrix";
import {
  amountInput,
  checkRefund,
  chooseBookings,
  clampRefund,
  cleanTimes,
  dayName,
  formatMoney,
  groupByDay,
  eventName,
  localeOf,
  parseAmount,
  whenOnDay,
  wholeNumber,
} from "./bookings-view";
import { daysOf, rangeOf, seasonValue } from "./calendar-value";
import { bookingPageOf } from "./bookings-view";

// Spaces in money vary by ICU: compare with every kind of space as a plain one.
const plain = (words: string) => words.replace(/[  ]/g, " ");

// A booking as the team's API answers it, the site's days already in its time zone.
const booking = (code: string, date: string, extra: Partial<TeamBookingView> = {}): TeamBookingView => {
  const nights = extra.nights ?? null;
  return {
    id: code, code, offer: "green-private-90", offerName: { en: "Private trip" }, kind: nights ? "nights" : "slot", date, time: nights ? null : "10:00", nights,
    endDate: nights ? addDays(date, nights) : date, start: 0, end: 0, guests: 2, tickets: [], amount: 90000, paid: 90000, refunded: 0, currency: "dkk",
    status: "confirmed", lang: "da", createdAt: 0, testMode: true, guest: { name: code, email: "", phone: "", note: "" }, holdUntil: 0, stripe: { session: null, paymentIntent: null },
    ...extra,
  };
};

describe("days", () => {
  it("names a day for its heading", () => {
    expect(dayName("2026-10-21", "2026-10-21")).toBe("Today, Wednesday 21 October");
    expect(dayName("2026-10-22", "2026-10-21")).toBe("Tomorrow, Thursday 22 October");
    expect(dayName("2026-10-24", "2026-10-21")).toBe("Saturday 24 October");
    expect(dayName("2027-01-02", "2026-10-21")).toBe("Saturday 2 January 2027");
  });
});

describe("the bookings each tab shows, by day", () => {
  const today = "2026-10-21";
  const all = [
    booking("Later1", "2026-10-23", { time: "14:00" }),
    booking("Early1", "2026-10-23", { time: "10:00" }),
    booking("Today1", "2026-10-21"),
    booking("Gone11", "2026-10-20"),
    booking("Stay11", "2026-10-19", { nights: 3 }),
    booking("Held11", "2026-10-22", { status: "pending" }),
    booking("Lapsed", "2026-10-22", { status: "expired" }),
    booking("Stop11", "2026-10-25", { status: "cancelled" }),
    booking("Stop22", "2026-10-01", { status: "cancelled" }),
  ];

  it("shows what is ahead, soonest first, a stay until its check-out day", () => {
    expect(chooseBookings(all, "upcoming", today).map(each => each.code)).toEqual(["Stay11", "Today1", "Held11", "Early1", "Later1"]);
  });

  it("shows what has ended, the latest first, and leaves out unpaid holds", () => {
    expect(chooseBookings(all, "past", today).map(each => each.code)).toEqual(["Gone11"]);
  });

  it("keeps cancelled bookings on their own tab", () => {
    expect(chooseBookings(all, "cancelled", today).map(each => each.code)).toEqual(["Stop11", "Stop22"]);
  });

  it("groups them by day, in the order chosen", () => {
    const groups = groupByDay(chooseBookings(all, "upcoming", today));
    expect(groups.map(group => group.day)).toEqual(["2026-10-19", "2026-10-21", "2026-10-22", "2026-10-23"]);
    expect(groups[3].bookings.map(each => each.code)).toEqual(["Early1", "Later1"]);
  });

  it("starts today in the site's time zone, not the browser's", () => {
    // 23:30 in London on 21 October is already 22 October in Copenhagen.
    const late = Date.UTC(2026, 9, 21, 22, 30);
    const today = localDate(late, "Europe/Copenhagen");
    expect(today).toBe("2026-10-22");
    expect(chooseBookings([booking("Wed111", "2026-10-21"), booking("Thu111", "2026-10-22")], "upcoming", today).map(each => each.code)).toEqual(["Thu111"]);
  });

  it("writes a time or a stay's nights", () => {
    expect(whenOnDay({ time: "10:00", nights: null })).toBe("10:00");
    expect(whenOnDay({ time: null, nights: 1 })).toBe("1 night");
    expect(whenOnDay({ time: null, nights: 3 })).toBe("3 nights");
  });
});

describe("money in the site's language", () => {
  it("writes Danish kroner as Danish does", () => {
    expect(localeOf("da")).toBe("da-DK");
    expect(plain(formatMoney(90000, "dkk", "da-DK"))).toBe("900,00 kr.");
    expect(plain(formatMoney(123450, "dkk", "da-DK"))).toBe("1.234,50 kr.");
    expect(amountInput(123450, "dkk", "da-DK")).toBe("1234,50");
  });

  it("knows currencies without øre", () => {
    expect(plain(formatMoney(1500, "jpy", "en-GB"))).toBe("JP¥1,500");
  });

  it("reads an amount typed either way", () => {
    expect(parseAmount("900,00", "dkk")).toBe(90000);
    expect(parseAmount("900", "dkk")).toBe(90000);
    expect(parseAmount("1.234,5", "dkk")).toBe(123450);
    expect(parseAmount("1,234.50", "dkk")).toBe(123450);
    expect(parseAmount("1 234,50 kr.", "dkk")).toBe(123450);
    expect(parseAmount("12.50", "dkk")).toBe(1250);
  });

  it("refuses what is not an amount", () => {
    expect(parseAmount("", "dkk")).toBeNull();
    expect(parseAmount("-10", "dkk")).toBeNull();
    expect(parseAmount("ten", "dkk")).toBeNull();
    expect(parseAmount("1,2,3,", "dkk")).toBeNull();
    expect(parseAmount("1,,2", "dkk")).toBeNull();
  });

  it("writes the history's amounts in it", () => {
    expect(plain(eventName({ type: "refund", detail: { amount: 80000 } }, "dkk", "da-DK"))).toBe("Refunded 800,00 kr.");
    expect(eventName({ type: "email-guest", detail: { to: "guest@example.com" } }, "dkk", "da-DK")).toBe("Confirmation sent to guest@example.com");
    expect(plain(eventName({ type: "cancelled", detail: { refund: 80000, notify: true } }, "dkk", "da-DK"))).toBe("Cancelled");
    expect(eventName({ type: "stripe-session", detail: null }, "dkk", "da-DK")).toBe("Stripe session");
  });
});

describe("the refund", () => {
  it("is at most what was paid, and never below nothing", () => {
    expect(checkRefund("800,00", 90000, "dkk", "da-DK")).toEqual({ minor: 80000 });
    expect(checkRefund("900", 90000, "dkk", "da-DK")).toEqual({ minor: 90000 });
    expect(checkRefund("0", 90000, "dkk", "da-DK")).toEqual({ minor: 0 });
    const over = checkRefund("900,01", 90000, "dkk", "da-DK");
    expect("error" in over && plain(over.error)).toBe("At most 900,00 kr., what was paid.");
    expect("error" in checkRefund("-5", 90000, "dkk", "da-DK")).toBe(true);
    expect(clampRefund(120000, 90000)).toBe(90000);
    expect(clampRefund(-1, 90000)).toBe(0);
    expect(clampRefund(Number.NaN, 90000)).toBe(0);
  });
});

describe("the schedule's fields", () => {
  it("cleans a day's start times", () => {
    expect(cleanTimes(["14:00", "10:00", "", "10:00", "25:00", " 12:00 "])).toEqual(["10:00", "12:00", "14:00"]);
  });

  it("reads a date picker's season and days", () => {
    expect(rangeOf("2026-05-01/2026-09-30")).toEqual({ from: "2026-05-01", to: "2026-09-30" });
    expect(rangeOf("2026-05-01")).toEqual({ from: "2026-05-01", to: "2026-05-01" });
    expect(rangeOf("2026-05-01T09:00/2026-05-03T10:00")).toEqual({ from: "2026-05-01", to: "2026-05-03" });
    expect(rangeOf("")).toBeNull();
    expect(seasonValue({ from: "2026-05-01", to: "2026-09-30" })).toBe("2026-05-01/2026-09-30");
    expect(seasonValue(null)).toBe("");
    expect(daysOf("2026-12-30/2027-01-02")).toEqual(["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
    expect(daysOf("2026-10-21")).toEqual(["2026-10-21"]);
    expect(daysOf("")).toEqual([]);
  });

  it("checks whole numbers", () => {
    expect(wholeNumber("24")).toBe(24);
    expect(wholeNumber("1.5")).toBeNull();
    expect(wholeNumber("")).toBeNull();
    expect(wholeNumber("0", 1)).toBeNull();
  });
});

describe("the schedule's matrix", () => {
  it("reads a day's times as typed, and refuses what is not a time", () => {
    expect(parseTimes("10, 12:30, 14")).toEqual({ times: ["10:00", "12:30", "14:00"] });
    expect(parseTimes("16 10 9.30 10")).toEqual({ times: ["09:30", "10:00", "16:00"] });
    expect(parseTimes("  ")).toEqual({ times: [] });
    expect("error" in parseTimes("10, noon")).toBe(true);
    expect("error" in parseTimes("24")).toBe(true);
    expect("error" in parseTimes("10:75")).toBe(true);
    expect(parseTime("9")).toBe("09:00");
  });

  it("writes them compactly, minutes only when not :00", () => {
    expect(formatTimes(["14:00", "10:00", "12:30", "09:00"])).toBe("9 10 12:30 14");
    expect(formatTimes(undefined)).toBe("");
    expect(timesInput(["10:00", "12:30"])).toBe("10, 12:30");
    expect(shortTime("00:15")).toBe("0:15");
  });

  const offer = (id: string, name: string, kind: "slot" | "seats" | "nights", pool = id, extra: Partial<ResolvedOffer> = {}): ResolvedOffer => ({
    id, name: { da: name, en: name }, kind, pool, capacity: 1, maxGuests: 4, minGuests: 1, prices: [{ id: "p", name: { en: "Price" }, amount: 10000 }],
    cancellation: { fullRefundHours: 24, feeMinor: 0 }, open: true, season: null, weekly: {}, closed: [], noticeHours: 2, horizonDays: 180, ...extra,
  });

  it("groups offers by a shared pool, else by kind, named from their own names", () => {
    const offers = [
      offer("a90", "Private green raft - 1,5 h", "slot", "green"),
      offer("a180", "Private green raft - 3 h", "slot", "green"),
      offer("sunset", "Sunset Sailing Tour", "seats"),
      offer("quiz", "Quiz Tour", "seats"),
      offer("blue1", "Blue Raft 1 - Stay (4 px)", "nights"),
      offer("blue2", "Blue Raft 2 - Stay (6 px)", "nights"),
      offer("solo", "Harbour bus", "slot"),
    ];
    const groups = groupOffers(offers, "en");
    expect(groups.map(group => [group.name, group.kind, group.offers.map(each => each.id)])).toEqual([
      ["Private green raft", "slot", ["a90", "a180"]],
      ["Shared trips", "seats", ["sunset", "quiz"]],
      ["Blue Raft", "nights", ["blue1", "blue2"]],
      ["Harbour bus", "slot", ["solo"]],
    ]);
    expect(shortName("Private green raft - 3 h", "Private green raft")).toBe("3 h");
    expect(shortName("Sunset Sailing Tour", "Shared trips")).toBe("Sunset Sailing Tour");
    expect(commonName(["Blue Raft 1 - Stay", "Blue Raft 2 - Stay"])).toBe("Blue Raft");
    expect(commonName(["Sunset", "Quiz"])).toBe("");
  });

  it("gives a group the limits most of its offers have, and keeps an offer's own", () => {
    const season = { from: "2026-05-01", to: "2026-09-30" };
    const offers = [offer("a", "A", "slot", "p", { season }), offer("b", "B", "slot", "p", { season }), offer("c", "C", "slot", "p", { season: null, noticeHours: 6 })];
    const limits = groupLimits(offers)!;
    expect(limits).toEqual({ season, closed: [], noticeHours: 2, horizonDays: 180 });
    const own = ownLimits(offers, limits);
    expect([...own]).toEqual(["c"]);
    const later = { ...limits, season: { from: "2026-06-01", to: "2026-08-31" }, closed: ["2026-07-01"] };
    const applied = applyLimits(offers, later, own);
    expect(applied.map(each => each.season?.from ?? null)).toEqual(["2026-06-01", "2026-06-01", null]);
    expect(applied[0]!.closed).toEqual(["2026-07-01"]);
    expect(applied[2]!.noticeHours).toBe(6);
    expect(sameLimits(limitsOf({ season: null, closed: ["b", "a"], noticeHours: 1, horizonDays: 2 }), { season: null, closed: ["a", "b"], noticeHours: 1, horizonDays: 2 })).toBe(true);
  });

  it("knows what a draft changed, and copies another row's week", () => {
    const saved = offer("a", "A", "slot", "p", { weekly: { mon: ["10:00"] } });
    const draft = { ...sameTimesAs(saved, { weekly: { mon: ["10:00"], tue: ["12:00"] } }), open: false, noticeHours: 4 };
    expect([...changesOf(saved, draft)]).toEqual(["open", "tue", "noticeHours"]);
    expect(changesOf(saved, { ...saved, weekly: { mon: ["10:00"], tue: [] } }).size).toBe(0);
    expect(overrideOf(draft).weekly).toEqual({ mon: ["10:00"], tue: ["12:00"], wed: [], thu: [], fri: [], sat: [], sun: [] });
  });

  it("writes and reads prices as whole kroner", () => {
    expect(priceText(290000, "dkk", "da-DK")).toBe("2.900");
    expect(priceText(14950, "dkk", "da-DK")).toBe("149,50");
    expect(pricesText([{ amount: 14900 }, { amount: 24900 }], "dkk", "da-DK")).toBe("149 / 249");
    expect(parsePrices("149 / 249,50", 2, "dkk")).toEqual({ amounts: [14900, 24950] });
    expect(parsePrices("2.900", 1, "dkk")).toEqual({ amounts: [290000] });
    expect("error" in parsePrices("149", 2, "dkk")).toBe(true);
    expect("error" in parsePrices("149 / ten", 2, "dkk")).toBe(true);
  });

  it("names seasons and closed days briefly", () => {
    // ICU writes September "Sep" or "Sept" depending on its version.
    expect(seasonText({ from: "2026-05-01", to: "2026-09-30" })).toMatch(/^1 May – 30 Sept?$/);
    expect(seasonText(null)).toBe("All year");
    expect(closedDayName("2026-12-24")).toBe("Thu 24 Dec");
  });
});

describe("try booking", () => {
  it("opens the site's own booking page, in a language, on the site's address", () => {
    expect(bookingPageOf("https://cphraft.c9y.site/")).toBe("https://cphraft.c9y.site/book/");
    expect(bookingPageOf("https://cphraft.c9y.site/edit/", "/en")).toBe("https://cphraft.c9y.site/en/book/");
    expect(bookingPageOf("not an address")).toBe("");
  });
});
