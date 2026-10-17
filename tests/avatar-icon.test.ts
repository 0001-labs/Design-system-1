// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { afterEach, expect, test, vi } from "vite-plus/test";

// The deferred icon chunk never arrives: whatever draws, draws without it.
vi.mock("../DS1/2-core/generated/icons-extra", () => new Promise(() => {}));
const { avatarIcon } = await import("../DS1/2-core/generated/icon-avatar");
await import("../DS1/2-core/ds-avatar");

afterEach(() => document.body.replaceChildren());

test("the avatar's person drawing is its own, so it draws in the first frame", async () => {
  const avatar = document.createElement("ds-avatar");
  avatar.icon = "avatar";
  const other = document.createElement("ds-icon");
  other.setAttribute("type", "audio");
  document.body.append(avatar, other);
  await avatar.updateComplete;
  const icon = avatar.shadowRoot!.querySelector("ds-icon")!;
  await new Promise((done) => setTimeout(done, 0));
  expect(icon.shadowRoot!.querySelector("svg")).not.toBeNull();
  expect(avatar.shadowRoot!.querySelector(".initial")).toBeNull();
  // A deferred icon outside the avatar still waits for the chunk.
  expect(other.shadowRoot!.querySelector("svg")).toBeNull();
});

test("the drawing is the library's avatar icon, generated from its file", () => {
  const file = readFileSync("DS1/x-icon/avatar.svg", "utf8");
  for (const path of file.match(/d="[^"]+"/g)!) expect(avatarIcon).toContain(path);
});
