/**
 * サブタスクドメインサービス
 *
 * サブタスクに関連する全ての操作を提供します
 */

import { taskStore } from '$lib/stores/tasks.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { subTaskStore } from '$lib/stores/sub-task-store.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { TaggingService } from '$lib/services/domain/tagging';
import { SubTaskOperations } from './subtask-operations';

// ===== バックエンド通信 =====
export { SubTaskBackend } from './subtask-backend';

// ===== ビジネスロジック =====
export { SubTaskOperations } from './subtask-operations';
export type { SubTaskOperationsDependencies } from './subtask-operations';

let _subTaskOperations: SubTaskOperations | undefined;

function createSubTaskOperations(): SubTaskOperations {
  return new SubTaskOperations({
    taskStore,
    taskCoreStore,
    subTaskStore,
    tagStore,
    taggingService: TaggingService,
    errorHandler
  });
}

export function getSubTaskOperations(): SubTaskOperations {
  if (!_subTaskOperations) {
    _subTaskOperations = createSubTaskOperations();
  }
  return _subTaskOperations;
}

/**
 * subTaskOperations - サブタスク操作の統一インターフェース
 *
 * UIコンポーネントから直接呼び出すための Proxy インスタンス
 * すべてのサブタスク操作はこのインスタンスを通じて行います
 *
 * 使用例:
 * ```typescript
 * import { subTaskOperations } from '$lib/services/domain/subtask';
 *
 * // サブタスク作成
 * await subTaskOperations.addSubTask(taskId, { title: '新しいサブタスク' });
 *
 * // サブタスク更新
 * subTaskOperations.updateSubTask(subTaskId, { title: '更新されたタイトル' });
 *
 * // ステータス変更
 * subTaskOperations.changeSubTaskStatus(subTaskId, 'completed');
 * ```
 */
export const subTaskOperations = new Proxy({} as SubTaskOperations, {
  get(_target, prop) {
    const operations = getSubTaskOperations();
    const value = operations[prop as keyof SubTaskOperations];
    return typeof value === 'function' ? value.bind(operations) : value;
  }
});
