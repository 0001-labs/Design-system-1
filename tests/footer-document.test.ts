// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { loadTranslations, setLanguage } = await import("../DS1/0-face/i18n");
const { footerColumnWidth } = await import("../DS1/4-page/ds-footer");
await import("../DS1/4-page/ds-document");

afterEach(() => { document.body.replaceChildren(); setLanguage("en"); });
const settle = () => new Promise(resolve => setTimeout(resolve));

const COLUMNS = [
  { heading: "Product", links: [{ label: "Download", href: "/download" }, { label: "Help", href: "/help", current: true }] },
  { heading: "Elsewhere", links: [{ label: "Instagram", href: "https://instagram.com/name", external: true }] },
  { links: [{ label: "Terms", href: "/terms" }] },
];

test("ds-footer draws its brand, columns of links, copyright and preferences", async () => {
  const footer = document.createElement("ds-footer");
  Object.assign(footer, { brand: "Name", tagline: "What it does", columns: COLUMNS, year: 2026, literal: true });
  footer.setAttribute("preferences", "");
  document.body.append(footer);
  await footer.updateComplete;
  const root = footer.shadowRoot!;
  expect(root.querySelector("footer")!.className).toBe("ds-footer");
  const mark = root.querySelector<HTMLAnchorElement>(".ds-footer__mark")!;
  expect([mark.textContent, mark.getAttribute("href")]).toEqual(["Name", "/"]);
  expect(root.querySelector(".ds-footer__tagline")!.textContent).toBe("What it does");
  // Without a label the columns are lists, not a second navigation.
  expect(root.querySelector("nav")).toBeNull();
  const columns = root.querySelectorAll(".ds-footer__column");
  expect(columns).toHaveLength(3);
  expect([...root.querySelectorAll(".ds-footer__heading")].map(heading => [heading.tagName, heading.textContent])).toEqual([["H2", "Product"], ["H2", "Elsewhere"]]);
  const links = [...root.querySelectorAll<HTMLAnchorElement>(".ds-footer__links a")];
  expect(links.map(link => link.textContent)).toEqual(["Download", "Help", "Instagram", "Terms"]);
  expect(links[1]!.getAttribute("aria-current")).toBe("page");
  expect(links[0]!.hasAttribute("aria-current")).toBe(false);
  expect([links[2]!.getAttribute("target"), links[2]!.getAttribute("rel")]).toEqual(["_blank", "noopener noreferrer"]);
  expect(links[0]!.hasAttribute("target")).toBe(false);
  expect(root.querySelector(".ds-footer__legal")!.textContent!.trim()).toBe("© 2026 Name");
  expect([...root.querySelectorAll("ds-cycle")].map(cycle => cycle.getAttribute("type"))).toEqual(["language", "theme"]);

  footer.label = "Footer"; footer.owner = "Company"; footer.setAttribute("preferences", "theme");
  await footer.updateComplete;
  expect(root.querySelector("nav.ds-footer__columns")!.getAttribute("aria-label")).toBe("Footer");
  expect(root.querySelector(".ds-footer__legal")!.textContent!.trim()).toBe("© 2026 Company");
  expect([...root.querySelectorAll("ds-cycle")].map(cycle => cycle.getAttribute("type"))).toEqual(["theme"]);
  footer.removeAttribute("preferences");
  await footer.updateComplete;
  expect(root.querySelector(".ds-footer__preferences")!.hasAttribute("hidden")).toBe(true);
});

test("ds-footer looks its words up unless literal, takes this year by default, and lets the page bring its own parts", async () => {
  loadTranslations("da", { Product: "Produkt", Download: "Hent" });
  const footer = document.createElement("ds-footer");
  footer.columns = [{ heading: "Product", links: [{ label: "Download", href: "/download" }] }];
  footer.innerHTML = '<a slot="brand" href="/"><img alt="Name" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></a><p slot="legal">© Name, made in Japan</p><button slot="preferences">¥</button>';
  document.body.append(footer);
  await footer.updateComplete;
  const root = footer.shadowRoot!;
  setLanguage("da"); await footer.updateComplete;
  expect(root.querySelector(".ds-footer__heading")!.textContent).toBe("Produkt");
  expect(root.querySelector(".ds-footer__links a")!.textContent).toBe("Hent");
  expect(root.querySelector(".ds-footer__mark")).toBeNull();
  expect(root.querySelector('[part="brand"]')!.hasAttribute("hidden")).toBe(false);
  expect(root.querySelector('[part="preferences"]')!.hasAttribute("hidden")).toBe(false);
  expect(root.querySelector('slot[name="legal"]')).not.toBeNull();
  footer.replaceChildren(); footer.literal = true; await footer.updateComplete;
  expect(root.querySelector(".ds-footer__heading")!.textContent).toBe("Product");
  expect(root.querySelector(".ds-footer__legal")!.textContent!.trim()).toBe(`© ${new Date().getFullYear()}`);
  expect(root.querySelector('[part="brand"]')!.hasAttribute("hidden")).toBe(true);
});

function legalDocument(markup = "") {
  const element = document.createElement("ds-document");
  element.innerHTML = markup || `
    <h1>Terms</h1>
    <p>These terms apply.</p>
    <h2>Using the service</h2><p>…</p>
    <h3>Accounts</h3><p>…</p>
    <h2 id="pay">Payments</h2><p>…</p>
    <h2>特定商取引法に基づく表記</h2>
    <dl class="ds-definitions"><dt>販売価格</dt><dd>各商品ページに表示します。</dd></dl>
    <div data-ds-not-prose><h2>An example</h2></div>`;
  document.body.append(element);
  return element;
}

test("ds-document builds its contents from the writing's headings, giving them ids", async () => {
  const element = legalDocument();
  await element.updateComplete; await settle(); await element.updateComplete;
  expect(element.hasAttribute("data-ds-prose")).toBe(true);
  const root = element.shadowRoot!;
  const nav = root.querySelector("nav")!;
  expect(nav.hasAttribute("hidden")).toBe(false);
  expect(nav.getAttribute("aria-labelledby")).toBe("contents-title");
  expect(root.getElementById("contents-title")!.textContent).toBe("Contents");
  const links = [...root.querySelectorAll<HTMLAnchorElement>(".ds-document__toc-list a")];
  expect(links.map(link => [link.textContent, link.getAttribute("href")])).toEqual([
    ["Using the service", "#using-the-service"],
    ["Payments", "#pay"],
    ["特定商取引法に基づく表記", "#特定商取引法に基づく表記"],
  ]);
  expect(element.querySelector("h2")!.id).toBe("using-the-service");
  // A heading in a part marked data-ds-not-prose is not the writing's.
  expect(element.querySelector("[data-ds-not-prose] h2")!.id).toBe("");

  element.levels = "2 3"; await element.updateComplete; await element.updateComplete;
  const items = [...root.querySelectorAll(".ds-document__toc-list li")];
  expect(items.map(item => [item.textContent!.trim(), item.classList.contains("ds-document__toc-sub")])).toEqual([
    ["Using the service", false], ["Accounts", true], ["Payments", false], ["特定商取引法に基づく表記", false],
  ]);

  // Writing that changes is read again.
  element.querySelector("h2#pay")!.textContent = "Paying";
  await settle(); await element.updateComplete;
  expect([...root.querySelectorAll(".ds-document__toc-list a")].map(link => link.textContent)).toContain("Paying");
});

test("a contents link scrolls to its heading, focuses it and marks it as the section in view", async () => {
  const element = legalDocument();
  await element.updateComplete; await settle(); await element.updateComplete;
  const root = element.shadowRoot!;
  const heading = element.querySelector<HTMLElement>("#pay")!;
  const scrolled = vi.fn();
  heading.scrollIntoView = scrolled;
  const link = root.querySelector<HTMLAnchorElement>('a[href="#pay"]')!;
  const click = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
  link.dispatchEvent(click);
  expect(click.defaultPrevented).toBe(true);
  expect(scrolled).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(heading);
  expect(heading.getAttribute("tabindex")).toBe("-1");
  expect(location.hash).toBe("#pay");
  await element.updateComplete;
  expect(link.getAttribute("aria-current")).toBe("location");
  expect(root.querySelectorAll('[aria-current="location"]')).toHaveLength(1);
  // A modified click is the browser's: a new tab, a copied link.
  const modified = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true, metaKey: true });
  link.dispatchEvent(modified);
  expect(modified.defaultPrevented).toBe(false);
  history.replaceState(null, "", location.pathname);
});

test("ds-document has no contents for one heading or when asked, and names them in the page's language", async () => {
  loadTranslations("ja", { Contents: "目次" });
  const single = legalDocument("<h1>Help</h1><h2>Only</h2><p>…</p>");
  await single.updateComplete; await settle(); await single.updateComplete;
  expect(single.shadowRoot!.querySelector("nav")!.hasAttribute("hidden")).toBe(true);
  const full = legalDocument();
  await full.updateComplete; await settle();
  full.hideContents = true; await full.updateComplete;
  expect(full.getAttribute("hide-contents")).toBe("");
  expect(full.shadowRoot!.querySelector("nav")!.hasAttribute("hidden")).toBe(true);
  full.hideContents = false;
  setLanguage("ja"); await full.updateComplete;
  expect(full.shadowRoot!.getElementById("contents-title")!.textContent).toBe("目次");
  full.label = "On this page"; full.literal = true; await full.updateComplete;
  expect(full.shadowRoot!.getElementById("contents-title")!.textContent).toBe("On this page");
});

test("contents of the page's own take the built list's place", async () => {
  const element = legalDocument('<ol slot="contents"><li><a href="#a">A</a></li></ol><h2 id="a">A</h2>');
  await element.updateComplete; await settle(); await element.updateComplete;
  const root = element.shadowRoot!;
  expect(root.querySelector("nav")!.hasAttribute("hidden")).toBe(false);
  expect(root.querySelector('slot[name="contents"]')).not.toBeNull();
});

test("ds-footer draws a column's icon links first, in a row of marks named by their labels", async () => {
  const footer = document.createElement("ds-footer");
  Object.assign(footer, { literal: true, columns: [{ heading: "Contact", links: [
    { label: "hello@example.com", href: "mailto:hello@example.com" },
    { label: "Instagram", href: "https://instagram.com/name", external: true, icon: "icons/instagram.svg" },
    { label: "LinkedIn", href: "https://linkedin.com/company/name", external: true, icon: "icons/linkedin.svg" },
  ] }] });
  document.body.append(footer);
  await footer.updateComplete;
  const column = footer.shadowRoot!.querySelector(".ds-footer__column")!;
  expect([...column.children].map(child => child.className)).toEqual(["ds-footer__heading", "ds-footer__icons", "ds-footer__links"]);
  const marks = [...column.querySelectorAll<HTMLAnchorElement>(".ds-footer__icons a")];
  expect(marks.map(a => [a.getAttribute("aria-label"), a.getAttribute("target")])).toEqual([["Instagram", "_blank"], ["LinkedIn", "_blank"]]);
  expect(marks[0]!.querySelector<HTMLElement>(".ds-icon")!.getAttribute("style")).toContain('icons/instagram.svg');
  expect([...column.querySelectorAll(".ds-footer__links a")].map(a => a.textContent)).toEqual(["hello@example.com"]);
});

test("ds-footer draws contact lines: words alone beside links, a heading that is a link, a column's own width and round marks stacked at the end", async () => {
  const footer = document.createElement("ds-footer");
  Object.assign(footer, { literal: true, year: 2023, owner: "Name", columns: [
    { heading: "Name Ltd", href: "/about", links: [
      { label: "Reg. 12345678" },
      { label: "hello@example.com", href: "mailto:hello@example.com" },
    ] },
    { heading: "Office", width: 10, links: [{ label: "1 Street" }, { label: "1000 City" }] },
    { heading: "Follow", icons: "stack", links: [
      { label: "Instagram", href: "https://instagram.com/name", external: true, icon: "icons/instagram.svg" },
      { label: "LinkedIn", href: "https://linkedin.com/company/name", external: true, icon: "icons/linkedin.svg" },
    ] },
  ], policies: [{ label: "Privacy policy", href: "/privacy" }, { label: "No address" }] });
  document.body.append(footer);
  await footer.updateComplete;
  const root = footer.shadowRoot!;
  const [contact, office, follow] = [...root.querySelectorAll<HTMLElement>(".ds-footer__column")];
  const heading = contact!.querySelector<HTMLAnchorElement>(".ds-footer__heading > a")!;
  expect([heading.textContent, heading.getAttribute("href")]).toEqual(["Name Ltd", "/about"]);
  expect([...contact!.querySelectorAll(".ds-footer__links > li > *")].map(line => [line.tagName, line.textContent])).toEqual([["SPAN", "Reg. 12345678"], ["A", "hello@example.com"]]);
  expect(contact!.getAttribute("style")).toBeNull();
  expect(office!.querySelector(".ds-footer__heading")!.children).toHaveLength(0);
  expect(office!.getAttribute("style")).toContain("--ds-footer-column-width: 10");
  expect(follow!.classList.contains("ds-footer__column--stack")).toBe(true);
  // The stacked column's heading names its marks; it draws no heading line.
  expect(follow!.querySelector(".ds-footer__heading")).toBeNull();
  expect(follow!.querySelector(".ds-footer__icons")!.getAttribute("aria-label")).toBe("Follow");
  expect([...follow!.querySelectorAll<HTMLAnchorElement>(".ds-footer__icons a")].map(a => a.getAttribute("aria-label"))).toEqual(["Instagram", "LinkedIn"]);
  expect(follow!.querySelector(".ds-footer__links")).toBeNull();
  // Policies stand under the copyright as secondary buttons; one without an address is left out.
  expect(root.querySelector(".ds-footer__legal")!.textContent!.trim()).toBe("© 2023 Name");
  const policies = [...root.querySelectorAll<HTMLAnchorElement>(".ds-footer__policies a")];
  expect(policies.map(a => [a.className, a.textContent, a.getAttribute("href")])).toEqual([["ds-button ds-button--secondary", "Privacy policy", "/privacy"]]);
  footer.policies = []; await footer.updateComplete;
  expect(root.querySelector(".ds-footer__policies")).toBeNull();
});

test("a footer column's width is whole squares, eight unless it names a positive number", () => {
  expect([undefined, 0, -2, "x", 10, 9.6, "12"].map(footerColumnWidth)).toEqual([8, 8, 8, 8, 10, 10, 12]);
});
