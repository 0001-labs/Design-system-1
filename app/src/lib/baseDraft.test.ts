// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
vi.mock("./backend", async () => {
  const { signal } = await import("@lit-labs/signals");
  return { authToken: signal("token") };
});
import type { ReactiveController } from "lit";
import { TOKENS_END, TOKENS_START } from "../../../shared/base-sheet";
import { AUTOSAVE_DEBOUNCE_MS, AUTOSAVE_MAX_WAIT_MS } from "./autosave";
import { BaseDraft, type Base } from "./baseDraft";

const TEMPLATE = ":root {\n  --ds-radius: 4px;\n}\n";
const block = (body: string) => `${TOKENS_START}\n:root {\n${body}\n}\n${TOKENS_END}\n`;
const saved = (version: number, css: string): Base => ({ css, rev: version, version, updatedAt: 1000 * version, sheet: `:root {\n  --a: 1;\n}\n`, contentHash: `h${version}` });

type Call = { path: string; method: string; body: Record<string, unknown> | null };
let calls: Call[];
let replies: Array<(call: Call) => { status: number; body: unknown }>;
const send = vi.fn(async (path: string, init: RequestInit = {}) => {
  const call = { path, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null };
  calls.push(call);
  const reply = replies.shift()?.(call) ?? { status: 500, body: {} };
  return new Response(JSON.stringify(reply.body), { status: reply.status });
});

const connected: ReactiveController[] = [];
function host() {
  const controllers: ReactiveController[] = [];
  return { controllers, requestUpdate: vi.fn(), addController: (c: ReactiveController) => controllers.push(c), removeController: () => {}, updateComplete: Promise.resolve(true) };
}
async function settle() { for (let i = 0; i < 10; i++) await Promise.resolve(); await vi.advanceTimersByTimeAsync(0); }
async function loaded(base: Base | null = null) {
  replies.push(() => ({ status: 200, body: { base, history: base ? [{ version: base.version, createdAt: 1, contentHash: base.contentHash, restoredFrom: null, overrides: 1 }] : [] } }));
  const h = host();
  const draft = new BaseDraft(h, { template: TEMPLATE, fetch: send as unknown as typeof fetch });
  h.controllers[0]!.hostConnected!();
  connected.push(h.controllers[0]!);
  await settle();
  return { draft, h };
}
const ok = (call: Call) => ({ status: 200, body: { base: saved(((call.body?.baseRev as number) ?? 0) + 1, call.body?.css as string) } });

beforeEach(() => { vi.useFakeTimers(); calls = []; replies = []; send.mockClear(); });
afterEach(() => { for (const controller of connected.splice(0)) controller.hostDisconnected!(); vi.useRealTimers(); });

test("loads the saved overrides under today's template and reads their values", async () => {
  const { draft } = await loaded(saved(3, `:root { --old: 1; }\n\n${block("  --ds-button-size: 24px;")}`));
  expect(calls[0]).toMatchObject({ path: "/api/base", method: "GET" });
  expect(draft.css.startsWith(TEMPLATE.trimEnd())).toBe(true);
  expect(draft.css).not.toContain("--old");
  expect(draft.overrides).toEqual([["--ds-button-size", "24px"]]);
  expect(draft.value("--ds-button-size")).toBe("24px");
  expect(draft.value("--ds-tag-size")).toBeUndefined();
  expect(draft.seed).toBe(1);
  expect(draft.state).toBe("live");
});

test("an edit saves silently after a pause, as a new live version", async () => {
  const { draft, h } = await loaded();
  draft.edit("--ds-button-size", "24px");
  expect(draft.state).toBe("dirty");
  expect(h.requestUpdate).toHaveBeenCalled();
  expect(draft.value("--ds-button-size")).toBe("24px");
  replies.push(ok);
  await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
  await settle();
  expect(calls[1]).toMatchObject({ path: "/api/base", method: "PUT", body: { baseRev: 0 } });
  expect(calls[1]!.body!.css).toContain("--ds-button-size: 24px;");
  expect(draft.state).toBe("live");
  expect(draft.base?.version).toBe(1);
  expect(draft.history[0]?.version).toBe(1);
  // The next save builds on the new revision; taking the token out empties the block.
  draft.remove("--ds-button-size");
  replies.push(ok);
  await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
  await settle();
  expect(calls[2]).toMatchObject({ method: "PUT", body: { baseRev: 1 } });
  expect(calls[2]!.body!.css).not.toContain(TOKENS_START);
});

test("editing back to what is saved leaves nothing to save", async () => {
  const { draft } = await loaded(saved(2, block("  --ds-tag-size: 20px;")));
  draft.edit("--ds-tag-size", "24px");
  draft.edit("--ds-tag-size", "20px");
  await vi.advanceTimersByTimeAsync(AUTOSAVE_MAX_WAIT_MS);
  await settle();
  expect(calls).toHaveLength(1);
});

test("a long run of edits still saves at the latest after the maximum wait", async () => {
  const { draft } = await loaded();
  replies.push(ok, ok);
  for (let step = 0; step < 16; step++) {
    draft.edit("--ds-button-padding-size", `${step * 2}px`);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS / 2);
  }
  expect(calls.filter(call => call.method === "PUT")).toHaveLength(1);
  expect(AUTOSAVE_MAX_WAIT_MS).toBeLessThanOrEqual(16 * AUTOSAVE_DEBOUNCE_MS / 2);
});

test("a version saved elsewhere stops saving until the newest is opened", async () => {
  const { draft } = await loaded(saved(4, ""));
  draft.edit("--ds-button-size", "24px");
  replies.push(() => ({ status: 409, body: { error: { code: "draft_conflict", message: "Saved somewhere else." } } }));
  await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
  await settle();
  expect(draft.state).toBe("conflict");
  draft.edit("--ds-button-size", "28px");
  await vi.advanceTimersByTimeAsync(AUTOSAVE_MAX_WAIT_MS);
  await settle();
  expect(calls.filter(call => call.method === "PUT")).toHaveLength(1);
  replies.push(() => ({ status: 200, body: { base: saved(5, block("  --ds-tag-size: 20px;")), history: [] } }));
  await draft.load();
  expect(draft.state).toBe("live");
  expect(draft.overrides).toEqual([["--ds-tag-size", "20px"]]);
  expect(draft.seed).toBe(2);
});

test("a failed save shows its reason and tries again with backoff", async () => {
  const { draft } = await loaded();
  draft.edit("--ds-button-size", "24px");
  replies.push(() => ({ status: 502, body: { error: { code: "upstream_error", message: "The base could not be reached." } } }), ok);
  await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
  await settle();
  expect(draft.state).toBe("error");
  expect(draft.failure).toBe("The base could not be reached.");
  await vi.advanceTimersByTimeAsync(1000);
  await settle();
  expect(draft.state).toBe("live");
  expect(draft.failure).toBe("");
});

test("leaving the page saves the waiting edit at once", async () => {
  const { draft } = await loaded();
  draft.edit("--ds-button-size", "24px");
  replies.push(ok);
  window.dispatchEvent(new Event("pagehide"));
  await settle();
  expect(calls[1]).toMatchObject({ method: "PUT" });
  expect(draft.state).toBe("live");
});

test("restoring a version makes it live again and reloads the draft", async () => {
  const { draft } = await loaded(saved(2, block("  --ds-tag-size: 24px;")));
  replies.push(() => ({ status: 200, body: { base: saved(3, block("  --ds-tag-size: 20px;")) } }));
  replies.push(() => ({ status: 200, body: { base: saved(3, block("  --ds-tag-size: 20px;")), history: [] } }));
  await draft.restore(1);
  expect(calls[1]).toMatchObject({ path: "/api/base/restore", method: "POST", body: { version: 1 } });
  expect(draft.value("--ds-tag-size")).toBe("20px");
  expect(draft.seed).toBe(2);
});

test("a base that cannot be read says why", async () => {
  replies.push(() => ({ status: 404, body: { error: { code: "disabled", message: "Live base editing is off." } } }));
  const h = host();
  const draft = new BaseDraft(h, { template: TEMPLATE, fetch: send as unknown as typeof fetch });
  h.controllers[0]!.hostConnected!();
  await settle();
  expect(draft.base).toBeUndefined();
  expect(draft.failure).toBe("Live base editing is off.");
  draft.edit("--ds-button-size", "24px");
  expect(draft.css).toBe("");
});
