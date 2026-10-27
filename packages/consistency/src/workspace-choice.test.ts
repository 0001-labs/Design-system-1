import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { draftWords, readFailure, readWorkspaces, type WorkspaceSummary } from './workspace-choice';

const workspace: WorkspaceSummary = { code: '01STDO', name: '0001', plan: 'free', role: 'owner', sites: 3, siteCodes: ['10VNDG'], limits: { sites: 2, customDomains: false } };
const answer = (status: number, body?: unknown) => vi.stubGlobal('fetch', vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })));

describe('reading the workspaces', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the workspaces the platform answers with, the ones of the right shape', async () => {
    answer(200, { owner: true, workspaces: [workspace, { code: 'bad' }] });
    expect(await readWorkspaces()).toEqual({ owner: true, workspaces: [workspace] });
  });

  it('says the session ended when the platform answers 401 or 403', async () => {
    answer(401);
    expect(await readWorkspaces()).toEqual({ failed: 'signed-out' });
    answer(403, { error: 'forbidden' });
    expect(await readWorkspaces()).toEqual({ failed: 'signed-out' });
  });

  it('says the platform is unavailable for any other failure: a server error, a bad body, no answer at all', async () => {
    answer(503);
    expect(await readWorkspaces()).toEqual({ failed: 'unavailable' });
    answer(200, { owner: true });
    expect(await readWorkspaces()).toEqual({ failed: 'unavailable' });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    expect(await readWorkspaces()).toEqual({ failed: 'unavailable' });
  });

  it('tells a failed answer apart the same way for any read', () => {
    expect(readFailure(new Response(null, { status: 401 }))).toBe('signed-out');
    expect(readFailure(new Response(null, { status: 403 }))).toBe('signed-out');
    expect(readFailure(new Response(null, { status: 500 }))).toBe('unavailable');
    expect(readFailure(null)).toBe('unavailable');
  });

  it('counts the draft sites against the plan, or says nothing without a limit', () => {
    expect(draftWords(workspace)).toBe('3 of 2 draft sites');
    expect(draftWords({ ...workspace, sites: 1, limits: { sites: 1, customDomains: false } })).toBe('1 of 1 draft site');
    expect(draftWords({ ...workspace, limits: { sites: null, customDomains: true } })).toBe('');
    expect(draftWords(undefined)).toBe('');
  });
});
