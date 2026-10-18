/** Production release rules. Identity is supplied by the authenticated server. */
export type FlagDefinition = { label: string; description?: string; defaultEnabled?: boolean };
export type FlagDefinitions = Readonly<Record<string, FlagDefinition>>;
export type ReleaseRule = { enabled: boolean; audience: 'everyone' | 'owner' | 'accounts'; accountIds?: string[] };
export type FlagPrincipal = { accountId?: string | null; isOwner?: boolean };
export type FlagRules = Readonly<Record<string, unknown>>;

export function isReleaseRule(value: unknown): value is ReleaseRule {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const rule = value as Partial<ReleaseRule>;
  return typeof rule.enabled === 'boolean' &&
    ['everyone', 'owner', 'accounts'].includes(rule.audience ?? '') &&
    (rule.accountIds === undefined || (Array.isArray(rule.accountIds) && rule.accountIds.every(id => typeof id === 'string' && id.length > 0)));
}

/** Unknown flags and malformed persisted rules fail closed. No owner bypass of Off. */
export function resolveFlag(definitions: FlagDefinitions, key: string, rules: FlagRules, principal: FlagPrincipal = {}): boolean {
  if (!Object.prototype.hasOwnProperty.call(definitions, key)) return false;
  if (!Object.prototype.hasOwnProperty.call(rules, key)) return definitions[key]?.defaultEnabled === true;
  const rule = rules[key];
  if (!isReleaseRule(rule) || !rule.enabled) return false;
  switch (rule.audience) {
    case 'everyone': return true;
    case 'owner': return principal.isOwner === true;
    case 'accounts': return typeof principal.accountId === 'string' && !!rule.accountIds?.includes(principal.accountId);
  }
}

/** Send only this evaluated snapshot to clients, never targeting identities. */
export function resolveFlags(definitions: FlagDefinitions, rules: FlagRules, principal: FlagPrincipal = {}): Record<string, boolean> {
  return Object.fromEntries(Object.keys(definitions).map(key => [key, resolveFlag(definitions, key, rules, principal)]));
}

export function requireFlag(definitions: FlagDefinitions, key: string, rules: FlagRules, principal: FlagPrincipal = {}): void {
  if (!resolveFlag(definitions, key, rules, principal)) throw new Error('This feature is not available.');
}
