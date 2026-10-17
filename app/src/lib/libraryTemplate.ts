import componentTokens from '../../../DS1/1-root/component-tokens.css?raw';
import componentMetrics from '../../../DS1/1-root/component-metrics.css?raw';
import { LIBRARY_REVISION } from '../../../DS1/1-root/library-tokens';
import { version } from '../../../package.json';

/**
 * A new library's first line: the DS1 version its template comes from and the library revision
 * (DS1/1-root/library-tokens.ts) its publishing is prepared by, `<version>+sha256:<12 hex>`.
 */
export const templateStamp = `/* DS1 — version ${version}+${LIBRARY_REVISION} */`;

/** What a new library starts as: DS1's component tokens and measures, under the stamp. */
export const libraryTemplate = `${templateStamp}\n/* Design system 1 component library */\n${componentMetrics}\n${componentTokens.replace(/^@import[^;]+;\s*/gm, '')}`;

/**
 * The template a library was created from, as each library keeps it (templateVersion), so a later
 * DS1 cannot silently change what "new library" meant, and a bad template can be traced to the
 * libraries made from it. Libraries made before stamping read `components-1`.
 */
export function templateVersion(template = libraryTemplate): string {
  const stamped = /\/\* DS1 — version ([^*]+?) \*\//.exec(template);
  return stamped?.[1]?.trim() ?? 'components-1';
}
