import { defineConfig } from "vite-plus";
import { resolve } from "path";

const isMinified = process.env.MINIFY === "true";

// Library build config - handles CSS ?inline imports for bundling
// This bundles everything (including lit) for standalone/CDN usage
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "DS1/index.ts"),
      name: "DsOne",
      formats: ["es"],
      fileName: () => (isMinified ? "design-system-1.bundle.min.js" : "design-system-1.bundle.js"),
    },
    minify: isMinified ? "esbuild" : false,
    sourcemap: true,
    // Target modern browsers
    target: "es2020",
  },
  resolve: {
    alias: {
      "design-system-1": resolve(__dirname, "DS1"),
    },
  },
});
