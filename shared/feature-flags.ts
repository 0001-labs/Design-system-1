import type { FlagDefinitions } from './feature-flags-runtime/index';

export const FEATURE_FLAGS: FlagDefinitions = {
  'base-live-editing': {
    label: 'Live base editing',
    description: 'The owner edits the base system on designsystem1.com; each save is live in products that link /ds1/base/latest.css.',
    defaultEnabled: false,
  },
  'consistency-component-routing': {
    label: 'Component routing',
    description: 'Use bounded decisions for existing components in the private editor. Other requests use the writing model.',
    defaultEnabled: false,
  },
};
