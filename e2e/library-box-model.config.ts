import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'library-box-model.spec.ts',workers:1,
use:{baseURL:'http://127.0.0.1:5189',viewport:{width:1440,height:1000}},
webServer:{command:'node e2e/library-box-model-server.mjs',cwd:'..',url:'http://127.0.0.1:5189/e2e/fixtures/library-box-model.html',reuseExistingServer:true}});
