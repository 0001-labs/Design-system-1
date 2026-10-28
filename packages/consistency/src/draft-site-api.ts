export interface DraftSiteSummary { id: string; name: string; revision: number; updatedAt: number }
export interface DraftSite extends DraftSiteSummary { document: Record<string, unknown> }
export async function draftSiteApi<T>(workspace: string, id = '', init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/consistency/draft-sites${id ? `/${id}` : ''}`, { cache: 'no-store', ...init, headers: { 'X-C9y-Workspace': workspace, 'Content-Type': 'application/json', ...init?.headers } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error === 'site-limit' ? 'This workspace has reached its site limit.' : body?.error === 'revision-conflict' ? 'This site changed in another tab. Your edits are still here. Save a copy to keep them.' : response.status === 401 || response.status === 403 ? 'Your session or permission changed. Sign in again in another tab, then try again.' : 'The site could not be saved. Try again.');
  return body as T;
}

