# フロントエンド レイヤーアーキテクチャ

## 概要

フロントエンドは**Infrastructure層**と**Application層**に明確に分離されています。
この分離により、以下を実現します：

- バックエンド実装（Tauri/Web/Cloud等）の切り替えが容易
- コンポーネントからの誤った直接アクセスを防止
- 新しいバックエンドの追加が簡単
- テスタビリティの向上

## ディレクトリ構造

```
src/lib/
├── infrastructure/              ← インフラ層（直接呼び出し禁止）
│   └── backends/
│       ├── index.ts            (BackendService選択ロジック)
│       ├── tauri/              (Tauri実装)
│       │   ├── project.ts
│       │   ├── task.ts
│       │   ├── subtask.ts
│       │   └── ...
│       ├── web/                (Web/Supabase実装)
│       │   ├── project.ts
│       │   ├── task.ts
│       │   └── ...
│       └── (future) cloud/     (将来: クラウド同期実装など)
│
└── services/                    ← アプリケーション層（コンポーネントから使用OK）
    ├── domain/                 (単一エンティティ操作)
    │   ├── project.ts
    │   ├── tasklist.ts
    │   ├── task.ts
    │   ├── subtask.ts
    │   ├── tag.ts
    │   └── settings.ts
    │
    ├── composite/              (横断的操作)
    │   ├── project-composite.ts
    │   ├── task-composite.ts
    │   └── recurrence-composite.ts
    │
    ├── ui/                     (UI状態管理のみ)
    │   ├── task-detail.ts
    │   ├── view.ts
    │   └── layout.ts
    │
    └── index.ts                (公開API定義)
```

## 各層の責務

### Stores層 (`stores/*.svelte.ts`)

**責務**:
- Svelteのrunes（`$state`, `$derived`）を使用したリアクティブ状態管理
- アプリケーション全体のグローバル状態保持
- UIの表示に必要なデータの計算・提供

**特徴**:
- `.svelte.ts`拡張子（Svelte runesを使用するため必須）
- 永続化はdata-serviceまたはsettingsInitServiceに委譲
- ビジネスロジックは持たない（domain servicesに委譲）

**依存ルール**:
- ✅ **data-service（infrastructure）を参照OK**
  - 例: `dataService.createProject()`, `dataService.updateTask()`
- ✅ **settingsInitServiceを参照OK**
  - 例: 設定の初期化・取得
- ❌ **domain/ui/composite servicesを参照禁止**
  - 理由: 循環依存を防ぐため
- ❌ **他のstoresへの相互参照は最小限**
  - 必要な場合は依存方向を明確化

**例**:
```typescript
// stores/tasks.svelte.ts
import { dataService } from '$lib/services/data-service';

class TaskStore {
  tasks = $state<Task[]>([]);

  async addTask(taskData: Task) {
    // ✅ data-serviceで永続化
    const newTask = await dataService.createTask(projectId, taskData);

    // ✅ ローカル状態更新
    this.tasks.push(newTask);
  }
}

export const taskStore = new TaskStore();
```

---

### Infrastructure層 (`infrastructure/backends/`)

**責務**:
- バックエンド通信の**実装**を提供
- Tauri/Web/Cloud等の環境差異を吸収
- データの永続化・取得

**特徴**:
- インターフェース定義 + 実装
- 環境ごとにフォルダ分け（`tauri/`, `web/`, `cloud/`等）
- `index.ts` で環境に応じたBackendServiceを選択

**アクセス制限**:
- ❌ **コンポーネントから直接呼び出し禁止**
- ❌ **Storeから直接呼び出し禁止**
- ✅ **Services層からのみアクセス可能**

---

### data-service (`services/data-service.ts`)

**特別な位置づけ**:
- Infrastructure層とStores層の橋渡し役
- `infrastructure/backends/`への唯一のアクセスポイント
- 実質的にInfrastructure層の一部として扱う

**責務**:
- BackendServiceの取得・初期化
- 各バックエンド操作のシンプルなラッパー
- データ永続化の統一インターフェース提供

**依存ルール**:
- ✅ **infrastructure/backends を参照OK**
  - `getBackendService()`経由でバックエンド取得
- ❌ **stores を参照禁止**（厳守）
  - 理由: Infrastructure層はStoresに依存してはいけない
  - 必要なIDはパラメータとして受け取る
- ❌ **domain/ui/composite services を参照禁止**
  - 理由: 循環依存を防ぐため

**例**:
```typescript
// services/data-service.ts
import { getBackendService } from '$lib/infrastructure/backends';

class DataService {
  private async getBackend() {
    return await getBackendService();
  }

  // ✅ 正しい: projectIdをパラメータで受け取る
  async createTag(projectId: string, tagData: TagData): Promise<Tag> {
    const backend = await this.getBackend();
    return await backend.tag.create(projectId, tagData);
  }

  // ❌ 間違い: storeから取得
  // async createTag(tagData: TagData): Promise<Tag> {
  //   const { taskStore } = await import('$lib/stores/tasks.svelte');
  //   const projectId = taskStore.selectedProjectId; // NG!
  //   ...
  // }
}
```

**呼び出し元の責任**:
```typescript
// stores/tags.svelte.ts
import { taskStore } from './tasks.svelte';
import { dataService } from '$lib/services/data-service';

class TagStore {
  async addTag(tagData: TagData) {
    // ✅ storeがprojectIdを取得してdata-serviceに渡す
    const projectId = taskStore.selectedProjectId || '';
    const newTag = await dataService.createTag(projectId, tagData);
    this.tags.push(newTag);
  }
}
```

---

### Application層 - Domain Services (`services/domain/`)

**責務**:
- 単一エンティティのCRUD操作
- Infrastructure層（Backend）を使ってデータ永続化
- Storeを使ってUI状態の同期

**パターン**:
```typescript
// services/domain/task.ts
export class TaskService {
  static async updateTask(taskId: string, updates: Partial<Task>) {
    // 1. Backendで永続化
    const backend = await getBackendService();
    await backend.task.update(projectId, taskId, updates);

    // 2. Storeで状態更新
    taskStore.updateTask(taskId, updates);
  }
}
```

**依存ルール（Svelte 5特有）**:
- ✅ **コンポーネントから呼び出しOK**
- ✅ **Storeからデータ取得OK**
  - 理由: Svelte runesは`.svelte.ts`でのみ動作、状態はstoresに集中
  - 例: `taskStore.tasks`, `taskStore.selectedProjectId`
- ❌ **data-serviceを直接呼び出し禁止**
  - 理由: 永続化はstoresまたはProjectsService経由で行う
- ✅ **他のDomain Servicesを使用OK**
  - 例: TaskServiceからRecurrenceServiceを呼び出す

**注意事項**:
- Storesを参照するのは**読み取り専用**が基本
- Storeメソッドを呼ぶ場合は、単なるラッパーにならないよう注意
- ビジネスロジックがない場合はservice層に配置しない

---

### Application層 - Composite Services (`services/composite/`)

**責務**:
- 複数エンティティの協調操作
- トランザクション的な処理
- Domain Servicesを組み合わせて使用

**例**:
```typescript
// services/composite/task-composite.ts
export class TaskCompositeService {
  /**
   * タスクとサブタスクを一括作成
   */
  static async createTaskWithSubTasks(
    listId: string,
    task: Task,
    subTasks: SubTask[]
  ) {
    // Domain Servicesを組み合わせて使用
    const createdTask = await TaskService.createTask(listId, task);

    for (const subTask of subTasks) {
      await SubTaskService.createSubTask(createdTask.id, subTask);
    }

    return createdTask;
  }
}
```

**アクセス制限**:
- ✅ **コンポーネントから呼び出しOK**
- ✅ **Domain Servicesを使用OK**
- ❌ **Infrastructure層への直接アクセスは避ける**（Domain経由で行う）

---

### Application層 - UI Services (`services/ui/`)

**責務**:
- UI状態管理のみ（モバイルDrawer、選択状態等）
- バックエンド通信を行わない

**例**:
```typescript
// services/ui/task-detail.ts
export class TaskDetailService {
  static openTaskDetail(taskId: string) {
    TaskService.selectTask(taskId); // Domain Serviceを呼ぶのはOK

    if (isMobile) {
      this.openDrawer(); // UI状態の変更
    }
  }
}
```

**アクセス制限**:
- ✅ **コンポーネントから呼び出しOK**
- ✅ **Domain/Composite Servicesを使用OK**
- ❌ **Infrastructure層への直接アクセス禁止**

## レイヤー間の依存関係

```
┌─────────────────────────────────────────────┐
│ Components (Svelte)                         │
│ ✅ stores/* から読み取り                    │
│ ✅ services/* から import                   │
│ ❌ infrastructure/* から import 禁止         │
│ ❌ stores/* への直接書き込み禁止             │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ Stores Layer ($state管理)                   │
│ ├─ tasks.svelte.ts                          │
│ ├─ tags.svelte.ts                           │
│ ├─ settings.svelte.ts                       │
│ └─ view-store.svelte.ts                     │
│                                             │
│ ✅ data-service (infrastructure) を参照     │
│ ✅ settingsInitService を参照               │
│ ❌ domain/ui services を参照禁止            │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ Services Layer                              │
│ ├─ data-service.ts (infrastructure)         │
│ ├─ domain/      (単一エンティティ)          │
│ ├─ composite/   (横断操作)                  │
│ └─ ui/          (UI状態)                    │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ Infrastructure Layer                        │
│ └─ backends/                                │
│    ├─ tauri/    (Tauri実装)                │
│    ├─ web/      (Web実装)                  │
│    └─ cloud/    (将来: クラウド実装)        │
└─────────────────────────────────────────────┘
```

### 詳細な依存ルール

| From → To | Infrastructure | data-service | Domain | Composite | UI | Stores | Components |
|-----------|---------------|--------------|--------|-----------|-----|--------|------------|
| **Components** | ❌ 禁止 | ❌ 禁止 | ✅ OK | ✅ OK | ✅ OK | ✅ 読取のみ | ✅ OK |
| **Stores** | ✅ backends経由 | ✅ OK | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | - | - |
| **UI Services** | ❌ 禁止 | ❌ 禁止 | ✅ OK | ✅ OK | - | ✅ OK | - |
| **Composite Services** | ❌ 禁止 | ❌ 禁止 | ✅ OK | - | - | ⚠️ 避ける | - |
| **Domain Services** | ❌ 禁止 | ❌ 禁止 | ✅ OK | - | - | ✅ OK | - |
| **data-service** | ✅ OK | - | - | - | - | ❌ 禁止 | - |
| **Infrastructure** | - | - | - | - | - | - | - |

### 循環依存防止ルール

**🔴 絶対禁止（循環依存リスク）**:
- ❌ `stores` → `domain/ui/composite services`
- ❌ `data-service` → `stores`
- ❌ `data-service` → `domain/ui/composite services`

**🟡 Svelte 5特有の許容パターン**:
- ✅ `domain/ui services` → `stores` (Svelte runesの制約上許容)
  - 理由: `$state`は`.svelte.ts`でのみ動作するため、状態はstoresに集中
  - 条件: **逆方向の依存（stores → domain/ui services）が存在しないこと**

**🟢 推奨パターン**:
- ✅ `stores` → `data-service` → `infrastructure`
- ✅ `domain/ui services` → `stores` (一方向のみ)
- ✅ `components` → `services` → `stores` → `infrastructure`

## 循環依存チェック（ESLint）

循環依存は**ESLintで自動検出**されます。`eslint.config.ts`に以下のルールが設定されています：

### ESLint設定

```typescript
// eslint.config.ts

// 1. Stores層からDomain/UI/Composite Servicesへの参照を禁止
{
  files: ['src/lib/stores/**/*.{ts,svelte.ts}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/services/domain/**', '**/services/domain/**'],
            message: '❌ Stores層からDomain Servicesへの参照は禁止です（循環依存）。'
          },
          {
            group: ['$lib/services/ui/**', '**/services/ui/**'],
            message: '❌ Stores層からUI Servicesへの参照は禁止です（循環依存）。'
          },
          {
            group: ['$lib/services/composite/**', '**/services/composite/**'],
            message: '❌ Stores層からComposite Servicesへの参照は禁止です（循環依存）。'
          }
        ]
      }
    ]
  }
},

// 2. data-serviceからStores/Servicesへの参照を禁止
{
  files: ['src/lib/services/data-service.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/stores/**', '**/stores/**'],
            message: '❌ data-serviceからStoresへの参照は禁止です。必要なIDはパラメータで受け取ってください。'
          },
          {
            group: ['$lib/services/domain/**', '**/services/domain/**'],
            message: '❌ data-serviceからDomain Servicesへの参照は禁止です（循環依存）。'
          },
          {
            group: ['$lib/services/ui/**', '**/services/ui/**'],
            message: '❌ data-serviceからUI Servicesへの参照は禁止です（循環依存）。'
          },
          {
            group: ['$lib/services/composite/**', '**/services/composite/**'],
            message: '❌ data-serviceからComposite Servicesへの参照は禁止です（循環依存）。'
          }
        ]
      }
    ]
  }
}
```

### 実行方法

```bash
# Lintチェック（循環依存も自動検出）
bun run lint

# 開発中の自動チェック
bun run dev  # ESLint統合されたエディタで自動表示
```

### エラー例

```bash
# stores → domain services の違反例
src/lib/stores/settings.svelte.ts
  2:1  error  '$lib/services/domain/settings' import is restricted from being used by a pattern.
              ❌ Stores層からDomain Servicesへの参照は禁止です（循環依存）。

# data-service → stores の違反例
src/lib/services/data-service.ts
  5:1  error  '$lib/stores/tasks.svelte' import is restricted from being used by a pattern.
              ❌ data-serviceからStoresへの参照は禁止です。必要なIDはパラメータで受け取ってください。
```

### CI/CDへの組み込み

```json
// package.json
{
  "scripts": {
    "lint": "eslint .",
    "precommit": "bun run lint && bun check",
    "ci": "bun run lint && bun run test && bun check"
  }
}
```

---

## 技術的強制策

### 1. ESLintルール

```javascript
// .eslintrc.cjs
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/infrastructure/**'],
            message: '❌ Infrastructure層への直接アクセスは禁止です。services/を使用してください。'
          }
        ]
      }
    ]
  }
};
```

### 2. 公開API管理 (`services/index.ts`)

```typescript
// src/lib/services/index.ts

// ✅ Domain Services (公開)
export * from './domain/project.service';
export * from './domain/task.service';
export * from './domain/subtask.service';
export * from './domain/tag.service';
export * from './domain/settings.service';

// ✅ Composite Services (公開)
export * from './composite/project-composite.service';
export * from './composite/task-composite.service';
export * from './composite/recurrence-composite.service';

// ✅ UI Services (公開)
export * from './ui/task-detail.service';
export * from './ui/view.service';
export * from './ui/layout.service';

// ❌ infrastructure は export しない（外部から使えない）
```

### 3. TypeScript paths設定

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "$lib/services": ["./src/lib/services/index.ts"],
      "$lib/services/*": ["./src/lib/services/*"]
    }
  }
}
```

## コンポーネントからの使い方

### ✅ 正しい使い方

```typescript
// src/lib/components/task/TaskList.svelte
<script lang="ts">
  import { TaskService } from '$lib/services';

  async function handleUpdate(taskId: string, updates: Partial<Task>) {
    await TaskService.updateTask(taskId, updates);
  }
</script>
```

### ❌ 間違った使い方

```typescript
// ❌ NG: Infrastructure層への直接アクセス
import { TauriBackend } from '$lib/infrastructure/backends/tauri';

// ESLintエラー: Infrastructure層への直接アクセスは禁止です
```

## 新しいバックエンドの追加方法

新しいバックエンド（例: Firebase）を追加する場合:

```
1. infrastructure/backends/firebase/ フォルダを作成
2. BackendServiceインターフェースを実装
3. infrastructure/backends/index.ts で選択ロジックに追加
```

**重要**: Services層は一切変更不要！

```typescript
// infrastructure/backends/index.ts
export async function getBackendService(): Promise<BackendService> {
  if (isFirebase) {
    return new FirebaseBackend(); // 新規追加
  } else if (isTauri) {
    return new TauriBackend();
  } else {
    return new WebBackend();
  }
}
```

## Store（状態管理）との関係

Store（`src/lib/stores/`）は以下のルールに従います:

### Storeからの読み取り
- ✅ **コンポーネントから直接読み取りOK**
  ```typescript
  import { taskStore } from '$lib/stores/tasks.svelte';

  const tasks = taskStore.tasks; // 読み取りOK
  ```

### Storeへの書き込み
- ❌ **コンポーネントから直接書き込み禁止**
- ✅ **必ずDomain Serviceを経由**
  ```typescript
  // ❌ NG
  taskStore.updateTask(taskId, updates);

  // ✅ OK
  await TaskService.updateTask(taskId, updates);
  ```

**理由**: Domain Serviceが「Backend永続化 + Store更新」の両方を保証するため

## まとめ

### 設計原則

1. **Infrastructure層とApplication層を明確に分離**
2. **コンポーネントはServices層のみ使用**
3. **新しいバックエンド追加時はInfrastructure層のみ変更**
4. **Store書き込みは必ずDomain Service経由**

### 期待される効果

- 🎯 **保守性向上**: 責務が明確、変更箇所が限定的
- 🔒 **安全性向上**: 誤用をESLintで防止
- 🚀 **拡張性向上**: 新しいバックエンド追加が容易
- 🧪 **テスタビリティ向上**: 各層が独立してテスト可能

### 関連ドキュメント

- [バックエンドコマンド実装](./backend-commands.md)
- [Svelte 5パターン](./svelte5-patterns.md)
- [全体アーキテクチャ](../architecture.md)
