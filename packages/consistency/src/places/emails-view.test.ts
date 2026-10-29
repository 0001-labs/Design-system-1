import { describe, expect, it } from "vite-plus/test";
import { EMAIL_KIND_NAMES, emailDocument, emailsQuery, emailStatusName, kindName, relatedOf, sentAt, sizeName } from "./emails-view";

// Ported from the sites' own editor's tests (team-cms/tests/app-emails.test.ts, deleted 26 October 2026).
describe("the Emails place's list", () => {
  it("asks for a page by kind, words and cursor, leaving out what is not chosen", () => {
    expect(emailsQuery({})).toBe("emails");
    expect(emailsQuery({ kind: "gift-card", q: "  ida@example.com ", after: "1761.ab" })).toBe("emails?kind=gift-card&q=ida%40example.com&after=1761.ab");
    expect(emailsQuery({ kind: null, q: "   " })).toBe("emails");
  });
});

describe("an email in words", () => {
  it("names every kind the Worker sends, and shows an unknown one as it is", () => {
    expect(Object.keys(EMAIL_KIND_NAMES)).toEqual(["form-inquiry", "sign-in-code", "booking-confirmation", "booking-team-note", "booking-cancelled", "gift-card", "gift-card-receipt"]);
    expect(kindName("form-inquiry")).toBe("Form enquiry");
    expect(kindName("booking-team-note")).toBe("Booking note to the team");
    expect(kindName("newsletter")).toBe("newsletter");
  });

  it("marks a failed one in the danger tone", () => {
    expect(emailStatusName("failed")).toEqual({ name: "Failed", tone: "danger" });
    expect(emailStatusName("sent")).toEqual({ name: "Sent", tone: "success" });
  });

  it("writes the time as today's clock, a day this year, or a day with its year", () => {
    const now = Date.UTC(2026, 9, 21, 12);
    expect(sentAt(Date.UTC(2026, 9, 21, 9, 5), now, "UTC")).toBe("09:05");
    expect(sentAt(Date.UTC(2026, 2, 3, 14, 30), now, "UTC")).toBe("3 Mar, 14:30");
    expect(sentAt(Date.UTC(2025, 11, 24, 8), now, "UTC")).toBe("24 Dec 2025, 08:00");
  });

  it("writes a size as people read it, and none for a template's", () => {
    expect(sizeName(820)).toBe("820 bytes");
    expect(sizeName(41_200)).toBe("41 KB");
    expect(sizeName(1_250_000)).toBe("1.3 MB");
    expect(sizeName(0)).toBe("");
  });

  it("says what an email was about: a booking, or a gift card and its PDF through the site's API", () => {
    expect(relatedOf({ kind: "booking-confirmation", related: "b1" })).toEqual({ name: "A booking", place: "bookings", id: "b1" });
    expect(relatedOf({ kind: "gift-card-receipt", related: "g 1" })).toEqual({ name: "A gift card", place: "giftcards", id: "g 1", pdf: "giftcards/g%201/pdf" });
    expect(relatedOf({ kind: "sign-in-code", related: null })).toBeNull();
  });
});

describe("the document an email is drawn in", () => {
  it("holds the email's HTML, fetches nothing but images, and opens links in a new tab", () => {
    const document = emailDocument("<p>Hej</p>");
    expect(document).toContain("<body><p>Hej</p></body>");
    expect(document).toContain("default-src 'none'");
    expect(document).toContain('<base target="_blank">');
    expect(document).not.toMatch(/<script/i);
  });
});
