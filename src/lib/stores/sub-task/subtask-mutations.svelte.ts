/* eslint-disable no-restricted-imports -- TODO [計画02]: フロントエンド層方針の再定義と移行で対応予定。期限: 2026-04-30 */
import type { IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { SubTask, SubTaskWithTags } from '$lib/types/sub-task';
import type { TaskWithSubTasks } from '$lib/types/task';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { SvelteDate } from 'svelte/reactivity';
import { SubTaskBackend } from '$lib/services/domain/subtask';

/**
 * サブタスクのCRUD操作
 *
 * 責務: サブタスクの作成、更新、削除
 */
export class SubTaskMutations {
  constructor(
    private projectStoreRef: IProjectStore,
    private selection: ISelectionStore
  ) {}

  /**
   * サブタスクを追加
   */
  async addSubTask(
    taskId: string,
    subTask: { title: string; description?: string; status?: string; priority?: number }
  ) {
    let targetTask: TaskWithSubTasks | undefined;
    let targetProjectId: string | null = null;

    for (const project of this.projectStoreRef.projects) {
      for (const list of project.taskLists) {
        const task = list.tasks.find((t) => t.id === taskId);
        if (task) {
          targetProjectId = project.id;
          targetTask = task;
          break;
        }
      }
      if (targetProjectId) break;
    }

    if (!targetProjectId || !targetTask) {
      console.error('Failed to find task for subtask creation:', taskId);
      return null;
    }

    try {
      const newSubTask = await SubTaskBackend.createSubTask(targetProjectId, taskId, subTask);
      const subTaskWithTags = { ...newSubTask, tags: [] } as SubTaskWithTags;
      targetTask.subTasks.push(subTaskWithTags);
      return newSubTask;
    } catch (error) {
      console.error('Failed to create subtask:', error);
      errorHandler.addSyncError('サブタスク作成', 'task', taskId, error);
      return null;
    }
  }

  /**
   * サブタスクを更新
   */
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

            const projectId = project.id;
            try {
              await SubTaskBackend.updateSubTask(projectId, subTaskId, updates);
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

  /**
   * サブタスクを削除
   */
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

            try {
              await SubTaskBackend.deleteSubTask(projectId, subTaskId);
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
}
