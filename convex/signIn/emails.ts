/** The email that carries a sign-in code: plain, named after the product, readable without pictures. */
export function signInCodeEmail({ product, code, minutes = 10 }: { product: string; code: string; minutes?: number }) {
  if (!/^\d{6}$/.test(code)) throw new Error('Invalid sign-in code')
  const subject = `Your ${product} sign-in code`
  const text = `${product}\n\nYour sign-in code is ${code}.\n\nEnter it in ${product} to sign in. The code expires in ${minutes} minutes and can only be used once.\n\nIf you did not ask for it, you can ignore this email.`
  const escape = (value: string) => value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)
  const type = 'font-family:-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;color:#000'
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(subject)}</title></head><body style="margin:0;padding:40px 20px;background:#fff">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:400px;margin:0 auto">
<tr><td style="${type};padding:0 0 40px">${escape(product)}</td></tr>
<tr><td style="${type};padding:0 0 20px">Your sign-in code is</td></tr>
<tr><td style="${type};font-size:28px;line-height:40px;letter-spacing:4px;padding:0 0 20px">${code}</td></tr>
<tr><td style="${type};padding:0 0 20px">Enter it in ${escape(product)} to sign in. The code expires in ${minutes} minutes and can only be used once.</td></tr>
<tr><td style="${type};color:#777">If you did not ask for it, you can ignore this email.</td></tr>
</table></body></html>`
  return { subject, text, html }
}
