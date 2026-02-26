# Svelte 5 設計パターン

## 概要

本文書では、Flequitアプリケーションで採用するSvelte 5の設計パターンとベストプラクティスを定義します。Svelte 5の新機能であるrunesを中心とした設計指針を示します。

関連ドキュメント:

- component-patterns: docs/ja/develop/design/frontend/component-patterns.md
- anti-patterns: docs/ja/develop/design/frontend/anti-patterns.md

禁止事項（要約）:

- -logic.svelte.ts形式のロジッククラス新規追加
- プロキシのみのサービス層増設（UI→Store→Backendから逸脱）
- 同一概念の型二重定義と変換関数の乱立

## 状態管理

### $state: リアクティブな状態

基本的なリアクティブ状態の管理に使用します。

```typescript
// stores/task.svelte.ts
export class TaskStore {
  private tasks = $state<Task[]>([]);
  private loading = $state<boolean>(false);

  get allTasks() {
    return this.tasks;
  }

  get isLoading() {
    return this.loading;
  }

  addTask(task: Task) {
    this.tasks.push(task);
  }
}
```

### $derived: 派生状態（計算されたプロパティ）

他の状態から派生する値の計算に使用します。

```typescript
// stores/task.svelte.ts
export class TaskStore {
  private tasks = $state<Task[]>([]);

  get completedTasks() {
    return $derived(this.tasks.filter((task) => task.status === 'completed'));
  }

  get progress() {
    return $derived(this.tasks.length > 0 ? this.completedTasks.length / this.tasks.length : 0);
  }
}
```

### $effect: 副作用処理

状態変更に基づく副作用の実行に使用します。

```typescript
// components/task-list.svelte
<script lang="ts">
  import { taskStore } from '$lib/stores/task.svelte';

  // タスク変更時にローカルストレージに保存
  $effect(() => {
    localStorage.setItem('tasks', JSON.stringify(taskStore.allTasks));
  });

  // クリーンアップが必要な場合
  $effect(() => {
    const interval = setInterval(() => {
      console.log('Current tasks:', taskStore.allTasks.length);
    }, 5000);

    return () => clearInterval(interval);
  });
</script>
```

### クラスベースストア

複雑な状態管理には、クラスベースのストアを使用します。

```typescript
// stores/project.svelte.ts
import type { Project, Task } from '$lib/types';

export class ProjectStore {
  private projects = $state<Project[]>([]);
  private currentProject = $state<Project | null>(null);
  private loading = $state<boolean>(false);
  private error = $state<string | null>(null);

  // ゲッター
  get allProjects() {
    return this.projects;
  }

  get current() {
    return this.currentProject;
  }

  get isLoading() {
    return this.loading;
  }

  get hasError() {
    return this.error !== null;
  }

  // 派生状態
  get activeProjects() {
    return $derived(this.projects.filter((project) => !project.isArchived));
  }

  // アクション
  async loadProjects() {
    this.loading = true;
    this.error = null;

    try {
      const projects = await invoke<Project[]>('get_projects');
      this.projects = projects;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      this.loading = false;
    }
  }

  selectProject(projectId: string) {
    this.currentProject = this.projects.find((p) => p.id === projectId) || null;
  }

  addProject(project: Project) {
    this.projects.push(project);
  }

  updateProject(updatedProject: Project) {
    const index = this.projects.findIndex((p) => p.id === updatedProject.id);
    if (index !== -1) {
      this.projects[index] = updatedProject;
    }
  }

  deleteProject(projectId: string) {
    this.projects = this.projects.filter((p) => p.id !== projectId);
    if (this.currentProject?.id === projectId) {
      this.currentProject = null;
    }
  }
}

// シングルトンとしてエクスポート
export const projectStore = new ProjectStore();
```

## コンポーネント設計

注意: 詳細な推奨/非推奨パターンは component-patterns.md / anti-patterns.md を参照。ここではSvelte 5固有の指針のみを扱う。

### Props定義

Svelte 5のprops定義パターンを使用します。

```typescript
// components/task-item.svelte
<script lang="ts">
  import type { Task } from '$lib/types';

  interface Props {
    task: Task;
    readonly?: boolean;
    onUpdate?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
  }

  let {
    task,
    readonly = false,
    onUpdate = () => {},
    onDelete = () => {}
  }: Props = $props();

  // ローカル状態
  let isEditing = $state<boolean>(false);
  let editedTitle = $state<string>(task.title);

  // 派生状態
  const canEdit = $derived(!readonly && !task.isCompleted);

  function handleSave() {
    if (editedTitle.trim()) {
      onUpdate({ ...task, title: editedTitle.trim() });
      isEditing = false;
    }
  }
</script>
```

### イベントハンドリング

コールバック関数を優先し、CustomEventは必要時のみ使用します。

```typescript
// 推奨: コールバック関数
<script lang="ts">
  interface Props {
    onTaskComplete: (taskId: string) => void;
    onTaskEdit: (task: Task) => void;
  }

  let { onTaskComplete, onTaskEdit }: Props = $props();
</script>

<button onclick={() => onTaskComplete(task.id)}>
  Complete
</button>

<!-- 必要時のみCustomEvent -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    taskUpdated: { task: Task; changes: Partial<Task> };
  }>();

  function handleUpdate(changes: Partial<Task>) {
    const updatedTask = { ...task, ...changes };
    dispatch('taskUpdated', { task: updatedTask, changes });
  }
</script>
```

### スニペット（Snippet）

子コンテンツの渡しにはSnippet型を使用します。

```typescript
// components/modal.svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: Snippet;
    actions?: Snippet;
  }

  let { title, isOpen, onClose, children, actions }: Props = $props();
</script>

{#if isOpen}
  <div class="modal-overlay" onclick={onClose}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <header class="modal-header">
        <h2>{title}</h2>
        <button onclick={onClose}>×</button>
      </header>

      <main class="modal-body">
        {@render children()}
      </main>

      {#if actions}
        <footer class="modal-actions">
          {@render actions()}
        </footer>
      {/if}
    </div>
  </div>
{/if}
```

使用例：

```svelte
<Modal title="Edit Task" isOpen={isModalOpen} onClose={() => (isModalOpen = false)}>
  <TaskForm task={selectedTask} onSave={handleSave} />

  {#snippet actions()}
    <button onclick={handleCancel}>Cancel</button>
    <button onclick={handleSave}>Save</button>
  {/snippet}
</Modal>
```

## リアクティビティのベストプラクティス

### 1. 状態の最小化

必要最小限の状態のみを$stateで管理し、できる限り$derivedを使用します。

```typescript
// 良い例
class TaskStore {
  private tasks = $state<Task[]>([]);

  get completedTasks() {
    return $derived(this.tasks.filter((t) => t.status === 'completed'));
  }

  get pendingTasks() {
    return $derived(this.tasks.filter((t) => t.status === 'pending'));
  }
}

// 悪い例 - 冗長な状態管理
class TaskStore {
  private tasks = $state<Task[]>([]);
  private completedTasks = $state<Task[]>([]);
  private pendingTasks = $state<Task[]>([]);

  // 手動で同期が必要 - バグの原因となりやすい
  addTask(task: Task) {
    this.tasks.push(task);
    if (task.status === 'completed') {
      this.completedTasks.push(task);
    } else {
      this.pendingTasks.push(task);
    }
  }
}
```

### 2. $effectの適切な使用

$effectは外部システムとの同期にのみ使用し、内部状態の更新には使用しません。

```typescript
// 良い例 - 外部システムとの同期
$effect(() => {
  // ローカルストレージとの同期
  localStorage.setItem('userPreferences', JSON.stringify(preferences));
});

$effect(() => {
  // WebSocketとの同期
  if (isConnected) {
    websocket.send(JSON.stringify(currentState));
  }
});

// 悪い例 - 内部状態の更新（$derivedを使うべき）
let count = $state(0);
let doubledCount = $state(0);

$effect(() => {
  doubledCount = count * 2; // これは$derivedで行うべき
});
```

### 3. メモリリークの防止

$effectでリソースを作成する場合は、必ずクリーンアップを行います。

```typescript
$effect(() => {
  const eventListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };

  document.addEventListener('keydown', eventListener);

  // クリーンアップ
  return () => {
    document.removeEventListener('keydown', eventListener);
  };
});
```

## パフォーマンス最適化

### 1. 計算の最適化

複雑な計算は$derivedでメモ化します。

```typescript
class DataStore {
  private rawData = $state<DataItem[]>([]);

  // 重い計算はメモ化される
  get processedData() {
    return $derived(
      this.rawData
        .filter((item) => item.isActive)
        .map((item) => ({
          ...item,
          computed: heavyComputation(item)
        }))
        .sort((a, b) => a.priority - b.priority)
    );
  }
}
```

### 2. 条件付きレンダリング

不要なレンダリングを避けるため、適切に条件分岐を使用します。

```svelte
<!-- 良い例 -->
{#if items.length > 0}
  <ul>
    {#each items as item (item.id)}
      <TaskItem {item} />
    {/each}
  </ul>
{:else}
  <EmptyState />
{/if}

<!-- 悪い例 - 常にレンダリングされる -->
<ul class:hidden={items.length === 0}>
  {#each items as item (item.id)}
    <TaskItem {item} />
  {/each}
</ul>
```

## エラーハンドリング

### 1. ストアレベルでのエラー管理

```typescript
class ApiStore {
  private data = $state<any[]>([]);
  private error = $state<string | null>(null);
  private loading = $state<boolean>(false);

  async fetchData() {
    this.loading = true;
    this.error = null;

    try {
      const result = await api.getData();
      this.data = result;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch data:', err);
    } finally {
      this.loading = false;
    }
  }

  clearError() {
    this.error = null;
  }
}
```

### 2. コンポーネントレベルでのエラー表示

```svelte
<script lang="ts">
  import { apiStore } from '$lib/stores/api.svelte';

  $effect(() => {
    apiStore.fetchData();
  });
</script>

{#if apiStore.isLoading}
  <LoadingSpinner />
{:else if apiStore.hasError}
  <ErrorMessage
    message={apiStore.error}
    onRetry={() => apiStore.fetchData()}
    onDismiss={() => apiStore.clearError()}
  />
{:else}
  <DataList items={apiStore.data} />
{/if}
```

このパターンに従って実装することで、保守性が高く、パフォーマンスに優れたSvelte 5アプリケーションを構築できます。
