import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { LibraryClient } from './client.mjs';
const run = promisify(execFile);

test('CLI and MCP use the same HTTP contract, authorization and conflict handling', async () => {
  const requests = [];
  const server = createServer(async (req, res) => {
    let text = ''; for await (const chunk of req) text += chunk;
    requests.push({ url: req.url, authorization: req.headers.authorization, args: text ? JSON.parse(text) : null });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/libraries') res.end(JSON.stringify({ operations: [{ name: 'list', description: 'List', readOnly: true, inputSchema: { type: 'object', properties: {} } }, { name: 'save', description: 'Save', readOnly: false, inputSchema: { type: 'object', properties: {} } }] }));
    else if (req.url === '/api/libraries/list') res.end(JSON.stringify({ result: [{ name: 'Example', draftRev: 2 }] }));
    else { res.statusCode = 409; res.end(JSON.stringify({ error: { code: 'draft_conflict', message: 'Edited elsewhere.', details: { serverRev: 3 } } })); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const env = { ...process.env, DS1_API_URL: `http://127.0.0.1:${server.address().port}`, DS1_TOKEN: 'test-session' };
  const client = new Client({ name: 'library-tests', version: '1.0.0' });
  try {
    const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
    const result = await run(process.execPath, [cli, 'list'], { env });
    assert.equal(JSON.parse(result.stdout)[0].name, 'Example');
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('./mcp.mjs', import.meta.url))], env }));
    const list = await client.listTools();
    assert.equal(list.tools[0].name, 'libraries_list');
    assert.equal(list.tools[1].annotations.destructiveHint, true);
    const value = await client.callTool({ name: 'libraries_list', arguments: {} });
    assert.equal(JSON.parse(value.content[0].text)[0].draftRev, 2);
    const failure = await client.callTool({ name: 'libraries_save', arguments: { baseRev: 2 } });
    assert.equal(failure.isError, true);
    assert.equal(JSON.parse(failure.content[0].text).code, 'draft_conflict');
    assert.ok(requests.filter(r => r.args).every(r => r.authorization === 'Bearer test-session'));
  } finally { await client.close(); await new Promise(resolve => server.close(resolve)); }
});
test('email sign-in stores credentials privately and refreshes without printing them', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ds1-library-'));
  const valid = `header.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 3600 })).toString('base64url')}.signature`;
  const calls = [];
  const client = new LibraryClient({ directory, send: async (url, init) => {
    calls.push(JSON.parse(init.body));
    return Response.json({ result: { tokens: { token: valid, refreshToken: 'test-refresh' } } });
  } });
  try {
    await client.login('reader@example.com', '123456');
    assert.equal((await stat(client.file)).mode & 0o777, 0o600);
    assert.equal(await client.session(), valid);
    assert.equal(calls.length, 1);
    await client.store({ token: 'expired', refreshToken: 'test-refresh' });
    assert.equal(await client.session(), valid);
    assert.deepEqual(calls[1], { refreshToken: 'test-refresh' });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
