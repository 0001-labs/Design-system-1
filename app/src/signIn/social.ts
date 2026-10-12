/**
 * Google and Apple for a site without Convex Auth's React client: `signIn`
 * answers with where to send the person and a verifier only this browser
 * knows; the provider returns to the sign-in page with a one-use `code`, and
 * the two together make the session. Ten minutes, once.
 */
const KEY = 'sign-in-social'

export type SocialStart = { redirect?: string; verifier?: string }

/** Keeps the verifier and sends the person to the provider. Throws when the backend did not start a flow. */
export function startSocialSignIn(result: SocialStart): never {
  if (!result.redirect || !result.verifier) throw new Error('Sign-in did not start. Try again.')
  sessionStorage.setItem(KEY, JSON.stringify({ verifier: result.verifier, at: Date.now() }))
  window.location.assign(result.redirect)
  throw new Error('Leaving for the provider')
}

/** The code and verifier to redeem when the page opens back from a provider; null otherwise. Removes both from the address and the browser. */
export function pendingSocialSignIn(): { code: string; verifier: string } | null {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  if (!code) return null
  let kept: { verifier?: string; at?: number } = {}
  try {
    kept = JSON.parse(sessionStorage.getItem(KEY) ?? '{}')
  } catch {
    kept = {}
  }
  sessionStorage.removeItem(KEY)
  url.searchParams.delete('code')
  url.searchParams.delete('oauth')
  window.history.replaceState(null, '', url.toString())
  if (!kept.verifier || !kept.at || Date.now() - kept.at > 10 * 60_000) return null
  return { code, verifier: kept.verifier }
}
