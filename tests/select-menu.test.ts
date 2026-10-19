// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
await import("../DS1/3-unit/ds-select");
afterEach(() => document.body.replaceChildren());

const settle = async (host: HTMLElement & { updateComplete: Promise<unknown> }) => {
  for (let i = 0; i < 3; i++) {
    await host.updateComplete;
    for (const inner of host.shadowRoot?.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("*") ?? []) await inner.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};

async function field(markup: string, attributes = "") {
  document.body.innerHTML = `<label>Size <ds-select ${attributes}><select name="size">${markup}</select></ds-select></label>`;
  const host = document.querySelector("ds-select")!;
  await settle(host);
  return { host, select: host.querySelector("select")!, list: () => host.shadowRoot!.querySelector("ds-menu.list") as HTMLElement & { open: boolean } | null };
}

const OPTIONS = '<option value="s">Small</option><option value="m" selected data-details="Most chosen" data-shortcut="mod+2">Medium</option><option value="l" disabled>Large</option><optgroup label="Print"><option value="a4" data-icon="file">A4</option></optgroup><option value="x" hidden>Hidden</option>';

test("a field lists its options in place of the platform picker: groups, details, shortcuts, the chosen one checked", async () => {
  const { host, select, list } = await field(OPTIONS);
  expect(host.hasAttribute("data-field")).toBe(true);
  expect(host.hasAttribute("data-listed")).toBe(true);
  expect(host.hasAttribute("role")).toBe(false);
  expect(select.getAttribute("aria-haspopup")).toBe("listbox");
  expect(select.getAttribute("aria-expanded")).toBe("false");
  expect(list()!.open).toBe(false);

  const key = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
  select.dispatchEvent(key);
  expect(key.defaultPrevented).toBe(true);
  await settle(host);
  expect(list()!.open).toBe(true);
  expect(select.getAttribute("aria-expanded")).toBe("true");
  const choices = [...list()!.querySelectorAll<HTMLButtonElement>('[role="option"]')];
  expect(choices.map(choice => choice.dataset.textValue)).toEqual(["Small", "Medium", "Large", "A4"]);
  expect(choices.map(choice => choice.getAttribute("aria-selected"))).toEqual(["false", "true", "false", "false"]);
  expect(choices[1]!.querySelector(".details")!.textContent).toBe("Most chosen");
  expect(choices[1]!.querySelector(".shortcut")!.textContent).toMatch(/2$/);
  expect(choices[2]!.disabled).toBe(true);
  expect(choices[3]!.querySelector("ds-icon")!.getAttribute("type")).toBe("file");
  const group = list()!.querySelector('[role="group"]')!;
  expect(group.querySelector(".group-label")!.textContent).toBe("Print");
  expect(group.getAttribute("aria-labelledby")).toBe(group.querySelector(".group-label")!.id);
  expect(list()!.getAttribute("aria-label")).toBe("Size");
});

test("choosing sets the select's value, sends input and change once, and closes the list", async () => {
  const { host, select, list } = await field(OPTIONS);
  const events: string[] = [];
  select.addEventListener("input", () => events.push("input"));
  select.addEventListener("change", () => events.push("change"));
  host.click();
  await settle(host);
  expect(list()!.open).toBe(true);
  list()!.querySelector<HTMLButtonElement>('[data-text-value="Small"]')!.click();
  await settle(host);
  expect(select.value).toBe("s");
  expect(events).toEqual(["input", "change"]);
  expect(list()!.open).toBe(false);
  expect(select.getAttribute("aria-expanded")).toBe("false");
  // Choosing the chosen one again changes nothing.
  host.click(); await settle(host);
  list()!.querySelector<HTMLButtonElement>('[data-text-value="Small"]')!.click();
  await settle(host);
  expect(events).toEqual(["input", "change"]);
});

test("a press on the field toggles the list, and a disabled field opens nothing", async () => {
  const { host, select, list } = await field(OPTIONS);
  host.click(); await settle(host);
  expect(list()!.open).toBe(true);
  host.click(); await settle(host);
  expect(list()!.open).toBe(false);
  select.disabled = true; await settle(host);
  host.click(); await settle(host);
  expect(list()!.open).toBe(false);
  const key = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
  select.dispatchEvent(key);
  expect(key.defaultPrevented).toBe(false);
});

test("native keeps the platform's picker, and a multiple select stays a native list", async () => {
  const native = await field(OPTIONS, "native");
  expect(native.host.hasAttribute("data-listed")).toBe(false);
  expect(native.list()).toBeNull();
  expect(native.select.hasAttribute("aria-haspopup")).toBe(false);
  const key = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
  native.select.dispatchEvent(key);
  expect(key.defaultPrevented).toBe(false);
  document.body.innerHTML = '<ds-select><select multiple aria-label="Tags"><option>One</option></select></ds-select>';
  const host = document.querySelector("ds-select")!;
  await settle(host);
  expect(host.hasAttribute("data-listbox")).toBe(true);
  expect(host.hasAttribute("data-listed")).toBe(false);
});

test("without a select it is an action menu, opened by the button its for names", async () => {
  document.body.innerHTML = '<button id="more" type="button">More</button><ds-select for="more"><button role="menuitem">Rename</button><hr data-ds-menu-separator><button role="menuitem">Delete</button></ds-select>';
  const host = document.querySelector("ds-select")!;
  const opener = document.getElementById("more")!;
  await settle(host);
  expect(host.field).toBe(false);
  expect(host.getAttribute("role")).toBe("menu");
  expect(host.floating).toBe(true);
  expect(host.trigger).toBe(opener);
  expect(opener.getAttribute("aria-haspopup")).toBe("menu");
  opener.click(); await settle(host);
  expect(host.open).toBe(true);
  expect(opener.getAttribute("aria-expanded")).toBe("true");
});

test("without a select or an opener it is a list in place", async () => {
  document.body.innerHTML = '<ds-select role="listbox"><button role="option">One</button></ds-select>';
  const host = document.querySelector("ds-select")!;
  await settle(host);
  expect(host.floating).toBe(false);
  expect(host.getAttribute("role")).toBe("listbox");
});

test("an action menu's rows are its own: arrows move between them", async () => {
  document.body.innerHTML = '<ds-select><button role="menuitem">One</button><button role="menuitem">Two</button></ds-select>';
  const host = document.querySelector("ds-select")!;
  await settle(host);
  const [one, two] = host.querySelectorAll("button");
  one!.focus();
  one!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, composed: true, cancelable: true }));
  expect(document.activeElement).toBe(two);
});
