import { mkdir, readFile, writeFile, rename, rm, chmod } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export class ApiError extends Error {
  constructor(error, status) { super(error.message); this.code = error.code; this.status = status; this.details = error.details; }
}
export class LibraryClient {
  constructor({ origin = process.env.DS1_API_URL || 'https://designsystem1.com', directory = process.env.DS1_CONFIG_DIR || join(homedir(), '.config', 'design-system-1'), send = fetch } = {}) {
    const url = new URL(origin);
    if (url.protocol !== 'https:' && !(['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol === 'http:')) throw new Error('DS1_API_URL must use HTTPS.');
    this.origin = url.origin; this.directory = directory; this.send = send;
    this.file = join(directory, `${encodeURIComponent(this.origin)}.json`);
  }
  async request(path, args, token) {
    const response = await this.send(`${this.origin}${path}`, { method: args === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: args === undefined ? undefined : JSON.stringify(args), redirect: 'error', signal: AbortSignal.timeout(65_000) });
    const body = await response.json();
    if (!response.ok) throw new ApiError(body.error || { code: 'http_error', message: `Request failed (${response.status}).` }, response.status);
    return body;
  }
  async schema() { return this.request('/api/libraries'); }
  async credentials() {
    try { return JSON.parse(await readFile(this.file, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  async store(tokens) {
    if (!tokens?.token || !tokens?.refreshToken) throw new Error('Sign-in did not return a session.');
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    await chmod(this.directory, 0o700);
    const tmp = `${this.file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(tokens), { mode: 0o600 }); await rename(tmp, this.file);
  }
  async login(email, code) {
    const { result } = await this.request('/api/library-auth/sign-in', { provider: 'email-code', params: { email, ...(code ? { code } : {}) } });
    if (code) await this.store(result?.tokens);
  }
  // CLI and MCP share renewable sessions. Lock refreshes across processes.
  async session() {
    if (process.env.DS1_TOKEN) return process.env.DS1_TOKEN;
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const lock = `${this.file}.lock`;
    for (let attempt = 0; ; attempt++) {
      try { await mkdir(lock, { mode: 0o700 }); break; }
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        if (attempt >= 100) throw new Error(`Session is locked by another process. If it has stopped, remove ${lock}.`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    try {
      let tokens = await this.credentials();
      if (!tokens) throw new Error('Run ds1 login before using libraries.');
      let expires = 0;
      try { expires = JSON.parse(Buffer.from(tokens.token.split('.')[1], 'base64url').toString()).exp * 1000; } catch { /* Refresh an unreadable token. */ }
      // This decoded expiry only decides when to refresh; the server validates authorization.
      if (expires < Date.now() + 60_000) {
        const { result } = await this.request('/api/library-auth/sign-in', { refreshToken: tokens.refreshToken });
        await this.store(result?.tokens); tokens = result.tokens;
      }
      return tokens.token;
    } finally { await rm(lock, { recursive: true, force: true }); }
  }
  async call(operation, args = {}) {
    if (!/^[a-z]+$/.test(operation)) throw new Error('Invalid operation.');
    return (await this.request(`/api/libraries/${operation}`, args, await this.session())).result;
  }
  async logout() {
    const token = await this.session();
    await this.request('/api/library-auth/sign-out', {}, token);
    await rm(this.file, { force: true });
  }
}
