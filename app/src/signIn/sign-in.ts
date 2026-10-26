/**
 * The sign-in screen every product shows: `<sign-in-screen>`, two steps. The
 * email first; then the way in: the code sent to it, or the password where the
 * address keeps one, with Google and Apple beside the first step when the
 * backend says they are on. The element draws and asks; the product's adapter
 * talks to its own Convex deployment and keeps the session.
 *
 *   import { defineSignInScreen } from './sign-in/sign-in'
 *   defineSignInScreen()
 *   const screen = document.createElement('sign-in-screen') as SignInScreen
 *   screen.adapter = { … }
 *   screen.addEventListener('signed-in', () => …)
 *
 * No shadow root: the product's typeface and Design system 1 tokens apply, with
 * `sign-in.css` loaded beside it.
 */
export type SocialSignIn = 'google' | 'apple'

/** What the backend's `providers` query answers (`convex/signIn/social.ts`); repeated here so the screen's copy stands alone in a product. */
export type SignInAvailability = { google: boolean; apple: boolean; newAccounts: boolean; code: boolean }

export type SignInAdapter = {
  /** The backend's `providers` query. */
  providers(): Promise<SignInAvailability>
  /** The backend's `passwordSignIn` query: whether this address signs in with a password. */
  passwordSignIn(email: string): Promise<boolean>
  /** Provider `email-code` with `{ email }`. */
  requestCode(email: string): Promise<void>
  /** Provider `email-code` with `{ email, code }`; resolves once the product holds the session. */
  signInWithCode(email: string, code: string): Promise<void>
  /** Provider `password`, flow `signIn`; resolves once the product holds the session. */
  signInWithPassword(email: string, password: string): Promise<void>
  /** Starts Google or Apple: the page leaves for the provider. */
  signInWith(provider: SocialSignIn): Promise<void>
}

/** Every word on the screen, so a product can translate them. */
export type SignInWords = typeof ENGLISH
export const ENGLISH = {
  enterEmail: 'Enter your email',
  email: 'Email',
  continue: 'Continue',
  enterCode: 'Enter the code we sent to {email}',
  code: 'Code',
  enterPassword: 'Enter your password',
  password: 'Password',
  signIn: 'Sign in',
  sendAgain: 'Send the code again',
  anotherEmail: 'Use another email',
  google: 'Continue with Google',
  apple: 'Continue with Apple',
  invalidEmail: 'Enter a valid email.',
  invalidCode: 'The code is six digits.',
  failed: 'Sign-in did not go through. Try again.',
  codeUnavailable: 'Sign-in by email is not ready here yet.',
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function element<K extends keyof HTMLElementTagNameMap>(tag: K, attributes: Record<string, string | boolean> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  for (const [name, value] of Object.entries(attributes)) {
    if (value === false) continue
    node.setAttribute(name, value === true ? '' : value)
  }
  node.append(...children)
  return node
}

/**
 * Cut words fade over their last square, never an ellipsis: an element whose
 * words are wider than it is marked `data-cut="end"` and sign-in.css fades it
 * then; words that fit stay crisp. Measured here, the same way as Design
 * system 1's cut-fade module, since the screen stands alone in a product.
 */
function markCut(node: Element) {
  if (node.scrollWidth > node.clientWidth + 1) {
    if (node.getAttribute('data-cut') !== 'end') node.setAttribute('data-cut', 'end')
  } else if (node.hasAttribute('data-cut')) node.removeAttribute('data-cut')
}

export class SignInScreen extends HTMLElement {
  private backend: SignInAdapter | null = null
  /** The product's way to the backend. Set before or after the element is on the page: the providers are asked once both hold. */
  get adapter(): SignInAdapter | null {
    return this.backend
  }
  set adapter(adapter: SignInAdapter | null) {
    this.backend = adapter
    if (adapter && this.isConnected) void this.loadProviders()
  }
  words: SignInWords = ENGLISH
  /** The way in after the email, once decided. */
  private way: 'code' | 'password' | null = null
  private email = ''
  private busy = false
  private available: SignInAvailability | null = null
  private readonly emailInput = element('input', { id: 'sign-in-email', name: 'email', type: 'email', autocomplete: 'username', required: true, maxlength: '254', enterkeyhint: 'next' })
  private readonly secretInput = element('input', { id: 'sign-in-secret', name: 'secret', type: 'text', required: true, maxlength: '256', enterkeyhint: 'go' })
  private readonly emailLabel = element('label', { for: 'sign-in-email' })
  private readonly secretLabel = element('label', { for: 'sign-in-secret' })
  private readonly continueButton = element('button', { type: 'button' })
  private readonly signInButton = element('button', { type: 'submit' })
  private readonly sendAgainButton = element('button', { type: 'button' })
  private readonly anotherEmailButton = element('button', { type: 'button' })
  private readonly googleButton = element('button', { type: 'button' })
  private readonly appleButton = element('button', { type: 'button' })
  private readonly error = element('p', { class: 'sign-in-error', role: 'alert', hidden: true })
  private readonly emailStep = element('div', { class: 'sign-in-step' })
  private readonly secretStep = element('div', { class: 'sign-in-step', hidden: true })
  private readonly providers = element('div', { class: 'sign-in-providers', hidden: true })
  private readonly googleRow = element('div', { class: 'sign-in-row', hidden: true })
  private readonly appleRow = element('div', { class: 'sign-in-row', hidden: true })
  private rendered = false
  /** Measures the labels and the error when their box changes; `measureCuts()` measures them when their words do. */
  private cuts: ResizeObserver | null = null

  connectedCallback() {
    if (!this.rendered) this.render()
    if (!this.cuts && typeof ResizeObserver !== 'undefined') {
      const cuts = new ResizeObserver((entries) => { for (const entry of entries) markCut(entry.target) })
      for (const node of this.cutWords()) cuts.observe(node)
      this.cuts = cuts
    }
    // Words drawn in a fallback face are narrower or wider once the page's fonts arrive.
    document.fonts?.ready.then(() => this.measureCuts(), () => {})
    void this.loadProviders()
  }

  disconnectedCallback() {
    this.cuts?.disconnect()
    this.cuts = null
  }

  private cutWords(): Element[] {
    return [this.emailLabel, this.secretLabel, this.error]
  }

  private measureCuts() {
    for (const node of this.cutWords()) markCut(node)
  }

  private render() {
    this.rendered = true
    this.emailStep.append(this.emailLabel, element('div', { class: 'sign-in-row' }, this.emailInput, this.continueButton))
    this.secretStep.append(this.secretLabel, element('div', { class: 'sign-in-row' }, this.secretInput, this.signInButton), element('div', { class: 'sign-in-small' }, this.sendAgainButton, this.anotherEmailButton))
    this.googleRow.append(this.googleButton)
    this.appleRow.append(this.appleButton)
    this.providers.append(this.googleRow, this.appleRow)
    const form = element('form', { novalidate: true }, this.emailStep, this.secretStep, this.error, this.providers)
    this.append(form)
    this.applyWords()
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      void (this.way ? this.finish() : this.continue())
    })
    this.emailInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        void this.continue()
      }
    })
    this.continueButton.addEventListener('click', () => void this.continue())
    this.sendAgainButton.addEventListener('click', () => void this.sendCode())
    this.anotherEmailButton.addEventListener('click', () => this.reset())
    this.googleButton.addEventListener('click', () => void this.social('google'))
    this.appleButton.addEventListener('click', () => void this.social('apple'))
  }

  /** Call after changing `words`. */
  applyWords() {
    const w = this.words
    this.emailLabel.textContent = w.enterEmail
    this.emailInput.placeholder = w.email
    this.continueButton.textContent = w.continue
    this.signInButton.textContent = w.signIn
    this.sendAgainButton.textContent = w.sendAgain
    this.anotherEmailButton.textContent = w.anotherEmail
    this.googleButton.textContent = w.google
    this.appleButton.textContent = w.apple
    this.showWay()
  }

  private showWay() {
    const w = this.words
    if (this.way === 'password') {
      this.secretLabel.textContent = w.enterPassword
      this.secretInput.placeholder = w.password
      this.secretInput.type = 'password'
      this.secretInput.autocomplete = 'current-password'
      this.secretInput.removeAttribute('inputmode')
      this.secretInput.removeAttribute('pattern')
      this.sendAgainButton.hidden = true
    } else if (this.way === 'code') {
      this.secretLabel.textContent = w.enterCode.replace('{email}', this.email)
      this.secretInput.placeholder = w.code
      this.secretInput.type = 'text'
      this.secretInput.autocomplete = 'one-time-code'
      this.secretInput.inputMode = 'numeric'
      this.secretInput.setAttribute('pattern', '[0-9]*')
      this.sendAgainButton.hidden = false
    }
    this.measureCuts()
  }

  private async loadProviders() {
    if (!this.adapter) return
    try {
      const available = await this.adapter.providers()
      this.available = available
      this.googleRow.hidden = !available.google
      this.appleRow.hidden = !available.apple
      this.providers.hidden = !(available.google || available.apple)
    } catch {
      this.providers.hidden = true
    }
  }

  private setBusy(busy: boolean) {
    this.busy = busy
    for (const button of [this.continueButton, this.signInButton, this.sendAgainButton, this.googleButton, this.appleButton]) button.disabled = busy
  }

  private fail(message: string) {
    this.error.textContent = message
    this.error.hidden = false
    markCut(this.error)
  }

  private clearError() {
    this.error.textContent = ''
    this.error.hidden = true
  }

  private async continue() {
    if (this.busy || !this.adapter) return
    this.clearError()
    const email = this.emailInput.value.trim().toLowerCase()
    if (!EMAIL_SHAPE.test(email)) return this.fail(this.words.invalidEmail)
    this.email = email
    this.setBusy(true)
    try {
      this.way = (await this.adapter.passwordSignIn(email)) ? 'password' : 'code'
      if (this.way === 'code' && this.available && !this.available.code) throw new Error(this.words.codeUnavailable)
      if (this.way === 'code') await this.adapter.requestCode(email)
      this.showWay()
      this.emailStep.hidden = true
      this.providers.hidden = true
      this.secretStep.hidden = false
      this.secretInput.value = ''
      this.secretInput.focus()
    } catch (problem) {
      this.way = null
      this.fail(problem instanceof Error && problem.message ? problem.message : this.words.failed)
    } finally {
      this.setBusy(false)
    }
  }

  private async sendCode() {
    if (this.busy || !this.adapter || this.way !== 'code') return
    this.clearError()
    this.setBusy(true)
    try {
      await this.adapter.requestCode(this.email)
      this.secretInput.focus()
    } catch (problem) {
      this.fail(problem instanceof Error && problem.message ? problem.message : this.words.failed)
    } finally {
      this.setBusy(false)
    }
  }

  private async finish() {
    if (this.busy || !this.adapter || !this.way) return
    this.clearError()
    const secret = this.secretInput.value.trim()
    if (this.way === 'code' && !/^\d{6}$/.test(secret)) return this.fail(this.words.invalidCode)
    if (!secret) return
    this.setBusy(true)
    try {
      if (this.way === 'code') await this.adapter.signInWithCode(this.email, secret)
      else await this.adapter.signInWithPassword(this.email, secret)
      this.dispatchEvent(new CustomEvent('signed-in', { detail: { email: this.email, way: this.way }, bubbles: true }))
    } catch (problem) {
      this.fail(problem instanceof Error && problem.message ? problem.message : this.words.failed)
      this.secretInput.select()
    } finally {
      this.setBusy(false)
    }
  }

  private async social(provider: SocialSignIn) {
    if (this.busy || !this.adapter) return
    this.clearError()
    this.setBusy(true)
    try {
      await this.adapter.signInWith(provider)
    } catch (problem) {
      this.fail(problem instanceof Error && problem.message ? problem.message : this.words.failed)
      this.setBusy(false)
    }
  }

  /** Back to the email, keeping what was typed. */
  reset() {
    this.way = null
    this.clearError()
    this.secretStep.hidden = true
    this.emailStep.hidden = false
    void this.loadProviders()
    this.emailInput.focus()
  }
}

export function defineSignInScreen(tag = 'sign-in-screen') {
  if (!customElements.get(tag)) customElements.define(tag, SignInScreen)
}

declare global {
  interface HTMLElementTagNameMap {
    'sign-in-screen': SignInScreen
  }
}
