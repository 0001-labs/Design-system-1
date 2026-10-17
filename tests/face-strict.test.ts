import { readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { expect, test } from "vite-plus/test";

const face = join(import.meta.dirname, "../DS1/0-face");

/**
 * Products copy 0-face into strict TypeScript projects, browser-only, with no
 * bundler's types. Every module must check there: strict, DOM and
 * DOM.Iterable, no vite/client. The toaster's `?inline`/`?raw` imports are
 * declared as a Vite page declares them; outside Vite they are the feedback
 * module's concern.
 */
test("every 0-face module passes a strict type check with the DOM libraries alone", () => {
  const files = readdirSync(face).filter((file) => file.endsWith(".ts")).map((file) => join(face, file));
  const queries = join(import.meta.dirname, "fixtures/vite-queries.d.ts");
  const program = ts.createProgram([...files, queries], {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    types: [],
    skipLibCheck: true,
    resolveJsonModule: true,
    allowJs: true,
  });
  const errors = ts.getPreEmitDiagnostics(program).map((diagnostic) => {
    const where = diagnostic.file ? `${diagnostic.file.fileName.replace(face, "0-face")}:${diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1}` : "";
    return `${where} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`;
  });
  expect(errors).toEqual([]);
}, 60_000);
