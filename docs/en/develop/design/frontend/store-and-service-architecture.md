# Store and Service Architecture

**作成日**: 2025-12-09
**最終更新**: 2025-12-09
**ステータス**: ✅ 実装完了

## 概要

このドキュメントでは、Flequitアプリケーションにおける**状態管理 (Store)** と**ビジネスロジック (Service)** の役割分担と設計指針を説明します。

## アーキテクチャ原則

### 責務の明確な分離

```
UIコンポーネント (.svelte)
    ↓
Services (ビジネスロジック)
    ├─→ Stores (状態管理)
    └─→ Backend (バックエンド通信)
```

## レイヤー構成

### Layer 1: Stores (状態管理)

**責務**:
- アプリケーション状態の保持
- リアクティブな状態の提供
- 状態の読み取り専用操作

**重要**: Stores は**状態管理のみ**を担当し、ビジネスロジックやバックエンド通信は行いません。

**例**: [stores/task-core-store.svelte.ts](src/lib/stores/task-core-store.svelte.ts:1)

```typescript
export class TaskCoreStore {
  projects = $state<ProjectTree[]>([]);

  // 状態の読み取り 
  getTaskById(taskId: string): TaskWithSubTasks | null {
    // プロジェクトツリーから検索
  }

  // ローカル状態の操作（バックエンドは呼ばない）
  insertTask(listId: string, task: TaskWithSubTasks): TaskWithSubTasks | null {
    // メモリ内のprojects配列に追加
  }
}
```

### Layer 2: Services - Operations (ビジネスロジック)

**責務**:
- ビジネスルールの実装
- 楽観的更新 (Optimistic Update)
- エラーハンドリング
- Stores と Backend の調整

**例**: [services/domain/task/task-operations.ts](src/lib/services/domain/task/task-operations.ts:1)

```typescript
export class TaskOperations {
  async addTask(listId: string, taskData: Partial<TaskWithSubTasks>): Promise<TaskWithSubTasks | null> {
    // 1. ローカル状態に楽観的に追加
    const inserted = taskCoreStore.insertTask(listId, newTask);

    try {
      // 2. バックエンドに永続化
      await TaskBackend.createTaskWithSubTasks(listId, inserted);
      return inserted;
    } catch (error) {
      // 3. 失敗時はロールバック
      taskCoreStore.removeTask(inserted.id);
      errorHandler.addSyncError('タスク作成', 'task', inserted.id, error);
      return null;
    }
  }
}
```

### Layer 3: Services - Backend (バックエンド通信)

**責務**:
- バックエンドAPIの呼び出し
- データの永続化
- バックエンドエラーのハンドリング

**重要**: Backend サービスはローカル状態 (Store) を操作しません。

**例**: [services/domain/task/task-backend.ts](src/lib/services/domain/task/task-backend.ts:1)

```typescript
export const TaskBackend = {
  async createTask(listId: string, taskData: Task): Promise<Task> {
    const backend = await resolveBackend();
    await backend.task.create(projectId, newTask, getCurrentUserId());
    return newTask;
  }
}
```

## 具体例: タスク管理

### ディレクトリ構成

```
src/lib/
├── stores/                          # 状態管理
│   ├── task-core-store.svelte.ts   # タスクの状態管理
│   └── tasks.svelte.ts              # Facade
│
├── services/
│   ├── domain/                      # ビジネスロジック
│   │   └── task/
│   │       ├── task-operations.ts   # タスク操作の統合
│   │       └── task-backend.ts      # バックエンド通信
│   │
│   └── ui/                          # UI層のサービス
│       └── task/
│           └── task-interactions.ts # UI特有の操作
```

### 呼び出しフロー

#### ケース1: タスクを作成する

```typescript
// UIコンポーネント
import { taskOperations } from '$lib/services/domain/task';

async function handleAddTask() {
  // UIから直接 Operations を呼び出す
  const newTask = await taskOperations.addTask(listId, {
    title: 'New Task',
    description: 'Description'
  });
}
```

```typescript
// TaskOperations (services/domain/task/task-operations.ts)
async addTask(listId: string, taskData: Partial<TaskWithSubTasks>): Promise<TaskWithSubTasks | null> {
  // 1. ローカル状態を楽観的に更新
  const inserted = this.#deps.taskCoreStore.insertTask(listId, newTask);

  try {
    // 2. バックエンドに永続化
    await TaskBackend.createTaskWithSubTasks(listId, inserted);
    return inserted;
  } catch (error) {
    // 3. エラー時はロールバック
    this.#deps.taskCoreStore.removeTask(inserted.id);
    this.#deps.errorHandler.addSyncError('タスク作成', 'task', inserted.id, error);
    return null;
  }
}
```

#### ケース2: タスクを更新する

```typescript
// UIコンポーネント
import { taskOperations } from '$lib/services/domain/task';

async function handleUpdateTask() {
  await taskOperations.updateTask(taskId, {
    title: 'Updated Title'
  });
}
```

```typescript
// TaskOperations
async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  // 1. 現在の状態をスナップショット
  const snapshot = cloneTask(currentTask);

  // 2. ローカル状態を楽観的に更新
  this.#deps.taskCoreStore.applyTaskUpdate(taskId, (task) => {
    Object.assign(task, updates);
  });

  try {
    // 3. バックエンドに永続化
    await TaskBackend.updateTaskWithSubTasks(projectId, taskId, updates);
  } catch (error) {
    // 4. エラー時はスナップショットから復元
    this.#deps.taskCoreStore.applyTaskUpdate(taskId, (task) => {
      Object.assign(task, snapshot);
    });
    this.#deps.errorHandler.addSyncError('タスク更新', 'task', taskId, error);
  }
}
```

## 命名規則

### Stores

- **ファイル名**: `{entity}-store.svelte.ts` (例: `task-core-store.svelte.ts`)
- **クラス名**: `{Entity}Store` (例: `TaskCoreStore`)
- **メソッド命名**:
  - 読み取り: `getTaskById()`, `getTasksByListId()`
  - 書き込み: `insertTask()`, `removeTask()`, `applyTaskUpdate()`
  - 明示的に「ローカル操作」であることを示す

### Services - Operations

- **ファイル名**: `{entity}-operations.ts` (例: `task-operations.ts`)
- **クラス名**: `{Entity}Operations` (例: `TaskOperations`)
- **メソッド命名**:
  - CRUD: `addTask()`, `updateTask()`, `deleteTask()`
  - ビジネス操作: `toggleTaskStatus()`, `moveTaskToList()`

### Services - Backend

- **ファイル名**: `{entity}-backend.ts` (例: `task-backend.ts`)
- **オブジェクト名**: `{Entity}Backend` (例: `TaskBackend`)
- **メソッド命名**:
  - `createTask()`, `updateTask()`, `deleteTask()`
  - バックエンドAPIの操作を直接的に表現

## 楽観的更新 (Optimistic Update) パターン

すべての変更操作は以下のパターンに従います:

```typescript
async function operation() {
  // 1. スナップショットを作成 (更新の場合)
  const snapshot = cloneCurrentState();

  // 2. ローカル状態を即座に更新 (楽観的更新)
  store.updateLocalState(newData);

  try {
    // 3. バックエンドに永続化
    await backend.persistData(newData);
  } catch (error) {
    // 4. エラー時はロールバック
    store.restoreState(snapshot);
    errorHandler.addError(error);
  }
}
```

### メリット

- **ユーザー体験の向上**: UIが即座に反応
- **データ整合性**: エラー時の自動ロールバック
- **デバッグ容易性**: エラーハンドリングが一箇所に集約

## Facade パターン

複雑な Store は Facade パターンで統合します。

**例**: [stores/tasks.svelte.ts](src/lib/stores/tasks.svelte.ts:1)

```typescript
export class TaskStore {
  #entities: TaskEntitiesStore;   // エンティティ管理
  #selection: TaskSelectionStore; // 選択状態
  #draft: TaskDraftStore;         // ドラフト状態

  // 公開APIは内部ストアに委譲
  get projects(): ProjectTree[] {
    return this.#entities.projects;
  }

  getTaskById(taskId: string): TaskWithSubTasks | null {
    return this.#selection.getTaskById(taskId);
  }
}
```

## UI特有のサービス (Optional)

UI層特有の複雑な操作は、`services/ui/` に配置することができます。

**例**: [services/ui/task/task-interactions.ts](src/lib/services/ui/task/task-interactions.ts:1)

```typescript
export class TaskInteractionsService {
  // 新規タスクモードの開始/キャンセル
  startNewTaskMode(listId: string): void { /* ... */ }
  cancelNewTaskMode(): void { /* ... */ }

  // ドラフトタスクの保存
  async saveNewTask(): Promise<string | null> {
    const draft = this.#deps.draft.newTaskDraft;
    const newTask = await this.#deps.taskOperations.addTask(draft.listId, draft);
    // ...
  }
}
```

## ベストプラクティス

### ✅ 推奨

1. **UIから直接 Operations を呼び出す**
   ```typescript
   import { taskOperations } from '$lib/services/domain/task';
   await taskOperations.addTask(listId, taskData);
   ```

2. **Store は状態管理のみ**
   ```typescript
   // ✅ 良い例
   class TaskCoreStore {
     insertTask(listId: string, task: TaskWithSubTasks) {
       // ローカル配列に追加するだけ
     }
   }
   ```

3. **Backend は永続化のみ**
   ```typescript
   // ✅ 良い例
   const TaskBackend = {
     async createTask(listId: string, task: Task) {
       // バックエンドAPIを呼ぶだけ
     }
   }
   ```

### ❌ 非推奨

1. **Store からバックエンドを呼ぶ**
   ```typescript
   // ❌ 悪い例
   class TaskStore {
     async addTask() {
       const backend = await resolveBackend();  // NG!
       await backend.task.create(...);
     }
   }
   ```

2. **Backend から Store を操作する**
   ```typescript
   // ❌ 悪い例
   const TaskBackend = {
     async createTask() {
       await backend.task.create(...);
       taskStore.insertTask(...);  // NG!
     }
   }
   ```

3. **UI から直接 Backend を呼ぶ**
   ```typescript
   // ❌ 悪い例
   async function handleAddTask() {
     await TaskBackend.createTask(...);  // NG!
     // エラーハンドリングやロールバックがない
   }
   ```

## まとめ

- **Stores**: 状態管理のみ。リアクティブな状態を提供。
- **Operations**: ビジネスロジック。楽観的更新、エラーハンドリング、Store と Backend の調整。
- **Backend**: バックエンド通信のみ。データの永続化。
- **UI**: Operations を直接呼び出す。シンプルで明快。

この設計により、各レイヤーの責務が明確になり、保守性と拡張性が向上します。
