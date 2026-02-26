# タスク詳細ナビゲーション設計

## 概要

タスク詳細画面からタスクとサブタスク間をナビゲートする機能の設計ドキュメントです。

## 要件

### 1. サブタスククリック時のナビゲーション

ユーザーがタスク詳細（タスクビュー）でサブタスクをクリックした時：

1. タスク一覧でサブタスクを選択する
2. タスク詳細ビューにサブタスクを表示する
3. 親タスクが折りたたまれている場合は展開する
4. （オプション）サブタスクがビューポート外にある場合はスクロールする

### 2. 親タスクへ移動ボタンのナビゲーション

ユーザーがタスク詳細（サブタスクビュー）で「親タスクへ移動」ボタンをクリックした時：

1. タスク一覧で親タスクを選択する
2. タスク詳細ビューに親タスクを表示する
3. 親タスクが別のタスクのサブタスクである場合は、そのタスクを展開する
4. （オプション）親タスクがビューポート外にある場合はスクロールする

## アーキテクチャ

### 状態管理

#### 現在の実装

- `showSubTasks`状態は各`task-item.svelte`コンポーネント内でローカルに管理されている
- コンポーネント外部から展開状態を制御する方法がない
- 選択状態は`selectionStore`で管理されている

#### 新しい実装

タスク一覧のUI状態（アコーディオンの展開状態を含む）を管理する新しいストアを作成します。

```typescript
// src/lib/stores/task-list/task-list-ui-state.svelte.ts

import { SvelteSet } from 'svelte/reactivity';

export class TaskListUIState {
  // サブタスクが展開されているタスクのIDを追跡
  // 自動的なリアクティビティのためにSvelteSetを使用
  private expandedTaskIds = $state<SvelteSet<string>>(new SvelteSet());

  /**
   * タスクのサブタスクが展開されているかチェック
   */
  isTaskExpanded(taskId: string): boolean {
    return this.expandedTaskIds.has(taskId);
  }

  /**
   * タスクの展開状態をトグル
   */
  toggleTaskExpansion(taskId: string): void {
    if (this.expandedTaskIds.has(taskId)) {
      this.expandedTaskIds.delete(taskId);
    } else {
      this.expandedTaskIds.add(taskId);
    }
    // SvelteSetは自動的にリアクティブなので、再代入は不要
  }

  /**
   * タスクのサブタスクを展開
   */
  expandTask(taskId: string): void {
    if (!this.expandedTaskIds.has(taskId)) {
      this.expandedTaskIds.add(taskId);
      // SvelteSetは自動的にリアクティブ
    }
  }

  /**
   * タスクのサブタスクを折りたたみ
   */
  collapseTask(taskId: string): void {
    if (this.expandedTaskIds.has(taskId)) {
      this.expandedTaskIds.delete(taskId);
      // SvelteSetは自動的にリアクティブ
    }
  }

  /**
   * すべての展開状態をリセット（テスト用）
   */
  reset(): void {
    this.expandedTaskIds.clear();
  }
}

export const taskListUIState = new TaskListUIState();
```

### コンポーネントの更新

#### task-item.svelte

ローカルの`showSubTasks`状態をストアベースの状態に置き換えます：

```typescript
// 変更前
let showSubTasks = $state(false);

// 変更後
import { taskListUIState } from '$lib/stores/task-list/task-list-ui-state.svelte';

const showSubTasks = $derived(taskListUIState.isTaskExpanded(task.id));

function toggleSubTasksAccordion(event?: Event) {
  event?.stopPropagation();
  taskListUIState.toggleTaskExpansion(task.id);
}
```

### サービスレイヤーの更新

#### task-detail-actions.ts

`handleSubTaskClick`を更新して親タスクを展開：

```typescript
handleSubTaskClick = (subTaskId: string) => {
  // 親タスクIDを取得してタスク一覧で展開
  const parentTaskId = subTaskStore.getTaskIdBySubTaskId(subTaskId);
  if (parentTaskId) {
    // サブタスクが見えるようにタスク一覧で親タスクを展開
    taskListUIState.expandTask(parentTaskId);
  }

  // サブタスクを選択
  this.#domain.selectSubTask(subTaskId);

  // オプション: サブタスクまでスクロール
  // this.scrollToSubTask(subTaskId);
};
```

`handleGoToParentTask`を更新して必要に応じて祖父タスクを展開：

```typescript
handleGoToParentTask = () => {
  const current = this.#store.currentItem;
  if (!isSubTask(current)) return;

  const parentTaskId = current.taskId;

  // 親タスクがそれ自体サブタスクかチェック
  const parentTask = taskStore.getTaskById(parentTaskId);
  if (!parentTask) return;

  // 親が別のタスクのサブタスクである場合、そのタスクを展開する必要がある
  // 注意: 現在のデータモデルでは、タスクが他のタスクのサブタスクとして
  // ネストされることはない。これはモデルが変更された場合の将来対応。

  // 親タスクを選択
  this.#domain.selectTask(parentTaskId);

  // オプション: 親タスクまでスクロール
  // this.scrollToTask(parentTaskId);
};
```

## データフロー

### サブタスククリック時のフロー

```
ユーザーがタスク詳細でサブタスクをクリック
    ↓
handleSubTaskClick(subTaskId)
    ↓
1. サブタスクと親タスクIDを取得
2. taskListUIState.expandTask(parentTaskId)
3. selectionStore.selectSubTask(subTaskId)
    ↓
タスク一覧が更新される:
  - 親タスクのアコーディオンが展開される
  - サブタスクがハイライトされる
  - タスク詳細にサブタスクが表示される
```

### 親タスクへ移動時のフロー

```
ユーザーが「親タスクへ移動」ボタンをクリック
    ↓
handleGoToParentTask()
    ↓
1. 現在のサブタスクの親タスクIDを取得
2. selectionStore.selectTask(parentTaskId)
    ↓
タスク一覧が更新される:
  - 親タスクがハイライトされる
  - タスク詳細に親タスクが表示される
```

## 重要な実装の詳細

### コンテキストバインディングの問題

ストアのメソッドをドメインアクションに渡す際、**メソッドを直接渡さないでください**。`this`コンテキストが失われます。必ずアロー関数でラップしてください：

```typescript
// ❌ 不正解 - thisコンテキストが失われる
const domainActions: TaskDetailDomainActions = {
  selectTask: selectionStore.selectTask,
  selectSubTask: selectionStore.selectSubTask
};

// ✅ 正解 - アロー関数でラップ
const domainActions: TaskDetailDomainActions = {
  selectTask: (taskId: string | null) => selectionStore.selectTask(taskId),
  selectSubTask: (subTaskId: string | null) => selectionStore.selectSubTask(subTaskId)
};
```

この問題は、JavaScriptのメソッド参照がスタンドアロン関数として渡されると`this`バインディングを失うために発生します。アロー関数ラッパーは、メソッドが正しいコンテキストで呼び出されることを保証します。

## ストアの依存関係

```
TaskListUIState (新規)
  ↓
TaskItem (コンポーネント)
  - 使用: isTaskExpanded(taskId)
  - 呼び出し: toggleTaskExpansion(taskId)

TaskDetailActions (サービス)
  - 呼び出し: expandTask(taskId)
```

## テスト戦略

### 単体テスト

1. **TaskListUIStateストア**
   - `isTaskExpanded`が正しい状態を返すことをテスト
   - `toggleTaskExpansion`が状態を正しくトグルすることをテスト
   - `expandTask`がタスクを展開することをテスト
   - `collapseTask`がタスクを折りたたむことをテスト
   - `reset`がすべての状態をクリアすることをテスト

### 統合テスト

1. **サブタスククリックナビゲーション**
   - 前提条件: サブタスクを持つタスク、サブタスクは折りたたまれている
   - 操作: ユーザーがタスク詳細でサブタスクをクリック
   - 期待結果: タスク一覧でサブタスクが展開され、サブタスクが選択される

2. **親タスクへ移動ナビゲーション**
   - 前提条件: サブタスクがタスク詳細で選択されている
   - 操作: ユーザーが「親タスクへ移動」をクリック
   - 期待結果: 親タスクが選択され、タスク詳細に表示される

### E2Eテスト

1. **完全なサブタスクナビゲーションフロー**
   - サブタスクを持つタスクを作成
   - サブタスクを折りたたむ
   - タスク詳細でタスクを開く
   - サブタスクをクリック
   - タスク一覧でサブタスクが展開されていることを確認
   - サブタスクが選択され、詳細に表示されていることを確認

2. **完全な親タスクナビゲーションフロー**
   - サブタスクを選択
   - タスク詳細でサブタスクを開く
   - 「親タスクへ移動」をクリック
   - 親タスクが選択され、詳細に表示されていることを確認

## 移行に関する注意事項

### 破壊的変更

なし - これは純粋に機能の追加です。

### 非推奨

なし

### 後方互換性

完全に後方互換性があります。UI状態ストアは新しい追加であり、既存のAPIを変更しません。

## パフォーマンスに関する考慮事項

1. **状態更新**: Svelte 5の`$state`と`SvelteSet`を使用することで、自動的なリアクティビティと最小限の再レンダリングを実現
2. **Set操作**: `SvelteSet<string>`を使用してO(1)のルックアップパフォーマンス
3. **メモリ**: 展開状態は展開されたタスクに対してのみ保存され、メモリへの影響は最小限
4. **リアクティビティ**: `SvelteSet`は手動での再代入なしに自動的なリアクティビティを提供し、パフォーマンスを向上

## 将来の拡張

1. **状態の永続化**: アプリ再起動後も持続するようにlocalStorageに展開状態を保存
2. **一括操作**: `expandAll()`と`collapseAll()`メソッドを追加
3. **アニメーション**: スムーズな展開/折りたたみアニメーションを追加
4. **キーボードナビゲーション**: 展開/折りたたみのキーボードショートカットを追加
5. **自動スクロール**: 選択されたタスク/サブタスクへの自動スクロールを実装

## 関連ドキュメント

- [ストアアーキテクチャ](./store-architecture.md)
- [コンポーネントパターン](./component-patterns.md)
- [Svelte 5パターン](./svelte5-patterns.md)
