// @vitest-environment node
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { Carousel } from "../DS1/react/carousel";

test("the carousel adapter renders a named region with its slides in the light DOM, without browser globals", () => {
  expect(typeof HTMLElement).toBe("undefined");
  const markup = renderToString(createElement(Carousel, { label: "What people say", buttons: true, dots: false, slideWidth: 12 }, createElement("figure", null, "One"), createElement("figure", null, "Two")));
  expect(markup).toContain("<ds-carousel");
  expect(markup).toContain('role="region"');
  expect(markup).toContain('aria-label="What people say"');
  expect(markup).toContain('slide-width="12"');
  expect(markup).toContain("no-dots");
  expect(markup).toContain("<figure>One</figure><figure>Two</figure>");
});
