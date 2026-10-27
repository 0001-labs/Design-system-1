/**
 * The workspace the app is in: one client's sites, on its plan. The owner moves between every workspace; anyone
 * else between the ones they were invited to. Every call for the workspace's own things (its sites, its domains,
 * its drafts) names it in `X-C9y-Workspace`, and the platform checks the person may open it.
 */
export interface PlanLimits { sites: number | null; customDomains: boolean }
export interface WorkspaceSummary {
  code: string;
  name: string;
  plan: string;
  role: 'owner' | 'admin' | 'editor';
  sites: number;
  /** The codes of its sites, so a site asked for by its code (`?open=`) opens in its own workspace. */
  siteCodes: string[];
  limits: PlanLimits;
}

const CODE = /^\d{2}[A-Za-z]{4}$/;
const ACTIVE_KEY = 'consistency-active-workspace';
const LIST_KEY = 'consistency-workspaces';

let active = (() => { try { const code = localStorage.getItem(ACTIVE_KEY) ?? ''; return CODE.test(code) ? code : ''; } catch { return ''; } })();

/** The workspace's code, or '' before the first answer. */
export const activeWorkspace = () => active;
export function setActiveWorkspace(code: string) {
  active = CODE.test(code) ? code : '';
  try { localStorage.setItem(ACTIVE_KEY, active); } catch { /* chosen again next visit */ }
}
/** The headers that put a call in the workspace. */
export const workspaceHeaders = (): Record<string, string> => (active ? { 'X-C9y-Workspace': active } : {});

const isSummary = (value: unknown): value is WorkspaceSummary => {
  const each = value as Partial<WorkspaceSummary> | null;
  return !!each && typeof each.code === 'string' && CODE.test(each.code) && typeof each.name === 'string' && Array.isArray(each.siteCodes) && !!each.limits;
};
/** The workspaces as last read, so the header draws at once and the platform only confirms them. */
export function storedWorkspaces(): WorkspaceSummary[] {
  try { const value = JSON.parse(localStorage.getItem(LIST_KEY) ?? '[]') as unknown; return Array.isArray(value) ? value.filter(isSummary) : []; } catch { return []; }
}
export function storeWorkspaces(list: WorkspaceSummary[]) { try { localStorage.setItem(LIST_KEY, JSON.stringify(list)); } catch { /* read again next visit */ } }

/** Why a read failed: the session ended (the platform answered 401 or 403), or the platform could not be reached or answered badly. */
export type ReadFailure = 'signed-out' | 'unavailable';
/** The workspaces the person may open, or why they could not be read. */
export type WorkspacesRead = { owner: boolean; workspaces: WorkspaceSummary[] } | { failed: ReadFailure };
/** The failure a read ended in: `signed-out` for 401 and 403, `unavailable` for every other answer and for no answer at all. */
export const readFailure = (response: Response | null): ReadFailure => response?.status === 401 || response?.status === 403 ? 'signed-out' : 'unavailable';

/**
 * The workspaces the person may open, or `{ failed }` saying why they could not be read: `signed-out` when the
 * platform answered 401 or 403, `unavailable` for any other failure (another status, a bad body, no answer). The home
 * says so over the workspaces and cards it drew from the last visit, instead of passing them off as current.
 */
export async function readWorkspaces(): Promise<WorkspacesRead> {
  const response = await fetch('/api/consistency/workspaces', { cache: 'no-store' }).catch(() => null);
  const body = response?.ok ? await response.json().catch(() => null) as { owner?: unknown; workspaces?: unknown } | null : null;
  if (!Array.isArray(body?.workspaces)) return { failed: readFailure(response) };
  return { owner: body.owner === true, workspaces: body.workspaces.filter(isSummary) };
}

/** Who may invite and remove people and rename the workspace. */
export const canManage = (workspace: WorkspaceSummary | undefined) => workspace?.role === 'owner' || workspace?.role === 'admin';

/** "1 of 2 draft sites", or nothing on a plan without a limit. */
export function draftWords(workspace: WorkspaceSummary | undefined): string {
  const limit = workspace?.limits.sites;
  if (!workspace || limit === null || limit === undefined) return '';
  return `${workspace.sites} of ${limit} draft ${limit === 1 ? 'site' : 'sites'}`;
}
