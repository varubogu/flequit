import { TaggingService } from '$lib/services/domain/tagging';
import type { TaskOperationsDependencies } from './types';

/**
 * タスクタグ管理操作
 */
export class TaskTagOperations {
  #deps: TaskOperationsDependencies;

  constructor(deps: TaskOperationsDependencies) {
    this.#deps = deps;
  }

  /**
   * タスクにタグを名前で追加する（タグが存在しない場合は作成）
   */
  async addTagToTaskByName(taskId: string, tagName: string): Promise<void> {
    const { taskStore, tagStore, errorHandler } = this.#deps;
    const trimmed = tagName.trim();
    if (!trimmed) {
      console.warn('Empty tag name provided');
      return;
    }

    const context = taskStore.getTaskProjectAndList(taskId);
    if (!context) {
      console.error('Failed to find task:', taskId);
      return;
    }

    try {
      const tag = await TaggingService.createTaskTag(context.project.id, taskId, trimmed);
      tagStore.addTagWithId(tag);
      taskStore.attachTagToTask(taskId, tag);
    } catch (error) {
      console.error('Failed to sync tag addition to backends:', error);
      errorHandler.addSyncError('タスクタグ追加', 'task', taskId, error);
    }
  }

  /**
   * タスクに既存のタグを追加する
   */
  async addTagToTask(taskId: string, tagId: string): Promise<void> {
    const { tagStore, taskStore, errorHandler } = this.#deps;
    const tag = tagStore.tags.find((t) => t.id === tagId);
    if (!tag) return;

    const context = taskStore.getTaskProjectAndList(taskId);
    if (!context) {
      console.error('Failed to find task:', taskId);
      return;
    }

    try {
      const created = await TaggingService.createTaskTag(context.project.id, taskId, tag.name);
      taskStore.attachTagToTask(taskId, created);
    } catch (error) {
      console.error('Failed to sync tag addition to backends:', error);
      errorHandler.addSyncError('タスクタグ追加', 'task', taskId, error);
    }
  }

  /**
   * タスクからタグを削除する
   */
  async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
    const { taskStore, errorHandler } = this.#deps;
    const context = taskStore.getTaskProjectAndList(taskId);
    if (!context) return;

    const removed = taskStore.detachTagFromTask(taskId, tagId);
    if (!removed) return;

    try {
      await TaggingService.deleteTaskTag(context.project.id, taskId, tagId);
    } catch (error) {
      console.error('Failed to sync tag removal to backends:', error);
      taskStore.attachTagToTask(taskId, removed);
      errorHandler.addSyncError('タスクタグ削除', 'task', taskId, error);
    }
  }
}
