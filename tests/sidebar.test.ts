// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import type { Sidebar, SidebarItem } from "../DS1/3-unit/ds-sidebar";

await import("../DS1/3-unit/ds-sidebar");

afterEach(() => document.body.replaceChildren());
async function setup(items: SidebarItem[]) {
  const sidebar = document.createElement("ds-sidebar") as Sidebar;
  sidebar.items = items; document.body.append(sidebar); await sidebar.updateComplete;
  await Promise.all([...sidebar.shadowRoot!.querySelectorAll("ds-button")].map(button => button.updateComplete));
  return sidebar;
}
function control(sidebar: Sidebar, id: string) { return sidebar.shadowRoot!.querySelector<HTMLElement>(`[data-item="${id}"]`)!; }
function key(element: HTMLElement, key: string) { element.dispatchEvent(new KeyboardEvent("keydown", {key, bubbles: true, cancelable: true})); }

test("native destinations and modified clicks survive, while activation can be declined", async () => {
  const sidebar = await setup([{id: "guide", label: "Guide", href: "#guide", current: true}]);
  const activate = vi.fn(event => event.preventDefault()); sidebar.addEventListener("sidebar-activate", activate);
  const link = control(sidebar, "guide");
  expect(link.getAttribute("href")).toBe("#guide"); expect(link.getAttribute("aria-current")).toBe("page");
  const click = new MouseEvent("click", {bubbles: true, cancelable: true}); link.dispatchEvent(click);
  expect(click.defaultPrevented).toBe(true); expect(activate).toHaveBeenCalledOnce();
  const modified = new MouseEvent("click", {bubbles: true, cancelable: true, metaKey: true}); link.dispatchEvent(modified);
  expect(modified.defaultPrevented).toBe(false); expect(activate).toHaveBeenCalledOnce();
});

test("expansion remains controlled and actions do not also navigate", async () => {
  const sidebar = await setup([{id: "folder", label: "Folder", expanded: false, action: {id: "add", label: "Add"}}]);
  const toggle = vi.fn(), action = vi.fn(), activate = vi.fn();
  sidebar.addEventListener("sidebar-toggle", toggle); sidebar.addEventListener("sidebar-action", action); sidebar.addEventListener("sidebar-activate", activate);
  control(sidebar, "folder").click();
  expect(toggle.mock.calls[0][0].detail).toEqual({id: "folder", expanded: true});
  expect(control(sidebar, "folder").getAttribute("aria-expanded")).toBe("false");
  sidebar.shadowRoot!.querySelector<HTMLButtonElement>(".action button")!.click();
  expect(action.mock.calls[0][0].detail).toEqual({id: "folder", action: "add"}); expect(toggle).toHaveBeenCalledOnce(); expect(activate).not.toHaveBeenCalled();
});

test("arrow navigation follows visible hierarchy and skips unavailable rows", async () => {
  const sidebar = await setup([
    {id: "folder", label: "Folder", expanded: true},
    {id: "child", label: "Child", depth: 1, href: "#child"},
    {id: "missing", label: "Missing", disabled: true},
    {id: "last", label: "Last", href: "#last"},
  ]);
  const folder = control(sidebar, "folder"), child = control(sidebar, "child"), last = control(sidebar, "last");
  folder.focus(); key(folder, "ArrowRight"); expect(sidebar.shadowRoot!.activeElement).toBe(child);
  key(child, "ArrowDown"); expect(sidebar.shadowRoot!.activeElement).toBe(last);
  key(last, "Home"); expect(sidebar.shadowRoot!.activeElement).toBe(folder);
  key(folder, "End"); expect(sidebar.shadowRoot!.activeElement).toBe(last);
  child.focus(); key(child, "ArrowLeft"); expect(sidebar.shadowRoot!.activeElement).toBe(folder);
  expect(control(sidebar, "missing").hasAttribute("disabled")).toBe(true);
  folder.focus(); sidebar.items = [sidebar.items[0]]; await sidebar.updateComplete;
  expect(sidebar.shadowRoot!.activeElement).toBe(folder);
});
