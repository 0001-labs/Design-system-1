/**
 * What a person types into a number field, read as arithmetic: `12`, `10 + 5`, `(3 − 1) × 4`,
 * and an operator first (`*2`, `/2`, `+10`, `×1.5`) applied to the current value. A leading minus
 * is a negative number, never "take away". The minus sign, × and ÷ count as -, * and /; a unit
 * written after the figures (`12px`, `50 %`) is ignored. `null` when it is not arithmetic.
 */
export function readNumberExpression(text: string, current = 0): number | null {
  let source = text.trim().replace(/[−–]/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/,/g, ".");
  source = source.replace(/\s*[a-z%°]+\s*$/i, "");
  if (!source) return null;
  if (/^[+*/]/.test(source)) source = `${current}${source}`;
  let at = 0;
  const peek = () => source[at];
  const skip = () => { while (source[at] === " ") at++; };
  function primary(): number {
    skip();
    if (peek() === "(") { at++; const value = sum(); skip(); if (peek() !== ")") throw 0; at++; return value; }
    if (peek() === "-") { at++; return -primary(); }
    if (peek() === "+") { at++; return primary(); }
    const match = /^(\d+\.?\d*|\.\d+)/.exec(source.slice(at));
    if (!match) throw 0;
    at += match[0].length;
    return Number(match[0]);
  }
  function product(): number {
    let value = primary();
    for (skip(); peek() === "*" || peek() === "/"; skip()) {
      const op = source[at++];
      const right = primary();
      value = op === "*" ? value * right : value / right;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    for (skip(); peek() === "+" || peek() === "-"; skip()) {
      const op = source[at++];
      const right = product();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }
  try {
    const value = sum();
    skip();
    return at === source.length && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** The decimals a step implies: 1 → 0, 0.05 → 2. */
export function stepPlaces(step: number): number {
  const text = String(step);
  if (/e-(\d+)$/.test(text)) return Number(/e-(\d+)$/.exec(text)![1]);
  return text.includes(".") ? text.split(".")[1].length : 0;
}

/** A value as the field writes it: no trailing zeros, the minus sign rather than a hyphen. */
export function formatNumberValue(value: number, places: number): string {
  const fixed = value.toFixed(places);
  const trimmed = fixed.includes(".") ? fixed.replace(/\.?0+$/, "") : fixed;
  return trimmed === "-0" ? "0" : trimmed.replace("-", "−");
}
