import { readFileSync } from 'node:fs';
import { expect, test } from 'vite-plus/test';

// A product that loads only the component tokens, not one.css, must still see a banner with a height and a fill.
test('the banner reads the component tokens before one.css names', () => {
  const css = readFileSync(new URL('../DS1/2-core/styles/ds-banner.css', import.meta.url), 'utf8');
  for (const bare of ['unit', 'yellow', 'black', 'slate', 'typeface-regular']) {
    const uses = [...css.matchAll(new RegExp(`var\\(--${bare}[,)]`, 'g'))];
    expect(uses.length, `--${bare} is used`).toBeGreaterThan(0);
    for (const use of uses) {
      const before = css.slice(Math.max(0, use.index! - 60), use.index!);
      expect(before, `--${bare} at ${use.index} is not a fallback of a --ds- token`).toMatch(new RegExp(`var\\(--ds-${bare}, (calc\\()?$`));
    }
  }
});
