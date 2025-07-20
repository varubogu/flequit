import type { Task, TaskWithSubTasks, SubTask, TaskStatus } from '$lib/types/task';
import { taskStore } from '$lib/stores/tasks.svelte';

export class TaskService {
  static toggleTaskStatus(taskId: string): void {
    taskStore.toggleTaskStatus(taskId);
  }

  static selectTask(taskId: string | null): void {
    taskStore.selectTask(taskId);
  }

  static selectSubTask(subTaskId: string | null): void {
    taskStore.selectSubTask(subTaskId);
  }

  static updateTask(taskId: string, updates: Partial<Task>): void {
    taskStore.updateTask(taskId, updates);
  }

  static updateTaskFromForm(taskId: string, formData: {
    title: string;
    description: string;
    due_date: string;
    start_date?: Date;
    end_date?: Date;
    is_range_date?: boolean;
    priority: number;
  }): void {
    const updates: Partial<Task> = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_range_date: formData.is_range_date || false
    };

    if (formData.due_date) {
      updates.due_date = new Date(formData.due_date);
    } else {
      updates.due_date = undefined;
    }

    this.updateTask(taskId, updates);
  }

  static changeTaskStatus(taskId: string, newStatus: TaskStatus): void {
    this.updateTask(taskId, { status: newStatus });
  }

  static deleteTask(taskId: string): boolean {
      taskStore.deleteTask(taskId);
      return true;
  }

  static toggleSubTaskStatus(task: TaskWithSubTasks, subTaskId: string): void {
    const subTask = task.sub_tasks.find(st => st.id === subTaskId);
    if (!subTask) return;

    const newStatus: TaskStatus = subTask.status === 'completed' ? 'not_started' : 'completed';
    const updatedSubTasks = task.sub_tasks.map(st =>
      st.id === subTaskId ? { ...st, status: newStatus } : st
    );

    // Note: This is a simplified update - in a real app you'd want proper subtask management
    this.updateTask(task.id, { sub_tasks: updatedSubTasks } as any);
  }

  static addTask(listId: string, taskData: {
    title: string;
    description?: string;
    priority?: number;
  }): TaskWithSubTasks | null {
    return taskStore.addTask(listId, {
      list_id: listId,
      title: taskData.title,
      description: taskData.description,
      status: 'not_started',
      priority: taskData.priority || 0,
      order_index: 0,
      is_archived: false
    });
  }

  static updateSubTaskFromForm(subTaskId: string, formData: {
    title: string;
    description: string;
    due_date: string;
    start_date?: Date;
    end_date?: Date;
    is_range_date?: boolean;
    priority: number;
  }): void {
    const updates: Partial<SubTask> = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority || undefined,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_range_date: formData.is_range_date || false
    };

    if (formData.due_date) {
      updates.due_date = new Date(formData.due_date);
    } else {
      updates.due_date = undefined;
    }

    this.updateSubTask(subTaskId, updates);
  }

  static updateSubTask(subTaskId: string, updates: Partial<SubTask>): void {
    taskStore.updateSubTask(subTaskId, updates);
  }

  static changeSubTaskStatus(subTaskId: string, newStatus: TaskStatus): void {
    this.updateSubTask(subTaskId, { status: newStatus });
  }

  static deleteSubTask(subTaskId: string): boolean {
    if (confirm('Are you sure you want to delete this subtask?')) {
      taskStore.deleteSubTask(subTaskId);
      return true;
    }
    return false;
  }
}
