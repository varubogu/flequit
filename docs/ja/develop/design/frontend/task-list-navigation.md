# タスク詳細ナビゲーション設計

タスク詳細画面からタスクとサブタスク間をナビゲートする機能の設計。

> 実装の正本は `src/lib/stores/task-list/`、`src/lib/services/ui/task/` を参照。

## 要件

### サブタスククリック時のナビゲーション

タスク詳細 (タスクビュー) でサブタスクをクリックした時:

1. タスク一覧でサブタスクを選択する
2. タスク詳細ビューにサブタスクを表示する
3. 親タスクが折りたたまれている場合は展開する
4. (オプション) サブタスクがビューポート外なら自動スクロール

### 「親タスクへ移動」ボタン

タスク詳細 (サブタスクビュー) で「親タスクへ移動」をクリックした時:

1. タスク一覧で親タスクを選択する
2. タスク詳細ビューに親タスクを表示する
3. 親タスクが別タスクのサブタスクの場合、その上位タスクを展開する
4. (オプション) 親タスクがビューポート外なら自動スクロール

## アーキテクチャ

### 新しいストア: `TaskListUIState`

タスク一覧の UI 状態 (アコーディオンの展開状態を含む) を管理する専用ストア。

実装参照: `src/lib/stores/task-list/task-list-ui-state.svelte.ts`

主な API:

- `isTaskExpanded(taskId): boolean` - 展開判定
- `toggleTaskExpansion(taskId)` - トグル
- `expandTask(taskId)` / `collapseTask(taskId)` - 明示的な展開/折りたたみ
- `reset()` - 全展開状態をクリア (テスト用)

実装上の要点:

- `SvelteSet<string>` を使用 (自動リアクティブ + O(1) ルックアップ)
- `$state<SvelteSet<string>>(new SvelteSet())` で初期化
- 再代入不要 (`SvelteSet` の `add` / `delete` で自動更新)

### コンポーネントの更新

`task-item.svelte` のローカル `showSubTasks` 状態を、ストア駆動の `$derived(taskListUIState.isTaskExpanded(task.id))` に置き換える。トグル操作は `taskListUIState.toggleTaskExpansion(task.id)` を呼ぶ。

### サービス層の更新

`task-detail-actions.ts` の以下を更新:

- `handleSubTaskClick(subTaskId)`: 親タスク ID を取得 → `taskListUIState.expandTask(parentTaskId)` → `selectionStore.selectSubTask(subTaskId)`
- `handleGoToParentTask()`: 現在のサブタスクの `taskId` を取得 → `selectionStore.selectTask(parentTaskId)` (将来、親が他タスクのサブタスクとなるモデルになった場合は祖父タスクを展開する処理を追加)

## データフロー

### サブタスククリック時

```
ユーザーがタスク詳細でサブタスクをクリック
    ↓
handleSubTaskClick(subTaskId)
    ↓
1. サブタスクと親タスク ID を取得
2. taskListUIState.expandTask(parentTaskId)
3. selectionStore.selectSubTask(subTaskId)
    ↓
タスク一覧が更新:
  - 親タスクのアコーディオンが展開
  - サブタスクがハイライト
  - タスク詳細にサブタスクが表示
```

### 親タスクへ移動時

```
「親タスクへ移動」をクリック
    ↓
handleGoToParentTask()
    ↓
1. 現サブタスクの親タスク ID を取得
2. selectionStore.selectTask(parentTaskId)
    ↓
タスク一覧が更新:
  - 親タスクがハイライト
  - タスク詳細に親タスクを表示
```

## 重要な実装上の注意

### コンテキストバインディング

ストアのメソッドをドメインアクションに渡す際、**メソッドを直接渡さない** こと (`this` コンテキストを失う)。必ずアロー関数でラップする:

- ❌ `selectTask: selectionStore.selectTask` (`this` 喪失)
- ✅ `selectTask: (taskId) => selectionStore.selectTask(taskId)`

JavaScript のメソッド参照がスタンドアロン関数として渡されると `this` バインディングを失う。アロー関数ラッパーで正しいコンテキストを保証する。

## 依存関係

```
TaskListUIState (新規)
  ↓
TaskItem コンポーネント
  - 使用: isTaskExpanded(taskId)
  - 呼び出し: toggleTaskExpansion(taskId)

TaskDetailActions サービス
  - 呼び出し: expandTask(taskId)
```

## テスト戦略

### 単体テスト (TaskListUIState)

- `isTaskExpanded` が正しい状態を返すこと
- `toggleTaskExpansion` のトグル動作
- `expandTask` / `collapseTask` の明示的操作
- `reset` で全状態クリア

### 統合テスト

- **サブタスククリック**: 折りたたまれた状態 → 詳細でクリック → 一覧で展開 + サブタスク選択
- **親タスクへ移動**: サブタスクが詳細表示 → ボタンクリック → 親タスクが選択 + 詳細表示

### E2E

- 完全なサブタスクナビゲーションフロー (作成 → 折りたたみ → クリック → 展開確認)
- 完全な親タスクナビゲーションフロー

## 移行・互換性

- **破壊的変更**: なし (純粋な機能追加)
- **非推奨**: なし
- **後方互換性**: 完全互換 (UI 状態ストアは新規追加、既存 API は不変)

## パフォーマンス

- `SvelteSet` による自動リアクティブ + 最小限の再レンダリング
- O(1) ルックアップ
- 展開状態は展開されたタスクのみ保存 → メモリ影響最小
- 手動再代入不要

## 将来の拡張

- **状態永続化**: localStorage に展開状態を保存し、再起動後も保持
- **一括操作**: `expandAll()` / `collapseAll()` メソッド追加
- **アニメーション**: スムーズな展開/折りたたみ
- **キーボードナビゲーション**: 展開/折りたたみのショートカット
- **自動スクロール**: 選択されたタスク/サブタスクへ自動スクロール

## 関連

- [Store & Service アーキテクチャ](./store-and-service-architecture.md)
- [Svelte 5 パターン](./svelte5-patterns.md)
