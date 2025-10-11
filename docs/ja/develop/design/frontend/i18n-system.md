# 国際化システム設計

## 概要

Flequitアプリケーションの国際化（i18n）システムは、Inlang Paraglidecollector`reactiveMessage`システムを使用してリアルタイムでの言語切り替えを実現します。全てのUIテキストは多言語対応を行い、設定画面での言語選択後は即時反映されます。

## システム構成

### 基本設定

- **Inlang Paraglide**: 翻訳管理フレームワーク（`project.inlang/`設定）
- **対応言語**: 英語（ベース）、日本語
- **設定ファイル**: `project.inlang/settings.json`
- **自動生成**: `bun run build`で翻訳ファイル自動生成
- **リアクティブ対応**: リロード不要で即時言語切り替え

### ディレクトリ構造

```
project.inlang/
├── settings.json           # Inlang設定ファイル
└── messages/
    ├── en.json             # 英語メッセージ
    └── ja.json             # 日本語メッセージ

src/paraglide/              # 自動生成（Git管理対象外）
├── messages/
│   ├── index.ts
│   ├── en.ts
│   └── ja.ts
└── runtime.ts

src/lib/stores/
└── locale.svelte.ts        # 言語状態管理
```

## 使用方法

### 1. 基本的な翻訳メッセージの使用

```typescript
// 1. メッセージのインポート
import * as m from '$paraglide/messages';
import { reactiveMessage } from '$lib/stores/locale.svelte';

// 2. リアクティブメッセージの作成
const msg_task_title = reactiveMessage(m.task_title());
const msg_save_button = reactiveMessage(m.save_button());
```

```svelte
<!-- 3. コンポーネントでの使用 -->
<script lang="ts">
  import * as m from '$paraglide/messages';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  
  const msg_task_title = reactiveMessage(m.task_title());
  const msg_save_button = reactiveMessage(m.save_button());
</script>

<h1>{$msg_task_title}</h1>
<button>{$msg_save_button}</button>
```

### 2. パラメーター付きメッセージ

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
// パラメーター付きメッセージの使用
const msg_welcome = reactiveMessage(() => 
  m.welcome_user({ username: user.displayName })
);

const msg_task_count = reactiveMessage(() => 
  m.task_count({ count: remainingTasks.length })
);
```

### 3. 複雑な翻訳パターン

```typescript
// 条件に基づく翻訳
const getStatusMessage = (status: TaskStatus) => 
  reactiveMessage(() => {
    switch (status) {
      case 'todo': return m.status_todo();
      case 'in_progress': return m.status_in_progress();
      case 'completed': return m.status_completed();
      default: return m.status_unknown();
    }
  });

// 数値フォーマット付き翻訳
const msg_progress = reactiveMessage(() => 
  m.progress_percentage({ 
    percentage: Math.round(progress * 100) 
  })
);
```

## ロケール管理システム

### locale.svelte.ts の実装

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
    // ローカルストレージに保存
    localStorage.setItem('preferred-language', locale);
    // HTMLのlang属性も更新
    document.documentElement.lang = locale;
  }
  
  // 保存された言語設定を読み込み
  loadSavedLocale() {
    const saved = localStorage.getItem('preferred-language') as AvailableLanguageTag;
    if (saved && availableLanguageTags.includes(saved)) {
      this.setLocale(saved);
    }
  }
}

export const localeStore = new LocaleStore();

// リアクティブメッセージヘルパー
export function reactiveMessage<T extends (...args: any[]) => string>(
  messageFunction: T
): { subscribe: (callback: (value: string) => void) => () => void } {
  let currentValue = messageFunction();
  const subscribers = new Set<(value: string) => void>();
  
  // 言語変更を監視
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
      callback(currentValue); // 初期値を即座に送信
      
      return () => {
        subscribers.delete(callback);
      };
    }
  };
}
```

### 言語切り替えコンポーネント

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

## テスト時の対応

### Vitest単体テストでのモック化

```typescript
// tests/vitest.setup.ts
import { vi } from 'vitest';

// 翻訳システムをモック化
vi.mock('$paraglide/messages', () => ({
  task_title: () => 'Task Title',
  save_button: () => 'Save',
  welcome_user: ({ username }: { username: string }) => `Welcome, ${username}!`,
  // 必要なメッセージを追加
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

### テストファイル例

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
    
    // 翻訳されたテキストが表示されることを確認
    expect(screen.getByText('Task Title')).toBeInTheDocument();
  });
});
```

## メッセージ管理のベストプラクティス

### 1. メッセージキーの命名規則

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

### 2. コンポーネントレベルでのメッセージ管理

```typescript
// components/task-form.svelte
<script lang="ts">
  import * as m from '$paraglide/messages';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  
  // このコンポーネントで使用するメッセージをまとめて定義
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

### 3. 動的メッセージの処理

```typescript
// 動的にメッセージを生成する場合
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

## パフォーマンス考慮事項

### 1. メッセージのプリロード

```typescript
// app.svelte - アプリケーション起動時
<script lang="ts">
  import { localeStore } from '$lib/stores/locale.svelte';
  
  // 保存された言語設定を復元
  $effect(() => {
    localeStore.loadSavedLocale();
  });
</script>
```

### 2. 大量メッセージの効率的な管理

```typescript
// 頻繁に使用されるメッセージのみリアクティブ化
const commonMessages = {
  save: reactiveMessage(m.button_save()),
  cancel: reactiveMessage(m.button_cancel()),
  loading: reactiveMessage(m.status_loading())
};

// 使用頻度の低いメッセージは必要時のみ作成
const getSpecificMessage = (key: string) => 
  reactiveMessage(() => m[key]());
```

このシステムにより、ユーザーフレンドリーで保守性の高い多言語対応アプリケーションを実現できます。