/**
 * タスクドメインサービス
 *
 * タスクに関連する全ての操作を提供します
 */

import { taskStore } from '$lib/stores/tasks.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { taskListStore } from '$lib/stores/task-list-store.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { TaskRecurrenceService } from '../task-recurrence';
import { TaskOperations } from './task-operations';

// ===== 新しいAPI（推奨） =====
export { TaskBackend } from './task-backend';
export { TaskOperations } from './task-operations';
export type { TaskOperationsDependencies } from './task-operations';

let _taskOperations: TaskOperations | undefined;

function createTaskOperations(): TaskOperations {
	return new TaskOperations({
		taskStore,
		taskCoreStore,
		taskListStore,
		tagStore,
		errorHandler,
		recurrenceService: new TaskRecurrenceService()
	});
}

export function getTaskOperations(): TaskOperations {
	if (!_taskOperations) {
		_taskOperations = createTaskOperations();
	}
	return _taskOperations;
}

/**
 * taskOperations - タスク操作の統一インターフェース
 *
 * UIコンポーネントから直接呼び出すための Proxy インスタンス
 * すべてのタスク操作はこのインスタンスを通じて行います
 *
 * 使用例:
 * ```typescript
 * import { taskOperations } from '$lib/services/domain/task';
 *
 * // タスク作成
 * await taskOperations.addTask(listId, { title: '新しいタスク' });
 *
 * // タスク更新
 * await taskOperations.updateTask(taskId, { title: '更新されたタイトル' });
 *
 * // ステータス変更
 * await taskOperations.toggleTaskStatus(taskId);
 * ```
 */
export const taskOperations = new Proxy({} as TaskOperations, {
	get(_target, prop) {
		const operations = getTaskOperations();
		const value = operations[prop as keyof TaskOperations];
		return typeof value === 'function' ? value.bind(operations) : value;
	}
});

