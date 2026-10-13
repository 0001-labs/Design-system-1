// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import "../DS1/3-unit/ds-avatar-group";
afterEach(() => document.body.replaceChildren());

test("ordered members survive insert, remove, hide and reconnect without owning their actions", async () => {
  const group = document.createElement("ds-avatar-group");
  const first = document.createElement("button");
  const second = document.createElement("span");
  const lead = document.createElement("span");
  lead.slot = "lead";
  second.style.setProperty("--ds-avatar-group-order", "7");
  const activate = vi.fn();
  first.addEventListener("click", activate);
  group.append(lead, first, second);
  document.body.append(group);
  await group.updateComplete;
  const order = (element: HTMLElement) => element.style.getPropertyValue("--ds-avatar-group-order");
  await vi.waitFor(() => expect([order(first), order(second)]).toEqual(["2", "1"]));
  expect(order(lead)).toBe("");
  first.click();
  expect(activate).toHaveBeenCalledOnce();
  const third = document.createElement("span");
  group.prepend(third);
  await vi.waitFor(() =>
    expect([order(third), order(first), order(second)]).toEqual(["3", "2", "1"]),
  );
  third.hidden = true;
  await vi.waitFor(() => expect(order(third)).toBe(""));
  first.remove();
  await vi.waitFor(() => expect([order(first), order(second)]).toEqual(["", "1"]));
  expect(second.style.getPropertyValue("--ds-avatar-group-inset")).toBe("0px");
  group.remove();
  expect(order(second)).toBe("7");
  document.body.append(group);
  await group.updateComplete;
  await vi.waitFor(() => expect(order(second)).toBe("1"));
  expect(group.querySelector("span[slot=lead]")).toBe(lead);
});

test("moving a member between groups restores its original styles after release", async () => {
  // Observe the destination first: its callback may claim the node before the
  // source sees the removal, so the previous owner's state must be handed over.
  const destination = document.createElement("ds-avatar-group");
  const source = document.createElement("ds-avatar-group");
  const member = document.createElement("span");
  member.style.setProperty("--ds-avatar-group-order", "7", "important");
  source.append(member);
  destination.append(document.createElement("span"));
  document.body.append(destination, source);
  await Promise.all([destination.updateComplete, source.updateComplete]);
  await vi.waitFor(() =>
    expect(member.style.getPropertyValue("--ds-avatar-group-order")).toBe("1"),
  );
  destination.append(member);
  await vi.waitFor(() => {
    expect(member.style.getPropertyValue("--ds-avatar-group-order")).toBe("1");
    expect(member.style.getPropertyValue("--ds-avatar-group-inset")).toContain("--group-overlap");
  });
  source.remove();
  expect(member.style.getPropertyValue("--ds-avatar-group-order")).toBe("1");
  member.remove();
  await vi.waitFor(() =>
    expect(member.style.getPropertyValue("--ds-avatar-group-order")).toBe("7"),
  );
  expect(member.style.getPropertyPriority("--ds-avatar-group-order")).toBe("important");
  expect(member.style.getPropertyValue("--ds-avatar-group-inset")).toBe("");
});
