/** The complete public example catalogue, with independently authored additions. */
import { EXAMPLES as COMPONENT_EXAMPLES, PAGE_EXAMPLES as COMPONENT_PAGES } from './component-examples';
import { TOC_EXAMPLES } from './toc-examples';
import { LIST_EXAMPLES } from './list-examples';
import type { ComponentExample } from './component-examples';
export * from './component-examples';
export const EXAMPLES: Record<string, ComponentExample> = { ...COMPONENT_EXAMPLES, ...TOC_EXAMPLES, ...LIST_EXAMPLES };
export const PAGE_EXAMPLES: Record<string, string[]> = { ...COMPONENT_PAGES, '3-unit/list': [...(COMPONENT_PAGES['3-unit/list'] ?? []), 'list-records'], '3-unit/table-of-contents': ['table-of-contents'] };
