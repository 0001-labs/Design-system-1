// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { connectTree, treeStep, type TreeRow } from "../DS1/0-face/tree";
import type { Tree, TreeItem } from "../DS1/3-unit/ds-tree";

await import("../DS1/3-unit/ds-tree");
afterEach(() => document.body.replaceChildren());

const key = (element: Element, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true, ...init });
  element.dispatchEvent(event);
  return event;
};

describe("treeStep, the keyboard of the tree pattern", () => {
  const rows: TreeRow[] = [
    { level: 1, expanded: true, label: "Projects" },
    { level: 2, expanded: false, label: "Atlas" },
    { level: 2, label: "Harbor", disabled: true },
    { level: 2, label: "Meadow" },
    { level: 1, label: "Archive" },
  ];

  test("Up and Down skip unavailable rows and stop at the ends; Home and End go to them", () => {
    expect(treeStep(rows, 1, "ArrowDown")).toEqual({ focus: 3 });
    expect(treeStep(rows, 3, "ArrowUp")).toEqual({ focus: 1 });
    expect(treeStep(rows, 4, "ArrowDown")).toEqual({ focus: 4 });
    expect(treeStep(rows, 0, "ArrowUp")).toEqual({ focus: 0 });
    expect(treeStep(rows, 3, "Home")).toEqual({ focus: 0 });
    expect(treeStep(rows, 0, "End")).toEqual({ focus: 4 });
  });

  test("Right opens a closed row and enters an open one; on a leaf it does nothing", () => {
    expect(treeStep(rows, 1, "ArrowRight")).toEqual({ toggle: true });
    expect(treeStep(rows, 0, "ArrowRight")).toEqual({ focus: 1 });
    expect(treeStep(rows, 3, "ArrowRight")).toEqual({});
  });

  test("Left closes an open row, else goes to the parent; a root leaf stays", () => {
    expect(treeStep(rows, 0, "ArrowLeft")).toEqual({ toggle: false });
    expect(treeStep(rows, 3, "ArrowLeft")).toEqual({ focus: 0 });
    expect(treeStep(rows, 4, "ArrowLeft")).toEqual({});
  });

  test("Space selects, Enter selects and activates, and an unavailable row does neither", () => {
    expect(treeStep(rows, 3, " ")).toEqual({ select: true });
    expect(treeStep(rows, 3, "Enter")).toEqual({ select: true, activate: true });
    expect(treeStep(rows, 2, "Enter")).toEqual({});
  });

  test("a printed character moves to the next row starting with it, from the top after the last", () => {
    expect(treeStep(rows, 0, "m")).toEqual({ focus: 3 });
    expect(treeStep(rows, 3, "A")).toEqual({ focus: 4 });
    expect(treeStep(rows, 4, "a")).toEqual({ focus: 1 });
    expect(treeStep(rows, 0, "h")).toEqual({});
    expect(treeStep(rows, 0, "Tab")).toBeUndefined();
    expect(treeStep(rows, 0, "Shift")).toBeUndefined();
  });
});

describe("ds-tree", () => {
  const ITEMS: TreeItem[] = [
    { id: "projects", label: "Projects", expanded: true, icon: "folder" },
    { id: "atlas", label: "Atlas", depth: 1, expanded: false, meta: "3" },
    { id: "harbor", label: "Harbor", depth: 1, selected: true },
    { id: "meadow", label: "Meadow", depth: 1, disabled: true },
    { id: "archive", label: "Archive" },
  ];
  async function setup(items = ITEMS) {
    const tree = document.createElement("ds-tree") as Tree;
    tree.label = "Files";
    tree.items = items;
    document.body.append(tree);
    await tree.updateComplete;
    return tree;
  }
  const row = (tree: Tree, id: string) => tree.shadowRoot!.querySelector<HTMLElement>(`[data-item="${id}"]`)!;

  test("is a tree of treeitems with their level, place, state and one Tab stop on the selected row", async () => {
    const tree = await setup();
    const container = tree.shadowRoot!.querySelector('[role="tree"]')!;
    expect(container.getAttribute("aria-label")).toBe("Files");
    const rows = [...container.querySelectorAll('[role="treeitem"]')];
    expect(rows.map(item => item.getAttribute("aria-level"))).toEqual(["1", "2", "2", "2", "1"]);
    expect(rows.map(item => item.getAttribute("aria-posinset"))).toEqual(["1", "1", "2", "3", "2"]);
    expect(rows.map(item => item.getAttribute("aria-setsize"))).toEqual(["2", "3", "3", "3", "2"]);
    expect(rows.map(item => item.getAttribute("aria-expanded"))).toEqual(["true", "false", null, null, null]);
    expect(rows.map(item => item.getAttribute("aria-selected"))).toEqual(["false", "false", "true", "false", "false"]);
    expect(row(tree, "meadow").getAttribute("aria-disabled")).toBe("true");
    expect(rows.map(item => item.getAttribute("tabindex"))).toEqual(["-1", "-1", "0", "-1", "-1"]);
    expect(row(tree, "atlas").style.getPropertyValue("--depth")).toBe("1");
  });

  test("the arrow, the icon and the label each have their place; a leaf keeps the arrow's square", async () => {
    const tree = await setup();
    expect(row(tree, "projects").querySelector(".disclosure ds-icon")?.getAttribute("type")).toBe("right");
    expect(row(tree, "projects").querySelector(".disclosure ds-icon")?.hasAttribute("data-open")).toBe(true);
    expect(row(tree, "atlas").querySelector(".disclosure ds-icon")?.hasAttribute("data-open")).toBe(false);
    expect(row(tree, "harbor").querySelector(".disclosure")?.children.length).toBe(0);
    expect(row(tree, "projects").querySelector(".icon ds-icon")?.getAttribute("type")).toBe("folder");
    expect(row(tree, "atlas").querySelector(".meta")?.textContent).toBe("3");
    expect(row(tree, "projects").querySelector(".disclosure")?.getAttribute("aria-hidden")).toBe("true");
  });

  test("the keyboard moves the focus, opens, closes, selects and activates through events", async () => {
    const tree = await setup();
    const toggle = vi.fn(), select = vi.fn(), activate = vi.fn();
    tree.addEventListener("ds-tree-toggle", toggle);
    tree.addEventListener("ds-tree-select", select);
    tree.addEventListener("ds-tree-activate", activate);
    row(tree, "harbor").focus();
    expect(key(row(tree, "harbor"), "ArrowDown").defaultPrevented).toBe(true);
    expect(tree.shadowRoot!.activeElement).toBe(row(tree, "archive"));
    await tree.updateComplete;
    expect(row(tree, "archive").getAttribute("tabindex")).toBe("0");
    expect(row(tree, "harbor").getAttribute("tabindex")).toBe("-1");
    key(row(tree, "archive"), "Home");
    expect(tree.shadowRoot!.activeElement).toBe(row(tree, "projects"));
    key(row(tree, "projects"), "ArrowLeft");
    expect(toggle.mock.calls[0]![0].detail).toEqual({ id: "projects", expanded: false });
    key(row(tree, "projects"), "ArrowRight");
    expect(tree.shadowRoot!.activeElement).toBe(row(tree, "atlas"));
    key(row(tree, "atlas"), "ArrowRight");
    expect(toggle.mock.calls[1]![0].detail).toEqual({ id: "atlas", expanded: true });
    key(row(tree, "atlas"), " ");
    expect(select.mock.calls[0]![0].detail).toEqual({ id: "atlas" });
    key(row(tree, "atlas"), "Enter");
    expect(select).toHaveBeenCalledTimes(2);
    expect(activate.mock.calls[0]![0].detail).toEqual({ id: "atlas" });
    key(row(tree, "atlas"), "a");
    expect(tree.shadowRoot!.activeElement).toBe(row(tree, "archive"));
    expect(key(row(tree, "archive"), "ArrowDown", { metaKey: true }).defaultPrevented).toBe(false);
  });

  test("a click on the arrow opens or closes, a click elsewhere selects, a double click activates", async () => {
    const tree = await setup();
    const toggle = vi.fn(), select = vi.fn(), activate = vi.fn();
    tree.addEventListener("ds-tree-toggle", toggle);
    tree.addEventListener("ds-tree-select", select);
    tree.addEventListener("ds-tree-activate", activate);
    row(tree, "atlas").querySelector<HTMLElement>(".disclosure")!.click();
    expect(toggle.mock.calls[0]![0].detail).toEqual({ id: "atlas", expanded: true });
    expect(select).not.toHaveBeenCalled();
    row(tree, "atlas").querySelector<HTMLElement>(".label")!.click();
    expect(select.mock.calls[0]![0].detail).toEqual({ id: "atlas" });
    expect(tree.shadowRoot!.activeElement).toBe(row(tree, "atlas"));
    row(tree, "atlas").dispatchEvent(new MouseEvent("dblclick", { bubbles: true, composed: true }));
    expect(activate.mock.calls[0]![0].detail).toEqual({ id: "atlas" });
    row(tree, "meadow").click();
    expect(select).toHaveBeenCalledOnce();
  });

  test("the application keeps the rows: itemFromEvent names the row under a context menu", async () => {
    const tree = await setup();
    let found: TreeItem | undefined;
    tree.addEventListener("contextmenu", event => { found = tree.itemFromEvent(event); });
    row(tree, "harbor").querySelector(".label")!.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, composed: true }));
    expect(found?.id).toBe("harbor");
    tree.items = ITEMS.filter(item => item.depth !== 1);
    await tree.updateComplete;
    expect(tree.shadowRoot!.querySelectorAll('[role="treeitem"]').length).toBe(2);
    expect(row(tree, "projects").getAttribute("tabindex")).toBe("0");
  });
});

describe("connectTree, the native tree", () => {
  function native() {
    document.body.innerHTML = `<ul class="ds-tree" role="tree" aria-label="Files">
      <li class="ds-tree__item" role="treeitem" aria-level="1" aria-expanded="true" data-id="src"><span class="ds-tree__disclosure" aria-hidden="true"></span><span class="ds-tree__label">src</span></li>
      <li class="ds-tree__item" role="treeitem" aria-level="2" aria-expanded="false" data-id="lib"><span class="ds-tree__disclosure" aria-hidden="true"></span><span class="ds-tree__label">lib</span></li>
      <li class="ds-tree__item" role="treeitem" aria-level="3" data-id="deep" hidden><span class="ds-tree__disclosure" aria-hidden="true"></span><span class="ds-tree__label">deep.ts</span></li>
      <li class="ds-tree__item" role="treeitem" aria-level="2" data-id="main"><span class="ds-tree__disclosure" aria-hidden="true"></span><span class="ds-tree__label">main.ts</span></li>
      <li class="ds-tree__item" role="treeitem" aria-level="1" data-id="readme" aria-selected="true"><span class="ds-tree__disclosure" aria-hidden="true"></span><span class="ds-tree__label">README.md</span></li>
    </ul>`;
    const tree = document.querySelector<HTMLElement>(".ds-tree")!;
    const disconnect = connectTree(tree);
    const item = (id: string) => tree.querySelector<HTMLElement>(`[data-id="${id}"]`)!;
    return { tree, disconnect, item };
  }

  test("one Tab stop, on the selected row, moved by the keyboard", () => {
    const { tree, item } = native();
    expect([...tree.querySelectorAll("li")].map(li => li.tabIndex)).toEqual([-1, -1, -1, -1, 0]);
    item("readme").focus();
    key(item("readme"), "Home");
    expect(document.activeElement).toBe(item("src"));
    expect(item("src").tabIndex).toBe(0);
    expect(item("readme").tabIndex).toBe(-1);
    key(item("src"), "ArrowDown");
    key(item("lib"), "ArrowDown");
    // The hidden row inside the closed one is skipped.
    expect(document.activeElement).toBe(item("main"));
  });

  test("closing hides the rows inside, opening shows them again and keeps a closed row's rows hidden", () => {
    const { item } = native();
    item("src").focus();
    key(item("src"), "ArrowLeft");
    expect(item("src").getAttribute("aria-expanded")).toBe("false");
    expect(["lib", "deep", "main"].map(id => item(id).hidden)).toEqual([true, true, true]);
    expect(item("readme").hidden).toBe(false);
    key(item("src"), "ArrowRight");
    expect(["lib", "deep", "main"].map(id => item(id).hidden)).toEqual([false, true, false]);
    item("lib").querySelector<HTMLElement>(".ds-tree__disclosure")!.click();
    expect(item("lib").getAttribute("aria-expanded")).toBe("true");
    expect(item("deep").hidden).toBe(false);
  });

  test("selecting moves aria-selected; the page can cancel a toggle or a selection and keep its own", () => {
    const { tree, item } = native();
    item("main").querySelector<HTMLElement>(".ds-tree__label")!.click();
    expect(item("main").getAttribute("aria-selected")).toBe("true");
    expect(item("readme").getAttribute("aria-selected")).toBe("false");
    tree.addEventListener("ds-tree-select", event => event.preventDefault());
    tree.addEventListener("ds-tree-toggle", event => event.preventDefault());
    const activate = vi.fn();
    tree.addEventListener("ds-tree-activate", activate);
    item("readme").focus();
    key(item("readme"), "Enter");
    expect(item("readme").getAttribute("aria-selected")).toBe("false");
    expect(activate.mock.calls[0]![0].detail).toEqual({ id: "readme" });
    key(item("src"), "ArrowLeft");
    expect(item("src").getAttribute("aria-expanded")).toBe("true");
  });

  test("disconnecting takes the keyboard away", () => {
    const { item, disconnect } = native();
    disconnect();
    item("readme").focus();
    expect(key(item("readme"), "Home").defaultPrevented).toBe(false);
  });
});
