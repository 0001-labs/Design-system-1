import { defineConfig } from 'vite-plus';
import { resolve } from 'node:path';

// C9Y System's page, served privately at system.consistency.site from the site's build.
export default defineConfig({
  root: import.meta.dirname,
  base: '/private-c9y-system/',
  build: {
    outDir: resolve(import.meta.dirname, '../../../website/dist/private-c9y-system'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: { input: resolve(import.meta.dirname, 'index.html') },
  },
});
