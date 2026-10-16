---
title: Preferences
description: User preference management for theme and language settings
---

The preferences module provides utilities for storing and managing user preferences.

## Overview

Design system 1 stores user preferences in localStorage to persist settings across sessions.

## Basic Usage

```javascript
import { savePreferences } from 'design-system-1';

// Save user preferences
savePreferences({
  language: 'ja',
  theme: 'dark'
});
```

## Preference Types

### Language

```javascript
import { savePreferences } from 'design-system-1';

savePreferences({
  language: 'en-US' // or 'ja', 'zh-Hant', etc.
});
```

### Theme

```javascript
savePreferences({
  theme: 'dark' // or 'light' or 'system'
});
```

### Custom Preferences

```javascript
savePreferences({
  customSetting: 'value',
  anotherSetting: 123
});
```

## Storage

Preferences are stored in localStorage under the key `ds-one:preferences`:

```javascript
// Storage structure
{
  "language": "en-US",
  "theme": "light",
  "customSetting": "value"
}
```

## Type Definition

```typescript
type Preferences = {
  language?: LanguageCode;
  theme?: ThemeType;
  [key: string]: unknown;
};
```

## Error Handling

The module handles storage errors gracefully:

```javascript
import { savePreferences } from 'design-system-1';

// Won't throw if localStorage is unavailable
savePreferences({ theme: 'dark' });
// Logs warning if storage fails
```

## Integration

Preferences integrate with other Design system 1 modules:

### With Theme

```javascript
import { setTheme, savePreferences } from 'design-system-1';

function updateTheme(theme) {
  setTheme(theme);
  savePreferences({ theme });
}
```

### With i18n

```javascript
import { setLanguage, savePreferences } from 'design-system-1';

function updateLanguage(lang) {
  setLanguage(lang);
  savePreferences({ language: lang });
}
```

## Best Practices

1. **Merge preferences** - Use spread operator to preserve existing settings
2. **Handle errors** - Storage might be unavailable in private browsing
3. **Validate values** - Ensure preference values are valid before saving
