// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
import { avatarInk } from "../DS1/2-core/ds-avatar";
afterEach(() => document.body.replaceChildren());

test("saved light and dark identity colours choose stable ink independently of page theme", () => {
  expect(avatarInk("#99ff73")).toBe("var(--ds-black)");
  expect(avatarInk("#111")).toBe("var(--ds-white)");
  expect(avatarInk("var(--brand)")).toBeUndefined();
});

test("image failure returns to initials and a new source can load without accepting stale events", async () => {
  const avatar = document.createElement("ds-avatar");
  avatar.label = "Example member";
  avatar.initial = "高橋";
  avatar.src = "data:image/png;base64,first";
  document.body.append(avatar);
  await avatar.updateComplete;
  const first = avatar.shadowRoot!.querySelector("img")!;
  first.dispatchEvent(new Event("error"));
  await avatar.updateComplete;
  expect(avatar.shadowRoot!.querySelector("img")).toBeNull();
  expect(avatar.shadowRoot!.querySelector(".initial")?.textContent).toBe("高橋");
  expect(avatar.shadowRoot!.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe(
    "Example member",
  );
  avatar.src = "data:image/png;base64,second";
  await avatar.updateComplete;
  const second = avatar.shadowRoot!.querySelector("img")!;
  Object.defineProperties(second, { naturalWidth: { value: 120 }, naturalHeight: { value: 40 } });
  first.dispatchEvent(new Event("load"));
  await avatar.updateComplete;
  expect(second.hasAttribute("data-visible")).toBe(false);
  second.dispatchEvent(new Event("load"));
  await avatar.updateComplete;
  expect(second.hasAttribute("data-visible")).toBe(true);
  expect(avatar.style.getPropertyValue("--ds-avatar-intrinsic-ratio")).toBe("120 / 40");
  expect(avatar.shadowRoot!.querySelector(".initial")).toBeNull();
  avatar.mask = true;
  await avatar.updateComplete;
  expect(avatar.shadowRoot!.querySelector(".mask")).not.toBeNull();
  expect(second.hasAttribute("data-visible")).toBe(false);
  avatar.src = "";
  avatar.label = "";
  await avatar.updateComplete;
  expect(avatar.shadowRoot!.querySelector('[role="img"]')).toBeNull();
  expect(avatar.shadowRoot!.querySelector(".frame")?.getAttribute("aria-hidden")).toBe("true");
  expect(avatar.shadowRoot!.querySelector(".initial")?.textContent).toBe("高橋");
  expect(avatar.style.getPropertyValue("--ds-avatar-intrinsic-ratio")).toBe("");
});

test("public symbols and pending identity states remain shared properties", async () => {
  const avatar = document.createElement("ds-avatar");
  avatar.icon = "globe";
  avatar.pending = true;
  avatar.outlined = true;
  document.body.append(avatar);
  await avatar.updateComplete;
  expect(avatar.shadowRoot!.querySelector("ds-icon")?.getAttribute("type")).toBe("globe");
  expect(avatar.hasAttribute("pending")).toBe(true);
  expect(avatar.hasAttribute("outlined")).toBe(true);
  avatar.pending = false;
  await avatar.updateComplete;
  expect(avatar.hasAttribute("pending")).toBe(false);
});

test("avatars are only round; a logo is the one mark that keeps its corners", async () => {
  const avatar = document.createElement("ds-avatar");
  document.body.append(avatar);
  await avatar.updateComplete;
  expect("shape" in avatar).toBe(false);
  expect(avatar.hasAttribute("logo")).toBe(false);
  avatar.logo = true;
  await avatar.updateComplete;
  expect(avatar.hasAttribute("logo")).toBe(true);
});

test("Link fills an avatar with its colour; Ezo letters it in an ink on the neutral fill", async () => {
  const filled = document.createElement("ds-avatar");
  filled.color = "#99ff73";
  const inked = document.createElement("ds-avatar");
  inked.ink = "var(--person-ink)";
  document.body.append(filled, inked);
  await Promise.all([filled.updateComplete, inked.updateComplete]);
  const filledFrame = filled.shadowRoot!.querySelector<HTMLElement>(".frame")!;
  const inkedFrame = inked.shadowRoot!.querySelector<HTMLElement>(".frame")!;
  expect(filledFrame.style.backgroundColor).not.toBe("");
  expect(filledFrame.style.color).toBe("var(--ds-black)");
  expect(inkedFrame.style.backgroundColor).toBe("");
  expect(inkedFrame.style.color).toBe("var(--person-ink)");
});
