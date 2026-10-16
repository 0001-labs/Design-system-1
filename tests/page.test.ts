// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
import type { Page } from "../DS1/4-page/ds-page";
const { PAGE_LAYOUTS } = await import("../DS1/4-page/ds-page");

afterEach(() => document.body.replaceChildren());
async function setup(markup: string) {
  document.body.innerHTML = markup;
  const page = document.querySelector("ds-page") as Page;
  await page.updateComplete;
  return page;
}
const area = (page: Page, name: string) => page.shadowRoot!.querySelector<HTMLElement>(`[data-area="${name}"]`)!;

test("each area is a named slot and the main area takes unslotted content", async () => {
  const page = await setup(`<ds-page layout="sidebar">
    <nav slot="nav">Places</nav>
    <h1 slot="header">Title</h1>
    <p>Work</p>
  </ds-page>`);
  expect(page.layout).toBe("sidebar");
  const assigned = (name: string) => area(page, name).querySelector("slot")!.assignedElements().map(element => element.localName);
  expect(assigned("nav")).toEqual(["nav"]);
  expect(assigned("header")).toEqual(["h1"]);
  expect(assigned("main")).toEqual(["p"]);
});

test("an area with nothing in it is marked empty and takes no room", async () => {
  const page = await setup(`<ds-page layout="column"><p>Only the work</p></ds-page>`);
  expect(area(page, "main").hasAttribute("data-empty")).toBe(false);
  for (const name of ["nav", "header", "aside", "footer"]) expect(area(page, name).hasAttribute("data-empty")).toBe(true);
  const footer = document.createElement("p");
  footer.slot = "footer";
  page.append(footer);
  await new Promise(resolve => setTimeout(resolve));
  expect(area(page, "footer").hasAttribute("data-empty")).toBe(false);
});

test("layout, divided, fill and view reflect for styling", async () => {
  const page = await setup(`<ds-page></ds-page>`);
  expect(page.getAttribute("layout")).toBe("sidebar");
  for (const layout of PAGE_LAYOUTS) {
    page.layout = layout;
    await page.updateComplete;
    expect(page.getAttribute("layout")).toBe(layout);
  }
  Object.assign(page, { divided: true, fill: true, view: true });
  await page.updateComplete;
  expect(["divided", "fill", "view"].every(name => page.hasAttribute(name))).toBe(true);
});
