import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve('website/dist');
const server = await createServer({ configFile: false,
  plugins: [{ name: 'built-examples', configureServer(server) { server.middlewares.use(async (req,res,next) => {
    if (!req.url?.startsWith('/examples/') && !req.url?.startsWith('/_astro/')) return next();
    const url = new URL(req.url,'http://localhost');
    const path = resolve(root, '.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));
    if (!path.startsWith(root+'/')) return next();
    try { const body=await readFile(path); res.setHeader('Content-Type',path.endsWith('.html')?'text/html':path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'application/octet-stream');res.end(body); } catch {next();}
  }); } }], server: { host:'127.0.0.1', port:5189, strictPort:true }
});
await server.listen();
