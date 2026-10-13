// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { Split } from "../DS1/2-core/ds-split";
import { loadTranslations, setLanguage } from "../DS1/0-face/i18n";

afterEach(() => document.body.replaceChildren());
async function mount() {
  const split = new Split();
  split.options = "day:Day,week:Week,month:Month";
  split.value = "day";
  document.body.append(split);
  await split.updateComplete;
  return split;
}
const buttons = (split: Split) => [...split.shadowRoot!.querySelectorAll("button")];

test("selection changes once, bubbles across a shadow boundary and can be declined", async () => {
  const split = await mount(); const change = vi.fn();
  document.body.addEventListener("change", change, { once: true });
  buttons(split)[0].click(); expect(change).not.toHaveBeenCalled();
  buttons(split)[1].click(); await split.updateComplete;
  expect(split.value).toBe("week"); expect(change).toHaveBeenCalledOnce();
  expect(change.mock.calls[0][0]).toMatchObject({ detail: { value: "week" }, composed: true });
  expect(buttons(split).map(b => b.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
  split.addEventListener("change", event => event.preventDefault());
  buttons(split)[2].click(); await split.updateComplete;
  expect(split.value).toBe("week");
  split.focus(); expect(split.shadowRoot!.activeElement).toBe(buttons(split)[1]);
});

test("actions repeat without selecting or submitting; disabled groups and segments never act", async () => {
  const split = await mount(); const press = vi.fn();
  split.actions = true;
  split.segments = [{ value: "back", label: "Back: once, twice", icon: "left" }, { value: "next", label: "Next", disabled: true }];
  split.addEventListener("press", press); await split.updateComplete;
  const [back, next] = buttons(split);
  expect(back.type).toBe("button"); expect(back.hasAttribute("aria-pressed")).toBe(false);
  expect(back.getAttribute("aria-label")).toBe("Back: once, twice");
  back.click(); back.click(); next.click(); expect(press).toHaveBeenCalledTimes(2);
  split.disabled = true; await split.updateComplete;
  back.click(); expect(press).toHaveBeenCalledTimes(2);
  split.disabled = false; split.formDisabledCallback(true); await split.updateComplete;
  expect(buttons(split).every(button => button.disabled)).toBe(true);
  split.formDisabledCallback(false); await split.updateComplete;
  expect(buttons(split).map(button => button.disabled)).toEqual([false, true]);
  split.segments = []; await split.updateComplete; expect(buttons(split)).toHaveLength(0);
});

test("icon labels follow language changes and literal labels stay as supplied", async () => {
  const split = await mount();
  loadTranslations({ en: { "split.back": "Back" }, da: { "split.back": "Tilbage" } });
  split.options = "back:@left:split.back";
  setLanguage("en"); await split.updateComplete;
  expect(buttons(split)[0].getAttribute("aria-label")).toBe("Back");
  setLanguage("da"); await split.updateComplete;
  expect(buttons(split)[0].getAttribute("aria-label")).toBe("Tilbage");
  split.literal = true; await split.updateComplete;
  expect(buttons(split)[0].getAttribute("aria-label")).toBe("split.back");
  setLanguage("en");
});
