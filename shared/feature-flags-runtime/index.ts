/** Production release rules. Identity is supplied by the authenticated server. */
export type FlagDefinition = { label: string; description?: string; defaultEnabled?: boolean };
export type FlagDefinitions = Readonly<Record<string, FlagDefinition>>;
export type ReleaseAudience = 'everyone' | 'owner' | 'accounts' | 'percentage';
export type ReleaseRule = { enabled: boolean; audience: ReleaseAudience; accountIds?: string[]; percentage?: number };
export type FlagPrincipal = { accountId?: string | null; isOwner?: boolean };
export type FlagRules = Readonly<Record<string, unknown>>;

export function isRolloutPercentage(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 99;
}

export function isReleaseRule(value: unknown): value is ReleaseRule {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const rule = value as Partial<ReleaseRule>;
  return typeof rule.enabled === 'boolean' &&
    ['everyone', 'owner', 'accounts', 'percentage'].includes(rule.audience ?? '') &&
    (rule.accountIds === undefined || (Array.isArray(rule.accountIds) && rule.accountIds.every(id => typeof id === 'string' && id.length > 0))) &&
    (rule.percentage === undefined || isRolloutPercentage(rule.percentage)) &&
    (rule.audience !== 'percentage' || isRolloutPercentage(rule.percentage));
}

/**
 * The hundredth of the accounts an account falls in for a flag, 0 to 99. The same
 * account lands in the same place every time, and in a different place for each
 * flag, so a 10% release holds everyone the 5% one had. Anonymous visitors have no
 * place and are never in a share.
 */
export function rolloutBucket(key: string, accountId: string): number {
  const text = `${key}.${accountId}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % 100;
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
    case 'percentage': return typeof principal.accountId === 'string' && isRolloutPercentage(rule.percentage) && rolloutBucket(key, principal.accountId) < rule.percentage;
  }
}

/** Send only this evaluated snapshot to clients, never targeting identities. */
export function resolveFlags(definitions: FlagDefinitions, rules: FlagRules, principal: FlagPrincipal = {}): Record<string, boolean> {
  return Object.fromEntries(Object.keys(definitions).map(key => [key, resolveFlag(definitions, key, rules, principal)]));
}

export function requireFlag(definitions: FlagDefinitions, key: string, rules: FlagRules, principal: FlagPrincipal = {}): void {
  if (!resolveFlag(definitions, key, rules, principal)) throw new Error('This feature is not available.');
}
