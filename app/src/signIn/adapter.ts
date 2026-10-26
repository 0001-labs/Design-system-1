/**
 * A product's SignInAdapter from the two things it has anyway: Convex Auth's
 * `signIn` action (from `useAuthActions` in React, or `client.action(api.auth.signIn, …)`
 * elsewhere) and its two queries. The product wraps the result when it needs
 * more, such as refusing addresses outside an allowed list.
 */
import type { SignInAdapter, SignInAvailability, SocialSignIn } from './sign-in'

export type SignInAction = (provider: string, params: Record<string, unknown>) => Promise<unknown>

export function signInAdapter(input: {
  signIn: SignInAction
  providers: () => Promise<SignInAvailability>
  passwordSignIn: (email: string) => Promise<boolean>
  /** Where Google or Apple return to: a sign-in page the backend's redirect rules allow. */
  redirectTo: () => string
  /** Which of the backend's `brands` the code email goes out under, when the screen is not the product's own. */
  brand?: string
}): SignInAdapter {
  return {
    providers: input.providers,
    passwordSignIn: input.passwordSignIn,
    async requestCode(email) {
      await input.signIn('email-code', input.brand ? { email, brand: input.brand } : { email })
    },
    async signInWithCode(email, code) {
      await input.signIn('email-code', { email, code })
    },
    async signInWithPassword(email, password) {
      try {
        await input.signIn('password', { flow: 'signIn', email, password })
      } catch (problem) {
        // Convex Auth says "InvalidAccountId" (or, in some versions, "Invalid credentials") for a missing
        // account. A listed address without a password account yet gets one on its first sign-in; sign-up
        // fails for an address that already has one, so a wrong password creates nothing and is reported as it was.
        if (!(problem instanceof Error && /InvalidAccountId|Invalid credentials/i.test(problem.message))) throw problem
        try {
          await input.signIn('password', { flow: 'signUp', email, password })
        } catch {
          throw problem
        }
      }
    },
    async signInWith(provider: SocialSignIn) {
      await input.signIn(provider, { redirectTo: input.redirectTo() })
    },
  }
}
