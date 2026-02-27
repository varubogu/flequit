import type { TaskStatus } from '$lib/types/task';
import type { TaskRecurrenceService } from '$lib/services/domain/task-recurrence';
import type { TaskOperationsDependencies } from './types';
import type { TaskCrudOperations } from './crud';

/**
 * タスクステータス操作
 */
export class TaskStatusOperations {
  #taskStore: TaskOperationsDependencies['taskStore'];
  #crud: Pick<TaskCrudOperations, 'updateTask'>;
  #recurrenceService: TaskRecurrenceService;

  constructor(
    deps: Pick<TaskOperationsDependencies, 'taskStore'>,
    crud: Pick<TaskCrudOperations, 'updateTask'>,
    recurrenceService: TaskRecurrenceService
  ) {
    this.#taskStore = deps.taskStore;
    this.#crud = crud;
    this.#recurrenceService = recurrenceService;
  }

  /**
   * タスクのステータスをトグルする（完了 ⇔ 未開始）
   */
  async toggleTaskStatus(taskId: string): Promise<void> {
    const task = this.#taskStore.getTaskById(taskId);
    if (!task) {
      return;
    }

    const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
    await this.changeTaskStatus(taskId, newStatus);
  }

  /**
   * タスクのステータスを変更する
   * 完了時に繰り返しルールがある場合は次の発生をスケジュールする
   */
  async changeTaskStatus(taskId: string, newStatus: TaskStatus): Promise<void> {
    const currentTask = this.#taskStore.getTaskById(taskId);

    if (newStatus === 'completed' && currentTask?.recurrenceRule) {
      this.#recurrenceService.scheduleNextOccurrence(currentTask);
    }

    await this.#crud.updateTask(taskId, { status: newStatus });
  }
}
