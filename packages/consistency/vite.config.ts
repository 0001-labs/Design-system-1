import { defineConfig } from 'vite-plus';
import { resolve } from 'node:path';
export default defineConfig({
 root: import.meta.dirname,
 base: '/editor/',
 build: {
  outDir: resolve(import.meta.dirname,'../../website/dist/editor'), emptyOutDir:true,
  assetsInlineLimit:0, sourcemap:false,
  rollupOptions:{input:{index:resolve(import.meta.dirname,'index.html'),home:resolve(import.meta.dirname,'home.html'),guide:resolve(import.meta.dirname,'guide.html')}},
 },
});
