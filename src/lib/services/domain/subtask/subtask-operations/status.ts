import type { Task, TaskWithSubTasks, TaskStatus } from '$lib/types/task';
import type { SubTaskOperationsDependencies } from './types';

/**
 * サブタスクステータス操作
 */
export class SubTaskStatusOperations {
  #deps: Pick<SubTaskOperationsDependencies, 'taskCoreStore' | 'subTaskStore'>;

  constructor(deps: Pick<SubTaskOperationsDependencies, 'taskCoreStore' | 'subTaskStore'>) {
    this.#deps = deps;
  }

  /**
   * サブタスクのステータスをトグル（完了 ⇔ 未完了）します
   */
  toggleSubTaskStatus(task: TaskWithSubTasks, subTaskId: string): void {
    const { taskCoreStore } = this.#deps;
    const subTask = task.subTasks.find((st) => st.id === subTaskId);
    if (!subTask) return;

    const newStatus: TaskStatus = subTask.status === 'completed' ? 'not_started' : 'completed';
    const updatedSubTasks = task.subTasks.map((st) =>
      st.id === subTaskId ? { ...st, status: newStatus } : st
    );

    void taskCoreStore.updateTask(task.id, { sub_tasks: updatedSubTasks } as Partial<Task>);
  }

  /**
   * サブタスクのステータスを変更します
   */
  changeSubTaskStatus(subTaskId: string, newStatus: TaskStatus): void {
    void this.#deps.subTaskStore.updateSubTask(subTaskId, { status: newStatus });
  }
}
