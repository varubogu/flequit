import type { Tag } from '$lib/types/tag';
import { SvelteDate } from 'svelte/reactivity';
import type { TaskEntitiesStore } from '$lib/stores/tasks/task-entities-store.svelte';
import type { TaskDraftStore } from '$lib/stores/tasks/task-draft-store.svelte';

/**
 * タスクのタグ操作
 *
 * 責務: タスクとタグの関連付け、削除、更新
 */
export class TaskTagOperations {
  constructor(
    private entities: TaskEntitiesStore,
    private draft: TaskDraftStore
  ) {}

  /**
   * タスクにタグを付与
   */
  attachTagToTask(taskId: string, tag: Tag): void {
    const task = this.entities.getTaskById(taskId);
    if (!task) return;

    const duplicated = task.tags.some(
      (existing) => existing.id === tag.id || existing.name.toLowerCase() === tag.name.toLowerCase()
    );
    if (duplicated) return;

    task.tags.push(tag);
    task.updatedAt = new SvelteDate();
  }

  /**
   * タスクからタグを削除
   */
  detachTagFromTask(taskId: string, tagId: string): Tag | null {
    const task = this.entities.getTaskById(taskId);
    if (!task) return null;

    const index = task.tags.findIndex((existing) => existing.id === tagId);
    if (index === -1) return null;

    const [removed] = task.tags.splice(index, 1);
    task.updatedAt = new SvelteDate();
    return removed ?? null;
  }

  /**
   * すべてのタスクから指定タグを削除
   */
  removeTagFromAllTasks(tagId: string): void {
    this.entities.removeTagFromAllTasks(tagId);
    const draftTask = this.draft.newTaskDraft;
    if (draftTask) {
      const index = draftTask.tags.findIndex((tag) => tag.id === tagId);
      if (index !== -1) {
        draftTask.tags.splice(index, 1);
      }
    }
  }

  /**
   * すべてのタスクの指定タグを更新
   */
  updateTagInAllTasks(updatedTag: Tag): void {
    this.entities.updateTagInAllTasks(updatedTag);
    const draftTask = this.draft.newTaskDraft;
    if (draftTask) {
      const index = draftTask.tags.findIndex((tag) => tag.id === updatedTag.id);
      if (index !== -1) {
        draftTask.tags[index] = { ...updatedTag };
      }
    }
  }
}
