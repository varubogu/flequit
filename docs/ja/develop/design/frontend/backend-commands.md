# フロントエンドのバックエンドコマンド実装

データ保存・読み込みなど外部とのやり取りが発生するバックエンド通信層は `src/lib/infrastructure/backends/` に配置する。

> レイヤー全体の関係は [`layers.md`](./layers.md) を参照。実装の正本は `src/lib/infrastructure/backends/`。

## `infrastructure/backends/` の責務

- バックエンド通信の実装を提供
- Tauri / Web / Cloud 等の環境差異を吸収
- データの永続化・取得

特徴:

- インターフェース定義 + 実装をセット
- 環境ごとにフォルダ分け (`tauri/`, `web/`, `cloud/` 等)
- `index.ts` で環境に応じた `BackendService` を選択

アクセス制限:

- ❌ コンポーネントから直接呼び出し禁止
- ❌ Store から直接呼び出し禁止
- ✅ Services 層 (`services/domain/`) からのみアクセス可能

### ディレクトリ構造

```
src/lib/infrastructure/backends/
├── index.ts             # BackendService 選択ロジック
├── types.ts             # BackendService インターフェース定義
├── tauri/               # Tauri 実装 (完全実装)
└── web/                 # Web/Supabase 実装 (スケルトンのみ、ペンディング)
```

## 実装内訳

| バックエンド | 実装内容 |
| --- | --- |
| Tauri | Tauri コマンド経由で Rust バックエンドと通信 |
| Web | Supabase 等の Web API と通信 (将来 Cloud / Git 同期等の追加可能) |

## 取り扱うエンティティ

`project`, `tasklist`, `task`, `subtask`, `tag`, `settings`, `account`

## `BackendService` インターフェース

`infrastructure/backends/types.ts` で定義。各エンティティの Backend を集約:

- `project: ProjectBackend`
- `tasklist: TaskListBackend`
- `task: TaskBackend`
- `subtask: SubTaskBackend`
- `tag: TagBackend`
- `settings: SettingsBackend`
- 等

## 必要な CRUD 操作

各エンティティの Backend は以下を提供する:

| 操作 | シグネチャ (例: project) | 戻り値 |
| --- | --- | --- |
| Create | `create(projectId, entity)` | `boolean` (成功/失敗) |
| Update | `update(projectId, id, updates: Partial<T>)` | `boolean` |
| Delete | `delete(projectId, id)` | `boolean` |
| Get (1 件) | `get(projectId, id)` | `T | null` |
| GetAll (複数件) | `getAll(projectId, conditions?)` | `T[]` |

注意:

- `project`, `tasklist`, `task`, `subtask`, `tag`: 1 件と複数件の **両方** を提供
- `settings`, `account`: 1 件のみ提供

実装参照: `src/lib/infrastructure/backends/types.ts`, `src/lib/infrastructure/backends/tauri/...`

## データ更新通知の仕組み

バックエンド (Tauri / Web) でデータ取得 (同期) 時、以下の仕組みでフロントエンドへ通知する:

- どの値が更新されたかを `tauri/web` → フロントエンドへ通知
- フロントエンドは通知を受けて該当部分の表示を更新
- 実装方法はバックエンドごとに異なる (Tauri はイベント、Web は WebSocket 等)

## 型のルール: 親子関係

### 親 → 子へのアクセス

リスト構造・オブジェクト構造により不要。例: `Project` は `taskLists: TaskList[]` を持つ。

### 子 → 親へのアクセス

**子は 1 つ上の親の ID のみを保持** する:

```
project (projectId)
  ↓
tasklist (tasklistId, projectId を保持)
  ↓
task (taskId, listId を保持)
  ↓
subtask (subtaskId, taskId を保持)
```

理由: データの正規化と依存関係の明確化。

## 実装順序

1. 型定義の修正 (親子関係の ID 保持ルールに従う)
2. `infrastructure/backends/types.ts` にインターフェース定義
3. `infrastructure/backends/tauri/`, `infrastructure/backends/web/` を実装 (Tauri は完全実装、Web はスケルトン)

## Services 層との連携

Infrastructure 層を使うのは **Services 層 (`services/domain/`) のみ**。Services 層は `getBackendService()` を呼んで現在の環境の Backend を取得し、操作する。Service が成功時に Store も更新する。

実装参照: `src/lib/services/domain/task/task-backend.ts`

## 新しいバックエンドの追加

1. `infrastructure/backends/firebase/` 等のフォルダを作成
2. `BackendService` インターフェースを実装
3. `infrastructure/backends/index.ts` の `getBackendService()` 選択ロジックに追加

→ **Services 層・コンポーネントは一切変更不要**。

## 関連

- [レイヤーアーキテクチャ](./layers.md)
- [Svelte 5 パターン](./svelte5-patterns.md)
- [全体アーキテクチャ](../architecture.md)
- [Store & Service アーキテクチャ](./store-and-service-architecture.md)
