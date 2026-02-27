import type { SubTask } from '$lib/types/sub-task';
import type { SubTaskOperationsDependencies } from './types';

/**
 * サブタスクCRUD操作
 */
export class SubTaskCrudOperations {
  #deps: Pick<SubTaskOperationsDependencies, 'subTaskStore'>;

  constructor(deps: Pick<SubTaskOperationsDependencies, 'subTaskStore'>) {
    this.#deps = deps;
  }

  /**
   * 新しいサブタスクを追加します
   */
  async addSubTask(
    taskId: string,
    subTaskData: {
      title: string;
      description?: string;
      priority?: number;
    }
  ) {
    const { subTaskStore } = this.#deps;
    return subTaskStore.addSubTask(taskId, {
      title: subTaskData.title,
      description: subTaskData.description,
      status: 'not_started',
      priority: subTaskData.priority || 0
    });
  }

  /**
   * サブタスクを更新します
   */
  updateSubTask(subTaskId: string, updates: Partial<SubTask>): void {
    void this.#deps.subTaskStore.updateSubTask(subTaskId, updates);
  }

  /**
   * フォームデータからサブタスクを更新します
   */
  updateSubTaskFromForm(
    subTaskId: string,
    formData: {
      title: string;
      description: string;
      planStartDate?: Date;
      planEndDate?: Date;
      isRangeDate?: boolean;
      priority: number;
    }
  ): void {
    const updates: Partial<SubTask> = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority || undefined,
      planStartDate: formData.planStartDate,
      planEndDate: formData.planEndDate,
      isRangeDate: formData.isRangeDate || false
    };

    void this.#deps.subTaskStore.updateSubTask(subTaskId, updates);
  }

  /**
   * サブタスクを削除します
   */
  async deleteSubTask(subTaskId: string): Promise<void> {
    await this.#deps.subTaskStore.deleteSubTask(subTaskId);
  }
}
