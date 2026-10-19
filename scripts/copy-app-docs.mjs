import { copyFileSync } from 'node:fs';
copyFileSync(new URL('../packages/app/index.html', import.meta.url), new URL('../website/dist/private-app/index.html', import.meta.url));
