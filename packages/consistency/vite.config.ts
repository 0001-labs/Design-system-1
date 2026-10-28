import { defineConfig } from 'vite-plus';
import { resolve } from 'node:path';
export default defineConfig({
 root: import.meta.dirname,
 base: '/private-consistency/',
 plugins: [{name:'private-guide-path',generateBundle(_options,bundle){const guide=bundle['guide.html'];if(guide){delete bundle['guide.html'];guide.fileName='guide/index.html';bundle[guide.fileName]=guide;}}}],
 build: {
  outDir: resolve(import.meta.dirname,'../../website/dist/private-consistency'), emptyOutDir:true,
  assetsInlineLimit:0, sourcemap:false,
  rollupOptions:{input:{index:resolve(import.meta.dirname,'index.html'),home:resolve(import.meta.dirname,'home.html'),guide:resolve(import.meta.dirname,'guide.html')}},
 },
});
