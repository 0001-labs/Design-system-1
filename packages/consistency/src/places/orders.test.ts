import { describe, expect, it } from "vite-plus/test";
import { allowedSteps, dayAt, kindLabel, lineSpan, orderAt, orderEventName, ordersLabel, ordersQuery, orderStatusName, paymentName, stepDone, stepName, STATUSES } from "./orders-view";

describe("the Orders place's words", () => {
  it("names the orders and their kinds in the site's words in the app's language, else its own", () => {
    const about = { label: { da: { one: "Ordre", many: "Ordrer" }, en: { one: "Order", many: "Orders" } }, kindLabels: { request: { da: { one: "Forespørgsel", many: "Forespørgsler" }, en: { one: "Enquiry", many: "Enquiries" } } } };
    expect(ordersLabel(about).many).toBe("Orders");
    expect(ordersLabel({ label: { da: { one: "Ordre", many: "Ordrer" } } }).many).toBe("Orders");
    expect(ordersLabel(null, "Bookings").many).toBe("Bookings");
    expect(kindLabel(about, "request")).toEqual({ one: "Enquiry", many: "Enquiries" });
    expect(kindLabel(about, "sale")).toEqual({ one: "Sale", many: "Sales" });
  });

  it("gives every status words and a tone", () => {
    for (const status of STATUSES) expect(orderStatusName(status).name).toBeTruthy();
    expect(orderStatusName("held")).toEqual({ name: "Awaiting payment", tone: "warning" });
    expect(orderStatusName("cancelled").tone).toBe("danger");
  });
});

describe("the steps the engine allows the owner", () => {
  it("follows the engine's transitions from each status", () => {
    expect(allowedSteps("requested")).toEqual(["confirm", "cancel"]);
    expect(allowedSteps("held")).toEqual(["cancel"]);
    expect(allowedSteps("confirmed")).toEqual(["invoice", "mark-paid", "fulfil", "cancel"]);
    expect(allowedSteps("invoiced")).toEqual(["mark-paid", "fulfil", "cancel"]);
    expect(allowedSteps("paid")).toEqual(["fulfil", "cancel"]);
    for (const status of ["cancelled", "fulfilled", "expired"] as const) expect(allowedSteps(status)).toEqual([]);
  });

  it("names a request's steps approving and declining", () => {
    expect(stepName("confirm", { kind: "request", status: "requested" })).toBe("Approve");
    expect(stepName("cancel", { kind: "request", status: "requested" })).toBe("Decline");
    expect(stepName("cancel", { kind: "sale", status: "paid" })).toBe("Cancel");
    expect(stepDone("cancel", { code: "Rb42Xq", kind: "request", status: "requested" })).toBe("Rb42Xq is declined");
    expect(stepDone("mark-paid", { code: "Rb42Xq", kind: "sale", status: "invoiced" })).toBe("Rb42Xq is marked paid");
  });
});

describe("the list's query", () => {
  it("asks with the filters set, the words trimmed and the cursor", () => {
    expect(ordersQuery({ kind: null, status: null, q: "" })).toBe("orders?limit=50");
    expect(ordersQuery({ kind: "sale", status: "invoiced", q: "  ida " }, "1700000000000:0f0e0d0c-0b0a-4908-8706-050403020100", 50))
      .toBe("orders?kind=sale&status=invoiced&q=ida&limit=50&after=1700000000000%3A0f0e0d0c-0b0a-4908-8706-050403020100");
    expect(new URLSearchParams(ordersQuery({ kind: null, status: null, q: "x".repeat(150) }).slice(7)).get("q")).toHaveLength(100);
  });
});

describe("an order in words", () => {
  const zone = "Europe/Copenhagen";
  const now = Date.parse("2026-10-26T12:00:00Z");
  it("happens at its first line's start, else when it was made", () => {
    const line = { startsAt: null as number | null };
    expect(orderAt({ createdAt: 5, lines: [line as never] })).toBe(5);
    expect(orderAt({ createdAt: 5, lines: [line as never, { startsAt: 9 } as never] })).toBe(9);
  });
  it("writes days in the site's zone, with the year when it is another", () => {
    expect(dayAt(Date.parse("2026-10-23T08:00:00Z"), zone, false, now)).toBe("23 Oct");
    expect(dayAt(Date.parse("2026-10-23T08:00:00Z"), zone, true, now)).toBe("23 Oct, 10:00");
    expect(dayAt(Date.parse("2025-01-02T08:00:00Z"), zone, false, now)).toBe("2 Jan 2025");
  });
  it("writes a line's span: a dated item's days or a booking's start", () => {
    expect(lineSpan({ startsAt: null, nights: null, meta: { from: "2026-11-01", to: "2026-11-03" } }, zone)).toBe("2026-11-01 to 2026-11-03");
    expect(lineSpan({ startsAt: null, nights: null, meta: {} }, zone)).toBe("");
    expect(lineSpan({ startsAt: Date.parse("2026-10-23T11:00:00Z"), nights: 2, meta: {} }, zone)).toMatch(/23 Oct.*, 2 nights$/);
  });
  it("names its payment and its history", () => {
    expect(paymentName({ payment: "invoice", invoice: { number: "1007", to: null, dueOn: "2026-11-09", at: 1 } })).toBe("Invoice 1007");
    expect(paymentName({ payment: "stripe", invoice: null })).toBe("Stripe");
    expect(orderEventName({ what: "invoiced", detail: { number: "1007" } }, "dkk", "da-DK")).toBe("Invoiced as 1007");
    expect(orderEventName({ what: "paid", detail: { amount: 90000 } }, "dkk", "da-DK")).toMatch(/^Paid 900,00\s?kr\.$/);
    expect(orderEventName({ what: "something-new", detail: null }, "dkk", "da-DK")).toBe("Something new");
  });
});
