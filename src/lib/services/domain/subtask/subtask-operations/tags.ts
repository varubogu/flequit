import type { SubTaskOperationsDependencies } from './types';

/**
 * サブタスクタグ操作
 */
export class SubTaskTagOperations {
  #deps: SubTaskOperationsDependencies;

  constructor(deps: SubTaskOperationsDependencies) {
    this.#deps = deps;
  }

  /**
   * タグ名からサブタスクにタグを追加します
   */
  async addTagToSubTaskByName(subTaskId: string, taskId: string, tagName: string): Promise<void> {
    const { taskStore, subTaskStore, taggingService, errorHandler } = this.#deps;
    const trimmed = tagName.trim();
    if (!trimmed) {
      console.warn('Empty tag name provided');
      return;
    }

    const context = taskStore.getTaskProjectAndList(taskId);
    if (!context) {
      console.error('Failed to find task for subtask tag:', subTaskId);
      return;
    }

    try {
      const tag = await taggingService.createSubtaskTag(context.project.id, subTaskId, trimmed);
      subTaskStore.attachTagToSubTask(subTaskId, tag);
    } catch (error) {
      console.error('Failed to sync subtask tag addition to backends:', error);
      errorHandler.addSyncError('サブタスクタグ追加', 'subtask', subTaskId, error);
    }
  }

  /**
   * タグIDからサブタスクにタグを追加します
   */
  async addTagToSubTask(subTaskId: string, taskId: string, tagId: string): Promise<void> {
    const { tagStore, taskStore, subTaskStore, taggingService, errorHandler } = this.#deps;
    const tag = tagStore.tags.find((t) => t.id === tagId);
    if (!tag) return;

    const context = taskStore.getTaskProjectAndList(taskId);
    if (!context) {
      console.error('Failed to find task for subtask tag:', subTaskId);
      return;
    }

    try {
      const created = await taggingService.createSubtaskTag(
        context.project.id,
        subTaskId,
        tag.name
      );
      subTaskStore.attachTagToSubTask(subTaskId, created);
    } catch (error) {
      console.error('Failed to sync subtask tag addition to backends:', error);
      errorHandler.addSyncError('サブタスクタグ追加', 'subtask', subTaskId, error);
    }
  }

  /**
   * サブタスクからタグを削除します
   */
  async removeTagFromSubTask(subTaskId: string, taskId: string, tagId: string): Promise<void> {
    const { taskStore, subTaskStore, taggingService, errorHandler } = this.#deps;
    const context = taskStore.getTaskProjectAndList(taskId);
    if (!context) return;

    const removed = subTaskStore.detachTagFromSubTask(subTaskId, tagId);
    if (!removed) return;

    try {
      await taggingService.deleteSubtaskTag(context.project.id, subTaskId, tagId);
    } catch (error) {
      console.error('Failed to sync subtask tag removal to backends:', error);
      subTaskStore.attachTagToSubTask(subTaskId, removed);
      errorHandler.addSyncError('サブタスクタグ削除', 'subtask', subTaskId, error);
    }
  }
}
