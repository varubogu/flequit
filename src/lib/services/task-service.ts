import type { Task, TaskWithSubTasks, TaskStatus } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import { TaskSelectionService } from './task/task-selection-service';
import { TaskMutationService } from './task/task-mutation-service';

// 遅延初期化で循環参照を回避
let selectionService: TaskSelectionService | undefined;
let mutationService: TaskMutationService | undefined;

function getSelectionService(): TaskSelectionService {
  if (!selectionService) {
    selectionService = new TaskSelectionService();
  }
  return selectionService;
}

function getMutationService(): TaskMutationService {
  if (!mutationService) {
    mutationService = new TaskMutationService();
  }
  return mutationService;
}

export class TaskService {
  static toggleTaskStatus(taskId: string): void {
    void getMutationService().toggleTaskStatus(taskId);
  }

  static selectTask(taskId: string | null): boolean {
    return getSelectionService().selectTask(taskId);
  }

  static selectSubTask(subTaskId: string | null): boolean {
    return getSelectionService().selectSubTask(subTaskId);
  }

  static forceSelectTask(taskId: string | null): void {
    getSelectionService().forceSelectTask(taskId);
  }

  static forceSelectSubTask(subTaskId: string | null): void {
    getSelectionService().forceSelectSubTask(subTaskId);
  }

  static updateTask(taskId: string, updates: Partial<Task>): void {
    getMutationService().updateTask(taskId, updates);
  }

  static updateTaskFromForm(
    taskId: string,
    formData: {
      title: string;
      description: string;
      planStartDate?: Date;
      planEndDate?: Date;
      isRangeDate?: boolean;
      priority: number;
    }
  ): void {
    getMutationService().updateTaskFromForm(taskId, formData);
  }

  static changeTaskStatus(taskId: string, newStatus: TaskStatus): void {
    void getMutationService().changeTaskStatus(taskId, newStatus);
  }

  static deleteTask(taskId: string): boolean {
    void getMutationService().deleteTask(taskId);
    return true;
  }

  static toggleSubTaskStatus(task: TaskWithSubTasks, subTaskId: string): void {
    getMutationService().toggleSubTaskStatus(task, subTaskId);
  }

  static async addTask(
    listId: string,
    taskData: {
      title: string;
      description?: string;
      priority?: number;
    }
  ): Promise<TaskWithSubTasks | null> {
    return getMutationService().addTask(listId, taskData);
  }

  static async addSubTask(
    taskId: string,
    subTaskData: {
      title: string;
      description?: string;
      priority?: number;
    }
  ): Promise<SubTask | null> {
    return getMutationService().addSubTask(taskId, subTaskData);
  }

  static updateSubTaskFromForm(
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
    getMutationService().updateSubTaskFromForm(subTaskId, formData);
  }

  static updateSubTask(subTaskId: string, updates: Partial<SubTask>): void {
    getMutationService().updateSubTask(subTaskId, updates);
  }

  static changeSubTaskStatus(subTaskId: string, newStatus: TaskStatus): void {
    getMutationService().changeSubTaskStatus(subTaskId, newStatus);
  }

  static deleteSubTask(subTaskId: string): boolean {
    void getMutationService().deleteSubTask(subTaskId);
    return true;
  }

  static async addTagToTaskByName(taskId: string, tagName: string): Promise<void> {
    return getMutationService().addTagToTaskByName(taskId, tagName);
  }

  static async addTagToTask(taskId: string, tagId: string): Promise<void> {
    return getMutationService().addTagToTask(taskId, tagId);
  }

  static async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
    return getMutationService().removeTagFromTask(taskId, tagId);
  }

  static updateTaskDueDateForView(taskId: string, viewId: string): void {
    getMutationService().updateTaskDueDateForView(taskId, viewId);
  }

  static updateSubTaskDueDateForView(subTaskId: string, taskId: string, viewId: string): void {
    getMutationService().updateSubTaskDueDateForView(subTaskId, taskId, viewId);
  }

  static async addTagToSubTaskByName(
    subTaskId: string,
    taskId: string,
    tagName: string
  ): Promise<void> {
    return getMutationService().addTagToSubTaskByName(subTaskId, taskId, tagName);
  }

  static async addTagToSubTask(subTaskId: string, taskId: string, tagId: string): Promise<void> {
    return getMutationService().addTagToSubTask(subTaskId, taskId, tagId);
  }

  static async removeTagFromSubTask(
    subTaskId: string,
    taskId: string,
    tagId: string
  ): Promise<void> {
    return getMutationService().removeTagFromSubTask(subTaskId, taskId, tagId);
  }
}
