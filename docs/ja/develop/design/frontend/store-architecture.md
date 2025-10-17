# フロントエンドストア設計指針

## 目的

- ストアをアプリ全体の「リアクティブ状態キャッシュ」として統一的に扱い、副作用はサービス層へ移譲する。
- 依存関係と初期化順序を明確化し、循環参照や初期化順序起因のバグを防ぐ。
- テスト容易性・差し替え可能性を確保しつつ、運用負荷を最小限に抑える。

## 基本方針

- ストアはシングルトンとして定義し、アプリ起動フェーズで初期化する。
- ルート（レイアウト）レベルでストアを束ね、必要なコンポーネントへ明示的に渡す（Props または Context）。
- 副作用（永続化・通信・複合ロジック）は `services/` 配下に集約し、ストアは状態変換と購読 API に限定する。
- ストア間依存は一方向に限定し、相互参照が必要な場合はファサードもしくは注入ポイントを設けて循環を排除する。

## ストア分類と責務

| 区分 | 主な責務 | 依存関係 |
| --- | --- | --- |
| Domain Store | ドメイン状態の保持／派生値の提供。副作用を持たない。 | 同一ドメインのユーティリティ (`utils`, `types`) |
| UI Store | ビュー状態（選択・フィルタ・ダイアログ等）の管理。 | Domain Store（片方向） |
| Infrastructure Store（必要時） | 環境情報やバックエンド種別の保持。 | どの層からも参照可能だが、ビジネスロジックは持たない |

## 初期化規則

1. `initStores()`（もしくは同等のブートストラップ関数）で全ストアを生成し、初期状態を構築する。
2. ストア生成と同時に、必要なサービスへ依存注入を行う（例: `configureMutations`）。
3. フレームワーク側では、アプリケーションエントリ（例: `src/hooks.client.ts` やレイアウトコンポーネント）で `initStores()` を一度だけ呼び出す。
4. テストでは `initStoresForTest()` / `resetStores()` を用意し、任意のストアのみ生成またはリセットできるようにする。

## 依存注入ガイドライン

- ストア → サービス の直接 import を禁止し、サービスはコンストラクタ／ファクトリ経由でストアを受け取る。
- サービス → ストア の依存注入はブートストラップ関数内で一括実施し、ランタイムでの循環参照を避ける。
- ストア間で依存が必要な場合は、`constructor` の引数で受け取る方式を採用し、既定値は初期化フェーズで注入する。

## コンポーネントでの利用パターン

- ルート（または上位コンポーネント）がストアインスタンスを Props／Context で子へ渡す。
- 子コンポーネントは受け取ったストアをそのまま `$derived` / `$state` などの Rune に接続して購読する。
- グローバル import に頼るのは初期化フェーズのみとし、実行時の参照は渡されたインスタンスを使用する。

```svelte
<!-- Parent.svelte -->
<script lang="ts">
  import { taskStore } from '$lib/stores/tasks.svelte';

  // initStores()で初期化済みのインスタンスを受け取り、子へ渡す
</script>

<Child {taskStore} />
```

```svelte
<!-- Child.svelte -->
<script lang="ts">
  import type { TaskStore } from '$lib/stores/tasks.svelte';

  interface Props {
    taskStore: TaskStore;
  }

  const { taskStore }: Props = $props();

  const selectedTask = $derived(taskStore.selectedTask);
</script>
```

## テスト指針

- 各ストアに `reset()` などの初期化メソッドを持たせ、テスト間で状態が混ざらないようにする。
- ルート注入パターンに合わせ、テストではモックストアを Props／Context から注入する。
- ストア単体テストでは外部サービス依存をモック化し、純粋な状態変換／派生ロジックのみを検証する。

## 命名・配置

- `stores/<domain>/<domain>-store.svelte.ts` … Domain Store
- `stores/ui/<feature>-store.svelte.ts` … UI Store
- `services/ui/` … ストアに依存する UI 副作用
- `services/domain/` … 永続化やビジネスロジック
- `init/` または `services/bootstrap/` … ストア／サービスの初期化手順

## 例外・イベント処理

- ストア内でグローバルイベントへ直接登録しない。必要な場合はサービス層がイベントを受け取り、ストアを更新する。
- エラーは例外で上げず、`errorStore` など共通ハンドラへ委譲する。
