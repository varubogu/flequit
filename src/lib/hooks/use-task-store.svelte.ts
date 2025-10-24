import { taskStore, type TaskStore } from '$lib/stores/tasks.svelte';

/**
 * useTaskStore - タスクストアを取得するComposable
 *
 * 責務: コンポーネントにタスクストア機能を提供する統一的なインターフェース
 *
 * 利点:
 * - テスト時のモック化が容易
 * - 依存関係の注入パターンに準拠
 * - Svelte 5のrunesパターンに適合
 * - 既存のTaskStoreの優れた設計を活用
 *
 * TaskStoreは以下のサブストアを統合しています:
 * - TaskEntitiesStore: プロジェクトデータとタスクエンティティ管理
 * - TaskSelectionStore: 選択状態管理
 * - TaskDraftStore: 新規タスク下書き管理
 * - TaskTagOperations: タグ操作
 *
 * 使用例:
 * ```typescript
 * const taskStore = useTaskStore();
 * const allTasks = taskStore.allTasks;
 * const selectedTask = taskStore.selectedTask;
 * ```
 */
export function useTaskStore(): TaskStore {
	return taskStore;
}
