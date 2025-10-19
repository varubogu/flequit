# Internationalization System Design

## Overview

The Flequit application's internationalization (i18n) system uses Inlang Paraglide's `reactiveMessage` system to achieve real-time language switching. All UI text is multilingual, and changes are reflected immediately after language selection in settings.

## System Configuration

### Basic Settings

- **Inlang Paraglide**: Translation management framework (`project.inlang/` configuration)
- **Supported Languages**: English (base), Japanese
- **Configuration File**: `project.inlang/settings.json`
- **Auto-generation**: Translation files auto-generated with `bun run build`
- **Reactive Support**: Instant language switching without reload

### Directory Structure

```
project.inlang/
├── settings.json           # Inlang configuration file
└── messages/
    ├── en.json             # English messages
    └── ja.json             # Japanese messages

src/paraglide/              # Auto-generated (excluded from Git)
├── messages/
│   ├── index.ts
│   ├── en.ts
│   └── ja.ts
└── runtime.ts

src/lib/stores/
├── index.ts               # Aggregated store exports (including locale store)
└── locale.svelte.ts        # Language state management
```

## Usage

### 1. Basic Translation Message Usage

```typescript
// 1. Import messages
import * as m from '$paraglide/messages';
import { reactiveMessage } from '$lib/stores/locale.svelte';

// 2. Create reactive messages
const msg_task_title = reactiveMessage(m.task_title());
const msg_save_button = reactiveMessage(m.save_button());
```

```svelte
<!-- 3. Use in components -->
<script lang="ts">
  import * as m from '$paraglide/messages';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  const msg_task_title = reactiveMessage(m.task_title());
  const msg_save_button = reactiveMessage(m.save_button());
</script>

<h1>{$msg_task_title}</h1>
<button>{$msg_save_button}</button>
```

### 2. Parameterized Messages

```json
// messages/en.json
{
  "welcome_user": "Welcome, {username}!",
  "task_count": "You have {count} {count, plural, one {task} other {tasks}} remaining"
}

// messages/ja.json
{
  "welcome_user": "ようこそ、{username}さん！",
  "task_count": "{count}個のタスクが残っています"
}
```

```typescript
// Using parameterized messages
const msg_welcome = reactiveMessage(() =>
  m.welcome_user({ username: user.displayName })
);

const msg_task_count = reactiveMessage(() =>
  m.task_count({ count: remainingTasks.length })
);
```

### 3. Complex Translation Patterns

```typescript
// Conditional translations
const getStatusMessage = (status: TaskStatus) =>
  reactiveMessage(() => {
    switch (status) {
      case 'todo': return m.status_todo();
      case 'in_progress': return m.status_in_progress();
      case 'completed': return m.status_completed();
      default: return m.status_unknown();
    }
  });

// Numeric format translations
const msg_progress = reactiveMessage(() =>
  m.progress_percentage({
    percentage: Math.round(progress * 100)
  })
);
```

## Locale Management System

### locale.svelte.ts Implementation

```typescript
// src/lib/stores/locale.svelte.ts
import { availableLanguageTags, languageTag } from '$paraglide/runtime';
import type { AvailableLanguageTag } from '$paraglide/runtime';

class LocaleStore {
  private _currentLocale = $state<AvailableLanguageTag>(languageTag());

  get currentLocale() {
    return this._currentLocale;
  }

  get availableLocales() {
    return availableLanguageTags;
  }

  get currentLocaleName() {
    const localeNames = {
      en: 'English',
      ja: '日本語'
    };
    return localeNames[this._currentLocale] || this._currentLocale;
  }

  setLocale(locale: AvailableLanguageTag) {
    this._currentLocale = locale;
    // Save to local storage
    localStorage.setItem('preferred-language', locale);
    // Update HTML lang attribute
    document.documentElement.lang = locale;
  }

  // Load saved language setting
  loadSavedLocale() {
    const saved = localStorage.getItem('preferred-language') as AvailableLanguageTag;
    if (saved && availableLanguageTags.includes(saved)) {
      this.setLocale(saved);
    }
  }
}

export const localeStore = new LocaleStore();

// Reactive message helper
export function reactiveMessage<T extends (...args: any[]) => string>(
  messageFunction: T
): { subscribe: (callback: (value: string) => void) => () => void } {
  let currentValue = messageFunction();
  const subscribers = new Set<(value: string) => void>();

  // Monitor language changes
  $effect(() => {
    const newValue = messageFunction();
    if (newValue !== currentValue) {
      currentValue = newValue;
      subscribers.forEach(callback => callback(newValue));
    }
  });

  return {
    subscribe: (callback: (value: string) => void) => {
      subscribers.add(callback);
      callback(currentValue); // Send initial value immediately

      return () => {
        subscribers.delete(callback);
      };
    }
  };
}
```

### Language Switcher Component

```svelte
<!-- components/language-selector.svelte -->
<script lang="ts">
  import { localeStore } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  const msg_language_label = reactiveMessage(m.language_label());

  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' }
  ];
</script>

<div class="language-selector">
  <label for="language-select">{$msg_language_label}</label>
  <select
    id="language-select"
    bind:value={localeStore.currentLocale}
    onchange={(e) => localeStore.setLocale(e.target.value)}
  >
    {#each languageOptions as option (option.code)}
      <option value={option.code}>
        {option.name}
      </option>
    {/each}
  </select>
</div>
```

## Testing Considerations

### Vitest Unit Test Mocking

```typescript
// tests/vitest.setup.ts
import { vi } from 'vitest';

// Mock translation system
vi.mock('$paraglide/messages', () => ({
  task_title: () => 'Task Title',
  save_button: () => 'Save',
  welcome_user: ({ username }: { username: string }) => `Welcome, ${username}!`,
  // Add necessary messages
}));

vi.mock('$lib/stores/locale.svelte', () => ({
  localeStore: {
    currentLocale: 'en',
    setLocale: vi.fn()
  },
  reactiveMessage: (fn: Function) => ({
    subscribe: (callback: Function) => {
      callback(fn());
      return () => {};
    }
  })
}));
```

### Test File Example

```typescript
// tests/components/task-item.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TaskItem from '$lib/components/task-item.svelte';

describe('TaskItem', () => {
  it('renders task title with proper translation', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      status: 'todo'
    };

    render(TaskItem, { task });

    // Verify translated text is displayed
    expect(screen.getByText('Task Title')).toBeInTheDocument();
  });
});
```

## Message Management Best Practices

### 1. Message Key Naming Conventions

```json
{
  "button_save": "Save",
  "button_cancel": "Cancel",
  "label_task_title": "Task Title",
  "error_network_failed": "Network request failed",
  "status_todo": "To Do",
  "status_in_progress": "In Progress",
  "status_completed": "Completed",
  "placeholder_search_tasks": "Search tasks...",
  "tooltip_add_task": "Add new task"
}
```

### 2. Component-level Message Management

```typescript
// components/task-form.svelte
<script lang="ts">
  import * as m from '$paraglide/messages';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  // Define messages used in this component
  const messages = {
    title: reactiveMessage(m.label_task_title()),
    description: reactiveMessage(m.label_task_description()),
    save: reactiveMessage(m.button_save()),
    cancel: reactiveMessage(m.button_cancel()),
    placeholder_title: reactiveMessage(m.placeholder_task_title()),
    error_required: reactiveMessage(m.error_field_required())
  };
</script>

<form>
  <label for="title">{$messages.title}</label>
  <input
    id="title"
    placeholder={$messages.placeholder_title}
    required
  />

  <label for="description">{$messages.description}</label>
  <textarea id="description"></textarea>

  <div class="actions">
    <button type="button">{$messages.cancel}</button>
    <button type="submit">{$messages.save}</button>
  </div>
</form>
```

### 3. Dynamic Message Processing

```typescript
// Generate messages dynamically
const getTaskStatusMessage = (task: Task) =>
  reactiveMessage(() => {
    const params = {
      taskName: task.title,
      assignee: task.assignee?.name || 'Unassigned'
    };

    switch (task.status) {
      case 'completed':
        return m.task_completed_message(params);
      case 'in_progress':
        return m.task_in_progress_message(params);
      default:
        return m.task_todo_message(params);
    }
  });
```

## Performance Considerations

### 1. Message Preloading

```typescript
// app.svelte - Application startup
<script lang="ts">
  import { localeStore } from '$lib/stores/locale.svelte';

  // Restore saved language setting
  $effect(() => {
    localeStore.loadSavedLocale();
  });
</script>
```

### 2. Efficient Management of Large Messages

```typescript
// Make only frequently used messages reactive
const commonMessages = {
  save: reactiveMessage(m.button_save()),
  cancel: reactiveMessage(m.button_cancel()),
  loading: reactiveMessage(m.status_loading())
};

// Create specific messages only when needed
const getSpecificMessage = (key: string) =>
  reactiveMessage(() => m[key]());
```

This system enables building a user-friendly and maintainable multilingual application.
