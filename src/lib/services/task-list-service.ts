import { taskStore } from '$lib/stores/tasks.svelte';
import { TaskService } from './task-service';

export class TaskListService {
  static addNewTask(title: string): boolean {
    if (!title.trim() || taskStore.projects.length === 0) {
      return false;
    }
    
    const firstList = taskStore.projects[0].task_lists[0];
    if (!firstList) {
      return false;
    }
    
    const newTask = TaskService.addTask(firstList.id, {
      title: title.trim()
    });
    
    return newTask !== null;
  }
  
  static getTaskCountText(count: number): string {
    return `${count} task${count !== 1 ? 's' : ''}`;
  }
}