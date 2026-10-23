import type { FlagDefinitions } from './feature-flags-runtime/index';

export const FEATURE_FLAGS: FlagDefinitions = {
  'consistency-component-routing': {
    label: 'Component routing',
    description: 'Use bounded decisions for existing components in the private editor. Other requests use the writing model.',
    defaultEnabled: false,
  },
};
