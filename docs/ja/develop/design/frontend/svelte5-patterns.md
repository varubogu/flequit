# Svelte 5 設計パターン

Flequit で採用する Svelte 5 (runes) 中心の設計パターン。

> 実装の正本は `src/lib/stores/`、`src/lib/components/` を参照。本書は原則と適用範囲のみを述べる。

## コンポーネント分割指針

- **シンプル (〜100 行)**: ロジッククラス不要。`$state` / `$derived` / `$effect` を直接使用
- **中規模 (100-200 行)**: 内部関数でロジック分離 (export しない)。Context API で状態共有
- **大規模 (200 行超)**: 機能別に分割 (header / content / footer 等)。分割後も各 200 行以内目安

## アンチパターン

- ❌ **ロジッククラス (`-logic.svelte.ts`)**: runes をクラスに閉じ込めるとコンポーネントが薄くなりすぎる → コンポーネント内で直接 runes を使用
- ❌ **過度なサービス層**: プロキシのみの層が増殖しデバッグ困難 → 必要最小限の層 (UI → Store → Backend)
- ❌ **型の二重定義**: 同一概念の複数型と変換関数の乱立 → 統一型を採用 (例: `RecurrenceRule`)

## 状態管理 (runes)

### `$state`: リアクティブな状態

- ストア内の基本的なリアクティブ状態に使用
- `.svelte.ts` 拡張子内でのみ有効

### `$derived`: 派生状態

- 他の状態から計算される値に使用
- 派生計算は **必ず** `$derived` で。手動 `$effect` での同期は禁止

### `$effect`: 副作用

- **使用すべき場面**: 外部システムとの同期 (localStorage / WebSocket / DOM イベント登録)
- **使用してはならない場面**: 内部状態の派生計算 (それは `$derived` の役割)
- **クリーンアップ必須**: タイマー・イベントリスナー等を使う場合は return でクリーンアップ関数を返す

実装参照:
- ストア例: `src/lib/stores/tasks.svelte.ts`
- 副作用クリーンアップ例: `src/lib/components/...`

### クラスベースストア

複雑な状態管理にはクラスベースストアを使用する。シングルトン export が基本。詳細は [`store-and-service-architecture.md`](./store-and-service-architecture.md) 参照。

## コンポーネント設計

### Props 定義

Svelte 5 の `$props()` を使用する。Props は明示的な `interface Props` で型付けする。

```svelte
<script lang="ts">
  interface Props {
    task: Task;
    readonly?: boolean;
    onUpdate?: (task: Task) => void;
  }
  let { task, readonly = false, onUpdate = () => {} }: Props = $props();
</script>
```

### イベントハンドリング

- **コールバック関数を優先** (props 経由で受け取る)
- CustomEvent (`createEventDispatcher`) は必要時のみ使用 (例: イベントを複数階層で透過する場合)

### スニペット (Snippet)

子コンテンツの受け渡しは `Snippet` 型を使用する。Modal や Layout 系コンポーネントで活用。`{@render children()}` / `{#snippet name()}...{/snippet}` で記述。

実装参照: `src/lib/components/shared/modal.svelte` (該当があれば)

### コンポーネントからのバックエンド呼び出し

❌ コンポーネントから `invoke` 直呼び出しや Infrastructure import は禁止
✅ Services 層 (`$lib/services/domain/...`) のみ呼び出す

詳細は [`layers.md`](./layers.md) 参照。

## リアクティビティのベストプラクティス

### 1. 状態の最小化

`$state` で持つのは「真の入力」のみ。導出可能な値は `$derived` を使う。状態を二重に持つと手動同期が必要になり、バグの温床になる。

### 2. `$effect` の適切な使用

- 外部システムとの同期にのみ使用
- 内部状態の更新には使用しない (`$derived` を使う)

### 3. メモリリーク防止

`$effect` 内で生成したリソース (event listener / timer / subscription) は必ず return のクリーンアップ関数で解放する。

## パフォーマンス最適化

- **重い計算**: `$derived` でメモ化される
- **条件付きレンダリング**: `{#if}` を使い、不要な要素は完全にレンダリング外へ
- **リスト**: `{#each items as item (item.id)}` で **必ず key** を指定

## エラーハンドリング (UI 層)

- ストアに `error` / `loading` 状態を持たせ、コンポーネントで `{#if loading}` / `{:else if error}` / `{:else}` の三状態を扱う
- Operations サービスでは **楽観的更新 + 失敗時ロールバック** パターン (詳細は [`store-and-service-architecture.md`](./store-and-service-architecture.md) 参照)

## 関連ドキュメント

- [Store & Service アーキテクチャ](./store-and-service-architecture.md)
- [レイヤーアーキテクチャ](./layers.md)
- [コンポーネント実装規約 (rules)](../../rules/frontend.md)
