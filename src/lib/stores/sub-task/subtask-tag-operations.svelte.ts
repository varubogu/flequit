import type { IProjectStore } from '$lib/types/store-interfaces';
import type { SubTaskWithTags } from '$lib/types/sub-task';
import type { Tag } from '$lib/types/tag';
import { SvelteDate } from 'svelte/reactivity';

/**
 * サブタスクのタグ操作
 *
 * 責務: サブタスクへのタグ付与・削除
 */
export class SubTaskTagOperations {
  constructor(private projectStoreRef: IProjectStore) {}

  /**
   * サブタスクにタグを付与
   */
  attachTagToSubTask(subTaskId: string, tag: Tag) {
    for (const project of this.projectStoreRef.projects) {
      for (const list of project.taskLists) {
        for (const task of list.tasks) {
          const subTask = task.subTasks.find((st) => st.id === subTaskId) as
            | SubTaskWithTags
            | undefined;
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

  /**
   * サブタスクからタグを削除
   */
  detachTagFromSubTask(subTaskId: string, tagId: string): Tag | null {
    for (const project of this.projectStoreRef.projects) {
      for (const list of project.taskLists) {
        for (const task of list.tasks) {
          const subTask = task.subTasks.find((st) => st.id === subTaskId) as
            | SubTaskWithTags
            | undefined;
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
}
