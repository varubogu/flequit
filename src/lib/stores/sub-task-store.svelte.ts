import type { ISubTaskStore, IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { SubTask, SubTaskWithTags } from '$lib/types/sub-task';
import type { Tag } from '$lib/types/tag';
import { projectStore } from './project-store.svelte';
import { selectionStore } from './selection-store.svelte';
import { dataService } from '$lib/services/data-service';
import { errorHandler } from './error-handler.svelte';
import { SvelteDate } from 'svelte/reactivity';

/**
 * サブタスク管理ストア
 *
 * 責務: サブタスクのCRUD操作、タグ管理
 * 依存: ProjectStore（データ参照）, SelectionStore（選択状態）
 *
 * TaskStoreから分離して、サブタスク管理の責務を明確化しています。
 */
export class SubTaskStore implements ISubTaskStore {
	constructor(
		private projectStoreRef: IProjectStore,
		private selection: ISelectionStore
	) {}

	// 派生状態
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

	// CRUD操作
	async addSubTask(
		taskId: string,
		subTask: { title: string; description?: string; status?: string; priority?: number }
	) {
		try {
			const newSubTask = await dataService.createSubTask(taskId, subTask);

			// ローカル状態に追加
			for (const project of this.projectStoreRef.projects) {
				for (const list of project.taskLists) {
					const task = list.tasks.find((t) => t.id === taskId);
					if (task) {
						// UIでの操作用に tags を必ず初期化して保持（SubTaskWithTagsとして扱う）
						const subTaskWithTags = { ...newSubTask, tags: [] } as SubTaskWithTags;
						task.subTasks.push(subTaskWithTags);
						// 作成操作は即座に保存
						return newSubTask;
					}
				}
			}
			return newSubTask;
		} catch (error) {
			console.error('Failed to create subtask:', error);
			errorHandler.addSyncError('サブタスク作成', 'task', taskId, error);
			return null;
		}
	}

	async updateSubTask(subTaskId: string, updates: Partial<SubTask>) {
		// まずローカル状態を更新
		for (const project of this.projectStoreRef.projects) {
			for (const list of project.taskLists) {
				for (const task of list.tasks) {
					const subTaskIndex = task.subTasks.findIndex((st) => st.id === subTaskId);
					if (subTaskIndex !== -1) {
						task.subTasks[subTaskIndex] = {
							...task.subTasks[subTaskIndex],
							...updates,
							updatedAt: new SvelteDate()
						};

						// バックエンドに同期（更新操作は定期保存に任せる）
						try {
							await dataService.updateSubTask(subTaskId, updates);
						} catch (error) {
							console.error('Failed to sync subtask update to backends:', error);
							errorHandler.addSyncError('サブタスク更新', 'task', subTaskId, error);
						}
						return;
					}
				}
			}
		}
	}

	async deleteSubTask(subTaskId: string) {
		for (const project of this.projectStoreRef.projects) {
			for (const list of project.taskLists) {
				for (const task of list.tasks) {
					const subTaskIndex = task.subTasks.findIndex((st) => st.id === subTaskId);
					if (subTaskIndex !== -1) {
						// バックアップとして削除するサブタスクを保持
						const deletedSubTask = task.subTasks[subTaskIndex];
						// プロジェクトIDを事前に取得（削除前に取得する必要がある）
						const projectId = project.id;

						// まずローカル状態から削除
						task.subTasks.splice(subTaskIndex, 1);
						if (this.selection.selectedSubTaskId === subTaskId) {
							this.selection.selectSubTask(null);
						}

						// バックエンドに同期（削除操作は即座に保存）
						try {
							await dataService.deleteSubTask(subTaskId, projectId);
						} catch (error) {
							console.error('Failed to sync subtask deletion to backends:', error);
							errorHandler.addSyncError('サブタスク削除', 'task', subTaskId, error);
							// エラーが発生した場合はローカル状態を復元
							task.subTasks.splice(subTaskIndex, 0, deletedSubTask);
						}
						return;
					}
				}
			}
		}
	}

	// タグ操作
	attachTagToSubTask(subTaskId: string, tag: Tag) {
		for (const project of this.projectStoreRef.projects) {
			for (const list of project.taskLists) {
				for (const task of list.tasks) {
					const subTask = task.subTasks.find((st) => st.id === subTaskId) as SubTaskWithTags | undefined;
					if (subTask) {
						if (
							subTask.tags.some(
								(existing) =>
									existing.id === tag.id || existing.name.toLowerCase() === tag.name.toLowerCase()
							)
						) {
							return;
						}
						subTask.tags.push(tag);
						subTask.updatedAt = new SvelteDate();
						return;
					}
				}
			}
		}
	}

	detachTagFromSubTask(subTaskId: string, tagId: string): Tag | null {
		for (const project of this.projectStoreRef.projects) {
			for (const list of project.taskLists) {
				for (const task of list.tasks) {
					const subTask = task.subTasks.find((st) => st.id === subTaskId) as SubTaskWithTags | undefined;
					if (subTask) {
						const tagIndex = subTask.tags.findIndex((t) => t.id === tagId);
						if (tagIndex !== -1) {
							const [removed] = subTask.tags.splice(tagIndex, 1);
							subTask.updatedAt = new SvelteDate();
							return removed ?? null;
						}
						return null;
					}
				}
			}
		}
		return null;
	}

	// ヘルパー
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

	// テスト用
	reset() {
		// SubTaskはProjectTreeに含まれているため、ProjectStoreのresetで対応済み
		// 追加の状態がないため、このメソッドは空実装
	}
}

// シングルトンエクスポート
export const subTaskStore = new SubTaskStore(projectStore, selectionStore);
