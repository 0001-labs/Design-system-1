// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
import { askedConstraints, createConstraintPanel } from "../DS1/0-face/constraint-panel";
import { PHONE_WIDTHS, checkSite, describeElement, sitemapPages, type SiteFinding } from "../DS1/0-face/constraint-site";

afterEach(() => { document.body.replaceChildren(); localStorage.clear(); });

test("the address opens the panel on this page or on the whole site", () => {
  expect(askedConstraints("?constraints=1")).toBe("page");
  expect(askedConstraints("?constraints")).toBe("page");
  expect(askedConstraints("?constraints=site")).toBe("site");
  expect(askedConstraints("?other=1")).toBeNull();
});

test("a sitemap gives the site's own pages once each, in its order", () => {
  const xml = `<urlset><url><loc>https://example.com/</loc></url><url><loc> https://example.com/de/?a=1&amp;b=2 </loc></url>
    <url><loc>https://elsewhere.com/</loc></url><url><loc>https://example.com/</loc></url></urlset>`;
  expect(sitemapPages(xml, "https://example.com")).toEqual(["https://example.com/", "https://example.com/de/?a=1&b=2"]);
  expect(sitemapPages("<html></html>", "https://example.com")).toEqual([]);
});

test("an element is named by its tag, id and classes, and the start of its words", () => {
  const element = document.createElement("section");
  element.id = "hours";
  element.className = "panel panel--wide";
  element.textContent = "  Opening   hours at the office, every day of the week ";
  expect(describeElement(element)).toBe('section#hours.panel.panel--wide "Opening hours at the office, every day o"');
});

test("the site check measures every page at every phone width, a page at a time, and puts back what the pages stored", async () => {
  localStorage.setItem("kept", "yes");
  const seen: string[] = [];
  const broken: SiteFinding = { code: "page.window-width", rule: "", message: "It reaches 40px past the window's right edge.", element: "section" };
  const results = await checkSite({
    pages: ["https://example.com/", "https://example.com/de/"],
    async inspect(url, width) {
      seen.push(`${new URL(url).pathname} ${width}`);
      localStorage.setItem("ph-out", "1");
      localStorage.setItem("kept", "changed");
      if (width === 320 && url.endsWith("/de/")) return [broken];
      if (width === 430) throw new Error("did not load in 30 seconds");
      return [];
    },
    onResult: () => {},
  });
  expect(seen).toEqual([...PHONE_WIDTHS.map(w => `/ ${w}`), ...PHONE_WIDTHS.map(w => `/de/ ${w}`)]);
  expect(results.filter(r => r.findings.length)).toEqual([{ url: "https://example.com/de/", width: 320, findings: [broken] }]);
  expect(results.filter(r => r.error).map(r => r.error)).toEqual(["did not load in 30 seconds", "did not load in 30 seconds"]);
  expect(localStorage.getItem("ph-out")).toBeNull();
  expect(localStorage.getItem("kept")).toBe("yes");
});

test("the site check stops when asked", async () => {
  const controller = new AbortController();
  const seen: string[] = [];
  await checkSite({
    pages: ["https://example.com/", "https://example.com/de/"],
    widths: [320],
    async inspect(url) { seen.push(url); controller.abort(); return []; },
    onResult: () => {},
    signal: controller.signal,
  });
  expect(seen).toEqual(["https://example.com/"]);
});

test("the panel says when this page keeps every constraint, and offers the site's check", () => {
  const panel = createConstraintPanel();
  panel.show();
  const shadow = document.querySelector("[data-ds-constraint-panel]")!.shadowRoot!;
  expect(shadow.querySelector("[data-status]")!.textContent).toBe("This page keeps every constraint.");
  expect(shadow.querySelector("[data-site]")!.textContent).toBe("Site");
  panel.hide();
});
