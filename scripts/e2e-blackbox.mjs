#!/usr/bin/env node
// Black box tests: Design system 1 as anyone on the internet meets it, checked
// over HTTP alone, signed out. Each step is a contract from the Worker
// (services/src/index.ts, dashboard.ts), the site's routes and redirects
// (website/astro.config.mjs, website/public/_headers), the component directory,
// the Languages page, the README and Use with HTML, and AGENTS.md's
// Distribution: the documentation and every page its navigation, directory and
// sitemap name, the redirects and hosts, every file those pages load, the
// hosted stylesheet and module, Play, System CI where /flags sends, the owner-only hosts
// asking to sign in, and the published package on npm and jsDelivr.
//
//   node scripts/e2e-blackbox.mjs                              # against https://designsystem1.com
//   node scripts/e2e-blackbox.mjs --local                      # against astro dev :4321
//   node scripts/e2e-blackbox.mjs --base http://localhost:8787 # wrangler dev
//
// Read-only: every request is a GET or HEAD, sent without credentials. The
// package checks always read the public npm registry and jsDelivr.

import process from "node:process";

const PUBLIC = "https://designsystem1.com";
const PLAY = "https://play.designsystem1.com";
const FLAGS_MATRIX = "https://system.0001.dev/system/ci";
const ADOPTION = "https://designsystem1.com/adoption";
const ICON = "https://icon.designsystem1.com";
const EDITOR = "https://c9y.site";
const FONTS = "https://fonts.designsystem1.com";
const PACKAGE = "@0001-labs/design-system-1";
const REGISTRY = `https://registry.npmjs.org/${PACKAGE.replace("/", "%2f")}`;
const CDN = `https://cdn.jsdelivr.net/npm/${PACKAGE}`;

const LOCAL = process.argv.includes("--local");
const baseFlag = process.argv.indexOf("--base");
const BASE = new URL(baseFlag > 0 ? process.argv[baseFlag + 1] : LOCAL ? "http://localhost:4321" : PUBLIC);
const APEX = BASE.origin;
const PRODUCTION = APEX === PUBLIC;
// astro dev serves the pages alone; the Worker's redirects and private routes need it in front.
const WORKER = !LOCAL;

// The one list of languages (DS1/0-face/languages.ts, the Languages page).
const LANGUAGES = ["da", "de", "en", "es", "fi", "fr", "is", "it", "ja", "ko", "nb", "nn", "no", "pt", "pt-BR", "sv", "zh"];
// Built into apps, never public pages (DS1/0-face/component-visibility.ts).
const INTERNAL = ["/2-core/spacing-handle/", "/2-core/loading/"];

let passed = 0;
let failed = 0;
const failures = [];

// A few requests at a time, so the sitemap's pages do not arrive as a flood.
let inFlight = 0;
const waiting = [];
async function slot(run) {
  if (inFlight >= 16) await new Promise((resolve) => waiting.push(resolve));
  inFlight += 1;
  try {
    return await run();
  } finally {
    inFlight -= 1;
    waiting.shift()?.();
  }
}

async function request(target, { method = "GET", headers = {} } = {}) {
  const url = new URL(target, APEX);
  return slot(async () => {
    let response;
    // A request the network drops is sent once more before it counts; a status never is.
    for (let attempt = 1; !response; attempt += 1) {
      try {
        response = await fetch(url, {
          method,
          headers: { "User-Agent": "Design system 1 black box tests", ...headers },
          redirect: "manual",
          signal: AbortSignal.timeout(30_000),
        });
      } catch (error) {
        if (attempt < 2) continue;
        const cause = error?.cause?.code ?? error?.cause?.message ?? error?.message ?? String(error);
        throw new Error(`${url.href} did not answer (${cause})`);
      }
    }
    const text = method === "HEAD" ? "" : await response.text();
    return { url, status: response.status, headers: response.headers, text };
  });
}

// The same page is read by several steps; one GET serves them all.
const pages = new Map();
function page(target) {
  const key = new URL(target, APEX).href;
  if (!pages.has(key)) pages.set(key, request(key));
  return pages.get(key);
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function where(response) {
  return response.url.origin === APEX ? `${response.url.pathname}${response.url.search}` : response.url.href;
}

function expectStatus(response, status) {
  expect(response.status === status, `${where(response)} answered ${response.status}, expected ${status}`);
}

function expectType(response, ...types) {
  const actual = response.headers.get("content-type") ?? "";
  expect(types.some((type) => actual.startsWith(type)), `${where(response)} is ${actual || "untyped"}, expected ${types.join(" or ")}`);
}

function expectRedirect(response, status, to) {
  expectStatus(response, status);
  const location = new URL(response.headers.get("location") ?? "", response.url);
  const wanted = new URL(to, APEX);
  expect(location.href === wanted.href, `${response.url.href} went to ${location.href}, expected ${wanted.href}`);
}

function expectHeader(response, name, pattern) {
  const value = response.headers.get(name) ?? "";
  expect(pattern.test(value), `${where(response)} has ${name}: "${value}"`);
}

/** What the owner-only routes answer with (services/src/dashboard.ts). */
function expectPrivate(response) {
  expectHeader(response, "cache-control", /^private, no-store$/);
  expectHeader(response, "x-robots-tag", /^noindex, nofollow$/);
}

function decode(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function titles(html) {
  return [...html.matchAll(/<title>([^<]*)<\/title>/g)].map((match) => decode(match[1]).trim());
}

function meta(html, key) {
  const tag = html.match(new RegExp(`<meta[^>]+(?:name|property)="${key}"[^>]*>`, "i"))?.[0];
  return tag ? (tag.match(/content="([^"]*)"/i)?.[1] ?? "") : null;
}

function json(response) {
  expectType(response, "application/json");
  try {
    return JSON.parse(response.text);
  } catch {
    throw new Error(`${where(response)} is not JSON`);
  }
}

/** A documentation page: it draws, named as its link names it, in Starlight's "<title> | Design system 1". */
async function expectDocsPage(path, label) {
  const answer = await page(path);
  expectStatus(answer, 200);
  expectType(answer, "text/html");
  const title = titles(answer.text)[0] ?? "";
  expect(title.endsWith(" | Design system 1") && title.startsWith(label), `${path} is titled "${title}", expected "${label} | Design system 1"`);
  return answer;
}

// The type each kind of file must be served as, by its extension.
const TYPES = {
  css: ["text/css"],
  js: ["text/javascript", "application/javascript"],
  mjs: ["text/javascript", "application/javascript"],
  json: ["application/json"],
  woff2: ["font/woff2"],
  woff: ["font/woff"],
  ttf: ["font/ttf"],
  otf: ["font/otf"],
  svg: ["image/svg+xml"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  avif: ["image/avif"],
  gif: ["image/gif"],
  ico: ["image/x-icon", "image/vnd.microsoft.icon"],
};
const extension = (url) => url.pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "";

/** Same-origin files a page links in its head and body: stylesheets, icons, preloads and scripts. */
function linkedFiles(html, base) {
  const found = new Set();
  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = tag[0].match(/\brel="([^"]*)"/i)?.[1] ?? "";
    const href = tag[0].match(/\bhref="([^"]*)"/i)?.[1];
    if (href && /\b(stylesheet|icon|apple-touch-icon|modulepreload|preload|manifest)\b/i.test(rel)) found.add(new URL(decode(href), base).href);
  }
  for (const tag of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)) found.add(new URL(decode(tag[1]), base).href);
  return [...found].filter((href) => new URL(href).origin === new URL(base).origin);
}

/** What a stylesheet or module pulls in after it: @import and url() in CSS, relative imports and Vite's preload list in JavaScript. */
function referencedFiles(url, text) {
  const found = new Set();
  const kind = extension(url);
  if (kind === "css") {
    for (const match of text.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)/g)) found.add(match[1]);
    for (const match of text.matchAll(/url\(\s*["']?([^"')]+?)["']?\s*\)/g)) found.add(match[1]);
  } else if (kind === "js" || kind === "mjs") {
    // Module imports only: a stylesheet's "@import" kept as text inside a module is not one.
    for (const match of text.matchAll(/(?:\bfrom\s*|(?<![@\w.$])import\s*\(?\s*)["'](\.{1,2}\/[^"']+)["']/g)) found.add(match[1]);
    for (const match of text.matchAll(/["'](_astro\/[^"']+\.(?:js|css))["']/g)) found.add(`/${match[1]}`);
  }
  return [...found]
    .filter((ref) => !/^(data:|#|about:|blob:)/.test(ref) && !ref.includes("${"))
    .map((ref) => new URL(ref, url))
    .filter((ref) => ref.origin === url.origin)
    .map((ref) => (ref.hash = "", ref.href));
}

/** Every file reachable from the starting ones, each read once. */
async function crawl(start) {
  const seen = new Map();
  let wave = [...new Set(start)];
  while (wave.length) {
    const next = [];
    await Promise.all(
      wave.map(async (href) => {
        if (seen.has(href)) return;
        const url = new URL(href);
        const reads = ["css", "js", "mjs"].includes(extension(url));
        const answer = request(href, { method: reads ? "GET" : "HEAD" }).then(
          (response) => response,
          (error) => ({ url, error }),
        );
        seen.set(href, answer);
        const response = await answer;
        if (!response.error && response.status === 200 && reads) next.push(...referencedFiles(url, response.text));
      }),
    );
    wave = [...new Set(next)].filter((href) => !seen.has(href));
  }
  return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/** A check for each file: it answers 200 as its own type, with any further demand the caller makes. */
function fileChecks(files, label, more = () => {}) {
  return files.map(([href, answer]) => [
    label(href),
    async () => {
      const response = await answer;
      if (response.error) throw response.error;
      expectStatus(response, 200);
      const types = TYPES[extension(response.url)];
      if (types) expectType(response, ...types);
      more(response);
    },
  ]);
}

// A step's checks run side by side and report in order. A failed check is
// "✗ step — check: message", which test-run reads as the failing step.
async function step(name, checks) {
  console.log(`\n${name}`);
  const results = await Promise.all(
    checks.map(async ([label, run]) => {
      try {
        await run();
        return [label, null];
      } catch (error) {
        return [label, error instanceof Error ? error.message : String(error)];
      }
    }),
  );
  for (const [label, error] of results) {
    if (error === null) {
      passed += 1;
      console.log(`  ✓ ${label}`);
    } else {
      failed += 1;
      failures.push(`${name} — ${label}: ${error}`);
      console.log(`  ✗ ${name} — ${label}: ${error}`);
    }
  }
}

console.log(`Design system 1 black box tests against ${APEX}`);

// The navigation is the sidebar's own data on the Overview (website/src/components/MySidebar.astro).
const home = await page("/");
let navigation = [];
try {
  const groups = JSON.parse(decode(home.text.match(/data-groups="([^"]*)"/)?.[1] ?? "[]"));
  const walk = (entries) => entries.forEach((entry) => (entry.type === "link" && navigation.push(entry), walk(entry.entries ?? [])));
  walk(groups);
} catch {
  navigation = [];
}
const internalLinks = navigation.filter((link) => link.href.startsWith("/"));

// The component directory is the Overview's list of every component, by layer (ComponentDirectory.astro).
const directoryHtml = home.text.slice(home.text.indexOf('class="component-directory'));
const directory = [...directoryHtml.matchAll(/<section class="directory-layer[\s\S]*?<\/section>/g)]
  .flatMap((layer) => [...layer[0].matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)])
  .map((match) => ({ href: decode(match[1]), label: decode(match[2].replace(/<[^>]+>/g, "")).trim() }));

await step("Pages", [
  [
    "The Overview carries the sidebar's navigation",
    async () => {
      expectStatus(home, 200);
      expect(internalLinks.length >= 40, `only ${internalLinks.length} links in the navigation`);
    },
  ],
  ...internalLinks.map((link) => [`${link.label}, ${link.href}, draws`, () => expectDocsPage(link.href, link.label)]),
  [
    "Play in the navigation is play.designsystem1.com",
    async () => {
      const play = navigation.find((link) => link.label === "Play");
      expect(play?.href === `${PLAY}/`, `Play links to ${play?.href}`);
    },
  ],
  [
    "Each page is one document, with one <html>, one <head> and one <title>",
    async () => {
      const nested = [];
      for (const link of internalLinks) {
        const answer = await page(link.href);
        // Tags in the markup only: a code sample's copy button carries its document in an attribute.
        const markup = answer.text.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/="[^"]*"/g, '=""');
        const count = (pattern) => (markup.match(pattern) ?? []).length;
        if (count(/<html[\s>]/gi) !== 1 || count(/<head>/gi) !== 1 || count(/<title>/gi) !== 1) nested.push(link.href);
      }
      expect(nested.length === 0, `${nested.length} of ${internalLinks.length} pages draw a second document inside their body, e.g. ${nested.slice(0, 3).join(", ")}`);
    },
  ],
  [
    "Use with HTML tells a page to load the hosted stylesheet and module",
    async () => {
      const guide = await page("/start-here/quick-start/");
      for (const file of ["design-system-1.css", "design-system-1.js"])
        expect(guide.text.includes(`${PUBLIC}/resources/${file}`), `no ${PUBLIC}/resources/${file}`);
    },
  ],
  [
    "An unknown address is the site's 404 page",
    async () => {
      const missing = await request("/blackbox-no-such-page/");
      expectStatus(missing, 404);
      expectType(missing, "text/html");
      expect((titles(missing.text)[0] ?? "").includes("Design system 1"), "the 404 page has no title");
    },
  ],
]);

await step("Components", [
  [
    "The Overview's directory lists the components by layer",
    async () => expect(directory.length >= 40, `only ${directory.length} entries in the directory`),
  ],
  ...directory.map((entry) => [`${entry.label}, ${entry.href}, draws`, () => expectDocsPage(entry.href, entry.label)]),
  ...INTERNAL.map((path) => [`${path}, built into apps, is not a public page`, async () => expectStatus(await request(path), 404)]),
  ...(WORKER
    ? [
        [
          "/2-core/kbd/ goes to the owner's workspace",
          async () => expectRedirect(await request("/2-core/kbd/"), 302, `${PUBLIC}/libraries/workspace/?internal=keyboard-shortcut`),
        ],
        [
          "The workspace's internal component pages are private and noindex",
          async () => {
            const shell = await request("/libraries/workspace/?internal=keyboard-shortcut");
            expectStatus(shell, 200);
            expectPrivate(shell);
          },
        ],
      ]
    : []),
]);

const sitemapIndex = await request("/sitemap-index.xml");
const sitemapFiles = [...sitemapIndex.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemaps = await Promise.all(sitemapFiles.map((loc) => request(new URL(loc).pathname)));
const locations = sitemaps.flatMap((sitemap) => [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
await step("Sitemap", [
  [
    "Pages name /sitemap-index.xml, which lists its sitemaps on designsystem1.com",
    async () => {
      expect(home.text.includes('<link rel="sitemap" href="/sitemap-index.xml"'), "the Overview names no sitemap");
      expectStatus(sitemapIndex, 200);
      expectType(sitemapIndex, "application/xml");
      expect(sitemapFiles.length > 0, "no sitemaps listed");
      for (const sitemap of sitemaps) {
        expectStatus(sitemap, 200);
        expectType(sitemap, "application/xml");
      }
      expect(locations.length >= internalLinks.length, `only ${locations.length} addresses`);
      const elsewhere = [...sitemapFiles, ...locations].filter((loc) => new URL(loc).origin !== PUBLIC);
      expect(elsewhere.length === 0, `not on ${PUBLIC}: ${elsewhere.slice(0, 3).join(", ")}`);
    },
  ],
  [
    "The sitemap lists no page that asks not to be indexed",
    async () => {
      const hidden = [];
      for (const loc of locations) {
        const answer = await page(new URL(loc).pathname);
        if (answer.status === 200 && /noindex/.test(meta(answer.text, "robots") ?? "")) hidden.push(new URL(loc).pathname);
      }
      expect(hidden.length === 0, `${hidden.length} of ${locations.length} addresses are noindex, e.g. ${hidden.slice(0, 3).join(", ")}`);
    },
  ],
  ...locations.map((loc) => {
    const path = new URL(loc).pathname;
    return [
      `${path} answers`,
      async () => {
        const answer = await page(path);
        expectStatus(answer, 200);
        expectType(answer, "text/html");
      },
    ];
  }),
]);

// The Worker's moved documentation addresses (services/src/index.ts).
const WORKER_REDIRECTS = {
  "/classless": "/start-here/quick-start/",
  "/classless/libraries": "/libraries/workspace/",
  "/classless/editor": "/libraries/playground/",
  "/classless/library-api": "/libraries/api/",
  "/1-root/native-controls": "/start-here/quick-start/",
  "/components": "/2-core/overview/",
  "/4-page/layouts": "/start-here/examples/",
  "/icons": "/2-core/icon/",
  "/2-core/icon/collection": "/2-core/icon/",
  "/1-root/styling": "/1-root/overview/",
  "/built-ins/languages": "/1-root/languages/",
  "/advanced/theming": "/1-root/theming/",
  "/built-ins/theming": "/1-root/theming/",
  "/built-ins/device": "/1-root/device/",
  "/built-ins/preferences": "/1-root/preferences/",
  "/built-ins/pricing": "/1-root/pricing/",
};
// The site's own redirects, pages that move on at once (website/astro.config.mjs).
const SITE_REDIRECTS = {
  "/2-core/choice/": "/2-core/checkbox/",
  "/1-root/pricing/": "/1-root/formatting/#prices",
  "/start-here/overview/": "/",
  "/examples/": "/start-here/examples/",
  "/examples/settings/": "/start-here/examples/#general-settings",
  "/examples/shop/": "/start-here/examples/#shop",
  "/examples/planner/": "/start-here/examples/#planning-app",
  "/examples/finance/": "/start-here/examples/#finance-app",
  "/examples/product/": "/start-here/examples/#product-showcase",
};

await step("Redirects", [
  ...(WORKER
    ? [
        ...Object.entries(WORKER_REDIRECTS).map(([from, to]) => [
          `${from} goes to ${to}`,
          async () => expectRedirect(await request(from), 308, `${APEX}${to}`),
        ]),
        ["A moved address keeps its query", async () => expectRedirect(await request("/icons/?from=blackbox"), 308, `${APEX}/2-core/icon/?from=blackbox`)],
        ["/app goes to /app/", async () => expectRedirect(await request("/app"), 308, `${APEX}/app/`)],
        ...["/play", "/play/"].map((path) => [`${path} goes to Play`, async () => expectRedirect(await request(path), 308, `${PLAY}/`)]),
        ...["/flags", "/flags/", "/app/flags"].map((path) => [
          `${path} goes to System CI's Flags matrix`,
          async () => {
            const answer = await request(path);
            expectRedirect(answer, 308, FLAGS_MATRIX);
            expectPrivate(answer);
          },
        ]),
        ...["/reports", "/app/reports", "/reports/components"].map((path) => [
          `${path} goes to the adoption dashboard`,
          async () => {
            const answer = await request(path);
            expectRedirect(answer, 302, `${ADOPTION}/`);
            expectPrivate(answer);
          },
        ]),
        ["An unknown /api address is 404", async () => expectStatus(await request("/api/blackbox-no-such-endpoint"), 404)],
      ]
    : []),
  ...Object.entries(SITE_REDIRECTS).map(([from, to]) => [
    `${from} moves on to ${to}`,
    async () => {
      const answer = await request(from);
      expectStatus(answer, 200);
      expect(answer.text.includes(`<meta http-equiv="refresh" content="0;url=${to}">`), `${from} does not move on to ${to}`);
      expect(/noindex/.test(meta(answer.text, "robots") ?? ""), `${from} is indexable`);
    },
  ]),
]);

if (PRODUCTION)
  await step("Hosts", [
    ["www goes to the apex with its path and query", async () => expectRedirect(await request("https://www.designsystem1.com/2-core/button/?from=blackbox"), 308, `${PUBLIC}/2-core/button/?from=blackbox`)],
    ["dsone.dev, the former address, goes to the apex", async () => expectRedirect(await request("https://dsone.dev/2-core/button/"), 308, `${PUBLIC}/2-core/button/`)],
  ]);

await step("Files", [
  [
    "/robots.txt is text and does not shut crawlers out",
    async () => {
      const robots = await request("/robots.txt");
      expectStatus(robots, 200);
      expectType(robots, "text/plain");
      expect(!/^\s*Disallow:\s*\/\s*$/m.test(robots.text), "robots.txt disallows the whole site");
    },
  ],
  ...[
    ["/favicon.ico", "image/x-icon", "image/vnd.microsoft.icon"],
    ["/favicon.svg", "image/svg+xml"],
    ["/icons/design-system-1.svg", "image/svg+xml"],
    ["/icons/apple-touch-icon.png", "image/png"],
  ].map(([path, ...types]) => [
    `${path} is an image`,
    async () => {
      const image = await request(path, { method: "HEAD" });
      expectStatus(image, 200);
      expectType(image, ...types);
    },
  ]),
  [
    "/translations.json holds a table of words for each language on the list",
    async () => {
      const words = json(await request("/translations.json"));
      const codes = Object.keys(words);
      expect(codes.includes("en"), "no English");
      const unknown = codes.filter((code) => !LANGUAGES.includes(code));
      expect(unknown.length === 0, `not on the list: ${unknown.join(", ")}`);
      for (const code of codes) {
        expect(words[code] && typeof words[code] === "object" && !Array.isArray(words[code]), `${code} is not a table`);
        const bad = Object.entries(words[code]).filter(([, text]) => typeof text !== "string");
        expect(bad.length === 0, `${code} has words that are not text: ${bad.slice(0, 3).map(([key]) => key).join(", ")}`);
      }
    },
  ],
]);

// Every file the navigation's and directory's pages link, and what those files load in turn.
const pagePaths = [...new Set(["/", ...internalLinks.map((link) => link.href), ...directory.map((entry) => entry.href)])];
const pageAnswers = await Promise.all(pagePaths.map((path) => page(path).catch(() => null)));
const siteFiles = await crawl(pageAnswers.flatMap((answer) => (answer?.status === 200 ? linkedFiles(answer.text, answer.url) : [])));
await step("Assets", [
  ["The pages link their stylesheets and scripts", async () => expect(siteFiles.length >= 5, `only ${siteFiles.length} files linked`)],
  ...fileChecks(siteFiles, (href) => `${new URL(href).pathname} answers`),
]);

// The hosted stylesheet and module Use with HTML gives a page, and what they load. Pages on
// other sites load them, so each answers to any origin (website/public/_headers).
const hosted = await crawl([`${APEX}/resources/design-system-1.css`, `${APEX}/resources/design-system-1.js`]);
await step("Hosted files", [
  [
    "The hosted stylesheet loads the foundations and the fonts",
    async () => {
      for (const file of ["one.css", "grid.css", "fonts.css", "fonts/Inter-Arrows.woff2", "fonts/Iosevka-Regular.woff2"])
        expect(hosted.some(([href]) => href === `${APEX}/resources/${file}`), `no /resources/${file}`);
    },
  ],
  ...fileChecks(
    hosted,
    (href) => `${new URL(href).pathname} answers to any site`,
    (response) => expectHeader(response, "access-control-allow-origin", /^\*$/),
  ),
]);

if (PRODUCTION) {
  const play = await request(`${PLAY}/`);
  const playFiles = await crawl(play.status === 200 ? linkedFiles(play.text, play.url) : []);
  await step("Play", [
    [
      "play.designsystem1.com draws Play",
      async () => {
        expectStatus(play, 200);
        expectType(play, "text/html");
        expect(titles(play.text)[0] === "Play — Design system 1", `Play is titled "${titles(play.text)[0]}"`);
      },
    ],
    ...["/play", "/play/"].map((path) => [
      `${path} on Play draws Play too`,
      async () => {
        const answer = await request(`${PLAY}${path}`);
        expectStatus(answer, 200);
        expect(titles(answer.text)[0] === titles(play.text)[0], `${path} is titled "${titles(answer.text)[0]}"`);
      },
    ]),
    ["Play links its stylesheets and scripts", async () => expect(playFiles.length >= 2, `only ${playFiles.length} files linked`)],
    ...fileChecks(playFiles, (href) => `${new URL(href).pathname} answers on Play`),
    ...["/translations.json", "/favicon.svg"].map((path) => [
      `${path} answers on Play`,
      async () => {
        const answer = await request(`${PLAY}${path}`, { method: "HEAD" });
        expectStatus(answer, 200);
        expectType(answer, ...TYPES[extension(answer.url)]);
      },
    ]),
    [
      "Another address on Play goes to the same one on designsystem1.com",
      async () => expectRedirect(await request(`${PLAY}/2-core/button/?from=blackbox`), 308, `${PUBLIC}/2-core/button/?from=blackbox`),
    ],
    ["/private-app/ is not on Play", async () => expectStatus(await request(`${PLAY}/private-app/`), 404)],
  ]);

  await step("Flags", [
    ["System CI's Flags matrix, where /flags sends, asks to sign in", async () => expectRedirect(await request(FLAGS_MATRIX), 303, "https://system.0001.dev/login")],
  ]);

  await step("Private hosts", [
    ...["/private-consistency/home", "/private-consistency/home/", "/private-consistency/home.html"].map(path => [
      `Consistency's former home address ${path} is gone`,
      async () => expectStatus(await request(`https://consistency.site${path}?open=52OFXF`), 410),
    ]),
    ...["consistency.site", "c9y.site", "editor.c9y.site", "neweditor.c9y.site"].map(host => [
      `${host} upgrades HTTP with its path and query intact`,
      async () => expectRedirect(await request(`http://${host}/auth/start?next=%2F`), 308, `https://${host}/auth/start?next=%2F`),
    ]),
    ...[ICON, EDITOR].flatMap((origin) => [
      [
        // c9y.site is where customers' sites live; its home leads to the app at consistency.site
        // (services/src/consistency.ts). The icon host keeps its sign-in shell.
        origin === EDITOR ? "c9y.site's home leads to the app at consistency.site" : `${new URL(origin).hostname} asks to sign in`,
        async () => {
          const answer = await request(`${origin}/`);
          expectRedirect(answer, 302, origin === EDITOR ? "https://consistency.site/" : `${origin}/app/signin`);
          expectPrivate(answer);
          expectHeader(answer, "referrer-policy", /^same-origin$/);
        },
      ],
      [
        `${new URL(origin).hostname}/app/signin, the sign-in shell, draws privately`,
        async () => {
          const answer = await request(`${origin}/app/signin`);
          expectStatus(answer, 200);
          expectType(answer, "text/html");
          expectPrivate(answer);
          expectHeader(answer, "vary", /\bCookie\b/);
        },
      ],
      [`${new URL(origin).hostname} has no other pages`, async () => expectStatus(await request(`${origin}/blackbox-no-such-page`), 404)],
    ]),
    ["Private editor files require a session", async () => {
      const answer = await request(`${EDITOR}/private-consistency/consistency.js`);
      // c9y.site asks the owner's System sign-in quietly first (services/src/consistency-owner.ts).
      expectRedirect(answer, 302, `${EDITOR}/auth/start?silent=1`);
      expectPrivate(answer);
    }],
    ["The owner's sign-in asks System quietly, for c9y.site's own client", async () => {
      const answer = await request(`${EDITOR}/auth/start?silent=1`);
      expectStatus(answer, 303);
      const to = new URL(answer.headers.get("location") ?? "");
      if (to.origin + to.pathname !== "https://system.0001.dev/auth/authorize" || to.searchParams.get("client") !== "c9y" || to.searchParams.get("prompt") !== "none") throw new Error(`went to ${to}`);
    }],
    ["Private editor has no public-host alias", async () => expectStatus(await request('/private-consistency/index.html'), 404)],
    [
      "fonts.designsystem1.com draws its sign-in shell privately",
      async () => {
        const answer = await request(`${FONTS}/`);
        expectStatus(answer, 200);
        expectType(answer, "text/html");
        expectPrivate(answer);
        expectHeader(answer, "referrer-policy", /^same-origin$/);
      },
    ],
    ["fonts.designsystem1.com has no other pages", async () => expectStatus(await request(`${FONTS}/blackbox-no-such-page`), 404)],
    [
      "/private-app/ on designsystem1.com asks to sign in",
      async () => {
        const answer = await request("/private-app/");
        expectRedirect(answer, 302, `${PUBLIC}/app/signin?next=${encodeURIComponent("/libraries/workspace/")}`);
        expectPrivate(answer);
      },
    ],
    ...["/", "/adoption", "/architecture", "/examples", "/constraints"].map((path) => [
      `DS1 System ${path} asks to sign in`,
      async () => {
        const answer = await request(`https://system.designsystem1.com${path}`);
        expectRedirect(answer, 302, `https://system.designsystem1.com/app/signin?next=${encodeURIComponent(path)}`);
        expectPrivate(answer);
      },
    ]),
    ...["/adoption/", "/architecture/"].map((path) => [
      `${path} asks to sign in`,
      async () => {
        const answer = await request(path);
        expectRedirect(answer, 302, `${PUBLIC}/app/signin`);
        expectPrivate(answer);
      },
    ]),
    ...[
      [FONTS, "/api/fonts"],
      [PUBLIC, "/api/reports/components"],
      [PUBLIC, "/api/reports/architecture"],
      [PUBLIC, "/api/flags"],
      [PUBLIC, "/api/app-navigation"],
    ].map(([origin, path]) => [
      `${new URL(origin).hostname}${path} without a session asks for one`,
      async () => {
        const answer = await request(`${origin}${path}`);
        expectStatus(answer, 401);
        json(answer);
        expectPrivate(answer);
      },
    ]),
  ]);
}

// The published package: the version the latest tag names, and the files the README, Use with
// HTML and AGENTS.md's Distribution tell products to load from it.
const manifest = await request(`${REGISTRY}/latest`).then(
  (response) => ({ response, body: response.status === 200 ? JSON.parse(response.text) : null }),
  (error) => ({ error }),
);
const version = manifest.body?.version;
const pinned = `${CDN}@${version}`;
const main = (manifest.body?.main ?? "").replace(/^\.\//, "");
const styles = (manifest.body?.exports?.["./styles"] ?? "").replace(/^\.\//, "");
const packageFiles = version
  ? await crawl([`${pinned}/${main}`, `${pinned}/${styles}`, `${pinned}/DS1/1-root/grid.css`, `${pinned}/DS1/1-root/fonts.css`, `${pinned}/DS1/1-root/cjk.css`, `${pinned}/dist/design-system-1.bundle.min.js`])
  : [];
await step("Package", [
  [
    `The latest tag on npm names a stable version`,
    async () => {
      if (manifest.error) throw manifest.error;
      expectStatus(manifest.response, 200);
      expect(/^\d+\.\d+\.\d+$/.test(version ?? ""), `latest is ${version}`);
      expect(manifest.body.name === PACKAGE, `the tag names ${manifest.body.name}`);
    },
  ],
  [
    "Its main entry is the bundle, and its styles are one.css",
    async () => {
      expect(main === "dist/design-system-1.bundle.js", `main is ${main}`);
      expect(manifest.body.exports?.["."]?.import === "./dist/design-system-1.bundle.js", `"." imports ${manifest.body.exports?.["."]?.import}`);
      expect(styles === "DS1/1-root/one.css", `./styles is ${styles}`);
    },
  ],
  [
    "jsDelivr serves the version with its fonts and chunks",
    async () => {
      for (const file of ["DS1/1-root/one.css", "DS1/1-root/grid.css", "DS1/1-root/fonts/Inter-Arrows.woff2", "DS1/1-root/fonts/Iosevka-Regular.woff2", main])
        expect(packageFiles.some(([href]) => href === `${pinned}/${file}`), `${file} is not reached`);
    },
  ],
  ...fileChecks(
    packageFiles,
    (href) => `${href.slice(CDN.length + 1)} answers on jsDelivr`,
    (response) => expectHeader(response, "access-control-allow-origin", /^\*$/),
  ),
  [
    `${CDN}@latest/DS1/1-root/one.css answers`,
    async () => {
      const answer = await request(`${CDN}@latest/DS1/1-root/one.css`, { method: "HEAD" });
      expectStatus(answer, 200);
      expectType(answer, "text/css");
    },
  ],
]);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) {
  console.log("\nFailed:");
  for (const failure of failures) console.log(`  ${failure}`);
  process.exit(1);
}
