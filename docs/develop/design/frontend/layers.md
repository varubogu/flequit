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
    │   ├── project.service.ts
    │   ├── tasklist.service.ts
    │   ├── task.service.ts
    │   ├── subtask.service.ts
    │   ├── tag.service.ts
    │   └── settings.service.ts
    │
    ├── composite/              (横断的操作)
    │   ├── project-composite.service.ts
    │   ├── task-composite.service.ts
    │   └── recurrence-composite.service.ts
    │
    ├── ui/                     (UI状態管理のみ)
    │   ├── task-detail.service.ts
    │   ├── view.service.ts
    │   └── layout.service.ts
    │
    └── index.ts                (公開API定義)
```

## 各層の責務

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

### Application層 - Domain Services (`services/domain/`)

**責務**:
- 単一エンティティのCRUD操作
- Infrastructure層（Backend）を使ってデータ永続化
- Storeを使ってUI状態の同期

**パターン**:
```typescript
// services/domain/task.service.ts
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

**アクセス制限**:
- ✅ **コンポーネントから呼び出しOK**
- ✅ **Infrastructure層を使用OK**
- ✅ **Storeを使用OK**

---

### Application層 - Composite Services (`services/composite/`)

**責務**:
- 複数エンティティの協調操作
- トランザクション的な処理
- Domain Servicesを組み合わせて使用

**例**:
```typescript
// services/composite/task-composite.service.ts
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
// services/ui/task-detail.service.ts
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
│ ✅ services/* から import                   │
│ ❌ infrastructure/* から import 禁止         │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ Services Layer                              │
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

### 依存ルール

| From → To | Infrastructure | Domain | Composite | UI | Components |
|-----------|---------------|--------|-----------|-----|------------|
| **Components** | ❌ 禁止 | ✅ OK | ✅ OK | ✅ OK | ✅ OK |
| **UI Services** | ❌ 禁止 | ✅ OK | ✅ OK | - | - |
| **Composite Services** | ⚠️ 避ける | ✅ OK | - | - | - |
| **Domain Services** | ✅ OK | ✅ OK | - | - | - |
| **Infrastructure** | - | - | - | - | - |

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
