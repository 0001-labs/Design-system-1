import { defineConfig } from "vite-plus";
import { resolve } from "node:path";

export default defineConfig({
  // The SPA lives under /app/* in production, served by the same Cloudflare
  // Worker as the docs site. Dev mirrors that so paths, the router's
  // BASE, and the magic-link SITE_URL all agree.
  base: "/app/",

  // `convex dev` writes VITE_CONVEX_URL into .env.local at the REPO root, not
  // in app/. Vite otherwise reads env files from its own root, leaving
  // import.meta.env.VITE_CONVEX_URL undefined and the app throwing before it
  // renders.
  envDir: resolve(__dirname, ".."),

  build: {
    // Built into the Astro output rather than app/dist, so one Worker deploy
    // serves docs at / and the workbench at /app/.
    //
    // Order matters in the root `site:build` script: Astro empties
    // website/dist first, then this writes into it.
    outDir: "../website/dist/app",
    emptyOutDir: true,
  },

  server: {
    fs: {
      // The app imports DS1/ sources directly (one.css, ds-icon, and the
      // semantic stylesheet via ?raw).
      allow: [resolve(__dirname, "..")],
    },
  },
});
