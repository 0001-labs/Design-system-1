import { defineConfig } from 'vite-plus';
import { resolve } from 'node:path';
export default defineConfig({
  build: {
    outDir: resolve(import.meta.dirname, '../../website/dist/private-app'),
    emptyOutDir: true,
    lib: { entry: resolve(import.meta.dirname, 'src/index.ts'), formats: ['es'], fileName: () => 'app.js', cssFileName: 'app' },
    sourcemap: false,
    rollupOptions: { output: { codeSplitting: false } },
  },
});
