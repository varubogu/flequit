import type { SubTaskOperationsDependencies } from './types';

/**
 * サブタスクビュー操作
 */
export class SubTaskViewOperations {
  #deps: Pick<SubTaskOperationsDependencies, 'subTaskStore'>;

  constructor(deps: Pick<SubTaskOperationsDependencies, 'subTaskStore'>) {
    this.#deps = deps;
  }

  /**
   * ビューに応じてサブタスクの期日を更新します
   */
  updateSubTaskDueDateForView(subTaskId: string, _taskId: string, viewId: string): void {
    const { subTaskStore } = this.#deps;
    const today = new Date();
    let newDueDate: Date | undefined;

    switch (viewId) {
      case 'today':
        newDueDate = new Date(today);
        break;
      case 'tomorrow':
        newDueDate = new Date(today);
        newDueDate.setDate(today.getDate() + 1);
        break;
      case 'next3days':
        newDueDate = new Date(today);
        newDueDate.setDate(today.getDate() + 3);
        break;
      case 'nextweek':
        newDueDate = new Date(today);
        newDueDate.setDate(today.getDate() + 7);
        break;
      case 'thismonth':
        newDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      default:
        return;
    }

    if (newDueDate) {
      void subTaskStore.updateSubTask(subTaskId, { planEndDate: newDueDate });
    }
  }
}
