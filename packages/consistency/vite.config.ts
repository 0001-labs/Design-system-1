import { defineConfig } from 'vite-plus';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
export default defineConfig({ base: '/private-consistency/', plugins: [{ name: 'private-composition-shell', generateBundle() { this.emitFile({ type: 'asset', fileName: 'index.html', source: readFileSync(resolve(import.meta.dirname, 'index.html'), 'utf8') }); } }], build: {
  outDir: resolve(import.meta.dirname, '../../website/dist/private-consistency'), emptyOutDir: true,
  lib: { entry: resolve(import.meta.dirname, 'preview.ts'), formats: ['es'], fileName: () => 'consistency.js', cssFileName: 'consistency' },
  sourcemap: false, rollupOptions: { output: { codeSplitting: false } },
} });
