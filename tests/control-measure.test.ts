// @vitest-environment node
// Real layout and colour: the components are drawn in Chromium, light and dark, beside the
// native classes of controls.css that they must match.
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

const UNIT = 20;
const SCHEMES = ["light", "dark"] as const;
type Scheme = (typeof SCHEMES)[number];
let server: ViteDevServer;
let browser: Browser;
const pages = {} as Record<Scheme, Page>;

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  const url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/control-measure.html`;
  for (const scheme of SCHEMES) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 }, colorScheme: scheme });
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
    pages[scheme] = page;
  }
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

/** Puts markup on the stage and waits for its components to render, measure and paint. */
async function stage(page: Page, markup: string) {
  await page.evaluate(async (markup) => {
    const stage = document.getElementById("stage")!;
    stage.innerHTML = markup;
    for (const element of stage.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("*")) await element.updateComplete;
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
  }, markup);
}

const WORDS = ["Done", "Draft", "Live", "Open", "Sent", "To do", "Failed", "Password on", "Access restored"];

test("a badge never cuts short words that fit, rounding its width up to whole squares as the native class does", async () => {
  const page = pages.light;
  for (const words of WORDS) {
    await stage(page, `<ds-badge>${words}</ds-badge><span class="ds-badge">${words}</span><ds-badge icon="check">${words}</ds-badge>`);
    const [plain, native, withIcon] = await page.evaluate(() => [...document.getElementById("stage")!.children].map((element) => {
      const frame = element.shadowRoot?.querySelector<HTMLElement>(".frame") ?? (element as HTMLElement);
      const label = element.shadowRoot?.querySelector<HTMLElement>(".label") ?? (element as HTMLElement);
      const words = document.createRange();
      words.selectNodeContents(element);
      return { width: frame.getBoundingClientRect().width, label: label.getBoundingClientRect().width, words: words.getBoundingClientRect().width, cut: label.scrollWidth > label.clientWidth };
    }));
    for (const badge of [plain!, withIcon!]) {
      expect(badge.width % UNIT, `${words} on whole squares`).toBe(0);
      expect(badge.words, `${words} fits its label`).toBeLessThanOrEqual(badge.label);
      expect(badge.cut, `${words} is not cut short`).toBe(false);
    }
    expect(plain!.width, `${words} as wide as the native badge`).toBe(native!.width);
    expect(native!.cut).toBe(false);
  }
  // 32.3px of words and 8px of padding: three squares. Rounding the words down to 32px gave two, and "Do…".
  await stage(page, "<ds-badge>Done</ds-badge>");
  expect(await page.evaluate(() => document.querySelector("ds-badge")!.shadowRoot!.querySelector(".frame")!.getBoundingClientRect().width)).toBe(3 * UNIT);
});

test("a badge with more words than room stays inside it and cuts them short", async () => {
  await stage(pages.light, '<div style="width: 50px"><ds-badge>Access restored</ds-badge></div>');
  const badge = await pages.light.evaluate(() => {
    const element = document.querySelector("ds-badge")!;
    const label = element.shadowRoot!.querySelector<HTMLElement>(".label")!;
    return { width: element.shadowRoot!.querySelector(".frame")!.getBoundingClientRect().width, cut: label.scrollWidth > label.clientWidth };
  });
  expect(badge.width).toBeLessThanOrEqual(50);
  expect(badge.cut).toBe(true);
});

const FIELDS = [
  '<ds-input label="Email" error="Enter a valid email address"></ds-input>',
  '<ds-input error="Enter a valid email address"></ds-input>',
  '<ds-input variant="field" label="Email" error="Enter a valid email address"></ds-input>',
  '<ds-input variant="field" error-text="Enter a valid email address"></ds-input>',
  '<ds-input variant="row" error="Enter a valid email address"></ds-input>',
  '<ds-input variant="plain" label="Email" error="Enter a valid email address"></ds-input>',
  '<ds-input variant="outlined" label="Email" error="Enter a valid email address"></ds-input>',
  '<ds-input variant="filled" label="Email" error="Enter a valid email address"></ds-input>',
  '<ds-input type="password" revealable label="Password" error="Wrong password"></ds-input>',
  '<ds-input variant="field" label="Email" style="width: 120px" error-text="Enter a valid email address"></ds-input>',
  '<ds-input label="Email" style="--ds-sf: 1.5" error="Enter a valid email address"></ds-input>',
  '<ds-input variant="row" style="--ds-sf: 1.5" error="Enter a valid email address"></ds-input>',
  '<ds-input multiline label="Notes" error="Check this description"></ds-input>',
  '<ds-input multiline variant="default" error="Check this description"></ds-input>',
];

test("an input's error starts on the square below its control, on one-square lines in the native field's danger colour", async () => {
  for (const scheme of SCHEMES) {
    const page = pages[scheme];
    await stage(page, '<label class="ds-field"><span class="ds-field__label">Email</span><input class="ds-input"><span class="ds-field__error">Enter a valid email address</span></label>');
    const native = await page.evaluate(() => {
      const field = document.querySelector(".ds-field")!.getBoundingClientRect();
      const error = document.querySelector(".ds-field__error")!;
      return { top: error.getBoundingClientRect().top - field.top, color: getComputedStyle(error).color };
    });
    expect(native.top).toBe(2 * UNIT);
    expect(native.color).toBe(scheme === "light" ? "rgb(222, 3, 49)" : "rgb(255, 95, 95)");
    for (const markup of FIELDS) {
      await stage(page, markup);
      const field = await page.evaluate(() => {
        const element = document.getElementById("stage")!.firstElementChild as HTMLElement;
        const square = 20 * (parseFloat(getComputedStyle(element).getPropertyValue("--ds-sf")) || 1);
        const host = element.getBoundingClientRect();
        const control = element.shadowRoot!.querySelector("input, textarea")!.getBoundingClientRect();
        const error = element.shadowRoot!.querySelector<HTMLElement>(".error-message")!;
        const box = error.getBoundingClientRect();
        const label = element.shadowRoot!.querySelector("label");
        return { square, host: host.height, controlEnd: control.bottom - host.top, top: box.top - host.top, height: box.height, color: getComputedStyle(error).color,
          lineHeight: parseFloat(getComputedStyle(error).lineHeight), label: label ? label.getBoundingClientRect().height : 0 };
      });
      const where = `${markup} (${scheme})`;
      expect(field.top % field.square, `${where}: error on a square`).toBe(0);
      expect(field.top, `${where}: error on the square below the control`).toBe(Math.ceil(field.controlEnd / field.square) * field.square);
      expect(field.lineHeight, `${where}: one-square lines`).toBe(field.square);
      expect(field.height % field.square, `${where}: whole lines`).toBe(0);
      expect(field.host % field.square, `${where}: the field on whole squares`).toBe(0);
      expect(field.color, `${where}: danger colour`).toBe(native.color);
    }
  }
});

test("a required field's mark is the danger colour", async () => {
  for (const scheme of SCHEMES) {
    await stage(pages[scheme], '<ds-input variant="field" label="Email" required></ds-input><span class="ds-field__error">x</span>');
    const [mark, danger] = await pages[scheme].evaluate(() => [
      getComputedStyle(document.querySelector("ds-input")!.shadowRoot!.querySelector("label")!, "::after").color,
      getComputedStyle(document.querySelector(".ds-field__error")!).color,
    ]);
    expect(mark, scheme).toBe(danger);
  }
});

test("a secondary ds-button's words are the native secondary button's ink, light and dark", async () => {
  for (const scheme of SCHEMES) {
    const page = pages[scheme];
    await stage(page, '<button class="ds-button ds-button--secondary">Cancel</button><ds-button secondary>Cancel</ds-button><ds-button secondary href="#cancel">Cancel</ds-button><ds-button secondary control="host">Cancel</ds-button><p class="ds-text">Cancel</p>');
    const [native, element, link, host, text] = await page.evaluate(() => [...document.getElementById("stage")!.children].map((element) => {
      const face = element.localName === "ds-button" && element.getAttribute("control") !== "host" ? element.shadowRoot!.querySelector('[part="control"]')! : element;
      const style = getComputedStyle(face);
      return { color: style.color, background: style.backgroundColor };
    }));
    expect(native!.color, scheme).toBe(text!.color);
    expect(native!.color, scheme).toBe(scheme === "light" ? "rgb(42, 42, 42)" : "rgb(255, 255, 255)");
    for (const face of [element!, link!, host!]) {
      expect(face.color, scheme).toBe(native!.color);
      expect(face.background, scheme).toBe(native!.background);
    }
  }
});

test("a native range stands one control high on the sixteen, eight squares wide, its thumb in the ink on a 1px line", async () => {
  for (const scheme of SCHEMES) {
    const page = pages[scheme];
    for (const sf of [1, 1.5]) {
      await stage(page, `<div data-ds-surface style="--ds-sf: ${sf}; background: var(--ds-paper)"><div id="block"><input class="ds-range" type="range" value="0"></div>`
        + `<div id="row" style="display: flex; align-items: center; min-height: var(--ds-row-height)"><input class="ds-range" type="range" value="0"></div></div>`);
      const measured = await page.evaluate(() => ["block", "row"].map((id) => {
        const parent = document.getElementById(id)!.getBoundingClientRect();
        const range = document.querySelector(`#${id} .ds-range`)!;
        const box = range.getBoundingClientRect();
        return { square: parent.height, top: box.top - parent.top, height: box.height, width: box.width, color: getComputedStyle(range).color };
      }));
      for (const range of measured) {
        expect(range.square, `${scheme} ${sf}`).toBe(UNIT * sf);
        expect(range.top, `${scheme} ${sf} spare four above`).toBe(4 * sf);
        expect(range.height, `${scheme} ${sf} one control high`).toBe(16 * sf);
        expect(range.width, `${scheme} ${sf} eight squares`).toBe(8 * UNIT * sf);
        expect(range.color).toBe(scheme === "light" ? "rgb(42, 42, 42)" : "rgb(255, 255, 255)");
      }
    }
    // Read the drawn pixels at base scale: the thumb at the start, the line through the middle of the sixteen, paper above it.
    await stage(page, '<div id="block" style="background: var(--ds-paper)"><input class="ds-range" type="range" value="0"></div>');
    const shot = (await page.screenshot({ clip: { x: 0, y: 0, width: 8 * UNIT, height: UNIT } })).toString("base64");
    const [thumb, line, above, paper, ink, grey] = await page.evaluate(async (data) => {
      const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const pixel = (x: number, y: number) => context.getImageData(x, y, 1, 1).data.slice(0, 3).join(",");
      const probe = document.createElement("span");
      document.body.append(probe);
      const rgb = (value: string) => { probe.style.color = value; return getComputedStyle(probe).color.replace(/[^\d,]/g, ""); };
      const colours = [rgb("var(--ds-paper)"), rgb("var(--ds-text-color)"), rgb("var(--ds-title-color)")];
      probe.remove();
      return [pixel(4, 12), pixel(80, 12), pixel(80, 6), ...colours];
    }, shot);
    expect(thumb, `${scheme} thumb`).toBe(ink);
    expect(line, `${scheme} line`).toBe(grey);
    expect(above, `${scheme} above the line`).toBe(paper);
  }
});

test("every button face stands one control high on the lower sixteen, in a row and at the foot of a line", async () => {
  const page = pages.light;
  // A zero-size inline-block marks the words' baseline: its bottom edge sits on it.
  const words = `<span>Save<i class="probe" style="display:inline-block;width:0;height:0"></i></span>`;
  const faces = {
    host: `<ds-button control="host">${words}</ds-button>`,
    slotted: `<ds-button control="slotted"><button type="button">${words}</button></ds-button>`,
    "slotted primary": `<ds-button control="slotted" primary><button type="button">${words}</button></ds-button>`,
    native: `<button type="button" class="ds-button">${words}</button>`,
  };
  for (const [name, face] of Object.entries(faces)) {
    for (const [context, markup] of [
      ["row", `<div style="display:flex;align-items:flex-end;height:${UNIT}px">${face}</div>`],
      ["line", `<p style="margin:0;line-height:${UNIT}px">Words ${face}</p>`],
    ] as const) {
      await stage(page, markup);
      const measured = await page.evaluate(() => {
        const stage = document.getElementById("stage")!;
        const face = stage.querySelector<HTMLElement>("ds-button[control='slotted'] > button, ds-button[control='host'], button.ds-button")!;
        const box = face.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom, baseline: stage.querySelector(".probe")!.getBoundingClientRect().bottom };
      });
      expect(measured.bottom, `${name} in a ${context} stands on the square's foot`).toBeCloseTo(UNIT, 1);
      expect(measured.bottom - measured.top, `${name} in a ${context} is one control high`).toBeCloseTo(16, 1);
      expect(measured.baseline, `${name} in a ${context} has its baseline 3px above the foot`).toBeCloseTo(UNIT - 3, 0);
    }
  }
});

test("a menu entry is a row high with its words on the lower sixteen", async () => {
  const page = pages.light;
  const words = `<span>Rename<i class="probe" style="display:inline-block;width:0;height:0"></i></span>`;
  for (const face of [
    `<ds-button control="host" menu-item>${words}</ds-button>`,
    `<ds-button control="slotted" menu-item><button type="button">${words}</button></ds-button>`,
    `<ds-button menu-item>${words}</ds-button>`,
  ]) {
    await stage(page, `<div style="width:${8 * UNIT}px">${face}</div>`);
    const measured = await page.evaluate(() => {
      const stage = document.getElementById("stage")!;
      const host = stage.querySelector<HTMLElement>("ds-button")!;
      const face = host.querySelector<HTMLElement>(":scope > button") ?? host.shadowRoot?.querySelector<HTMLElement>("[part='control']") ?? host;
      const box = face.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, baseline: stage.querySelector(".probe")!.getBoundingClientRect().bottom };
    });
    expect(measured.bottom - measured.top, `${face} is one row high`).toBeCloseTo(UNIT, 1);
    expect(measured.baseline - measured.top, `${face} has its baseline 3px above the foot`).toBeCloseTo(UNIT - 3, 0);
  }
});

test("a slotted button keeps a one-square box with its face at the foot, an icon's face on the square's first sixteen", async () => {
  const page = pages.light;
  for (const icon of [false, true]) {
    const face = icon
      ? `<ds-button control="slotted" icon><button type="button" aria-label="Close"><ds-icon type="close"></ds-icon></button></ds-button>`
      : `<ds-button control="slotted" primary><button type="button">Save</button></ds-button>`;
    await stage(page, `<div style="display:flex;align-items:flex-start">${face}</div>`);
    const measured = await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>("#stage ds-button")!;
      const box = host.getBoundingClientRect();
      const face = host.querySelector<HTMLElement>(":scope > button")!.getBoundingClientRect();
      return { box: { width: box.width, height: box.height }, face: { left: face.left - box.left, top: face.top - box.top, width: face.width, height: face.height } };
    });
    expect(measured.box.height, `${icon ? "icon" : "words"}: box one square high`).toBeCloseTo(UNIT, 1);
    expect(measured.face.height, `${icon ? "icon" : "words"}: face one control high`).toBeCloseTo(16, 1);
    expect(measured.face.top, `${icon ? "icon" : "words"}: face at the foot`).toBeCloseTo(4, 1);
    if (icon) {
      expect(measured.box.width, "icon: box one square wide").toBeCloseTo(UNIT, 1);
      expect(measured.face.width, "icon: face one control wide").toBeCloseTo(16, 1);
      expect(measured.face.left, "icon: face on the square's first sixteen").toBeCloseTo(0, 1);
    }
  }
});
