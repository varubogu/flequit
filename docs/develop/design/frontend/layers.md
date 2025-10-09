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
- 永続化はInfrastructure層（backends）を直接呼び出し
- ビジネスロジックは持たない（servicesに委譲）

**依存ルール**:
- ✅ **infrastructure/backends を直接参照OK**
  - 例: `backend.project.create()`, `backend.task.update()`
- ✅ **utils/types を参照OK**
  - 例: 日付フォーマット関数、型定義
- ❌ **services (domain/ui/composite) を参照禁止**
  - 理由: 循環依存を防ぐため（servicesがstoresを参照している）
- ❌ **他のstoresへの相互参照は最小限**
  - 必要な場合は依存方向を明確化（一方向のみ）

**例**:
```typescript
// stores/tasks.svelte.ts
import { getBackendService } from '$lib/infrastructure/backends';

class TaskStore {
  tasks = $state<Task[]>([]);

  async addTask(projectId: string, taskData: Task) {
    // ✅ infrastructure/backendsで永続化
    const backend = await getBackendService();
    const newTask = await backend.task.create(projectId, taskData);

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
- ❌ **Components層から直接呼び出し禁止**
- ✅ **Stores層から直接呼び出しOK**
- ✅ **Services層から呼び出しOK**（将来的に移行予定）

---

### Application層 - Domain Services (`services/domain/`)

**責務**:
- 単一エンティティに関するビジネスロジック
- Storeを呼び出してデータ取得・更新
- 複雑な操作や検証ロジックの実装

**パターン**:
```typescript
// services/domain/task.ts
import { taskStore } from '$lib/stores/tasks.svelte';

export class TaskService {
  static async updateTask(taskId: string, updates: Partial<Task>) {
    // ビジネスロジック（例: バリデーション）
    if (!updates.title || updates.title.trim() === '') {
      throw new Error('タイトルは必須です');
    }

    // Storeを経由してデータ更新（永続化を含む）
    await taskStore.updateTask(taskId, updates);
  }
}
```

**依存ルール**:
- ✅ **Components層から呼び出しOK**
- ✅ **Storesからデータ取得・更新OK**
  - 理由: Svelte runesは`.svelte.ts`でのみ動作、状態はstoresに集中
  - 例: `taskStore.tasks`, `taskStore.updateTask()`
- ✅ **他のDomain Servicesを使用OK**
  - 例: TaskServiceからRecurrenceServiceを呼び出す
  - 注意: 循環参照にならないよう一方向のみ
- ✅ **Utils/Types を参照OK**
  - 例: 日付計算、バリデーション関数
- ❌ **UI/Composite Services を参照禁止**
  - 理由: 下位層から上位層への依存は禁止

**注意事項**:
- 単なるStoreのラッパーにならないよう注意（ビジネスロジックがない場合は不要）
- ビジネスロジックがない場合はservice層に配置せず、直接Storeを使用

---

### Application層 - Composite Services (`services/composite/`)

**責務**:
- 複数エンティティの協調操作
- トランザクション的な処理
- Domain Servicesを組み合わせて使用

**例**:
```typescript
// services/composite/task-composite.ts
import { TaskService } from '$lib/services/domain/task';
import { SubTaskService } from '$lib/services/domain/subtask';

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

**依存ルール**:
- ✅ **Components層から呼び出しOK**
- ✅ **Domain Servicesを使用OK**
- ✅ **他のComposite Servicesを使用OK**（慎重に、循環参照注意）
- ✅ **Storesからデータ取得・更新OK**
- ✅ **Utils/Types を参照OK**
- ❌ **UI Services を参照禁止**
  - 理由: 下位層から上位層への依存は禁止

---

### Application層 - UI Services (`services/ui/`)

**責務**:
- UI状態管理とユーザー操作の調整
- モバイル/デスクトップ切り替え
- Domain/Composite Servicesを組み合わせてUI層の操作を提供

**例**:
```typescript
// services/ui/task-detail.ts
import { TaskService } from '$lib/services/domain/task';
import { viewStore } from '$lib/stores/view-store.svelte';

export class TaskDetailService {
  static openTaskDetail(taskId: string) {
    // Domain Serviceでデータ操作
    TaskService.selectTask(taskId);

    // UI状態の変更
    if (viewStore.isMobile) {
      viewStore.openDrawer('task-detail');
    }
  }
}
```

**依存ルール**:
- ✅ **Components層から呼び出しOK**
- ✅ **Domain Servicesを使用OK**
- ✅ **Composite Servicesを使用OK**
- ✅ **他のUI Servicesを使用OK**（慎重に、循環参照注意）
- ✅ **Storesからデータ取得・更新OK**
- ✅ **Utils/Types を参照OK**
- ❌ **Infrastructure層への直接アクセス禁止**

## レイヤー間の依存関係

```
┌─────────────────────────────────────────────┐
│ Components (Svelte)                         │
│ ✅ stores/* から値の読み取りのみ            │
│ ✅ services/* から import・呼び出し         │
│ ❌ infrastructure/* から import 禁止         │
│ ❌ stores/* のメソッド呼び出し禁止           │
│ ❌ utils/types 以外への直接書き込み禁止     │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ Stores Layer ($state管理)                   │
│ ├─ tasks.svelte.ts                          │
│ ├─ tags.svelte.ts                           │
│ ├─ settings.svelte.ts                       │
│ └─ view-store.svelte.ts                     │
│                                             │
│ ✅ infrastructure/backends を直接参照       │
│ ❌ services (domain/ui/composite) 参照禁止  │
│ ❌ 他のstoresへの相互参照は最小限           │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ Services Layer                              │
│ ├─ ui/          (UI状態・最上位)            │
│ ├─ composite/   (横断操作)                  │
│ └─ domain/      (単一エンティティ)          │
│                                             │
│ 📊 依存方向: UI → Composite → Domain       │
│ ✅ 下位層・同位層への参照OK                 │
│ ❌ 上位層への参照禁止                       │
│ ✅ stores への参照OK（読み取り・更新）      │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ Infrastructure Layer                        │
│ └─ backends/                                │
│    ├─ tauri/    (Tauri実装)                │
│    ├─ web/      (Web実装)                  │
│    └─ cloud/    (将来: クラウド実装)        │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ Utils/Types Layer (全層から利用可能)        │
│ ├─ utils/       (純粋関数)                  │
│ └─ types/       (型定義)                    │
│                                             │
│ ❌ stores/services への参照禁止             │
└─────────────────────────────────────────────┘
```

### 詳細な依存ルール

| From → To | Infrastructure | Domain Services | Composite Services | UI Services | Stores | Utils/Types | Components |
|-----------|---------------|-----------------|-------------------|-------------|--------|-------------|------------|
| **Components** | ❌ 禁止 | ✅ 呼び出しOK | ✅ 呼び出しOK | ✅ 呼び出しOK | ✅ 読取のみ | ✅ OK | - |
| **Stores** | ✅ backends経由 | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | ⚠️ 最小限 | ✅ OK | - |
| **UI Services** | ❌ 禁止 | ✅ OK | ✅ OK | ⚠️ 同位層注意 | ✅ OK | ✅ OK | - |
| **Composite Services** | ❌ 禁止 | ✅ OK | ⚠️ 同位層注意 | ❌ 禁止 | ✅ OK | ✅ OK | - |
| **Domain Services** | ❌ 禁止 | ⚠️ 同位層注意 | ❌ 禁止 | ❌ 禁止 | ✅ OK | ✅ OK | - |
| **Utils/Types** | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | - | - |
| **Infrastructure** | - | - | - | - | - | - | - |

#### 凡例
- ✅ OK: 推奨される依存関係
- ⚠️ 注意: 許容されるが慎重に（循環依存に注意）
- ❌ 禁止: ESLintで検出される違反

### 循環依存防止ルール

**🔴 絶対禁止（循環依存リスク）**:
- ❌ `stores` → `services (domain/ui/composite)`
  - 理由: servicesがstoresを参照しているため、逆方向は循環依存になる
- ❌ `domain services` → `ui services`
  - 理由: 下位層から上位層への依存は禁止
- ❌ `domain services` → `composite services`
  - 理由: 下位層から上位層への依存は禁止
- ❌ `composite services` → `ui services`
  - 理由: 下位層から上位層への依存は禁止
- ❌ `utils/types` → `stores/services/infrastructure`
  - 理由: 純粋な関数・型定義層は他層に依存してはいけない

**🟡 Svelte 5特有の許容パターン**:
- ✅ `services (domain/ui/composite)` → `stores` (Svelte runesの制約上許容)
  - 理由: `$state`は`.svelte.ts`でのみ動作するため、状態はstoresに集中
  - 条件: **逆方向の依存（stores → services）が存在しないこと**
- ✅ `components` → `stores` (読み取りのみ)
  - 理由: UIコンポーネントは状態を表示する必要がある
  - 制限: **Storeのメソッド呼び出しは禁止、値の読み取りのみ**

**⚠️ 注意が必要なパターン**:
- ⚠️ `stores` 間の相互参照
  - 許容: 明確な依存方向がある場合（例: `task-store` → `project-store`）
  - 禁止: 相互に参照し合う場合（循環依存）
- ⚠️ 同位層の `services` 間の参照
  - 許容: 依存が一方向のみの場合
  - 禁止: 相互に参照し合う場合（循環依存）

**🟢 推奨パターン**:
- ✅ `components` → `services` → `stores` → `infrastructure`
- ✅ `services (ui → composite → domain)` (階層順守)
- ✅ `services` → `stores` (読み取り・更新)
- ✅ `components` → `stores` (読み取りのみ)

## 循環依存チェック（ESLint）

循環依存は**ESLintで自動検出**されます。`eslint.config.ts`に以下のルールが設定されています：

### ESLint設定

```typescript
// eslint.config.ts

// 1. Stores層からServicesへの参照を禁止
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

// 2. Domain ServicesからUI/Composite Servicesへの参照を禁止
{
  files: ['src/lib/services/domain/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/services/ui/**', '**/services/ui/**'],
            message: '❌ Domain ServicesからUI Servicesへの参照は禁止です（下位層→上位層）。'
          },
          {
            group: ['$lib/services/composite/**', '**/services/composite/**'],
            message: '❌ Domain ServicesからComposite Servicesへの参照は禁止です（下位層→上位層）。'
          }
        ]
      }
    ]
  }
},

// 3. Composite ServicesからUI Servicesへの参照を禁止
{
  files: ['src/lib/services/composite/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/services/ui/**', '**/services/ui/**'],
            message: '❌ Composite ServicesからUI Servicesへの参照は禁止です（下位層→上位層）。'
          }
        ]
      }
    ]
  }
},

// 4. Utils/Types層からStores/Servicesへの参照を禁止
{
  files: ['src/lib/utils/**/*.ts', 'src/lib/types/**/*.ts'],
  ignores: ['src/lib/types/bindings.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/stores/**', '**/stores/**'],
            message: '❌ Utils/Types層からStoresへの参照は禁止です。純粋な関数・型定義のみにしてください。'
          },
          {
            group: ['$lib/services/**', '**/services/**'],
            message: '❌ Utils/Types層からServicesへの参照は禁止です。純粋な関数・型定義のみにしてください。'
          },
          {
            group: ['$lib/infrastructure/**', '**/infrastructure/**'],
            message: '❌ Utils/Types層からInfrastructureへの参照は禁止です。純粋な関数・型定義のみにしてください。'
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
# 1. stores → services の違反例
src/lib/stores/tasks.svelte.ts
  2:1  error  '$lib/services/domain/task' import is restricted from being used by a pattern.
              ❌ Stores層からDomain Servicesへの参照は禁止です（循環依存）。

# 2. domain services → ui services の違反例
src/lib/services/domain/task.ts
  3:1  error  '$lib/services/ui/task-detail' import is restricted from being used by a pattern.
              ❌ Domain ServicesからUI Servicesへの参照は禁止です（下位層→上位層）。

# 3. composite services → ui services の違反例
src/lib/services/composite/task-composite.ts
  4:1  error  '$lib/services/ui/layout' import is restricted from being used by a pattern.
              ❌ Composite ServicesからUI Servicesへの参照は禁止です（下位層→上位層）。

# 4. utils → services の違反例
src/lib/utils/date-utils.ts
  2:1  error  '$lib/services/domain/settings' import is restricted from being used by a pattern.
              ❌ Utils/Types層からServicesへの参照は禁止です。純粋な関数・型定義のみにしてください。
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

## Components層とStoreの関係

Components層（`src/lib/components/`）とStore（`src/lib/stores/`）の間には厳格なルールがあります:

### Storeからの読み取り
- ✅ **Components層から直接読み取りOK**
  ```typescript
  // ✅ OK: 値の読み取り
  import { taskStore } from '$lib/stores/tasks.svelte';

  const tasks = taskStore.tasks;
  const selectedTask = taskStore.selectedTask;
  ```

### Storeのメソッド呼び出し
- ❌ **Components層からStoreのメソッド呼び出しは禁止**
- ✅ **必ずServicesを経由**
  ```typescript
  // ❌ NG: Components層から直接Storeのメソッドを呼び出し
  await taskStore.updateTask(taskId, updates);

  // ✅ OK: Servicesを経由
  import { TaskService } from '$lib/services/domain/task';
  await TaskService.updateTask(taskId, updates);
  ```

**理由**:
- Storeの更新ロジックにビジネスルールや検証が必要な場合、Services層で集中管理
- Services層を経由することで、将来の変更に対応しやすい
- テスタビリティの向上（Services層のモックが容易）

**注意**:
- Storeのメソッド呼び出しと値の読み取りはESLintで区別できないため、コードレビューで確認が必要
- 簡単な操作でもServicesを経由することで、一貫性のあるコードになる

## まとめ

### 設計原則

1. **Infrastructure層とApplication層を明確に分離**
2. **Components層はServicesのみ呼び出し、Storeは読み取りのみ**
3. **Services層は階層構造を守る (UI → Composite → Domain)**
4. **Stores層はServicesを参照しない（循環依存防止）**
5. **Storeのメソッド呼び出しは必ずServices経由**
6. **Utils/Types層は他層に依存しない（純粋関数・型定義のみ）**

### 期待される効果

- 🎯 **保守性向上**: 責務が明確、変更箇所が限定的
- 🔒 **安全性向上**: 誤用をESLintで防止
- 🚀 **拡張性向上**: 新しいバックエンド追加が容易
- 🧪 **テスタビリティ向上**: 各層が独立してテスト可能

### 関連ドキュメント

- [バックエンドコマンド実装](./backend-commands.md)
- [Svelte 5パターン](./svelte5-patterns.md)
- [全体アーキテクチャ](../architecture.md)
