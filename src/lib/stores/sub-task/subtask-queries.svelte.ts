import type { IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { SubTask } from '$lib/types/sub-task';

/**
 * サブタスクの検索・取得操作
 *
 * 責務: サブタスクの検索、ID関連の取得
 */
export class SubTaskQueries {
	constructor(
		private projectStoreRef: IProjectStore,
		private selection: ISelectionStore
	) {}

	/**
	 * 選択中のサブタスクを取得
	 */
	get selectedSubTask(): SubTask | null {
		const id = this.selection.selectedSubTaskId;
		if (!id) return null;

		for (const project of this.projectStoreRef.projects) {
			for (const list of project.taskLists) {
				for (const task of list.tasks) {
					const subTask = task.subTasks.find((st) => st.id === id);
					if (subTask) return subTask;
				}
			}
		}
		return null;
	}

	/**
	 * サブタスクIDから親タスクIDを取得
	 */
	getTaskIdBySubTaskId(subTaskId: string): string | null {
		for (const project of this.projectStoreRef.projects) {
			for (const list of project.taskLists) {
				for (const task of list.tasks) {
					const subTask = task.subTasks.find((st) => st.id === subTaskId);
					if (subTask) {
						return task.id;
					}
				}
			}
		}
		return null;
	}

	/**
	 * サブタスクIDからプロジェクトIDを取得
	 */
	getProjectIdBySubTaskId(subTaskId: string): string | null {
		for (const project of this.projectStoreRef.projects) {
			for (const list of project.taskLists) {
				for (const task of list.tasks) {
					const subTask = task.subTasks.find((st) => st.id === subTaskId);
					if (subTask) {
						return project.id;
					}
				}
			}
		}
		return null;
	}
}
