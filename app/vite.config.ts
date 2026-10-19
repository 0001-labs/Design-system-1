import { defineConfig, loadEnv } from "vite-plus";
import { resolve } from "node:path";

const envDir = resolve(__dirname, "..");

export default defineConfig(({ command, mode }) => {
  // A production build without the backend's address ships a bundle that stops
  // as soon as it loads (a worktree has no .env.local). Refuse it instead.
  if (command === "build" && mode === "production" && !process.env.VITE_CONVEX_URL && !loadEnv(mode, envDir, "VITE_").VITE_CONVEX_URL) {
    throw new Error("VITE_CONVEX_URL is not set: copy .env.local into this checkout or set it before building the app.");
  }
  return {
    // The SPA lives under /app/* in production, served by the same Cloudflare
    // Worker as the docs site. Dev mirrors that so paths, the router's
    // BASE, and the magic-link SITE_URL all agree.
    base: "/app/",

    // `convex dev` writes VITE_CONVEX_URL into .env.local at the REPO root, not
    // in app/. Vite otherwise reads env files from its own root, leaving
    // import.meta.env.VITE_CONVEX_URL undefined and the app throwing before it
    // renders.
    envDir,

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
        // The app imports the shared DS1 styles and Lit components directly.
        allow: [resolve(__dirname, "..")],
      },
    },
  };
});
