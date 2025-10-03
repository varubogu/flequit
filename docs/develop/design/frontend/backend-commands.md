# フロントエンド側のバックエンドコマンド実装

データ保存・読み込みなど外部とやり取りが発生するバックエンド通信層は `infrastructure/backends/` として定義します。

> **重要**: このドキュメントはInfrastructure層の実装について説明します。
> レイヤーアーキテクチャ全体については [layers.md](./layers.md) を参照してください。

## infrastructure/backends/

**配置**: `src/lib/infrastructure/backends/`

**責務**:
- バックエンド通信の実装を提供
- Tauri/Web/Cloud等の環境差異を吸収
- データの永続化・取得

**特徴**:
- インターフェース定義 + 実装
- 環境ごとにフォルダ分け（`tauri/`, `web/`, `cloud/`等）
- `index.ts` で環境に応じたBackendServiceを選択

**アクセス制限**:
- ❌ **コンポーネントから直接呼び出し禁止**
- ❌ **Storeから直接呼び出し禁止**
- ✅ **Services層（`services/domain/`）からのみアクセス可能**

### ディレクトリ構造

```
src/lib/infrastructure/backends/
├── index.ts                    # BackendService選択ロジック
├── types.ts                    # BackendServiceインターフェース定義
├── tauri/                      # Tauri実装
│   ├── project.ts
│   ├── tasklist.ts
│   ├── task.ts
│   ├── subtask.ts
│   ├── tag.ts
│   ├── settings.ts
│   └── index.ts
└── web/                        # Web/Supabase実装
    ├── project.ts
    ├── tasklist.ts
    ├── task.ts
    ├── subtask.ts
    ├── tag.ts
    ├── settings.ts
    └── index.ts
```

## infrastructure/backends/tauri/, infrastructure/backends/web/

**配置**:
- `src/lib/infrastructure/backends/tauri/`
- `src/lib/infrastructure/backends/web/`

**実装内容**:
- **Tauri**: Tauriコマンド経由でRustバックエンドと通信
- **Web**: Supabase等のWebAPIと通信
- **将来**: Cloud同期、Git同期等の実装も追加可能

**現状**:
- Tauriのみ実装済み
- Webは後で実装予定

## 共通事項

### 取り扱うデータ構造

以下のエンティティのインターフェースと実装を用意します:

- `project` (プロジェクト)
- `tasklist` (タスクリスト)
- `task` (タスク)
- `subtask` (サブタスク)
- `tag` (タグ)
- `settings` (設定)
- `account` (アカウント)

### BackendServiceインターフェース

各エンティティのBackendServiceは `infrastructure/backends/types.ts` でインターフェースとして定義されます:

```typescript
export interface BackendService {
  project: ProjectBackend;
  tasklist: TaskListBackend;
  task: TaskBackend;
  subtask: SubTaskBackend;
  tag: TagBackend;
  settings: SettingsBackend;
  // ... その他
}
```

### 必要な関数（CRUD操作）

各エンティティのBackendは以下のCRUD操作を提供します:

#### 新規作成 (Create)
- **引数**: オブジェクト
- **戻り値**: `boolean`（登録成功・失敗）
- **命名規則**: `createProject`, `createTask`等

```typescript
async create(projectId: string, entity: Project): Promise<boolean>
```

#### 更新 (Update)
- **引数**: ID + 更新内容（部分オブジェクト）
- **戻り値**: `boolean`（更新成功・失敗）
- **命名規則**: `updateProject`, `updateTask`等

```typescript
async update(projectId: string, id: string, updates: Partial<Project>): Promise<boolean>
```

#### 削除 (Delete)
- **引数**: ID
- **戻り値**: `boolean`（削除成功・失敗）
- **命名規則**: `deleteProject`, `deleteTask`等

```typescript
async delete(projectId: string, id: string): Promise<boolean>
```

#### 検索（1件）(Read - Single)
- **引数**: ID
- **戻り値**: エンティティオブジェクト（見つからない場合は`null`）
- **命名規則**: `getProject`, `getTask`等

```typescript
async get(projectId: string, id: string): Promise<Project | null>
```

#### 検索（複数件）(Read - Multiple)
- **引数**: 検索条件オブジェクト（オプション）
- **戻り値**: エンティティオブジェクトの配列
- **命名規則**: `getAllProjects`, `getAllTasks`等

```typescript
async getAll(projectId: string, conditions?: SearchConditions): Promise<Project[]>
```

**注意**:
- `project`, `tasklist`, `task`, `subtask`, `tag`: 1件検索と複数件検索の**両方**を用意
- `settings`, `account`: 1件検索のみ用意

### データ更新通知の仕組み

バックエンド（Tauri/Web）でデータ取得（同期）時は、以下の仕組みで更新を通知します:

- どの値が更新されたかを `tauri/web` → フロントエンドへ通知
- フロントエンドは通知を受けて該当部分の表示を更新
- 実装方法はバックエンドごとに異なる可能性あり（Tauriはイベント、WebはWebSocket等）

## 型について

親子関係のあるエンティティの型定義ルール:

### 親から子へのアクセス

- リスト構造・オブジェクト構造により不要
- 例: `Project` は `taskLists: TaskList[]` を持つ

### 子から親へのアクセス

- **子は1つ上の親のIDのみを保持**
- 例: `Task` は `listId` を持つが、`projectId` や `subTaskId` は持たない

```
project (projectId)
  ↓
tasklist (tasklistId, projectId を保持)
  ↓
task (taskId, listId を保持)
  ↓
subtask (subtaskId, taskId を保持)
```

**理由**: データの正規化と依存関係の明確化

## 実装順序

Infrastructure層の実装は以下の順序で行います:

1. **型定義の修正**
   - エンティティの型定義を精査
   - 親子関係のID保持ルールに従う

2. **`infrastructure/backends/types.ts` にインターフェース定義**
   - `BackendService` インターフェース
   - 各エンティティのBackendインターフェース

3. **`infrastructure/backends/tauri/`, `infrastructure/backends/web/` を実装**
   - Tauriは完全実装
   - Webは関数のスケルトンのみ実装（内部処理はペンディング）

## Services層との連携

Infrastructure層を使用するのは **Services層（`services/domain/`）のみ** です:

```typescript
// services/domain/task.ts
import { getBackendService } from '$lib/infrastructure/backends';

export class TaskService {
  static async updateTask(taskId: string, updates: Partial<Task>) {
    // Infrastructure層を使用
    const backend = await getBackendService();
    await backend.task.update(projectId, taskId, updates);

    // Store更新
    taskStore.updateTask(taskId, updates);
  }
}
```

## 新しいバックエンドの追加

新しいバックエンド（例: Firebase、Cloud同期）を追加する場合:

1. `infrastructure/backends/firebase/` フォルダを作成
2. `BackendService` インターフェースを実装
3. `infrastructure/backends/index.ts` で選択ロジックに追加

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

**重要**: Services層やコンポーネントは一切変更不要！

## 関連ドキュメント

- [レイヤーアーキテクチャ](./layers.md) - Infrastructure層とServices層の関係
- [Svelte 5パターン](./svelte5-patterns.md) - コンポーネント設計
- [全体アーキテクチャ](../architecture.md) - システム全体の設計
