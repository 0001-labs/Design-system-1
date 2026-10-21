// @vitest-environment node
// Real layout and pixels, in Chromium: the words written straight into a filled ds-button fade
// over the last square of the face when they are cut, on the shadow, host and slotted faces, while
// the fill stays whole to the face's edge; words that fit are drawn plainly, crisp to their end.
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

let server: ViteDevServer;
let browser: Browser;
let url = "";

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/cut-fade-measure.html`;
}, 60_000);
afterAll(async () => { await browser?.close(); await server?.close(); });

const LONG = "Publish everything at once";

/** Each face, cut and fitting: where its face is in the page, and what it computed. */
const STAGE = `
  <div style="width: 80px"><ds-button id="shadow-cut" primary>${LONG}</ds-button></div>
  <div style="width: 80px"><ds-button id="host-cut" primary control="host">${LONG}</ds-button></div>
  <div style="width: 80px"><ds-button id="slotted-cut" primary control="slotted"><button type="button">${LONG}</button></ds-button></div>
  <div style="width: 80px"><ds-button id="secondary-cut" secondary>${LONG}</ds-button></div>
  <div style="width: 200px"><ds-button id="shadow-fit" primary>Save</ds-button></div>
  <div style="width: 200px"><ds-button id="host-fit" primary control="host">Save</ds-button></div>
  <div style="width: 200px"><ds-button id="slotted-fit" primary control="slotted"><button type="button">Save</button></ds-button></div>`;

const FACES = ["shadow-cut", "host-cut", "slotted-cut", "secondary-cut", "shadow-fit", "host-fit", "slotted-fit"] as const;
type Face = (typeof FACES)[number];

type Read = {
  cut: string | null;
  mask: string;
  image: string;
  clip: string;
  fill: string;
  textFill: string;
  overflow: string;
  rect: { x: number; y: number; width: number; height: number };
  paddingEnd: number;
};

async function open(dir: "ltr" | "rtl"): Promise<{ tab: Page; seen: Record<Face, Read> }> {
  const tab = await browser.newPage({ viewport: { width: 600, height: 400 } });
  await tab.goto(url);
  await tab.waitForFunction(() => document.documentElement.dataset.ready === "true");
  const seen = await tab.evaluate(async ({ dir, stage, faces }) => {
    document.documentElement.dir = dir;
    const root = document.getElementById("stage")!;
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.gap = "8px";
    root.style.padding = "8px";
    root.innerHTML = stage;
    await Promise.all([...root.querySelectorAll<HTMLElement & { updateComplete: Promise<unknown> }>("ds-button")].map(element => element.updateComplete));
    // Let the resize observers report.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const face = (id: string) => {
      const host = document.getElementById(id)!;
      if (host.getAttribute("control") === "host") return host;
      if (host.getAttribute("control") === "slotted") return host.querySelector("button")!;
      return host.shadowRoot!.querySelector('[part="control"]')!;
    };
    const out: Record<string, unknown> = {};
    for (const id of faces) {
      const element = face(id);
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      out[id] = {
        cut: element.getAttribute("data-cut"),
        mask: style.maskImage,
        image: style.backgroundImage,
        clip: style.backgroundClip,
        fill: style.backgroundColor,
        textFill: style.getPropertyValue("-webkit-text-fill-color"),
        overflow: style.textOverflow,
        rect: { x: box.x, y: box.y, width: box.width, height: box.height },
        paddingEnd: parseFloat(style.paddingInlineEnd),
      };
    }
    return out;
  }, { dir, stage: STAGE, faces: [...FACES] });
  return { tab, seen: seen as Record<Face, Read> };
}

/**
 * The face's pixels, column by column: how far each column's most inked pixel stands from the fill
 * (0 is the fill, 255 the furthest), and the colour at the face's very edge, half way down.
 */
async function pixels(tab: Page, read: Read, dir: "ltr" | "rtl") {
  const { x, y, width, height } = read.rect;
  const shot = await tab.screenshot({ clip: { x, y, width, height } });
  return tab.evaluate(async ({ data, dir }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const { data: rgba, width: w, height: h } = context.getImageData(0, 0, image.width, image.height);
    const at = (px: number, py: number) => { const i = (py * w + px) * 4; return [rgba[i], rgba[i + 1], rgba[i + 2]]; };
    const middle = Math.floor(h / 2);
    // The fill, read inside the face's start padding, half way down.
    const fill = at(dir === "ltr" ? 1 : w - 2, middle);
    const distance = (c: number[]) => Math.max(...c.map((v, i) => Math.abs(v - fill[i])));
    const columns: number[] = [];
    for (let px = 0; px < w; px++) {
      // Rows clear of the rounded corners, where the page shows through.
      let most = 0;
      for (let py = 4; py < h - 4; py++) most = Math.max(most, distance(at(px, py)));
      columns.push(most);
    }
    // In reading order: the first column is the words' start.
    if (dir === "rtl") columns.reverse();
    const edge = at(dir === "ltr" ? w - 1 : 0, middle);
    return { fill, edge, columns };
  }, { data: shot.toString("base64"), dir });
}

const peak = (columns: number[], from: number, to: number) => Math.max(...columns.slice(from, to));

for (const dir of ["ltr", "rtl"] as const) {
  test(`a filled button's cut words fade over its last square while its fill stays whole (${dir})`, async () => {
    const { tab, seen } = await open(dir);
    try {
      for (const id of ["shadow-cut", "host-cut", "slotted-cut", "secondary-cut"] as const) {
        const face = seen[id];
        expect(face.cut, id).toBe("end");
        expect(face.overflow, id).not.toBe("ellipsis");
        // The face itself is never masked: its fill and its focus ring stay whole.
        expect(face.mask, id).toBe("none");
        // The words are painted through the fade, in their own colour, clipped to the glyphs…
        expect(face.image, id).toContain("linear-gradient");
        expect(face.image, id).toContain(dir === "ltr" ? "to right" : "to left");
        expect(face.image, id).toContain("calc(100% - 20px)");
        expect(face.clip, id).toBe("text, border-box");
        expect(face.textFill, id).toBe("rgba(0, 0, 0, 0)");
        // …over a fill that is still the face's own.
        expect(face.fill, id).not.toBe("rgba(0, 0, 0, 0)");
        expect(face.rect.width, id).toBe(80);

        const { fill, edge, columns } = await pixels(tab, face, dir);
        // The fill reaches the face's edge, past the words, unfaded.
        for (let i = 0; i < 3; i++) expect(Math.abs(edge[i] - fill[i]), `${id} edge`).toBeLessThanOrEqual(2);
        const content = Math.round(face.rect.width - face.paddingEnd);
        const inked = peak(columns, 0, content - 20);
        expect(inked, `${id} words`).toBeGreaterThan(120);
        // Over the square the words fade, they thin out towards the content's end…
        const early = peak(columns, content - 20, content - 14);
        const late = peak(columns, content - 5, content);
        expect(late, `${id} fade`).toBeLessThan(early);
        expect(late, `${id} fade`).toBeLessThan(inked * 0.3);
        // …and nothing of them is drawn in the end padding: only the fill.
        expect(peak(columns, content, columns.length), `${id} padding`).toBeLessThanOrEqual(4);
      }
    } finally {
      await tab.close();
    }
  }, 60_000);

  test(`a filled button's words that fit are drawn plainly, crisp to their end (${dir})`, async () => {
    const { tab, seen } = await open(dir);
    try {
      for (const id of ["shadow-fit", "host-fit", "slotted-fit"] as const) {
        const face = seen[id];
        expect(face.cut, id).toBeNull();
        expect(face.mask, id).toBe("none");
        expect(face.image, id).toBe("none");
        expect(face.clip, id).toBe("border-box");
        expect(face.textFill, id).not.toBe("rgba(0, 0, 0, 0)");

        const { columns } = await pixels(tab, face, dir);
        const content = Math.round(face.rect.width - face.paddingEnd);
        const inked = peak(columns, 0, content);
        expect(inked, `${id} words`).toBeGreaterThan(120);
        // The last letter is as inked as the rest: no fade.
        expect(peak(columns, content - 6, content), `${id} end`).toBeGreaterThan(inked * 0.7);
      }
    } finally {
      await tab.close();
    }
  }, 60_000);
}
