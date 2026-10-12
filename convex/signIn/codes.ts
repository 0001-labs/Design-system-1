/** A six-digit code drawn without bias: values past the largest multiple of a million are drawn again. */
export function sixDigitCode(random: (bytes: Uint32Array<ArrayBuffer>) => void = (bytes) => crypto.getRandomValues(bytes)): string {
  const bytes = new Uint32Array(new ArrayBuffer(4))
  do random(bytes)
  while (bytes[0] >= 4_294_000_000)
  return String(bytes[0] % 1_000_000).padStart(6, '0')
}
