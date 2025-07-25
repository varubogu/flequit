import type { Task, TaskWithSubTasks, SubTask, TaskStatus } from '$lib/types/task';
import { taskStore } from '$lib/stores/tasks.svelte';
import { RecurrenceService } from './recurrence-service';

export class TaskService {
  static toggleTaskStatus(taskId: string): void {
    taskStore.toggleTaskStatus(taskId);
  }

  static selectTask(taskId: string | null): boolean {
    // Check if we need confirmation for new task mode
    if (taskStore.isNewTaskMode && taskId !== null) {
      taskStore.pendingTaskSelection = taskId;
      return false; // Indicate that task selection needs confirmation
    }
    
    taskStore.selectTask(taskId);
    return true;
  }

  static selectSubTask(subTaskId: string | null): boolean {
    // Check if we need confirmation for new task mode
    if (taskStore.isNewTaskMode && subTaskId !== null) {
      taskStore.pendingSubTaskSelection = subTaskId;
      return false; // Indicate that subtask selection needs confirmation
    }
    
    taskStore.selectSubTask(subTaskId);
    return true;
  }
  
  static forceSelectTask(taskId: string | null): void {
    // Cancel new task mode and force task selection
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }
    
    taskStore.selectTask(taskId);
  }
  
  static forceSelectSubTask(subTaskId: string | null): void {
    // Cancel new task mode and force subtask selection
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }
    
    taskStore.selectSubTask(subTaskId);
  }

  static updateTask(taskId: string, updates: Partial<Task>): void {
    taskStore.updateTask(taskId, updates);
  }

  static updateTaskFromForm(taskId: string, formData: {
    title: string;
    description: string;
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

    this.updateTask(taskId, updates);
  }

  static changeTaskStatus(taskId: string, newStatus: TaskStatus): void {
    const currentTask = taskStore.getTaskById(taskId);
    
    // タスクが完了状態になった場合の繰り返し処理
    if (newStatus === 'completed' && currentTask?.recurrence_rule) {
      this.handleTaskCompletion(currentTask);
    }
    
    this.updateTask(taskId, { status: newStatus });
  }
  
  /**
   * タスク完了時の繰り返し処理
   */
  private static handleTaskCompletion(task: TaskWithSubTasks): void {
    if (!task.recurrence_rule) return;
    
    // 基準日を決定（終了日があればそれを使用、なければ今日）
    const baseDate = task.end_date || new Date();
    
    // 次回実行日を計算
    const nextDate = RecurrenceService.calculateNextDate(baseDate, task.recurrence_rule);
    if (!nextDate) return; // 繰り返し終了
    
    // 新しいタスクを作成
    const newTaskData: Partial<Task> = {
      list_id: task.list_id,
      title: task.title,
      description: task.description,
      status: 'not_started',
      priority: task.priority,
      start_date: task.is_range_date && task.start_date ? 
        new Date(nextDate.getTime() - (task.end_date!.getTime() - task.start_date.getTime())) : 
        undefined,
      end_date: nextDate,
      is_range_date: task.is_range_date,
      recurrence_rule: task.recurrence_rule,
      order_index: 0,
      is_archived: false
    };
    
    // 新しいタスクをストアに追加
    taskStore.createRecurringTask(newTaskData);
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

    this.updateSubTask(subTaskId, updates);
  }

  static updateSubTask(subTaskId: string, updates: Partial<SubTask>): void {
    taskStore.updateSubTask(subTaskId, updates);
  }

  static changeSubTaskStatus(subTaskId: string, newStatus: TaskStatus): void {
    this.updateSubTask(subTaskId, { status: newStatus });
  }

  static deleteSubTask(subTaskId: string): boolean {
    taskStore.deleteSubTask(subTaskId);
    return true;
  }
}
