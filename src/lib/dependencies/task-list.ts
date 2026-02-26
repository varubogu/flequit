import { TaskListService } from '$lib/services/domain/task-list';
import type { TaskList, TaskListWithTasks } from '$lib/types/task-list';

export interface TaskListGateway {
  createTaskListWithTasks(
    projectId: string,
    taskListData: {
      name: string;
      description?: string;
      color?: string;
      order_index?: number;
    }
  ): Promise<TaskListWithTasks>;
  updateTaskList(
    projectId: string,
    taskListId: string,
    updates: Partial<TaskList>
  ): Promise<TaskList | null>;
  deleteTaskList(projectId: string, taskListId: string): Promise<boolean>;
}

export function resolveTaskListGateway(): TaskListGateway {
  return TaskListService;
}
