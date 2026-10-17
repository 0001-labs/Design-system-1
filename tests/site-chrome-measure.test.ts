// @vitest-environment node
// Real layout: the site header, its drawer, the footer, the document page and
// ds-page's drawer are drawn in Chromium, light and dark, at the base scale and
// at --ds-sf 1.5, and measured against the 20px square.
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

const SCHEMES = ["light", "dark"] as const;
const SCALES = [1, 1.5] as const;
type Scheme = (typeof SCHEMES)[number];
let server: ViteDevServer;
let browser: Browser;
const pages = {} as Record<Scheme, Page>;

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  const url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/site-chrome-measure.html`;
  for (const scheme of SCHEMES) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, colorScheme: scheme });
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
    pages[scheme] = page;
  }
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

/** Puts markup on the stage at a width and scale, starts native headers and waits for the elements to draw. */
async function stage(page: Page, markup: string, { width = 1000, scale = 1 }: { width?: number; scale?: number } = {}) {
  await page.evaluate(async ({ markup, width, scale }) => {
    document.documentElement.removeAttribute("style");
    window.scrollTo(0, 0);
    const stage = document.getElementById("stage")!;
    stage.style.width = `${width}px`;
    stage.style.setProperty("--ds-sf", String(scale));
    stage.toggleAttribute("data-ds-surface", scale !== 1);
    stage.innerHTML = markup;
    (window as unknown as { startHeaders: () => void }).startHeaders();
    for (const element of stage.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("*")) await element.updateComplete;
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
  }, { markup, width, scale });
}

const NATIVE_HEADER = `<header class="ds-header">
  <a class="ds-header__brand" href="/">Name</a>
  <nav class="ds-header__nav" aria-label="Main"><a href="/">Home</a><a href="/help">Help</a><a href="/about">About</a></nav>
  <div class="ds-header__actions"><a class="ds-button ds-button--primary" href="/download">Download</a></div>
  <button class="ds-button ds-button--icon ds-header__toggle" type="button" aria-label="Menu"><span class="ds-icon" aria-hidden="true"></span><span class="ds-icon" aria-hidden="true"></span></button>
</header>`;
const LIT_HEADER = `<ds-header brand="Name" literal label="Main"><a href="/">Home</a><a href="/help">Help</a><a href="/about">About</a><a slot="actions" class="ds-button ds-button--primary" href="/download">Download</a></ds-header>`;

/** The header's parts, relative to its own box: native classes, or the element's shadow parts. */
async function headerBox(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector<HTMLElement>("#stage > *")!;
    const root: ParentNode = host.shadowRoot ?? host.parentElement!;
    const header = root.querySelector<HTMLElement>(".ds-header")!;
    const box = header.getBoundingClientRect();
    const rect = (element: Element | null) => {
      if (!element || getComputedStyle(element).display === "none") return null;
      const r = element.getBoundingClientRect();
      return { left: r.left - box.left, top: r.top - box.top, width: r.width, height: r.height, right: box.right - r.right };
    };
    const links = [...(host.shadowRoot ? host.querySelectorAll(":scope > a:not([slot])") : header.querySelectorAll(".ds-header__nav a"))];
    return {
      height: box.height,
      brand: rect(header.querySelector(".ds-header__brand")),
      nav: rect(header.querySelector(".ds-header__nav")),
      links: links.map(rect),
      toggle: rect(header.querySelector(".ds-header__toggle")),
      linkColor: links[0] ? getComputedStyle(links[0]).color : "",
      textColor: getComputedStyle(header).color,
    };
  });
}

test("a header is one row of one square with a square around it, its links over the work fifteen squares in", async () => {
  for (const scheme of SCHEMES) for (const scale of SCALES) {
    const boxes = [];
    for (const markup of [NATIVE_HEADER, LIT_HEADER]) {
      await stage(pages[scheme], markup, { scale });
      boxes.push(await headerBox(pages[scheme]));
    }
    const unit = 20 * scale;
    for (const box of boxes) {
      const at = `${scheme} at ${scale}`;
      expect(box.height, at).toBeCloseTo(3 * unit, 5);
      expect(box.brand!.left, at).toBeCloseTo(unit, 5);
      expect(box.brand!.width, at).toBeCloseTo(12 * unit, 5);
      expect(box.nav!.left, at).toBeCloseTo(15 * unit, 5);
      for (const link of box.links) {
        expect(link!.height, at).toBeCloseTo(unit, 5);
        expect(link!.top, at).toBeCloseTo(unit, 5);
      }
      expect(box.toggle, `${at}: no menu button on a wide page`).toBeNull();
      expect(box.linkColor, at).toBe(box.textColor);
    }
    // The element draws what the classes draw.
    expect(boxes[1]!.links.map(link => link!.left)).toEqual(boxes[0]!.links.map(link => link!.left));
  }
  expect((await headerBox(pages.light)).textColor).not.toBe((await headerBox(pages.dark)).textColor);
});

test("on a narrow page the navigation folds into a drawer whose close button stands where the menu button did", async () => {
  for (const scheme of SCHEMES) for (const markup of [NATIVE_HEADER, LIT_HEADER]) {
    const page = pages[scheme];
    await page.setViewportSize({ width: 400, height: 800 });
    await stage(page, markup, { width: 400 });
    const box = await headerBox(page);
    expect(box.nav).toBeNull();
    expect(box.toggle).not.toBeNull();
    // The 16px button is centred in the row's last square.
    expect(box.toggle!.right).toBeCloseTo(20 + 2, 5);
    expect(box.toggle!.top).toBeCloseTo(20 + 2, 5);
    const opened = await page.evaluate(async () => {
      const host = document.querySelector<HTMLElement>("#stage > *")!;
      const root: ParentNode = host.shadowRoot ?? host.parentElement!;
      const toggle = root.querySelector<HTMLElement>(".ds-header__toggle")!;
      const before = toggle.getBoundingClientRect();
      toggle.click();
      await new Promise(requestAnimationFrame);
      const panel = root.querySelector<HTMLDialogElement>("dialog.ds-drawer")!;
      const close = panel.querySelector<HTMLElement>(".ds-drawer__close")!;
      // Its transition is still running: measure it where it settles.
      panel.style.transition = "none";
      panel.style.transform = "none";
      const after = close.getBoundingClientRect();
      const links = [...(host.shadowRoot ? host.querySelectorAll(":scope > a:not([slot])") : panel.querySelectorAll(".ds-header__nav a"))].map(link => link.getBoundingClientRect());
      let active = document.activeElement;
      while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
      return {
        open: panel.open, modal: panel.matches(":modal"),
        panel: panel.getBoundingClientRect().toJSON(), view: { width: innerWidth, height: innerHeight },
        before: before.toJSON(), after: after.toJSON(), links: links.map(link => ({ top: link.top, left: link.left, height: link.height })),
        focused: active === close, expanded: toggle.getAttribute("aria-expanded"),
        paper: getComputedStyle(panel).backgroundColor,
        background: (() => { const probe = document.createElement("div"); probe.style.background = "var(--background)"; document.body.append(probe); const colour = getComputedStyle(probe).backgroundColor; probe.remove(); return colour; })(),
        icons: [...close.children].map(icon => getComputedStyle(icon).display),
      };
    });
    const at = `${scheme} ${markup.slice(1, 10)}`;
    expect(opened.open && opened.modal, at).toBe(true);
    expect(opened.expanded, at).toBe("true");
    expect(opened.focused, at).toBe(true);
    expect([opened.panel.left, opened.panel.top, opened.panel.width, opened.panel.height], at).toEqual([0, 0, opened.view.width, opened.view.height]);
    // The header fills the view's width from its top-left corner, as the panel does.
    expect(opened.after.left, at).toBeCloseTo(opened.before.left, 5);
    expect(opened.after.top, at).toBeCloseTo(opened.before.top, 5);
    expect(opened.icons.filter(display => display !== "none"), `${at}: the close button shows the close icon alone`).toHaveLength(1);
    // Links stand one square high, one under another, from three squares down.
    opened.links.forEach((link, index) => {
      expect(link.height, at).toBeCloseTo(20, 5);
      expect(link.left, at).toBeCloseTo(20, 5);
      expect(link.top, at).toBeCloseTo(60 + index * 20, 5);
    });
    expect(opened.paper, `${at}: the drawer is on the page's paper`).toBe(opened.background);
    await page.keyboard.press("Escape");
    const closed = await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>("#stage > *")!;
      const root: ParentNode = host.shadowRoot ?? host.parentElement!;
      let active = document.activeElement;
      while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
      return { open: root.querySelector<HTMLDialogElement>("dialog.ds-drawer")!.open, focused: active === root.querySelector(".ds-header__toggle"), nav: Boolean(root.querySelector(".ds-header > .ds-header__nav")) };
    });
    expect(closed, at).toEqual({ open: false, focused: true, nav: true });
    await page.setViewportSize({ width: 1200, height: 800 });
  }
});

test("in the drawer Tab goes round its controls, a link closes it, and the page keeps its scroll", async () => {
  const page = pages.light;
  for (const markup of [NATIVE_HEADER, LIT_HEADER]) {
    await stage(page, `${markup}<div style="height: 3000px"></div>`, { width: 400 });
    await page.evaluate(() => window.scrollTo(0, 300));
    // Clicked from the page, so nothing scrolls the button into view first.
    await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>("#stage > *")!;
      (host.shadowRoot ?? host.parentElement!).querySelector<HTMLElement>(".ds-header__toggle")!.click();
    });
    const names = [];
    for (let i = 0; i < 6; i++) {
      names.push(await page.evaluate(() => {
        let active = document.activeElement;
        while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
        return active?.getAttribute("aria-label") || active?.textContent?.trim();
      }));
      await page.keyboard.press("Tab");
    }
    expect(names, markup.slice(0, 12)).toEqual(["Close", "Home", "Help", "About", "Download", "Close"]);
    // Back from Home to Close, and on round to the last control.
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    expect(await page.evaluate(() => {
      let active = document.activeElement;
      while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
      return active?.textContent?.trim();
    })).toBe("Download");
    expect(await page.evaluate(() => [getComputedStyle(document.documentElement).overflow, scrollY])).toEqual(["hidden", 300]);
    // A link in the drawer closes it; the page stays where it was.
    await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>("#stage > *")!;
      const help = (host.shadowRoot ? host : host.parentElement!).querySelector<HTMLAnchorElement>('a[href="/help"]')!;
      help.addEventListener("click", event => event.preventDefault(), { once: true });
      help.click();
    });
    expect(await page.evaluate(() => [document.querySelector("dialog[open]") === null && !document.querySelector("ds-header")?.shadowRoot?.querySelector("dialog[open]"), getComputedStyle(document.documentElement).overflow, scrollY])).toEqual([true, "visible", 300]);
  }
});

const COLUMNS = JSON.stringify([
  { heading: "Product", links: [{ label: "Download", href: "/download" }, { label: "Help", href: "/help" }] },
  { heading: "Company", links: [{ label: "About", href: "/about" }] },
  { heading: "Other", links: [{ label: "Terms", href: "/terms" }] },
]);
const NATIVE_FOOTER = `<footer class="ds-footer">
  <div class="ds-footer__brand"><a class="ds-footer__mark" href="/">Name</a><p class="ds-footer__tagline">What it does</p></div>
  <nav class="ds-footer__columns" aria-label="Footer">
    <div class="ds-footer__column"><h2 class="ds-footer__heading">Product</h2><ul class="ds-footer__links"><li><a href="/download">Download</a></li><li><a href="/help">Help</a></li></ul></div>
    <div class="ds-footer__column"><h2 class="ds-footer__heading">Company</h2><ul class="ds-footer__links"><li><a href="/about">About</a></li></ul></div>
    <div class="ds-footer__column"><h2 class="ds-footer__heading">Other</h2><ul class="ds-footer__links"><li><a href="/terms">Terms</a></li></ul></div>
  </nav>
  <div class="ds-footer__base"><p class="ds-footer__legal">© 2026 Name</p><div class="ds-footer__preferences"><button class="ds-button ds-button--secondary" type="button">English</button><button class="ds-button ds-button--secondary" type="button">Light</button></div></div>
</footer>`;
const LIT_FOOTER = `<ds-footer brand="Name" tagline="What it does" label="Footer" year="2026" preferences literal columns='${COLUMNS}'></ds-footer>`;

async function footerBox(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector<HTMLElement>("#stage > *")!;
    const root: ParentNode = host.shadowRoot ?? host.parentElement!;
    const footer = root.querySelector<HTMLElement>(".ds-footer")!;
    const box = footer.getBoundingClientRect();
    const rect = (element: Element) => { const r = element.getBoundingClientRect(); return { left: r.left - box.left, top: r.top - box.top, width: r.width, height: r.height }; };
    return {
      height: box.height,
      brand: rect(footer.querySelector(".ds-footer__brand")!),
      columns: [...footer.querySelectorAll(".ds-footer__column")].map(rect),
      lines: [...footer.querySelectorAll(".ds-footer__heading, .ds-footer__links a, .ds-footer__mark, .ds-footer__tagline, .ds-footer__legal")].map(rect),
      base: rect(footer.querySelector(".ds-footer__base")!),
      preferences: rect(footer.querySelector(".ds-footer__preferences")!),
      line: getComputedStyle(footer).boxShadow,
    };
  });
}

test("a footer stands its brand in twelve squares and its columns in eight, two squares apart, every line one square", async () => {
  for (const scheme of SCHEMES) for (const scale of SCALES) for (const markup of [NATIVE_FOOTER, LIT_FOOTER]) {
    await stage(pages[scheme], markup, { scale, width: scale === 1 ? 1000 : 1200 });
    const box = await footerBox(pages[scheme]);
    const unit = 20 * scale, at = `${scheme} at ${scale}: ${markup.slice(1, 10)}`;
    expect(box.brand.left, at).toBeCloseTo(unit, 5);
    expect(box.brand.top, at).toBeCloseTo(2 * unit, 5);
    expect(box.brand.width, at).toBeCloseTo(12 * unit, 5);
    expect(box.columns.map(column => [column.left / unit, column.width / unit]).map(pair => pair.map(n => Math.round(n * 1000) / 1000)), at).toEqual(scale === 1 ? [[15, 8], [25, 8], [35, 8]] : [[15, 8], [25, 8], [15, 8]]);
    for (const line of box.lines) expect(line.height, at).toBeCloseTo(unit, 5);
    for (const line of box.lines) expect((line.top / unit) % 1, at).toBeCloseTo(0, 5);
    expect(box.base.left, at).toBeCloseTo(unit, 5);
    expect((box.base.top / unit) % 1, at).toBeCloseTo(0, 5);
    expect((box.height / unit) % 1, at).toBeCloseTo(0, 5);
    expect(box.line, at).toContain("inset");
  }
});

test("a narrow footer stands its brand above the columns, two to a row, and its preferences before the legal line", async () => {
  for (const markup of [NATIVE_FOOTER, LIT_FOOTER]) {
    await stage(pages.light, markup, { width: 400 });
    const box = await footerBox(pages.light);
    expect(box.brand.width).toBe(360);
    expect(box.columns.map(column => [column.left, column.top - box.columns[0]!.top])).toEqual([[20, 0], [220, 0], [20, 80]]);
    expect(box.columns[0]!.top).toBeGreaterThan(box.brand.top + box.brand.height);
    expect(box.preferences.left).toBe(20);
    const legal = box.lines.at(-1)!;
    expect(legal.top).toBeGreaterThan(box.preferences.top);
  }
});

const WRITING = `<h1>Terms</h1><p>These terms apply to the service.</p>
  <h2 id="using">Using the service</h2><p>${"Words in a long paragraph. ".repeat(30)}</p>
  <h2 id="notice">特定商取引法に基づく表記</h2>
  <dl class="ds-definitions">
    <dt>販売業者</dt><dd>Name</dd>
    <div><dt>商品代金以外の必要料金</dt><dd>${"送料は商品価格に含まれます。".repeat(6)}</dd></div>
    <dt>お問い合わせ</dt><dd><a href="mailto:hello@example.com">hello@example.com</a></dd>
  </dl>
  <h2 id="end">Changes</h2><p>${"More words. ".repeat(100)}</p>`;
const NATIVE_DOCUMENT = `<div class="ds-document">
  <nav class="ds-document__toc" aria-label="Contents"><div class="ds-document__contents"><p class="ds-document__toc-title">Contents</p>
    <ol class="ds-document__toc-list"><li><a href="#using">Using the service</a></li><li><a href="#notice" aria-current="location">特定商取引法に基づく表記</a></li><li><a href="#end">Changes</a></li></ol></div></nav>
  <article class="ds-document__body" data-ds-prose>${WRITING}</article>
</div>`;
const LIT_DOCUMENT = `<ds-document>${WRITING}</ds-document>`;

async function documentBox(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector<HTMLElement>("#stage > *")!;
    const root: ParentNode = host.shadowRoot ?? host.parentElement!;
    const frame = root.querySelector<HTMLElement>(".ds-document")!;
    const box = frame.getBoundingClientRect();
    const rect = (element: Element) => { const r = element.getBoundingClientRect(); return { left: r.left - box.left, top: r.top - box.top, width: r.width, height: r.height, viewTop: r.top }; };
    const pairs = [...document.querySelectorAll(".ds-definitions dt")].map(term => {
      const definition = term.nextElementSibling!;
      return { term: rect(term), definition: rect(definition) };
    });
    return {
      toc: rect(root.querySelector(".ds-document__toc")!),
      contents: rect(root.querySelector(".ds-document__contents")!),
      links: [...root.querySelectorAll(".ds-document__toc-list a")].map(rect),
      body: rect(root.querySelector(".ds-document__body")!),
      pairs,
      unit: parseFloat(getComputedStyle(frame).getPropertyValue("--ds-unit")),
    };
  });
}

test("a document stands its contents in twelve squares beside a reading column of thirty-two, and the contents stay in view", async () => {
  for (const scheme of SCHEMES) for (const scale of SCALES) for (const markup of [NATIVE_DOCUMENT, LIT_DOCUMENT]) {
    const page = pages[scheme];
    await stage(page, markup, { width: scale === 1 ? 1000 : 1200, scale });
    const box = await documentBox(page);
    const unit = 20 * scale, at = `${scheme} at ${scale}: ${markup.slice(1, 12)}`;
    expect(box.toc.width, at).toBeCloseTo(12 * unit, 5);
    expect(box.body.left, at).toBeCloseTo(14 * unit, 5);
    expect(box.body.width, at).toBeLessThanOrEqual(32 * unit + 0.01);
    expect(box.links.length, at).toBe(3);
    for (const link of box.links) expect(link.height, at).toBeCloseTo(unit, 5);
    // Each pair of the definition table: the term eight squares, the two on one row of whole squares.
    for (const { term, definition } of box.pairs) {
      expect(term.width, at).toBeCloseTo(8 * unit, 5);
      expect(definition.left - term.left, at).toBeCloseTo(8 * unit, 5);
      expect(definition.top, at).toBeCloseTo(term.top, 5);
      expect(definition.height, at).toBeCloseTo(term.height, 5);
      expect((term.height / unit) % 1, at).toBeCloseTo(0, 5);
    }
    expect(box.pairs[1]!.term.height, `${at}: a long definition takes more lines`).toBeGreaterThan(2 * unit);
    // Scrolled past, the contents stop one square below the top of the view.
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.evaluate(() => new Promise(requestAnimationFrame));
    expect((await documentBox(page)).contents.viewTop, at).toBeCloseTo(unit, 5);
  }
});

test("a narrow document stands its contents above the writing and they scroll away with it; a narrow definition table stacks", async () => {
  for (const markup of [NATIVE_DOCUMENT, LIT_DOCUMENT]) {
    const page = pages.light;
    await stage(page, markup, { width: 400 });
    const box = await documentBox(page);
    expect(box.body.top).toBeGreaterThan(box.toc.top + box.toc.height - 1);
    expect(box.body.left).toBe(0);
    for (const { term, definition } of box.pairs) {
      expect(definition.left).toBe(term.left);
      expect(definition.top).toBeCloseTo(term.top + term.height, 5);
      expect(term.height).toBe(30);
    }
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.evaluate(() => new Promise(requestAnimationFrame));
    expect((await documentBox(page)).contents.viewTop).toBeLessThan(0);
  }
});

test("the element marks the section in view in its contents", async () => {
  const page = pages.light;
  await stage(page, LIT_DOCUMENT, { width: 1000 });
  const current = () => page.evaluate(() => document.querySelector("ds-document")!.shadowRoot!.querySelector('[aria-current="location"]')?.textContent);
  expect(await current()).toBe("Using the service");
  await page.evaluate(() => document.getElementById("end")!.scrollIntoView());
  await page.waitForFunction(() => document.querySelector("ds-document")!.shadowRoot!.querySelector('[aria-current="location"]')?.textContent === "Changes");
  await page.evaluate(() => document.querySelector("ds-document")!.shadowRoot!.querySelector<HTMLAnchorElement>('a[href="#using"]')!.click());
  await page.waitForFunction(() => location.hash === "#using");
  expect(await current()).toBe("Using the service");
});

test("ds-page with drawer folds its navigation into a menu button before the header on a narrow page", async () => {
  for (const scheme of SCHEMES) for (const scale of SCALES) {
    const page = pages[scheme];
    await stage(page, `<ds-page drawer layout="sidebar"><nav slot="nav"><a href="/a">A</a><a href="/b">B</a></nav><h1 slot="header" style="margin:0;font:inherit;line-height:var(--ds-unit)">Title</h1><p style="margin:0">Work</p></ds-page>`, { width: scale === 1 ? 400 : 560, scale });
    const unit = 20 * scale, at = `${scheme} at ${scale}`;
    const box = await page.evaluate(() => {
      const element = document.querySelector("ds-page")!;
      const root = element.shadowRoot!;
      const host = element.getBoundingClientRect();
      const rect = (selector: string) => { const node = root.querySelector(selector)!; if (getComputedStyle(node).display === "none") return null; const r = node.getBoundingClientRect(); return { left: r.left - host.left, top: r.top - host.top, width: r.width, height: r.height }; };
      return { bar: rect('[part="bar"]'), toggle: rect('[part="drawer-toggle"]'), header: rect('[part="header"]'), nav: rect('[part="nav"]'), main: rect('[part="main"]') };
    });
    expect(box.nav, at).toBeNull();
    expect([box.bar!.left, box.bar!.top, box.bar!.width, box.bar!.height].map(n => n / unit), at).toEqual([1, 1, 1, 1]);
    expect(box.toggle!.width, at).toBeCloseTo(16 * scale, 5);
    expect(box.header!.left / unit, at).toBeCloseTo(3, 5);
    expect(box.header!.top / unit, at).toBeCloseTo(1, 5);
    expect(box.main!.left / unit, at).toBeCloseTo(1, 5);
    expect(box.main!.top / unit, at).toBeCloseTo(3, 5);
    const opened = await page.evaluate(async () => {
      const element = document.querySelector("ds-page")!;
      element.shadowRoot!.querySelector<HTMLElement>('[part="drawer-toggle"]')!.click();
      await new Promise(requestAnimationFrame);
      const panel = element.shadowRoot!.querySelector<HTMLDialogElement>('[part="drawer"]')!;
      const link = element.querySelector("a")!.getBoundingClientRect();
      return { open: panel.matches(":modal"), inPanel: element.shadowRoot!.querySelector('[part="nav"]')!.parentElement === panel, link: { top: link.top, height: link.height } };
    });
    expect(opened.open && opened.inPanel, at).toBe(true);
    expect(opened.link.top, at).toBeGreaterThanOrEqual(2 * unit);
    // A slotted link closes the drawer: its click crosses the slot into the panel.
    const after = await page.evaluate(() => {
      const element = document.querySelector("ds-page")!;
      const link = element.querySelector("a")!;
      link.addEventListener("click", event => event.preventDefault(), { once: true });
      link.click();
      return { open: element.drawerOpen, nav: element.shadowRoot!.querySelector('[part="nav"]')!.parentElement!.getAttribute("part") };
    });
    expect(after, at).toEqual({ open: false, nav: "page" });
  }
});

test("ds-page without drawer keeps its navigation above the work on a narrow page, as before", async () => {
  await stage(pages.light, `<ds-page layout="sidebar"><nav slot="nav">Nav</nav><p style="margin:0">Work</p></ds-page>`, { width: 400 });
  const box = await pages.light.evaluate(() => {
    const root = document.querySelector("ds-page")!.shadowRoot!;
    return { bar: getComputedStyle(root.querySelector('[part="bar"]')!).display, nav: getComputedStyle(root.querySelector('[part="nav"]')!).display };
  });
  expect(box).toEqual({ bar: "none", nav: "block" });
});
