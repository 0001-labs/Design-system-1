// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { loadTranslations, setLanguage } = await import("../DS1/0-face/i18n");
const { attachOverlay, tabbables } = await import("../DS1/0-face/attach-overlay");
const { startHeaders, markCurrentLink } = await import("../DS1/0-face/header");
const { footerPreferences } = await import("../DS1/4-page/ds-footer");
const { headingId, documentLevels } = await import("../DS1/4-page/ds-document");
await import("../DS1/4-page/ds-header");
await import("../DS1/4-page/ds-page");

const drawers: { destroy(): void }[] = [];
afterEach(() => {
  for (const drawer of drawers.splice(0)) drawer.destroy();
  document.body.replaceChildren();
  document.documentElement.removeAttribute("style");
  setLanguage("en");
});

const key = (target: EventTarget, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
};
const settle = () => new Promise(resolve => setTimeout(resolve));

function nativeHeader() {
  document.body.innerHTML = `
    <header class="ds-header">
      <a class="ds-header__brand" href="/">Name</a>
      <nav class="ds-header__nav" id="site-nav" aria-label="Main">
        <a href="/">Home</a><a href="/help">Help</a><a href="/about">About</a>
      </nav>
      <div class="ds-header__actions"><a class="ds-button ds-button--primary" href="/download">Download</a></div>
      <button class="ds-button ds-button--icon ds-header__toggle" type="button" aria-label="Menu" aria-controls="site-nav" data-close-label="Luk">
        <span class="ds-icon" aria-hidden="true"></span><span class="ds-icon" aria-hidden="true"></span>
      </button>
    </header>
    <main><a href="/elsewhere">Outside</a></main>`;
  const header = document.querySelector<HTMLElement>(".ds-header")!;
  const [drawer] = startHeaders();
  drawers.push(drawer!);
  return { header, drawer: drawer!, toggle: header.querySelector<HTMLButtonElement>(".ds-header__toggle")!, nav: header.querySelector("nav")!, actions: header.querySelector(".ds-header__actions")! };
}

test("a native header's menu button opens its navigation and actions in a modal drawer, and Escape puts them back", () => {
  const { header, drawer, toggle, nav, actions } = nativeHeader();
  const panel = drawer.panel;
  expect(panel.tagName).toBe("DIALOG");
  expect(panel.classList.contains("ds-overlay")).toBe(true);
  expect(panel.classList.contains("ds-overlay--screen")).toBe(true);
  expect(panel.getAttribute("aria-label")).toBe("Menu");
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(toggle.getAttribute("aria-haspopup")).toBe("dialog");
  expect(toggle.getAttribute("aria-controls")).toBe("site-nav");
  // A second start does not wire the header twice.
  expect(startHeaders()).toEqual([]);

  toggle.click();
  expect(drawer.isOpen).toBe(true);
  expect(panel.open).toBe(true);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(nav.parentElement).toBe(panel);
  expect(actions.parentElement).toBe(panel);
  expect([...panel.children].indexOf(nav)).toBeLessThan([...panel.children].indexOf(actions));
  const close = panel.querySelector<HTMLButtonElement>(".ds-overlay__close")!;
  expect(close.getAttribute("aria-label")).toBe("Luk");
  expect(close.hasAttribute("aria-expanded")).toBe(false);
  expect(close.classList.contains("ds-header__toggle")).toBe(false);
  expect(close.querySelectorAll(".ds-icon")).toHaveLength(2);
  expect(document.activeElement).toBe(close);

  key(document.body, "Escape");
  expect(drawer.isOpen).toBe(false);
  expect(panel.open).toBe(false);
  expect(nav.parentElement).toBe(header);
  expect(nav.previousElementSibling!.classList.contains("ds-header__brand")).toBe(true);
  expect(actions.previousElementSibling).toBe(nav);
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(toggle);
});

test("Tab and Shift+Tab go round the drawer's controls and never leave it", () => {
  const { drawer, toggle } = nativeHeader();
  toggle.click();
  const controls = tabbables(drawer.panel);
  expect(controls.map(control => control.textContent!.trim() || control.getAttribute("aria-label"))).toEqual(["Luk", "Home", "Help", "About", "Download"]);
  controls.at(-1)!.focus();
  expect(key(controls.at(-1)!, "Tab").defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(controls[0]);
  expect(key(controls[0]!, "Tab", { shiftKey: true }).defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(controls.at(-1));
  // Between the first and the last, Tab is the browser's own.
  controls[1]!.focus();
  expect(key(controls[1]!, "Tab").defaultPrevented).toBe(false);
  // Focus that slipped out comes back in.
  document.querySelector<HTMLElement>("main a")!.focus();
  key(document.body, "Tab");
  expect(document.activeElement).toBe(controls[0]);
});

test("the drawer holds the page's scroll while it is open, and closes on its close button and on a link", () => {
  const { drawer, toggle, header } = nativeHeader();
  document.documentElement.style.overflow = "clip";
  toggle.click();
  expect(document.documentElement.style.overflow).toBe("hidden");
  expect(document.documentElement.style.overscrollBehavior).toBe("none");
  drawer.panel.querySelector<HTMLElement>(".ds-overlay__close")!.click();
  expect(drawer.isOpen).toBe(false);
  expect(document.documentElement.style.overflow).toBe("clip");

  toggle.click();
  // A link closes it, even when a router takes the click.
  const help = drawer.panel.querySelector<HTMLAnchorElement>('a[href="/help"]')!;
  help.addEventListener("click", event => event.preventDefault(), { once: true });
  const click = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
  help.dispatchEvent(click);
  expect(click.defaultPrevented).toBe(true);
  expect(drawer.isOpen).toBe(false);
  expect(help.closest(".ds-header")).toBe(header);
  // Clicking the toggle twice closes it again.
  toggle.click(); toggle.click();
  expect(drawer.isOpen).toBe(false);
});

test("two drawers share the page's scroll, and destroy takes a made panel away", () => {
  const a = document.createElement("button"), b = document.createElement("button");
  const partA = document.createElement("div"), partB = document.createElement("div");
  document.body.append(a, partA, b, partB);
  const first = attachOverlay({ toggle: a, content: [partA], label: "First" });
  const second = attachOverlay({ toggle: b, content: [partB], closeOnLink: false });
  drawers.push(second);
  first.open(); second.open();
  first.close();
  expect(document.documentElement.style.overflow).toBe("hidden");
  // Only the drawer opened last answers Escape.
  first.open();
  key(document.body, "Escape");
  expect(first.isOpen).toBe(false);
  expect(second.isOpen).toBe(true);
  key(document.body, "Escape");
  expect(second.isOpen).toBe(false);
  expect(document.documentElement.style.overflow).toBe("");
  expect(first.panel.getAttribute("aria-label")).toBe("First");
  first.destroy();
  expect(first.panel.isConnected).toBe(false);
  expect(a.hasAttribute("aria-expanded")).toBe(false);
});

test("the link to the address being read is marked as the current page, unless one is marked", () => {
  document.body.innerHTML = '<nav><a href="/">Home</a><a href="/help/">Help</a><a href="#top">Top</a><a href="https://elsewhere.example/help">Away</a></nav>';
  const links = document.querySelectorAll<HTMLAnchorElement>("a");
  expect(markCurrentLink(links, { href: `${location.origin}/help/index.html` })?.textContent).toBe("Help");
  expect(links[1]!.getAttribute("aria-current")).toBe("page");
  // Already marked: left alone.
  expect(markCurrentLink(links, { href: `${location.origin}/` })).toBe(links[1]);
  expect(links[0]!.hasAttribute("aria-current")).toBe(false);
  links[1]!.removeAttribute("aria-current");
  expect(markCurrentLink(links, { href: `${location.origin}/` })).toBe(links[0]);
  links[0]!.removeAttribute("aria-current");
  expect(markCurrentLink(links, { href: `${location.origin}/nowhere` })).toBeNull();
});

test("ds-header draws its brand, its slotted links and actions, and names its menu in the page's language", async () => {
  loadTranslations("ja", { Menu: "メニュー", Close: "閉じる" });
  const header = document.createElement("ds-header");
  header.brand = "Name"; header.literal = true; header.href = "/home"; header.label = "Main";
  header.innerHTML = '<a href="/one">One</a><a href="/two" aria-current="page">Two</a><button slot="actions">Download</button>';
  document.body.append(header);
  await header.updateComplete; await settle(); await header.updateComplete;
  const root = header.shadowRoot!;
  const brand = root.querySelector<HTMLAnchorElement>('[part="brand"]')!;
  expect(brand.tagName).toBe("A");
  expect(brand.getAttribute("href")).toBe("/home");
  expect(brand.textContent).toBe("Name");
  expect(root.querySelector('[part="nav"]')!.getAttribute("aria-label")).toBe("Main");
  expect(root.querySelector('[part="nav"]')!.hasAttribute("hidden")).toBe(false);
  expect(root.querySelector('[part="actions"]')!.hasAttribute("hidden")).toBe(false);
  const toggle = root.querySelector<HTMLButtonElement>('[part="toggle"]')!;
  expect(toggle.getAttribute("aria-label")).toBe("Menu");
  expect(toggle.getAttribute("aria-controls")).toBe("drawer");
  expect([...toggle.querySelectorAll("ds-icon")].map(icon => icon.getAttribute("type"))).toEqual(["menu", "close"]);
  setLanguage("ja"); await header.updateComplete;
  expect(toggle.getAttribute("aria-label")).toBe("メニュー");
  expect(root.querySelector('[part="close"]')!.getAttribute("aria-label")).toBe("閉じる");
  expect(root.querySelector('[part="drawer"]')!.getAttribute("aria-label")).toBe("メニュー");
});

test("ds-header opens its drawer from the menu button, tells the page, and closes it on Escape", async () => {
  const header = document.createElement("ds-header");
  header.innerHTML = '<a href="/one">One</a><a href="/two">Two</a>';
  document.body.append(header);
  await header.updateComplete; await settle(); await header.updateComplete;
  const root = header.shadowRoot!;
  const toggle = root.querySelector<HTMLButtonElement>('[part="toggle"]')!;
  const panel = root.querySelector<HTMLDialogElement>('[part="drawer"]')!;
  const nav = root.querySelector('[part="nav"]')!;
  const told: boolean[] = [];
  header.addEventListener("ds-header-menu", event => told.push((event as CustomEvent<{ open: boolean }>).detail.open));
  toggle.click();
  expect(header.menuOpen).toBe(true);
  expect(nav.parentElement).toBe(panel);
  // The actions are empty, so they stay where they are.
  expect(root.querySelector('[part="actions"]')!.parentElement).not.toBe(panel);
  expect(header.shadowRoot!.activeElement).toBe(root.querySelector('[part="close"]'));
  key(panel, "Escape");
  expect(header.menuOpen).toBe(false);
  expect(nav.parentElement).toBe(root.querySelector('[part="header"]'));
  expect(told).toEqual([true, false]);
  header.openMenu(); header.closeMenu();
  expect(told).toEqual([true, false, true, false]);
});

test("ds-header with nothing to fold away has no menu button, and a brand of the page's own takes the brand's place", async () => {
  const header = document.createElement("ds-header");
  header.innerHTML = '<a slot="brand" href="/"><img alt="Name" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></a>';
  document.body.append(header);
  await header.updateComplete; await settle(); await header.updateComplete;
  const root = header.shadowRoot!;
  expect(root.querySelector('[part="toggle"]')!.hasAttribute("hidden")).toBe(true);
  expect(root.querySelector('[part="nav"]')!.hasAttribute("hidden")).toBe(true);
  expect(root.querySelector('[part="brand"]')!.tagName).toBe("SPAN");
  expect(root.querySelector('[part="brand"] slot[name="brand"]')).not.toBeNull();
});

test("ds-header marks the link to the address being read", async () => {
  history.replaceState(null, "", "/two");
  const header = document.createElement("ds-header");
  header.innerHTML = '<a href="/one">One</a><a href="/two">Two</a>';
  document.body.append(header);
  await header.updateComplete; await settle();
  expect(header.querySelector('a[href="/two"]')!.getAttribute("aria-current")).toBe("page");
  expect(header.querySelector('a[href="/one"]')!.hasAttribute("aria-current")).toBe(false);
  history.replaceState(null, "", "/");
});

test("ds-page with drawer folds its navigation into the same drawer", async () => {
  const page = document.createElement("ds-page");
  page.innerHTML = '<nav slot="nav"><a href="/a">A</a></nav><h1 slot="header">Title</h1><p>Work</p>';
  document.body.append(page);
  await page.updateComplete;
  const root = page.shadowRoot!;
  const bar = root.querySelector('[part="bar"]')!;
  expect(bar.hasAttribute("hidden")).toBe(true);
  page.drawer = true; await page.updateComplete;
  expect(bar.hasAttribute("hidden")).toBe(false);
  const toggle = root.querySelector<HTMLButtonElement>('[part="drawer-toggle"]')!;
  expect(toggle.getAttribute("aria-label")).toBe("Menu");
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  const nav = root.querySelector('[part="nav"]')!;
  const told: boolean[] = [];
  page.addEventListener("ds-page-drawer", event => told.push((event as CustomEvent<{ open: boolean }>).detail.open));
  toggle.click();
  expect(page.drawerOpen).toBe(true);
  expect(nav.parentElement).toBe(root.querySelector('[part="drawer"]'));
  // Escape closes it (a slotted link does too, measured in Chromium, where events cross the slot).
  key(root.querySelector('[part="drawer"]')!, "Escape");
  expect(page.drawerOpen).toBe(false);
  expect(nav.parentElement).toBe(root.querySelector('[part="page"]'));
  expect(told).toEqual([true, false]);
  page.drawerLabel = "Projects"; await page.updateComplete;
  expect(toggle.getAttribute("aria-label")).toBe("Projects");
  page.drawer = false; await page.updateComplete;
  expect(toggle.hasAttribute("aria-expanded")).toBe(false);
  expect(bar.hasAttribute("hidden")).toBe(true);
});

test("a footer's preferences, and a document's heading ids and levels, read their attributes", () => {
  expect(footerPreferences("")).toEqual(["language", "theme"]);
  expect(footerPreferences("true")).toEqual(["language", "theme"]);
  expect(footerPreferences("theme")).toEqual(["theme"]);
  expect(footerPreferences("theme, language")).toEqual(["language", "theme"]);
  expect(footerPreferences(null)).toEqual([]);
  expect(footerPreferences("false")).toEqual([]);
  const taken = new Set<string>(["payments"]);
  expect(headingId("Payments", taken, 0)).toBe("payments-2");
  expect(headingId("  Using the service ", taken, 1)).toBe("using-the-service");
  expect(headingId("販売価格", taken, 2)).toBe("販売価格");
  expect(headingId("— · —", taken, 3)).toBe("section-4");
  expect(documentLevels(undefined)).toEqual([2]);
  expect(documentLevels("3 2")).toEqual([2, 3]);
  expect(documentLevels("1 7 x")).toEqual([2]);
});


test("app header uses the compact variant while preserving its home link", async () => {
  const header = document.createElement('ds-header');
  header.variant = 'app';
  header.brand = 'Workspace';
  header.literal = true;
  header.href = '/workspace';
  document.body.append(header);
  await header.updateComplete;
  expect(header.shadowRoot!.querySelector('header')!.classList.contains('ds-header--app')).toBe(true);
  expect(header.shadowRoot!.querySelector('[part="brand"]')!.getAttribute('href')).toBe('/workspace');
  expect(header.shadowRoot!.querySelector('[part="toggle"]')!.hasAttribute('hidden')).toBe(true);
  header.variant = 'site';
  await header.updateComplete;
  expect(header.shadowRoot!.querySelector('header')!.classList.contains('ds-header--app')).toBe(false);
});
