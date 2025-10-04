import type { ITaskListStore, IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { TaskListWithTasks } from '$lib/types/task-list';
import type { ProjectTree } from '$lib/types/project';
import { projectStore } from './project-store.svelte';
import { selectionStore } from './selection-store.svelte';
import { dataService } from '$lib/services/data-service';
import { errorHandler } from './error-handler.svelte';
import { SvelteDate } from 'svelte/reactivity';

/**
 * タスクリスト管理ストア
 *
 * 責務: タスクリストのCRUD操作、並び替え、プロジェクト間移動
 * 依存: ProjectStore（プロジェクト情報）, SelectionStore（選択状態）
 *
 * TaskStoreから分離して、タスクリスト管理の責務を明確化しています。
 */
export class TaskListStore implements ITaskListStore {
	constructor(
		private projectStoreRef: IProjectStore,
		private selection: ISelectionStore
	) {}

	// 派生状態
	get selectedTaskList(): TaskListWithTasks | null {
		const listId = this.selection.selectedListId;
		if (!listId) return null;

		for (const project of this.projectStoreRef.projects) {
			const list = project.taskLists.find((l) => l.id === listId);
			if (list) return list;
		}
		return null;
	}

	// CRUD操作
	async addTaskList(
		projectId: string,
		taskList: { name: string; description?: string; color?: string }
	) {
		try {
			const project = this.projectStoreRef.projects.find((p) => p.id === projectId);
			const taskListWithOrderIndex = {
				...taskList,
				order_index: project?.taskLists?.length ?? 0
			};
			const newTaskList = await dataService.createTaskListWithTasks(
				projectId,
				taskListWithOrderIndex
			);
			if (project) {
				if (!project.taskLists) {
					project.taskLists = [] as TaskListWithTasks[];
				}
				project.taskLists.push(newTaskList);
			}
			return newTaskList;
		} catch (error) {
			console.error('Failed to create task list:', error);
			return null;
		}
	}

	async updateTaskList(
		taskListId: string,
		updates: { name?: string; description?: string; color?: string }
	): Promise<TaskListWithTasks | null> {
		try {
			// taskListIdからprojectIdを取得
			const projectId = this.getProjectIdByListId(taskListId);
			if (!projectId) {
				throw new Error(`タスクリストID ${taskListId} に対応するプロジェクトが見つかりません。`);
			}

			const updatedTaskList = await dataService.updateTaskList(projectId, taskListId, updates);
			if (updatedTaskList) {
				for (const project of this.projectStoreRef.projects) {
					const listIndex = project.taskLists.findIndex((l) => l.id === taskListId);
					if (listIndex !== -1) {
						project.taskLists[listIndex] = {
							...project.taskLists[listIndex],
							...updatedTaskList
						};
						// 更新された TaskListWithTasks を返す
						return project.taskLists[listIndex];
					}
				}
			}
			return null;
		} catch (error) {
			console.error('Failed to update task list:', error);
			return null;
		}
	}

	async deleteTaskList(taskListId: string) {
		try {
			// taskListIdからprojectIdを取得
			const projectId = this.getProjectIdByListId(taskListId);
			if (!projectId) {
				throw new Error(`タスクリストID ${taskListId} に対応するプロジェクトが見つかりません。`);
			}

			const success = await dataService.deleteTaskList(projectId, taskListId);
			if (success) {
				for (const project of this.projectStoreRef.projects) {
					const listIndex = project.taskLists.findIndex((l) => l.id === taskListId);
					if (listIndex !== -1) {
						project.taskLists.splice(listIndex, 1);
						// 削除されたタスクリストが選択されていた場合はクリア
						if (this.selection.selectedListId === taskListId) {
							this.selection.selectList(null);
							this.selection.selectTask(null);
							this.selection.selectSubTask(null);
						}
						break;
					}
				}
			}
			return success;
		} catch (error) {
			console.error('Failed to delete task list:', error);
			return false;
		}
	}

	// 並び替え・移動
	async reorderTaskLists(projectId: string, fromIndex: number, toIndex: number) {
		const project = this.projectStoreRef.projects.find((p) => p.id === projectId);
		if (
			!project ||
			fromIndex === toIndex ||
			fromIndex < 0 ||
			toIndex < 0 ||
			fromIndex >= project.taskLists.length ||
			toIndex >= project.taskLists.length
		) {
			return;
		}

		const [movedTaskList] = project.taskLists.splice(fromIndex, 1);
		project.taskLists.splice(toIndex, 0, movedTaskList);

		// Update order indices and sync to backends
		project.updatedAt = new SvelteDate();
		for (let index = 0; index < project.taskLists.length; index++) {
			const taskList = project.taskLists[index];
			taskList.orderIndex = index;
			taskList.updatedAt = new SvelteDate();

			try {
				await dataService.updateTaskList(projectId, taskList.id, { orderIndex: index });
			} catch (error) {
				console.error('Failed to sync task list order to backends:', error);
				errorHandler.addSyncError('タスクリスト順序更新', 'tasklist', taskList.id, error);
			}
		}
	}

	async moveTaskListToProject(taskListId: string, targetProjectId: string, targetIndex?: number) {
		// Find and remove the task list from its current project
		let taskListToMove: TaskListWithTasks | null = null;
		let sourceProject: ProjectTree | null = null;

		for (const project of this.projectStoreRef.projects) {
			const projectTaskLists = project.taskLists || [];
			const taskListIndex = projectTaskLists.findIndex((tl) => tl.id === taskListId);
			if (taskListIndex !== -1) {
				taskListToMove = projectTaskLists[taskListIndex];
				sourceProject = project;
				project.taskLists = projectTaskLists;
				project.taskLists.splice(taskListIndex, 1);
				project.updatedAt = new SvelteDate();

				// Update order indices in source project and sync to backends
				for (let index = 0; index < (project.taskLists || []).length; index++) {
					const tl = project.taskLists[index];
					tl.orderIndex = index;
					tl.updatedAt = new SvelteDate();

					try {
						await dataService.updateTaskList(project.id, tl.id, { orderIndex: index });
					} catch (error) {
						console.error('Failed to sync source project task list order to backends:', error);
						errorHandler.addSyncError('タスクリスト順序更新（移動元）', 'tasklist', tl.id, error);
					}
				}
				break;
			}
		}

		if (!taskListToMove || !sourceProject) return;

		// Find target project and add the task list
		const targetProject = this.projectStoreRef.projects.find((p) => p.id === targetProjectId);
		if (!targetProject) {
			// Restore to original project if target not found
			if (!sourceProject.taskLists) sourceProject.taskLists = [] as TaskListWithTasks[];
			sourceProject.taskLists.push(taskListToMove);
			return;
		}

		// Update task list's project reference
		taskListToMove.projectId = targetProjectId;
		taskListToMove.updatedAt = new SvelteDate();

		// Insert at specified position or at the end
		if (
			targetIndex !== undefined &&
			targetIndex >= 0 &&
			targetIndex <= (targetProject.taskLists ? targetProject.taskLists.length : 0)
		) {
			if (!targetProject.taskLists) targetProject.taskLists = [] as TaskListWithTasks[];
			targetProject.taskLists.splice(targetIndex, 0, taskListToMove);
		} else {
			if (!targetProject.taskLists) targetProject.taskLists = [] as TaskListWithTasks[];
			targetProject.taskLists.push(taskListToMove);
		}

		// Update order indices in target project and sync to backends
		targetProject.updatedAt = new SvelteDate();
		for (let index = 0; index < (targetProject.taskLists || []).length; index++) {
			const tl = targetProject.taskLists[index];
			tl.orderIndex = index;
			tl.updatedAt = new SvelteDate();

			try {
				await dataService.updateTaskList(targetProject.id, tl.id, {
					orderIndex: index
				});
			} catch (error) {
				console.error('Failed to sync target project task list order to backends:', error);
				errorHandler.addSyncError('タスクリスト順序更新（移動先）', 'tasklist', tl.id, error);
			}
		}
	}

	async moveTaskListToPosition(taskListId: string, targetProjectId: string, targetIndex: number) {
		// Find current position
		let currentProject: ProjectTree | null = null;
		let currentIndex = -1;

		for (const project of this.projectStoreRef.projects) {
			const index = project.taskLists.findIndex((tl) => tl.id === taskListId);
			if (index !== -1) {
				currentProject = project;
				currentIndex = index;
				break;
			}
		}

		if (!currentProject || currentIndex === -1) return;

		if (currentProject.id === targetProjectId) {
			// Same project - just reorder
			await this.reorderTaskLists(targetProjectId, currentIndex, targetIndex);
		} else {
			// Different project - move
			await this.moveTaskListToProject(taskListId, targetProjectId, targetIndex);
		}
	}

	// ヘルパー
	getProjectIdByListId(listId: string): string | null {
		for (const project of this.projectStoreRef.projects) {
			const list = project.taskLists.find((l) => l.id === listId);
			if (list) {
				return project.id;
			}
		}
		return null;
	}

	// テスト用
	reset() {
		// TaskListはProjectTreeに含まれているため、ProjectStoreのresetで対応済み
		// 追加の状態がないため、このメソッドは空実装
	}
}

// シングルトンエクスポート
export const taskListStore = new TaskListStore(projectStore, selectionStore);
