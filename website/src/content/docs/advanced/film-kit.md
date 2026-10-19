---
title: Film kit
description: A product's films play its real, deployed app, published as a kit with every deploy.
---

A product film shows the app as it is deployed today. Film kit makes that so: with every deploy the product publishes its own app as a **kit**, and the film loads that kit from the product's site. Nobody rebuilds the app inside the film, and every render records the revision it showed.

**Status: first version.** Film kit is a part of the 0001 System, copied with Sync 1 like any other shared source. Any product that builds with Vite (Vite+, plain Vite or Astro) and serves static files can publish one.

## What a kit is

The product's real app on made-up records: the app's own root component, every section, control and stylesheet as the app ships them, mounted on sample data. It comes as one classic script and one stylesheet.

- **No live data.** The kit answers the app's network itself from sample records. No keys, no sign-in, no requests leave the page. A kit is as public as the app's own bundle.
- **Published with every deploy** at `https://<site>/kit/`: `latest.json`, which names the current revision, and `<revision>/` with `kit.js`, `kit.css`, the files the stylesheet takes from `public/`, and `manifest.json`.
- **The revision is the content's hash.** The manifest lists every file with its sha256 and the commit it was built from. An unchanged kit keeps its revision across deploys.

Film kit has four files, each a Sync 1 export:

| File | Export | Taken by | What it does |
| --- | --- | --- | --- |
| `build.mjs` | `build` | The product | Bundles the kit entry with the product's own Vite and writes `dist/kit/` |
| `serve.ts` | `serve` | The product, when a Worker answers first | `filmKit(request, env.ASSETS)` answers `/kit/` for every origin |
| `player.js` | `player` | The film project | `window.FilmKits`: finds a kit, loads it into the film's page and pins its revision |
| `pull.mjs` | `pull` | The film project | Keeps a checked local copy of a kit |

## In the product

The example is a React app served by a Worker, its kit named `ledger`.

### 1. Take the build through Sync 1

Add Film kit to `sync.json`. Take `serve` as well when a Worker answers requests before the static files.

```json
"Film kit": {
  "build": { "to": "scripts/film-kit" },
  "serve": { "to": "server/film-kit" }
}
```

### 2. Export the app's root from its mount

The kit imports the real app, so nothing is cut out of the source at build time. Keep the root component in one file and the page mount in another:

```tsx
// src/start.tsx: the page mount
import { createRoot } from "react-dom/client";
import { App } from "./main";

createRoot(document.getElementById("root")!).render(<App />);
```

`src/main.tsx` exports `App` and mounts nothing.

### 3. Write the kit entry

The entry imports the root, answers the app's network from sample records, and sets `window.FilmKit`. `mount(element, options)` is all a film must have. Anything else the films drive, such as how many requests are still open, is the product's own.

```tsx
// src/film/kit.tsx
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { App } from "../main";
import { sampleState } from "../../shared/sample";

let records = null;
let root: Root | null = null;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// The app's network, answered from the sample records. Nothing leaves the page.
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "https://kit.invalid");
  if (url.pathname === "/api/state") return json(records);
  if (url.pathname === "/api/session") return json({ kind: "owner", plan: "plus" });
  return new Response("Not in the film", { status: 404 });
}) as typeof fetch;

function mount(element: HTMLElement, options: { today: string }) {
  root?.unmount();
  records = sampleState(options.today);
  root = createRoot(element);
  flushSync(() => root!.render(<App />));
}

window.FilmKit = { name: "ledger", mount };
```

Answer a save with the app's own validation and keep the result, so what the app does to its records in a film is the app's own code.

### 4. Build the kit at the end of every build

Add `film:kit` to `package.json` and run it last, after the app's own build, which empties `dist`:

```json
"build": "vp run check && vp build && vp run film:kit",
"film:kit": "node scripts/film-kit/build.mjs --name ledger --entry src/film/kit.tsx"
```

| Option | Default | For |
| --- | --- | --- |
| `--name` | Required | The kit's name: lowercase letters, digits and hyphens |
| `--entry` | Required | The kit entry |
| `--out` | `dist/kit` | Where the host serves from. An Astro site on a Worker: `dist/client/kit` |
| `--public` | `public` | The folder the stylesheet's `/…` addresses come from |
| `--config` | none | A Vite config with the plugins the app needs, such as React's or Tailwind's |
| `--headers` | none | A static host's `_headers` file, for step 5 |

The build prints the kit's name, revision and file count, and says so when the checkout had uncommitted changes.

### 5. Serve `/kit/` to every origin

Films load the kit from another origin, so `/kit/` answers every one: `Access-Control-Allow-Origin: *`, a year's immutable caching for a revision, and no caching for `latest.json`.

In a Worker that runs first, call `filmKit()` before sign-in, so the kit never asks for a session:

```ts
import { filmKit } from "./film-kit/serve";

export default {
  async fetch(request: Request, env: Env) {
    const kit = await filmKit(request, env.ASSETS);
    if (kit) return kit;
    // …sign-in and the app's own routes
  },
};
```

On a static host (Cloudflare Pages, Workers static assets, Amplify), pass `--headers dist/_headers` to the build instead. It adds the same headers for the kit's folder.

### 6. Deploy, then check

```bash
curl -s https://<site>/kit/latest.json
```

```bash
curl -sI https://<site>/kit/<revision>/manifest.json
```

`latest.json` names the revision just built, and the manifest answers with `Access-Control-Allow-Origin: *`.

## In the film project

### Register the host

Add one line to `scenes/kits/hosts.js`, the list of where each product publishes its kit:

```js
FilmKits.register('ledger', 'https://<site>/kit/');
```

### Load the kit

A scene loads `../film-kit/player.js` and `../kits/hosts.js`, resolves the kit, and writes its tags into the app's own page, an iframe's `srcdoc`. Anything that must run before the app, such as a film clock, goes before the kit's tags.

```js
const kit = await FilmKits.resolve('ledger', story.kit);
frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"></head><body>
  <div id="root"></div>
  <script src="../my-film/clock.js"></script>
  ${FilmKits.tags(kit)}
</body></html>`;
frame.addEventListener('load', () => {
  frame.contentWindow.FilmKit.mount(frame.contentDocument.getElementById('root'), { today: '2026-10-19' });
}, { once: true });
```

`resolve()` returns the kit's name, revision, commit, scripts, styles and files, and where it came from: `live`, `pinned` or `local`.

### Typefaces

Captions drawn beside the app take the app's typefaces from the same kit. `FilmKits.fontFaces()` returns the kit's `@font-face` rules for the named families, with their addresses made absolute, as CSS for the film's own page:

```js
style.textContent = await FilmKits.fontFaces(kit, ['GT-America-Standard-Regular', 'Iosevka']);
```

### Choose a version

The page's `?kit=` comes first, then the film's own choice, then `latest`. Several kits are separated by commas: `?kit=ledger@latest,notes@local`.

| Choice | Plays |
| --- | --- |
| `latest` | What the product has deployed now |
| `?kit=<name>@<revision>` | That revision, pinned |
| `local` | The pulled copy in `scenes/kits/<name>/` |

Each kit resolves once per page load, so a page never mixes two revisions. When the host cannot be reached, the local copy plays instead and the console says so.

### Renders pin their revision

The renderer reads the revisions its first page took (`FilmKits.settled()`, or `FilmKits.pinQuery()` as a `kit=` query) and opens every other capture page on the same ones. The render's manifest records them under `kits`.

### Keep a local copy

```bash
vp run kit:pull ledger
```

`kit:pull <name> [revision]` downloads a revision, checks every file against the manifest's sha256 and writes `scenes/kits/<name>/`. Earlier copies are removed. Pull before publishing a film that must not change.

## Limits

1. **A host keeps only its current revision.** Each deploy replaces the last kit. A film pinned to an older revision plays only from a pulled copy.
2. **Films find controls by their labels.** A film presses the app's controls by their accessible names (`[aria-label="Show the calendar"]`) and finds rows by their words. Renaming a label in the product breaks the film that uses it, from the next deploy on. Play the product's films after changing words they use, or pin them to a pulled revision.
