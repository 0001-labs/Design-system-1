import { defineConfig } from "vite-plus";

export default defineConfig({
  check: {
    // Adopt Oxfmt separately from the Vite+ toolchain migration so existing
    // source and documentation files do not create one large formatting diff.
    fmt: false,
  },
  fmt: {
    ignorePatterns: [
      ".wrangler/**",
      "app/**",
      "convex/signIn/**",
      "dist/**",
      "move out/**",
      "sites/**",
      "website/**",
    ],
  },
  lint: {
    ignorePatterns: [
      ".wrangler/**",
      "app/**",
      // The shared sign-in, copied from Sign-in by `vp run sync-sign-in`, keeps its own formatting.
      "convex/signIn/**",
      "dist/**",
      "move out/**",
      "scripts/**",
      "sites/**",
      "website/**",
    ],
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    overrides: [
      {
        // A component's template listeners (@click=${this.handle}) are called by Lit with the
        // element as `this` (lit-html's EventPart calls them on options.host), so they are
        // bound; anywhere else a method passed on its own is still flagged.
        files: ["DS1/**/ds-*.ts"],
        rules: { "typescript/unbound-method": "off" },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    // The Playwright specs in e2e/ run with `vp run test:e2e`, not Vitest
    exclude: ["**/node_modules/**", "**/.git/**", "e2e/**"],
  },
  root: ".",
  server: {
    host: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "design-system-1": "./DS1",
    },
  },
});
