import { TaskBackend } from '../task-backend';
import type { TaskOperationsDependencies } from './types';

/**
 * タスク移動操作
 */
export class TaskMoveOperations {
  #deps: TaskOperationsDependencies;

  constructor(deps: TaskOperationsDependencies) {
    this.#deps = deps;
  }

  /**
   * タスクを別のリストに移動する
   */
  async moveTaskToList(taskId: string, newTaskListId: string): Promise<void> {
    const { taskCoreStore, errorHandler } = this.#deps;
    const moveContext = taskCoreStore.moveTaskBetweenLists(taskId, newTaskListId);
    if (!moveContext) return;

    try {
      await TaskBackend.updateTask(moveContext.targetProject.id, taskId, {
        listId: newTaskListId
      });
    } catch (error) {
      console.error('Failed to sync task move to backends:', error);
      taskCoreStore.restoreTaskMove(moveContext);
      errorHandler.addSyncError('タスク移動', 'task', taskId, error);
    }
  }
}
