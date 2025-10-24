import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';
import { ProjectTreeTraverser } from '$lib/utils/project-tree-traverser';

/**
 * タスク読み取り操作
 *
 * 責務: タスクの検索、取得などの読み取り専用操作
 */
export class TaskCoreQueries {
	constructor(private projectsRef: () => ProjectTree[]) {}

	/**
	 * タスクIDでタスクを取得
	 */
	getTaskById(taskId: string): TaskWithSubTasks | null {
		return ProjectTreeTraverser.findTask(this.projectsRef(), taskId);
	}
}
