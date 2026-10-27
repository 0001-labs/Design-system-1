import { test, expect } from 'vite-plus/test';
import { mkdtemp, mkdir, writeFile, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

test('the constraint CLI keeps a fault failure and saves its annotated viewport', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fault-lines-'));
  try {
    const site = join(root, 'site'), artifacts = join(root, 'artifacts');
    await mkdir(site);
    await writeFile(join(site, 'index.html'), `<meta name="viewport" content="width=device-width"><style>.cards{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px}button{height:40px}</style><div class="cards" data-ds-fault-lines="cards"><button>A</button><button>B</button></div><div class="cards" data-ds-fault-lines="cards" style="gap:10px"><button>C</button><button>D</button></div>`);
    const result = await promisify(execFile)(process.execPath, ['--import', 'tsx', 'scripts/constraints-phone.ts', '--dist', site, '--widths', '375', '--artifacts', artifacts], {cwd:join(import.meta.dirname,'..')}).then(value => ({...value,code:0}), (error: {code:number;stdout:string;stderr:string}) => error);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain('page.fault-lines');
    expect(result.stdout).not.toContain('could not be opened');
    const files = await readdir(artifacts);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^375-home-.*\.png$/);
    const png = await readFile(join(artifacts, files[0]!));
    expect(png.subarray(1,4).toString()).toBe('PNG');
  } finally {await rm(root,{recursive:true,force:true});}
}, 30_000);
