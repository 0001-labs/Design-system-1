/**
 * Where a sign-in may end. `redirectTo` is caller-controlled and becomes the
 * link in an email or the page a provider returns to, so only a product's own
 * sign-in pages may ever be a destination: anything else would let a forged
 * request carry the one-use code away. Destinations receive that code and
 * never session credentials; the code is worthless without the verifier the
 * starting client keeps, which is what makes a custom URL scheme safe.
 */
export type RedirectRules = {
  /** Web origins a sign-in may end on: `SITE_URL` and the extra ones a product allows, such as a localhost for development. */
  origins: string[]
  /** The pathnames allowed there: each exact, or one pattern. */
  paths: string[] | RegExp
  /** Query keys allowed, each at most once, with the shape its value must have (null for any). `oauth`, when allowed, must be `1`. */
  params?: Record<string, RegExp | null>
  /** Keys that have to be present. */
  require?: string[]
  /** Custom URL schemes an app registers, with the colon (`ezo:`): the destination is then `<scheme>//callback?state=<uuid>` and nothing else. */
  nativeSchemes?: string[]
  /** A further rule for hosts outside `origins`, such as a product's customer subdomains; https only, no port. */
  hostAllowed?: (hostname: string) => boolean
}

const UUID = /^[a-f0-9-]{36}$/i
const refuse = (reason = 'Invalid sign-in destination'): never => {
  throw new Error(reason)
}

/** The destination as a string when the rules allow it; throws otherwise. */
export function signInRedirect(redirectTo: string, rules: RedirectRules): string {
  let url: URL
  try {
    url = new URL(redirectTo)
  } catch {
    return refuse()
  }
  if (url.username || url.password || url.hash) refuse()
  if (rules.nativeSchemes?.includes(url.protocol)) {
    if (url.hostname !== 'callback' || url.port || (url.pathname !== '' && url.pathname !== '/')) refuse()
    const keys = [...url.searchParams.keys()]
    if (keys.length !== 1 || keys[0] !== 'state' || !UUID.test(url.searchParams.get('state') ?? '')) refuse('Invalid sign-in state')
    return url.toString()
  }
  if (!['http:', 'https:'].includes(url.protocol)) refuse()
  const listed = rules.origins.some((origin) => {
    try {
      return new URL(origin).origin === url.origin
    } catch {
      return false
    }
  })
  const byHost = !listed && url.protocol === 'https:' && !url.port && rules.hostAllowed?.(url.hostname.toLowerCase()) === true
  if (!listed && !byHost) refuse()
  const path = url.pathname
  if (!(rules.paths instanceof RegExp ? rules.paths.test(path) : rules.paths.includes(path))) refuse()
  const allowed = rules.params ?? {}
  for (const key of new Set(url.searchParams.keys())) {
    if (!Object.prototype.hasOwnProperty.call(allowed, key)) refuse()
    const values = url.searchParams.getAll(key)
    if (values.length !== 1) refuse()
    const shape = key === 'oauth' ? /^1$/ : allowed[key]
    if (shape && !shape.test(values[0])) refuse()
  }
  for (const key of rules.require ?? []) if (!url.searchParams.has(key)) refuse()
  return url.toString()
}
