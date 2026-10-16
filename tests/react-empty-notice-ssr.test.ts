// @vitest-environment node
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { Empty } from "../DS1/react/empty";
import { Notice } from "../DS1/react/notice";

test("the empty state and notice adapters render their words in the light DOM without browser globals", () => {
  expect(typeof HTMLElement).toBe("undefined");
  const empty = renderToString(createElement(Empty, { heading: "No lists", icon: "lists", actions: createElement("button", null, "New list") }, "Make one to start."));
  expect(empty).toContain("<ds-empty");
  expect(empty).toContain('<span slot="heading">No lists</span>');
  expect(empty).toContain("Make one to start.");
  expect(empty).toContain('<div slot="actions" style="display:contents"><button>New list</button></div>');
  // Without a heading the element shows the shared words' title itself.
  expect(renderToString(createElement(Empty, { text: "Nothing to show" }))).not.toContain('slot="heading"');

  const danger = renderToString(createElement(Notice, { tone: "danger", heading: "Couldn't save" }, "Your changes are kept."));
  expect(danger).toContain('role="alert"');
  expect(danger).toContain('tone="danger"');
  expect(danger).toContain("Your changes are kept.");
  expect(renderToString(createElement(Notice, null, "Saved"))).toContain('role="status"');
  expect(renderToString(createElement(Notice, { role: "note" }, "Draft"))).toContain('role="note"');
});
