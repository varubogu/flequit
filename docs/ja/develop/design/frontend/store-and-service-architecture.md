# Store & Service アーキテクチャ

フロントエンドにおける **状態管理 (Store)** と **ビジネスロジック (Service)** の責務分離・設計指針を定義する。

## 目的

- ストアをアプリ全体の「リアクティブ状態キャッシュ」として統一的に扱い、副作用はサービス層へ移譲する。
- 依存関係と初期化順序を明確化し、循環参照や初期化順序起因のバグを防ぐ。
- テスト容易性・差し替え可能性を確保しつつ、運用負荷を最小限に抑える。

## レイヤー構成

```
UIコンポーネント (.svelte)
    ↓
Services (ビジネスロジック)
    ├─→ Stores (状態管理)
    └─→ Backend (バックエンド通信)
```

### Layer 1: Stores (状態管理)

**責務**: アプリケーション状態の保持、リアクティブな状態の提供、状態の読み取り/ローカル書き込み操作。

**重要**: Stores は **状態管理のみ** を担当し、ビジネスロジックやバックエンド通信は行わない。

実装参照: `src/lib/stores/task-core-store.svelte.ts`, `src/lib/stores/tasks.svelte.ts`

### Layer 2: Services - Operations (ビジネスロジック)

**責務**: ビジネスルールの実装、楽観的更新 (Optimistic Update)、エラーハンドリング、Stores と Backend の調整。

実装参照: `src/lib/services/domain/task/task-operations.ts`

### Layer 3: Services - Backend (バックエンド通信)

**責務**: バックエンド API の呼び出し、データ永続化、バックエンドエラーのハンドリング。

**重要**: Backend サービスはローカル状態 (Store) を操作しない。

実装参照: `src/lib/services/domain/task/task-backend.ts`

### Layer (Optional): Services - UI

UI 層特有の複雑な操作（モード切り替え、ドラフト管理など）は `services/ui/` に配置できる。

実装参照: `src/lib/services/ui/task/task-interactions.ts`

## ストア分類と責務

| 区分                            | 主な責務                                           | 依存関係                                       |
| ------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| Domain Store                    | ドメイン状態の保持・派生値の提供。副作用なし。     | 同一ドメインのユーティリティ (`utils`/`types`) |
| UI Store                        | ビュー状態（選択・フィルタ・ダイアログ等）の管理。 | Domain Store（片方向）                         |
| Infrastructure Store (必要時)   | 環境情報・バックエンド種別の保持。                 | どの層からも参照可。ロジックは持たない。       |

## 楽観的更新パターン

すべての変更操作はこのパターンに従う:

1. 現在の状態をスナップショット
2. ローカル状態を即座に更新（楽観的更新）
3. バックエンドに永続化を試行
4. 失敗時はスナップショットから状態を復元し、`errorHandler` でエラー記録

実装参照: `src/lib/services/domain/task/task-operations.ts` の `addTask` / `updateTask`

### メリット

- ユーザー体験の向上: UI が即座に反応
- データ整合性: エラー時の自動ロールバック
- デバッグ容易性: エラーハンドリングが一箇所に集約

## 初期化規則

1. `initStores()` で全ストアを生成し、初期状態を構築する。
2. ストア生成時、必要なサービスへ依存注入を行う（例: `configureMutations`）。
3. アプリエントリ（`src/hooks.client.ts` やレイアウトコンポーネント）で `initStores()` を一度だけ呼ぶ。
4. テスト用には `initStoresForTest()` / `resetStores()` を用意し、任意のストアのみ生成・リセット可能にする。

## 依存注入ガイドライン

- **ストア → サービス の直接 import は禁止**。サービスはコンストラクタ／ファクトリ経由でストアを受け取る。
- **サービス → ストア の依存注入はブートストラップ関数内で一括実施**。ランタイムでの循環参照を回避。
- ストア間で依存が必要な場合は、`constructor` 引数で受け取り、既定値は初期化フェーズで注入する。

## コンポーネントでの利用パターン

- ルート（または上位コンポーネント）がストアインスタンスを Props または Context で子へ渡す。
- 子コンポーネントは受け取ったストアを `$derived` / `$state` などの Rune に接続して購読する。
- グローバル import は初期化フェーズのみ。実行時は渡されたインスタンスを使用する。

## Facade パターン

複雑な Store は Facade パターンで統合する（例: `TaskStore` が `TaskEntitiesStore` / `TaskSelectionStore` / `TaskDraftStore` を内部に持ち、公開 API は委譲）。

実装参照: `src/lib/stores/tasks.svelte.ts`

## 命名・配置

| 種別             | パス                                       | 例                            |
| ---------------- | ------------------------------------------ | ----------------------------- |
| Domain Store     | `stores/<domain>/<domain>-store.svelte.ts` | `task-core-store.svelte.ts`   |
| UI Store         | `stores/ui/<feature>-store.svelte.ts`      | -                             |
| Service: Operations | `services/domain/<entity>/<entity>-operations.ts` | `task-operations.ts`   |
| Service: Backend | `services/domain/<entity>/<entity>-backend.ts`    | `task-backend.ts`      |
| Service: UI      | `services/ui/<entity>/<entity>-interactions.ts`   | `task-interactions.ts` |
| 初期化           | `init/` または `services/bootstrap/`        | -                             |

### メソッド命名

- **Stores 読み取り**: `getTaskById()`, `getTasksByListId()`
- **Stores 書き込み**: `insertTask()`, `removeTask()`, `applyTaskUpdate()`（明示的にローカル操作と分かる名前）
- **Operations**: CRUD は `addTask()` / `updateTask()` / `deleteTask()`。ビジネス操作は `toggleTaskStatus()` 等。
- **Backend**: `createTask()` / `updateTask()` / `deleteTask()`（バックエンド API の操作を直接表現）

## ベストプラクティス

### ✅ 推奨

1. **UI から直接 Operations を呼び出す**（Store/Backend を直接呼ばない）
2. **Store は状態管理のみ**（バックエンド呼び出しを含めない）
3. **Backend は永続化のみ**（Store を操作しない）

### ❌ 非推奨

- Store からバックエンドを呼ぶ
- Backend から Store を操作する
- UI から直接 Backend を呼ぶ（エラーハンドリングやロールバックが欠落する）

## テスト指針

- 各ストアに `reset()` などの初期化メソッドを持たせ、テスト間で状態が混ざらないようにする。
- ルート注入パターンに合わせ、テストではモックストアを Props/Context から注入する。
- ストア単体テストでは外部サービス依存をモック化し、純粋な状態変換／派生ロジックのみを検証する。

## 例外・イベント処理

- ストア内でグローバルイベントへ直接登録しない。必要な場合はサービス層がイベントを受け取り、ストアを更新する。
- エラーは例外で上げず、`errorStore` など共通ハンドラへ委譲する。
