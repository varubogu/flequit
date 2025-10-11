# フロントエンド固有のコーディングルール

## Svelte 5 設計パターン

### 状態管理
- **$state**: リアクティブな状態
- **$derived**: 派生状態（計算されたプロパティ）
- **$effect**: 副作用処理
- **クラスベースストア**: 複雑な状態管理に使用

### コンポーネント設計
- **props**: `let { prop }: Props = $props()`
- **イベント**: コールバック関数を優先、CustomEventは必要時のみ
- **スニペット**: `Snippet`型を使用した子コンテンツ渡し

## コンポーネント設計原則

- shadcn-svelteコンポーネント（`@src/lib/components/ui`は極力オリジナルを維持する
- 機能別コンポーネントは適切なディレクトリに配置
- 200行を超える場合は機能分割を検討
- メッセージはInlang Paraglideを使用して常に国際化対応
- コンポーネントの単体テスト作成時、外部UIライブラリのモックは使わない。外部UIライブラリ以外はモック化する

### ❌ 禁止パターン: `-logic.svelte.ts` ファイル

**新規開発では `-logic.svelte.ts` パターンの使用を禁止します。**

理由：
- Svelte 5のrunesはコンポーネント内で直接使用することを前提としている
- クラスベースロジックは過度な抽象化を生み、可読性を低下させる
- propsのバインディングが複雑化し、メンテナンス性が悪化する

**推奨パターン**:

```svelte
<!-- ❌ 旧パターン（禁止） -->
<script lang="ts">
  import { TaskItemLogic } from './task-item-logic.svelte';
  const logic = new TaskItemLogic();
</script>

<button onclick={logic.handleEdit.bind(logic)}>Edit</button>

<!-- ✅ 新パターン（推奨） -->
<script lang="ts">
  let isEditing = $state(false);
  let editedTitle = $state('');

  function handleEdit() {
    isEditing = true;
  }
</script>

<button onclick={handleEdit}>Edit</button>
```

**既存コードの扱い**:
- 既存の `-logic.svelte.ts` ファイルは段階的に移行予定
- 新規機能追加時は上記の推奨パターンを使用すること

## レイヤーアーキテクチャ

詳細は `docs/develop/design/frontend/layers.md` を参照してください。

**重要なルール**:
- ❌ **コンポーネントから `infrastructure/` への直接アクセスは禁止**
- ✅ **必ず `services/` 経由でアクセス**
- ❌ **Storeへの直接書き込みは禁止**
- ✅ **書き込みは必ずDomain Service経由**

```typescript
// ❌ NG: Infrastructure層への直接アクセス
import { TauriBackend } from '$lib/infrastructure/backends/tauri';

// ✅ OK: Services層経由
import { TaskService } from '$lib/services';
```

## 開発ワークフロー

詳細は `docs/develop/rules/workflow.md` を参照してください。
