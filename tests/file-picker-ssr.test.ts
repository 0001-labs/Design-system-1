// @vitest-environment node
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { FilePicker } from "../DS1/react/file-picker";
test("file picker renders native attributes without browser globals",()=>{
  expect(typeof HTMLElement).toBe("undefined");
  const html=renderToString(createElement(FilePicker,{label:"Attach files",name:"files",multiple:true,accept:"image/*",disabled:true}));
  expect(html).toContain('<ds-file-picker'); expect(html).toContain('type="file"');
  expect(html).toContain('aria-label="Attach files"'); expect(html).toContain('multiple=""'); expect(html).toContain('disabled=""');
});
