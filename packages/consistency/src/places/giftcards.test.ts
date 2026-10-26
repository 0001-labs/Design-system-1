import { describe, expect, it } from "vite-plus/test";
import type { TeamGiftCardView } from "./bookings-shared";
import { formatMoney, localeOf } from "./bookings-view";
import {
  checkIssueAmount,
  chooseCards,
  dateName,
  giftEventName,
  giftStatusName,
  messageCount,
  sentTo,
  sortCards,
  useName,
  viewOf,
} from "./giftcards-view";

// Spaces in money vary by ICU: compare with every kind of space as a plain one.
const plain = (words: string) => words.replace(/[\u00a0\u202f]/g, " ");

// A card as the team's API answers it.
const card = (code: string, extra: Partial<TeamGiftCardView> = {}): TeamGiftCardView => ({
  id: code, code, amount: 50000, balance: 50000, held: 0, currency: "dkk", status: "active", expires: "2027-10-21", recipient: "Ida", recipientEmail: "ida@example.com",
  sendTo: "recipient", sendOn: null, sent: true, lang: "da", testMode: true, buyer: { name: "Bo", email: "bo@example.com" }, message: "", paid: 50000, issuedBy: null,
  createdAt: 1000, uses: [],
  ...extra,
});

describe("the cards each tab shows", () => {
  const all = [
    card("LATE", { expires: "2027-12-01", createdAt: 3000 }),
    card("SOON", { expires: "2027-01-05", createdAt: 1000 }),
    card("SPENT", { status: "used", balance: 0, createdAt: 2000 }),
    card("SPENT2", { status: "used", balance: 0, createdAt: 4000 }),
    card("WAIT", { status: "pending", code: null, expires: null, createdAt: 5000 }),
    card("GONE", { status: "expired", expires: "2026-01-01", createdAt: 500 }),
    card("VOID", { status: "void", createdAt: 600 }),
  ];
  const codes = (cards: TeamGiftCardView[]) => cards.map(each => each.id);

  it("shows the active cards, the soonest to run out first", () => {
    expect(codes(chooseCards(all, "active"))).toEqual(["SOON", "LATE"]);
  });

  it("shows the used cards, the newest first", () => {
    expect(codes(chooseCards(all, "used"))).toEqual(["SPENT2", "SPENT"]);
  });

  it("shows every card in All, the newest first", () => {
    expect(codes(chooseCards(all, "all"))).toEqual(["WAIT", "SPENT2", "LATE", "SPENT", "SOON", "VOID", "GONE"]);
  });

  it("sorts by expiry with an unpaid card last, and by created without changing the list", () => {
    expect(codes(sortCards(all, "expiry"))).toEqual(["GONE", "SOON", "SPENT2", "SPENT", "VOID", "LATE", "WAIT"]);
    const before = codes(all);
    sortCards(all, "created");
    expect(codes(all)).toEqual(before);
  });

  it("reads a tab from the route, Active when it names none", () => {
    expect(viewOf("used")).toBe("used");
    expect(viewOf("all")).toBe("all");
    expect(viewOf(null)).toBe("active");
    expect(viewOf("schedule")).toBe("active");
  });

});

describe("words", () => {
  it("names each status with its tone", () => {
    expect(giftStatusName("active")).toEqual({ name: "Active", tone: "success" });
    expect(giftStatusName("pending")).toEqual({ name: "Awaiting payment", tone: "warning" });
    expect(giftStatusName("used").tone).toBe("muted");
    expect(giftStatusName("expired").name).toBe("Expired");
    expect(giftStatusName("void")).toEqual({ name: "Void", tone: "danger" });
  });

  it("names what became of a use", () => {
    expect(useName("drawn")).toBe("Paid");
    expect(useName("returned")).toBe("Put back, the booking cancelled");
    expect(useName("released")).toBe("Let go, not paid");
  });

  it("writes an expiry as a date", () => {
    expect(dateName("2027-10-21")).toBe("21 October 2027");
    expect(dateName("2027-10-21", true)).toBe("21 Oct 2027");
    expect(dateName(null)).toBe("");
    expect(dateName("soon")).toBe("");
  });

  it("writes money as Bookings does, in the site's language", () => {
    expect(plain(formatMoney(50000, "dkk", localeOf("da")))).toBe("500,00 kr.");
    expect(plain(giftEventName({ type: "issued", detail: { amount: 100000 } }, "dkk", localeOf("da")))).toBe("Issued 1.000,00 kr., without payment");
  });

  it("names the history's events", () => {
    const da = localeOf("da");
    expect(giftEventName({ type: "sent", detail: { to: "ida@example.com" } }, "dkk", da)).toBe("Sent to ida@example.com");
    expect(giftEventName({ type: "resent", detail: { to: "bo@example.com" } }, "dkk", da)).toBe("Sent again to bo@example.com");
    expect(plain(giftEventName({ type: "drawn", detail: { booking: "b1", amount: 20000 } }, "dkk", da))).toBe("Paid 200,00 kr. of a booking");
    expect(giftEventName({ type: "voided", detail: null }, "dkk", da)).toBe("Voided");
    expect(giftEventName({ type: "something-new", detail: null }, "dkk", da)).toBe("Something new");
  });

  it("counts a message's characters", () => {
    expect(messageCount("", 300)).toBe("0 of 300");
    expect(messageCount("Tillykke æøå", 300)).toBe("12 of 300");
  });
});

describe("where a card went", () => {
  it("takes the latest sending's address", () => {
    const events = [
      { type: "sent", detail: { to: "ida@example.com" } },
      { type: "receipt", detail: { to: "bo@example.com" } },
      { type: "resent", detail: { to: "ida@work.example.com" } },
    ];
    expect(sentTo(card("A"), events)).toBe("ida@work.example.com");
  });

  it("counts the receipt for a card sent to its buyer", () => {
    expect(sentTo(card("A", { sendTo: "buyer" }), [{ type: "receipt", detail: { to: "bo@example.com" } }])).toBe("bo@example.com");
    expect(sentTo(card("A"), [{ type: "receipt", detail: { to: "bo@example.com" } }])).toBe("ida@example.com");
  });

  it("falls back to where it is meant to go", () => {
    expect(sentTo(card("A"), [])).toBe("ida@example.com");
    expect(sentTo(card("A", { recipientEmail: null }), [])).toBe("bo@example.com");
    expect(sentTo(card("A", { sendTo: "buyer" }), [])).toBe("bo@example.com");
  });
});

describe("an amount the team issues", () => {
  const da = localeOf("da");

  it("reads whole kroner as øre", () => {
    expect(checkIssueAmount("500", "dkk", da, null)).toEqual({ minor: 50000 });
    expect(checkIssueAmount("1.000", "dkk", da, null)).toEqual({ minor: 100000 });
    expect(checkIssueAmount("750 kr.", "dkk", da, { min: 20000, max: 1000000 })).toEqual({ minor: 75000 });
  });

  it("refuses nothing, øre and words", () => {
    expect(checkIssueAmount("0", "dkk", da, null)).toHaveProperty("error");
    expect(checkIssueAmount("500,50", "dkk", da, null)).toEqual({ error: "Write the amount in whole kroner, without øre." });
    expect(checkIssueAmount("lots", "dkk", da, null)).toHaveProperty("error");
  });

  it("keeps within the site's bounds when they are known", () => {
    const checked = checkIssueAmount("100", "dkk", da, { min: 20000, max: 1000000 });
    expect("error" in checked && plain(checked.error)).toBe("From 200,00 kr. to 10.000,00 kr., the site's bounds.");
  });
});
