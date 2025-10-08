import type { Task, TaskWithSubTasks, TaskStatus } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import { TaskSelectionService } from './task/task-selection-service';
import { TaskMutationService } from './task/task-mutation-service';

const selectionService = new TaskSelectionService();
const mutationService = new TaskMutationService();

export class TaskService {
  static toggleTaskStatus(taskId: string): void {
    void mutationService.toggleTaskStatus(taskId);
  }

  static selectTask(taskId: string | null): boolean {
    return selectionService.selectTask(taskId);
  }

  static selectSubTask(subTaskId: string | null): boolean {
    return selectionService.selectSubTask(subTaskId);
  }

  static forceSelectTask(taskId: string | null): void {
    selectionService.forceSelectTask(taskId);
  }

  static forceSelectSubTask(subTaskId: string | null): void {
    selectionService.forceSelectSubTask(subTaskId);
  }

  static updateTask(taskId: string, updates: Partial<Task>): void {
    mutationService.updateTask(taskId, updates);
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
    mutationService.updateTaskFromForm(taskId, formData);
  }

  static changeTaskStatus(taskId: string, newStatus: TaskStatus): void {
    void mutationService.changeTaskStatus(taskId, newStatus);
  }

  static deleteTask(taskId: string): boolean {
    void mutationService.deleteTask(taskId);
    return true;
  }

  static toggleSubTaskStatus(task: TaskWithSubTasks, subTaskId: string): void {
    mutationService.toggleSubTaskStatus(task, subTaskId);
  }

  static async addTask(
    listId: string,
    taskData: {
      title: string;
      description?: string;
      priority?: number;
    }
  ): Promise<TaskWithSubTasks | null> {
    return mutationService.addTask(listId, taskData);
  }

  static async addSubTask(
    taskId: string,
    subTaskData: {
      title: string;
      description?: string;
      priority?: number;
    }
  ): Promise<SubTask | null> {
    return mutationService.addSubTask(taskId, subTaskData);
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
    mutationService.updateSubTaskFromForm(subTaskId, formData);
  }

  static updateSubTask(subTaskId: string, updates: Partial<SubTask>): void {
    mutationService.updateSubTask(subTaskId, updates);
  }

  static changeSubTaskStatus(subTaskId: string, newStatus: TaskStatus): void {
    mutationService.changeSubTaskStatus(subTaskId, newStatus);
  }

  static deleteSubTask(subTaskId: string): boolean {
    void mutationService.deleteSubTask(subTaskId);
    return true;
  }

  static async addTagToTaskByName(taskId: string, tagName: string): Promise<void> {
    return mutationService.addTagToTaskByName(taskId, tagName);
  }

  static async addTagToTask(taskId: string, tagId: string): Promise<void> {
    return mutationService.addTagToTask(taskId, tagId);
  }

  static async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
    return mutationService.removeTagFromTask(taskId, tagId);
  }

  static updateTaskDueDateForView(taskId: string, viewId: string): void {
    mutationService.updateTaskDueDateForView(taskId, viewId);
  }

  static updateSubTaskDueDateForView(subTaskId: string, taskId: string, viewId: string): void {
    mutationService.updateSubTaskDueDateForView(subTaskId, taskId, viewId);
  }

  static async addTagToSubTaskByName(
    subTaskId: string,
    taskId: string,
    tagName: string
  ): Promise<void> {
    return mutationService.addTagToSubTaskByName(subTaskId, taskId, tagName);
  }

  static async addTagToSubTask(subTaskId: string, taskId: string, tagId: string): Promise<void> {
    return mutationService.addTagToSubTask(subTaskId, taskId, tagId);
  }

  static async removeTagFromSubTask(
    subTaskId: string,
    taskId: string,
    tagId: string
  ): Promise<void> {
    return mutationService.removeTagFromSubTask(subTaskId, taskId, tagId);
  }
}
