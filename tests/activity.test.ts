// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
import "../DS1/2-core/ds-activity";
afterEach(() => document.body.replaceChildren());
test("work can stop and restart without replacing its label or announcing frames", async () => {
  const mark = document.createElement("ds-activity");
  mark.textContent = "Checking the changes";
  mark.setAttribute("role", "status");
  document.body.append(mark);
  for (const active of [false, true, false, true]) {
    mark.active = active;
    await mark.updateComplete;
    expect(mark.hasAttribute("active")).toBe(active);
    expect(mark.textContent).toBe("Checking the changes");
    expect(mark.shadowRoot!.querySelector(".mark")!.getAttribute("aria-hidden")).toBe("true");
    expect(mark.shadowRoot!.querySelectorAll("[role=status]").length).toBe(0);
  }
});
